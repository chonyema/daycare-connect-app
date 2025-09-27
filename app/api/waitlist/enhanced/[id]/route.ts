import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { WaitlistPriorityEngine } from '@/app/utils/waitlist/priorityEngine';
import { WaitlistStatus, WaitlistAction } from '@prisma/client';

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
        { success: false, error: "Waitlist entry ID is required" },
        { status: 400 }
      );
    }

    const waitlistEntry = await prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        daycare: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            email: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            description: true,
            minAgeMonths: true,
            maxAgeMonths: true,
            totalCapacity: true,
            currentEnrollment: true,
            waitlistCount: true
          }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            description: true,
            performedByType: true,
            createdAt: true,
            metadata: true
          }
        },
        offers: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            spotAvailableDate: true,
            offerSentAt: true,
            offerExpiresAt: true,
            response: true,
            respondedAt: true,
            isAutomated: true,
            priorityAtOffer: true,
            positionAtOffer: true
          }
        }
      }
    });

    if (!waitlistEntry) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    // Calculate days on waitlist
    const now = new Date();
    const daysOnWaitlist = Math.floor(
      (now.getTime() - waitlistEntry.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get current priority rules and calculate current score
    const priorityRules = await prisma.priorityRule.findMany({
      where: {
        daycareId: waitlistEntry.daycareId,
        ...(waitlistEntry.programId && { programId: waitlistEntry.programId }),
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });

    const currentPriorityResult = WaitlistPriorityEngine.calculatePriorityScore({
      waitlistEntry,
      rules: priorityRules,
      daysOnWaitlist
    });

    // Get position in queue
    const currentPosition = await prisma.waitlistEntry.count({
      where: {
        daycareId: waitlistEntry.daycareId,
        ...(waitlistEntry.programId && { programId: waitlistEntry.programId }),
        status: 'ACTIVE',
        OR: [
          { priorityScore: { gt: waitlistEntry.priorityScore } },
          {
            priorityScore: waitlistEntry.priorityScore,
            joinedAt: { lt: waitlistEntry.joinedAt }
          }
        ]
      }
    }) + 1;

    return NextResponse.json({
      success: true,
      data: {
        ...waitlistEntry,
        daysOnWaitlist,
        currentPosition,
        positionBand: WaitlistPriorityEngine.getPositionBand(currentPosition),
        currentPriorityScore: currentPriorityResult.totalScore,
        priorityBreakdown: currentPriorityResult.ruleBreakdown,
        scoreNeedsUpdate: Math.abs(currentPriorityResult.totalScore - waitlistEntry.priorityScore) > 0.01
      }
    });

  } catch (error: any) {
    console.error('Get waitlist entry error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get waitlist entry" },
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
      desiredStartDate,
      preferredDays,
      careType,
      parentNotes,
      providerNotes,
      status,
      isPaused,
      pausedUntil,
      // Priority factors
      hasSiblingEnrolled,
      isStaffChild,
      inServiceArea,
      hasSubsidyApproval,
      hasCorporatePartnership,
      hasSpecialNeeds,
      providerTags,
      // Admin info
      performedBy,
      performedByType = 'PARENT',
      reason = 'Entry updated'
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry ID is required" },
        { status: 400 }
      );
    }

    // Get current entry
    const currentEntry = await prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        daycare: { select: { name: true } },
        program: { select: { name: true } }
      }
    });

    if (!currentEntry) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    const oldValues: any = {};
    const newValues: any = {};
    let needsPriorityRecalculation = false;

    // Track changes for audit log
    if (desiredStartDate !== undefined && desiredStartDate !== currentEntry.desiredStartDate?.toISOString()) {
      updateData.desiredStartDate = new Date(desiredStartDate);
      oldValues.desiredStartDate = currentEntry.desiredStartDate;
      newValues.desiredStartDate = desiredStartDate;
    }

    if (preferredDays !== undefined) {
      const newPreferredDays = preferredDays ? JSON.stringify(preferredDays) : null;
      if (newPreferredDays !== currentEntry.preferredDays) {
        updateData.preferredDays = newPreferredDays;
        oldValues.preferredDays = currentEntry.preferredDays;
        newValues.preferredDays = newPreferredDays;
      }
    }

    if (careType !== undefined && careType !== currentEntry.careType) {
      updateData.careType = careType;
      oldValues.careType = currentEntry.careType;
      newValues.careType = careType;
    }

    if (parentNotes !== undefined && parentNotes !== currentEntry.parentNotes) {
      updateData.parentNotes = parentNotes;
      oldValues.parentNotes = currentEntry.parentNotes;
      newValues.parentNotes = parentNotes;
    }

    if (providerNotes !== undefined && providerNotes !== currentEntry.providerNotes) {
      updateData.providerNotes = providerNotes;
      oldValues.providerNotes = currentEntry.providerNotes;
      newValues.providerNotes = providerNotes;
    }

    if (status !== undefined && status !== currentEntry.status) {
      updateData.status = status;
      oldValues.status = currentEntry.status;
      newValues.status = status;
    }

    if (isPaused !== undefined && isPaused !== currentEntry.isPaused) {
      updateData.isPaused = isPaused;
      oldValues.isPaused = currentEntry.isPaused;
      newValues.isPaused = isPaused;

      if (isPaused && pausedUntil) {
        updateData.pausedUntil = new Date(pausedUntil);
        newValues.pausedUntil = pausedUntil;
      } else if (!isPaused) {
        updateData.pausedUntil = null;
        newValues.pausedUntil = null;
      }
    }

    // Priority factors that trigger recalculation
    const priorityFactors = {
      hasSiblingEnrolled,
      isStaffChild,
      inServiceArea,
      hasSubsidyApproval,
      hasCorporatePartnership,
      hasSpecialNeeds
    };

    for (const [factor, value] of Object.entries(priorityFactors)) {
      if (value !== undefined && value !== currentEntry[factor as keyof typeof currentEntry]) {
        updateData[factor] = value;
        oldValues[factor] = currentEntry[factor as keyof typeof currentEntry];
        newValues[factor] = value;
        needsPriorityRecalculation = true;
      }
    }

    if (providerTags !== undefined) {
      const newProviderTags = providerTags?.length > 0 ? JSON.stringify(providerTags) : null;
      if (newProviderTags !== currentEntry.providerTags) {
        updateData.providerTags = newProviderTags;
        oldValues.providerTags = currentEntry.providerTags;
        newValues.providerTags = newProviderTags;
        needsPriorityRecalculation = true;
      }
    }

    // If no changes, return current data
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes detected",
        data: currentEntry
      });
    }

    // Update last updated timestamp
    updateData.lastUpdatedAt = new Date();

    // Recalculate priority score if needed
    if (needsPriorityRecalculation) {
      const priorityRules = await prisma.priorityRule.findMany({
        where: {
          daycareId: currentEntry.daycareId,
          ...(currentEntry.programId && { programId: currentEntry.programId }),
          isActive: true
        },
        orderBy: { sortOrder: 'asc' }
      });

      const now = new Date();
      const daysOnWaitlist = Math.floor(
        (now.getTime() - currentEntry.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create temporary entry with updates for scoring
      const tempEntry = { ...currentEntry, ...updateData };
      const priorityResult = WaitlistPriorityEngine.calculatePriorityScore({
        waitlistEntry: tempEntry,
        rules: priorityRules,
        daysOnWaitlist
      });

      const oldScore = currentEntry.priorityScore;
      const newScore = priorityResult.totalScore;

      if (Math.abs(oldScore - newScore) > 0.01) {
        updateData.priorityScore = newScore;
        oldValues.priorityScore = oldScore;
        newValues.priorityScore = newScore;
        newValues.priorityBreakdown = priorityResult.ruleBreakdown;
      }
    }

    // Update the entry
    const updatedEntry = await prisma.waitlistEntry.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { name: true, email: true } },
        daycare: { select: { name: true } },
        program: { select: { name: true } }
      }
    });

    // Create audit log
    let auditAction = WaitlistAction.NOTES_UPDATED;
    if (newValues.status) {
      if (newValues.status === 'PAUSED') auditAction = WaitlistAction.PAUSED;
      else if (oldValues.status === 'PAUSED' && newValues.status === 'ACTIVE') auditAction = WaitlistAction.UNPAUSED;
    } else if (needsPriorityRecalculation) {
      auditAction = WaitlistAction.PRIORITY_UPDATED;
    }

    await prisma.waitlistAuditLog.create({
      data: {
        waitlistEntryId: id,
        daycareId: currentEntry.daycareId,
        action: auditAction,
        description: reason,
        performedBy,
        performedByType,
        oldValues: JSON.stringify(oldValues),
        newValues: JSON.stringify(newValues),
        metadata: JSON.stringify({
          priorityRecalculated: needsPriorityRecalculation,
          changedFields: Object.keys(updateData)
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: "Waitlist entry updated successfully",
      data: updatedEntry,
      priorityRecalculated: needsPriorityRecalculation
    });

  } catch (error: any) {
    console.error('Update waitlist entry error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to update waitlist entry" },
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
    const performedBy = searchParams.get('performedBy');
    const reason = searchParams.get('reason') || 'Entry withdrawn';

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry ID is required" },
        { status: 400 }
      );
    }

    // Get current entry
    const currentEntry = await prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        daycare: { select: { name: true } },
        program: { select: { name: true } }
      }
    });

    if (!currentEntry) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    // Update status to withdrawn instead of deleting
    const updatedEntry = await prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: WaitlistStatus.WITHDRAWN,
        lastUpdatedAt: new Date()
      }
    });

    // Create audit log
    await prisma.waitlistAuditLog.create({
      data: {
        waitlistEntryId: id,
        daycareId: currentEntry.daycareId,
        action: WaitlistAction.WITHDRAWN,
        description: reason,
        performedBy,
        performedByType: performedBy ? 'PARENT' : null,
        oldValues: JSON.stringify({
          status: currentEntry.status,
          position: currentEntry.position
        }),
        newValues: JSON.stringify({
          status: 'WITHDRAWN'
        })
      }
    });

    // Update program waitlist count if applicable
    if (currentEntry.programId) {
      await prisma.program.update({
        where: { id: currentEntry.programId },
        data: { waitlistCount: { decrement: 1 } }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully withdrawn from waitlist",
      data: updatedEntry
    });

  } catch (error: any) {
    console.error('Delete waitlist entry error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to withdraw from waitlist" },
      { status: 500 }
    );
  }
}