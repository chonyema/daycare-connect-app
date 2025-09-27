import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { WaitlistPriorityEngine } from '@/app/utils/waitlist/priorityEngine';
import { WaitlistAction } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { daycareId, programId, performedBy, reason = 'Manual position update' } = body;

    if (!daycareId) {
      return NextResponse.json(
        { success: false, error: "Daycare ID is required" },
        { status: 400 }
      );
    }

    // Fetch active waitlist entries for the specified daycare/program
    const whereClause: any = {
      daycareId,
      status: 'ACTIVE'
    };

    if (programId) {
      whereClause.programId = programId;
    }

    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: whereClause,
      include: {
        program: true
      },
      orderBy: [
        { priorityScore: 'desc' },
        { joinedAt: 'asc' }
      ]
    });

    if (waitlistEntries.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active waitlist entries to update",
        data: { updatedCount: 0, positionChanges: [] }
      });
    }

    // Get priority rules for the daycare/program
    const priorityRules = await prisma.priorityRule.findMany({
      where: {
        daycareId,
        ...(programId && { programId }),
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Recalculate priority scores for all entries
    const updatedEntries = [];
    const positionChanges = [];
    const auditLogs = [];

    for (const entry of waitlistEntries) {
      const now = new Date();
      const daysOnWaitlist = Math.floor(
        (now.getTime() - entry.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate new priority score
      const priorityResult = WaitlistPriorityEngine.calculatePriorityScore({
        waitlistEntry: entry,
        rules: priorityRules,
        daysOnWaitlist
      });

      const oldScore = entry.priorityScore;
      const newScore = priorityResult.totalScore;
      const scoreChanged = Math.abs(oldScore - newScore) > 0.01;

      updatedEntries.push({
        id: entry.id,
        oldScore,
        newScore,
        oldPosition: entry.position,
        daysOnWaitlist,
        priorityBreakdown: priorityResult.ruleBreakdown,
        scoreChanged
      });

      // Update the entry with new priority score
      if (scoreChanged) {
        await prisma.waitlistEntry.update({
          where: { id: entry.id },
          data: {
            priorityScore: newScore,
            lastUpdatedAt: now
          }
        });
      }
    }

    // Fetch updated entries with new scores to calculate positions
    const updatedWaitlistEntries = await prisma.waitlistEntry.findMany({
      where: whereClause,
      include: {
        program: true
      }
    });

    // Add days on waitlist for position calculation
    const entriesWithDays = updatedWaitlistEntries.map(entry => {
      const now = new Date();
      const daysOnWaitlist = Math.floor(
        (now.getTime() - entry.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...entry, daysOnWaitlist };
    });

    // Calculate new positions
    const positionUpdates = WaitlistPriorityEngine.calculatePositions(entriesWithDays);

    // Update positions and track changes
    for (const update of positionUpdates) {
      const entry = updatedEntries.find(e => e.id === update.entryId);
      if (!entry) continue;

      const positionChanged = update.oldPosition !== update.newPosition;

      // Update position in database
      await prisma.waitlistEntry.update({
        where: { id: update.entryId },
        data: {
          position: update.newPosition,
          lastPositionChange: positionChanged ? new Date() : undefined
        }
      });

      // Track significant position changes
      if (WaitlistPriorityEngine.isSignificantPositionChange(
        update.oldPosition,
        update.newPosition,
        3 // threshold
      )) {
        positionChanges.push({
          entryId: update.entryId,
          oldPosition: update.oldPosition,
          newPosition: update.newPosition,
          positionChange: update.positionChange,
          priorityScoreChange: entry.newScore - entry.oldScore
        });

        // Create audit log for significant position changes
        auditLogs.push({
          waitlistEntryId: update.entryId,
          daycareId,
          action: WaitlistAction.POSITION_CHANGED,
          description: `Position changed from ${update.oldPosition} to ${update.newPosition} (${update.positionChange > 0 ? 'moved up' : 'moved down'} ${Math.abs(update.positionChange)} positions)`,
          performedBy: performedBy || null,
          performedByType: performedBy ? 'PROVIDER' : null,
          oldValues: JSON.stringify({
            position: update.oldPosition,
            priorityScore: entry.oldScore
          }),
          newValues: JSON.stringify({
            position: update.newPosition,
            priorityScore: entry.newScore,
            priorityBreakdown: entry.priorityBreakdown
          }),
          metadata: JSON.stringify({
            reason,
            daysOnWaitlist: entry.daysOnWaitlist,
            automaticRecalculation: true
          })
        });
      }
    }

    // Bulk create audit logs
    if (auditLogs.length > 0) {
      await prisma.waitlistAuditLog.createMany({
        data: auditLogs
      });
    }

    // Calculate new estimated wait times for all entries
    const estimatedWaitUpdates = [];
    for (const update of positionUpdates) {
      const estimatedWaitDays = WaitlistPriorityEngine.calculateEstimatedWaitDays(
        update.newPosition,
        {
          averageOfferPerMonth: 2, // TODO: Get from historical data
          averageAcceptanceRate: 0.7, // TODO: Get from historical data
          seasonalAdjustment: 1
        }
      );

      estimatedWaitUpdates.push({
        entryId: update.entryId,
        estimatedWaitDays
      });

      await prisma.waitlistEntry.update({
        where: { id: update.entryId },
        data: { estimatedWaitDays }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated positions for ${waitlistEntries.length} waitlist entries`,
      data: {
        updatedCount: waitlistEntries.length,
        positionChanges,
        significantChanges: positionChanges.length,
        priorityScoreChanges: updatedEntries.filter(e => e.scoreChanged).length,
        estimatedWaitUpdates
      }
    });

  } catch (error: any) {
    console.error('Position update error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update positions",
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daycareId = searchParams.get('daycareId');
    const programId = searchParams.get('programId');

    if (!daycareId) {
      return NextResponse.json(
        { success: false, error: "Daycare ID is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {
      daycareId,
      status: 'ACTIVE'
    };

    if (programId) {
      whereClause.programId = programId;
    }

    // Get current waitlist with positions
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: whereClause,
      select: {
        id: true,
        childName: true,
        position: true,
        priorityScore: true,
        joinedAt: true,
        estimatedWaitDays: true,
        parent: {
          select: {
            name: true,
            email: true
          }
        },
        program: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { position: 'asc' }
      ]
    });

    // Add calculated fields
    const enhancedEntries = waitlistEntries.map((entry, index) => {
      const now = new Date();
      const daysOnWaitlist = Math.floor(
        (now.getTime() - entry.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...entry,
        daysOnWaitlist,
        positionBand: WaitlistPriorityEngine.getPositionBand(entry.position),
        actualPosition: index + 1 // Current actual position in queue
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedEntries,
      meta: {
        total: enhancedEntries.length,
        nextPosition: enhancedEntries.length + 1,
        averageWaitDays: enhancedEntries.length > 0
          ? Math.round(enhancedEntries.reduce((sum, e) => sum + (e.estimatedWaitDays || 0), 0) / enhancedEntries.length)
          : 0
      }
    });

  } catch (error: any) {
    console.error('Get positions error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get position data" },
      { status: 500 }
    );
  }
}