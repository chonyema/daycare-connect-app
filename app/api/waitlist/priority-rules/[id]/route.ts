import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { PriorityRuleType } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Priority rule ID is required" },
        { status: 400 }
      );
    }

    const priorityRule = await prisma.priorityRule.findUnique({
      where: { id },
      include: {
        daycare: {
          select: { id: true, name: true }
        },
        program: {
          select: { id: true, name: true }
        }
      }
    });

    if (!priorityRule) {
      return NextResponse.json(
        { success: false, error: "Priority rule not found" },
        { status: 404 }
      );
    }

    // Get usage statistics for this rule
    const affectedEntries = await prisma.waitlistEntry.count({
      where: {
        daycareId: priorityRule.daycareId,
        ...(priorityRule.programId ? { programId: priorityRule.programId } : {}),
        status: 'ACTIVE',
        // Check if this rule would apply based on rule type
        ...(priorityRule.ruleType === 'SIBLING_ENROLLED' && { hasSiblingEnrolled: true }),
        ...(priorityRule.ruleType === 'STAFF_CHILD' && { isStaffChild: true }),
        ...(priorityRule.ruleType === 'SERVICE_AREA' && { inServiceArea: true }),
        ...(priorityRule.ruleType === 'SUBSIDY_APPROVED' && { hasSubsidyApproval: true }),
        ...(priorityRule.ruleType === 'CORPORATE_PARTNERSHIP' && { hasCorporatePartnership: true }),
        ...(priorityRule.ruleType === 'SPECIAL_NEEDS' && { hasSpecialNeeds: true })
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...priorityRule,
        parsedConditions: priorityRule.conditions ? JSON.parse(priorityRule.conditions) : null,
        scope: priorityRule.programId ? 'program' : 'daycare',
        stats: {
          affectedEntries,
          potentialImpact: affectedEntries * priorityRule.points
        }
      }
    });

  } catch (error: any) {
    console.error('Get priority rule error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get priority rule" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      points,
      isActive,
      conditions,
      sortOrder,
      updatedBy
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Priority rule ID is required" },
        { status: 400 }
      );
    }

    // Get current rule
    const currentRule = await prisma.priorityRule.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        points: true,
        isActive: true,
        conditions: true,
        sortOrder: true,
        daycareId: true,
        programId: true,
        ruleType: true
      }
    });

    if (!currentRule) {
      return NextResponse.json(
        { success: false, error: "Priority rule not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined && name !== currentRule.name) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (points !== undefined && points !== currentRule.points) {
      updateData.points = points;
    }

    if (isActive !== undefined && isActive !== currentRule.isActive) {
      updateData.isActive = isActive;
    }

    if (sortOrder !== undefined && sortOrder !== currentRule.sortOrder) {
      updateData.sortOrder = sortOrder;
    }

    if (conditions !== undefined) {
      let validatedConditions = null;
      if (conditions) {
        try {
          validatedConditions = typeof conditions === 'string'
            ? conditions
            : JSON.stringify(conditions);
          JSON.parse(validatedConditions);
        } catch (error) {
          return NextResponse.json(
            { success: false, error: "Invalid conditions JSON format" },
            { status: 400 }
          );
        }
      }

      if (validatedConditions !== currentRule.conditions) {
        updateData.conditions = validatedConditions;
      }
    }

    // If no changes, return current data
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes detected",
        data: currentRule
      });
    }

    // Update the rule
    const updatedRule = await prisma.priorityRule.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        daycare: { select: { name: true } },
        program: { select: { name: true } }
      }
    });

    // If points or conditions changed, trigger priority recalculation
    if (updateData.points !== undefined || updateData.conditions !== undefined || updateData.isActive !== undefined) {
      // This would ideally trigger a background job to recalculate priorities
      // For now, we'll return a flag indicating recalculation is needed
      return NextResponse.json({
        success: true,
        message: "Priority rule updated successfully",
        data: updatedRule,
        requiresRecalculation: true,
        recalculationScope: {
          daycareId: currentRule.daycareId,
          programId: currentRule.programId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Priority rule updated successfully",
      data: updatedRule
    });

  } catch (error: any) {
    console.error('Update priority rule error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to update priority rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const deletedBy = searchParams.get('deletedBy');
    const force = searchParams.get('force') === 'true';

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Priority rule ID is required" },
        { status: 400 }
      );
    }

    // Get current rule
    const currentRule = await prisma.priorityRule.findUnique({
      where: { id },
      include: {
        daycare: { select: { name: true } },
        program: { select: { name: true } }
      }
    });

    if (!currentRule) {
      return NextResponse.json(
        { success: false, error: "Priority rule not found" },
        { status: 404 }
      );
    }

    // Check if rule affects active waitlist entries
    const affectedEntries = await prisma.waitlistEntry.count({
      where: {
        daycareId: currentRule.daycareId,
        ...(currentRule.programId ? { programId: currentRule.programId } : {}),
        status: 'ACTIVE'
      }
    });

    if (affectedEntries > 0 && !force) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete rule that affects active waitlist entries",
          details: `This rule affects ${affectedEntries} active waitlist entries. Use force=true to proceed.`,
          affectedEntries
        },
        { status: 400 }
      );
    }

    // Soft delete by deactivating instead of hard delete (safer)
    const deletedRule = await prisma.priorityRule.update({
      where: { id },
      data: {
        isActive: false,
        name: `[DELETED] ${currentRule.name}`,
        description: currentRule.description
          ? `${currentRule.description} (Deleted on ${new Date().toISOString()})`
          : `Deleted on ${new Date().toISOString()}`,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Priority rule deleted successfully",
      data: deletedRule,
      requiresRecalculation: affectedEntries > 0,
      recalculationScope: {
        daycareId: currentRule.daycareId,
        programId: currentRule.programId
      }
    });

  } catch (error: any) {
    console.error('Delete priority rule error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to delete priority rule" },
      { status: 500 }
    );
  }
}