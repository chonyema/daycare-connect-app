import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { PriorityRuleType } from '@prisma/client';
import { DEFAULT_PRIORITY_RULES } from '@/app/utils/waitlist/priorityEngine';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      daycareId,
      programId,
      name,
      description,
      ruleType,
      points,
      isActive = true,
      conditions,
      sortOrder,
      createdBy
    } = body;

    if (!daycareId || !name || !ruleType || points === undefined) {
      return NextResponse.json(
        { success: false, error: "Daycare ID, name, rule type, and points are required" },
        { status: 400 }
      );
    }

    // Validate rule type
    if (!Object.values(PriorityRuleType).includes(ruleType)) {
      return NextResponse.json(
        { success: false, error: "Invalid rule type" },
        { status: 400 }
      );
    }

    // Validate daycare exists
    const daycare = await prisma.daycare.findUnique({
      where: { id: daycareId },
      select: { name: true }
    });

    if (!daycare) {
      return NextResponse.json(
        { success: false, error: "Daycare not found" },
        { status: 404 }
      );
    }

    // Validate program if provided
    if (programId) {
      const program = await prisma.program.findFirst({
        where: { id: programId, daycareId },
        select: { name: true }
      });

      if (!program) {
        return NextResponse.json(
          { success: false, error: "Program not found or doesn't belong to this daycare" },
          { status: 404 }
        );
      }
    }

    // Get next sort order if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const lastRule = await prisma.priorityRule.findFirst({
        where: { daycareId, programId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
      });
      finalSortOrder = (lastRule?.sortOrder || 0) + 1;
    }

    // Validate conditions if provided
    let validatedConditions = null;
    if (conditions) {
      try {
        // Ensure conditions is valid JSON
        validatedConditions = typeof conditions === 'string'
          ? conditions
          : JSON.stringify(conditions);

        // Parse to validate JSON structure
        JSON.parse(validatedConditions);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: "Invalid conditions JSON format" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate rule types within the same scope
    const existingRule = await prisma.priorityRule.findFirst({
      where: {
        daycareId,
        programId,
        ruleType,
        isActive: true
      }
    });

    if (existingRule) {
      return NextResponse.json(
        { success: false, error: `An active rule of type ${ruleType} already exists for this scope` },
        { status: 400 }
      );
    }

    // Create the priority rule
    const priorityRule = await prisma.priorityRule.create({
      data: {
        daycareId,
        programId,
        name,
        description,
        ruleType,
        points,
        isActive,
        conditions: validatedConditions,
        sortOrder: finalSortOrder
      },
      include: {
        daycare: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Priority rule "${name}" created successfully`,
      data: priorityRule
    });

  } catch (error: any) {
    console.error('Create priority rule error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to create priority rule" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daycareId = searchParams.get('daycareId');
    const programId = searchParams.get('programId');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const ruleType = searchParams.get('ruleType');

    if (!daycareId) {
      return NextResponse.json(
        { success: false, error: "Daycare ID is required" },
        { status: 400 }
      );
    }

    const whereClause: any = { daycareId };

    if (programId) {
      whereClause.programId = programId;
    }

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    if (ruleType) {
      whereClause.ruleType = ruleType;
    }

    const priorityRules = await prisma.priorityRule.findMany({
      where: whereClause,
      include: {
        daycare: {
          select: { name: true }
        },
        program: {
          select: { name: true }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Add parsed conditions for easier frontend handling
    const enhancedRules = priorityRules.map(rule => ({
      ...rule,
      parsedConditions: rule.conditions ? JSON.parse(rule.conditions) : null,
      scope: rule.programId ? 'program' : 'daycare'
    }));

    return NextResponse.json({
      success: true,
      data: enhancedRules,
      meta: {
        total: enhancedRules.length,
        active: enhancedRules.filter(r => r.isActive).length,
        inactive: enhancedRules.filter(r => !r.isActive).length,
        totalPoints: enhancedRules
          .filter(r => r.isActive)
          .reduce((sum, r) => sum + r.points, 0)
      }
    });

  } catch (error: any) {
    console.error('Get priority rules error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get priority rules" },
      { status: 500 }
    );
  }
}

// Bulk create default rules for a daycare
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { daycareId, programId, action, createdBy } = body;

    if (!daycareId || !action) {
      return NextResponse.json(
        { success: false, error: "Daycare ID and action are required" },
        { status: 400 }
      );
    }

    if (action === 'create_defaults') {
      // Check if default rules already exist
      const existingRules = await prisma.priorityRule.findMany({
        where: { daycareId, programId },
        select: { id: true }
      });

      if (existingRules.length > 0) {
        return NextResponse.json(
          { success: false, error: "Priority rules already exist for this scope" },
          { status: 400 }
        );
      }

      // Create default rules
      const defaultRulesData = DEFAULT_PRIORITY_RULES.map(rule => ({
        ...rule,
        daycareId,
        programId: programId || null
      }));

      const createdRules = await prisma.priorityRule.createMany({
        data: defaultRulesData
      });

      // Fetch the created rules with relations
      const rules = await prisma.priorityRule.findMany({
        where: { daycareId, programId },
        include: {
          daycare: { select: { name: true } },
          program: { select: { name: true } }
        },
        orderBy: { sortOrder: 'asc' }
      });

      return NextResponse.json({
        success: true,
        message: `Created ${createdRules.count} default priority rules`,
        data: rules
      });

    } else if (action === 'reorder') {
      const { ruleOrders } = body; // Array of { id, sortOrder }

      if (!Array.isArray(ruleOrders)) {
        return NextResponse.json(
          { success: false, error: "Rule orders must be an array" },
          { status: 400 }
        );
      }

      // Update sort orders in transaction
      await prisma.$transaction(async (tx) => {
        for (const { id, sortOrder } of ruleOrders) {
          await tx.priorityRule.update({
            where: { id },
            data: { sortOrder }
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: "Priority rules reordered successfully"
      });

    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Bulk priority rules operation error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}