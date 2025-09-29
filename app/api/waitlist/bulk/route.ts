import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { WaitlistStatus, WaitlistAction } from '@prisma/client';
import { WaitlistPriorityEngine } from '@/app/utils/waitlist/priorityEngine';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entryIds, data, performedBy } = body;

    if (!action || !entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Action and entry IDs are required" },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'move-up':
      case 'move-down':
        result = await handlePositionAdjustment(entryIds, action, data?.adjustment || 1, performedBy);
        break;

      case 'pause':
        result = await handleStatusUpdate(entryIds, 'PAUSED', performedBy);
        break;

      case 'resume':
        result = await handleStatusUpdate(entryIds, 'ACTIVE', performedBy);
        break;

      case 'priority-boost':
        result = await handlePriorityBoost(entryIds, data?.boost || 10, performedBy);
        break;

      case 'remove':
        result = await handleRemoval(entryIds, performedBy);
        break;

      case 'export':
        result = await handleExport(entryIds);
        break;

      case 'communicate':
        result = await handleCommunication(entryIds, data, performedBy);
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: result
    });

  } catch (error: any) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}

async function handlePositionAdjustment(
  entryIds: string[],
  direction: 'move-up' | 'move-down',
  adjustment: number,
  performedBy: string
) {
  return await prisma.$transaction(async (tx) => {
    const entries = await tx.waitlistEntry.findMany({
      where: { id: { in: entryIds } },
      include: {
        daycare: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } }
      }
    });

    const updatedEntries = [];

    for (const entry of entries) {
      const adjustment_value = direction === 'move-up' ? -adjustment : adjustment;
      const newPosition = Math.max(1, entry.position + adjustment_value);

      // Update the entry position
      const updatedEntry = await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          position: newPosition,
          lastUpdatedAt: new Date()
        }
      });

      // Create audit log
      await tx.waitlistAuditLog.create({
        data: {
          waitlistEntryId: entry.id,
          daycareId: entry.daycareId,
          action: WaitlistAction.POSITION_CHANGED,
          description: `Position ${direction === 'move-up' ? 'increased' : 'decreased'} by ${adjustment} positions (bulk action)`,
          performedBy,
          performedByType: 'PROVIDER',
          oldValues: JSON.stringify({ position: entry.position }),
          newValues: JSON.stringify({ position: newPosition }),
          metadata: JSON.stringify({
            bulkAction: true,
            direction,
            adjustment,
            totalEntriesAffected: entryIds.length
          })
        }
      });

      updatedEntries.push(updatedEntry);
    }

    // Recalculate positions for affected daycares
    const daycareIds = Array.from(new Set(entries.map(e => e.daycareId)));
    for (const daycareId of daycareIds) {
      await WaitlistPriorityEngine.recalculatePositions(daycareId);
    }

    return { updatedEntries, affectedDaycares: daycareIds.length };
  });
}

async function handleStatusUpdate(entryIds: string[], newStatus: WaitlistStatus, performedBy: string) {
  return await prisma.$transaction(async (tx) => {
    const entries = await tx.waitlistEntry.findMany({
      where: { id: { in: entryIds } },
      select: { id: true, status: true, daycareId: true }
    });

    const updatedEntries = await tx.waitlistEntry.updateMany({
      where: { id: { in: entryIds } },
      data: {
        status: newStatus,
        lastUpdatedAt: new Date()
      }
    });

    // Create audit logs
    for (const entry of entries) {
      await tx.waitlistAuditLog.create({
        data: {
          waitlistEntryId: entry.id,
          daycareId: entry.daycareId,
          action: WaitlistAction.STATUS_UPDATED,
          description: `Status changed from ${entry.status} to ${newStatus} (bulk action)`,
          performedBy,
          performedByType: 'PROVIDER',
          oldValues: JSON.stringify({ status: entry.status }),
          newValues: JSON.stringify({ status: newStatus }),
          metadata: JSON.stringify({
            bulkAction: true,
            totalEntriesAffected: entryIds.length
          })
        }
      });
    }

    return { updatedCount: updatedEntries.count };
  });
}

async function handlePriorityBoost(entryIds: string[], boost: number, performedBy: string) {
  return await prisma.$transaction(async (tx) => {
    const entries = await tx.waitlistEntry.findMany({
      where: { id: { in: entryIds } },
      select: { id: true, priorityScore: true, daycareId: true }
    });

    const updatedEntries = [];

    for (const entry of entries) {
      const newScore = entry.priorityScore + boost;

      const updatedEntry = await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          priorityScore: newScore,
          lastUpdatedAt: new Date()
        }
      });

      await tx.waitlistAuditLog.create({
        data: {
          waitlistEntryId: entry.id,
          daycareId: entry.daycareId,
          action: WaitlistAction.PRIORITY_UPDATED,
          description: `Priority score increased by ${boost} points (bulk action)`,
          performedBy,
          performedByType: 'PROVIDER',
          oldValues: JSON.stringify({ priorityScore: entry.priorityScore }),
          newValues: JSON.stringify({ priorityScore: newScore }),
          metadata: JSON.stringify({
            bulkAction: true,
            boost,
            totalEntriesAffected: entryIds.length
          })
        }
      });

      updatedEntries.push(updatedEntry);
    }

    // Recalculate positions for affected daycares
    const daycareIds = Array.from(new Set(entries.map(e => e.daycareId)));
    for (const daycareId of daycareIds) {
      await WaitlistPriorityEngine.recalculatePositions(daycareId);
    }

    return { updatedEntries, averageBoost: boost };
  });
}

async function handleRemoval(entryIds: string[], performedBy: string) {
  return await prisma.$transaction(async (tx) => {
    const entries = await tx.waitlistEntry.findMany({
      where: { id: { in: entryIds } },
      include: {
        parent: { select: { name: true } },
        daycare: { select: { name: true } }
      }
    });

    // Update status to REMOVED
    await tx.waitlistEntry.updateMany({
      where: { id: { in: entryIds } },
      data: {
        status: 'REMOVED' as WaitlistStatus,
        lastUpdatedAt: new Date()
      }
    });

    // Create audit logs
    for (const entry of entries) {
      await tx.waitlistAuditLog.create({
        data: {
          waitlistEntryId: entry.id,
          daycareId: entry.daycareId,
          action: WaitlistAction.REMOVED,
          description: `Entry removed from waitlist (bulk action)`,
          performedBy,
          performedByType: 'PROVIDER',
          oldValues: JSON.stringify({ status: entry.status }),
          newValues: JSON.stringify({ status: 'REMOVED' }),
          metadata: JSON.stringify({
            bulkAction: true,
            totalEntriesAffected: entryIds.length,
            parentName: entry.parent.name,
            childName: entry.childName
          })
        }
      });
    }

    return { removedCount: entries.length };
  });
}

async function handleExport(entryIds: string[]) {
  const entries = await prisma.waitlistEntry.findMany({
    where: { id: { in: entryIds } },
    include: {
      parent: {
        select: { name: true, email: true, phone: true }
      },
      daycare: {
        select: { name: true, address: true, city: true }
      },
      program: {
        select: { name: true, description: true }
      },
      offers: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          response: true,
          spotAvailableDate: true,
          offerExpiresAt: true
        }
      }
    },
    orderBy: { position: 'asc' }
  });

  // Transform data for export
  const exportData = entries.map(entry => ({
    'Child Name': entry.childName,
    'Child Age': entry.childAge,
    'Parent Name': entry.parent.name,
    'Parent Email': entry.parent.email,
    'Parent Phone': entry.parent.phone || '',
    'Daycare': entry.daycare.name,
    'Program': entry.program?.name || 'Any Program',
    'Position': entry.position,
    'Priority Score': entry.priorityScore,
    'Status': entry.status,
    'Care Type': entry.careType,
    'Desired Start Date': entry.desiredStartDate.toISOString().split('T')[0],
    'Joined Date': entry.joinedAt.toISOString().split('T')[0],
    'Estimated Wait Days': entry.estimatedWaitDays,
    'Last Offer Response': entry.offers[0]?.response || 'None',
    'Notes': entry.parentNotes || ''
  }));

  return {
    data: exportData,
    filename: `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`,
    totalRecords: exportData.length
  };
}

async function handleCommunication(entryIds: string[], communicationData: any, performedBy: string) {
  const { type, subject, content } = communicationData;

  const entries = await prisma.waitlistEntry.findMany({
    where: { id: { in: entryIds } },
    include: {
      parent: { select: { name: true, email: true, phone: true } },
      daycare: { select: { name: true } }
    }
  });

  // In a real implementation, you would integrate with email/SMS services
  // For now, we'll just log the communication attempts

  const communications = [];

  for (const entry of entries) {
    // Replace variables in content
    let personalizedContent = content
      .replace(/{parentName}/g, entry.parent.name || 'Parent')
      .replace(/{childName}/g, entry.childName)
      .replace(/{daycareName}/g, entry.daycare.name)
      .replace(/{position}/g, entry.position.toString())
      .replace(/{estimatedWait}/g, `${entry.estimatedWaitDays} days`);

    // Store communication record
    communications.push({
      entryId: entry.id,
      parentEmail: entry.parent.email,
      parentPhone: entry.parent.phone,
      type,
      subject,
      content: personalizedContent,
      sentAt: new Date()
    });

    // Create audit log
    await prisma.waitlistAuditLog.create({
      data: {
        waitlistEntryId: entry.id,
        daycareId: entry.daycareId,
        action: WaitlistAction.BULK_UPDATED,
        description: `${type.toUpperCase()} communication sent: "${subject}" (bulk action)`,
        performedBy,
        performedByType: 'PROVIDER',
        metadata: JSON.stringify({
          bulkAction: true,
          communicationType: type,
          subject,
          totalRecipients: entryIds.length
        })
      }
    });
  }

  return {
    communicationsSent: communications.length,
    type,
    subject,
    recipients: communications.map(c => c.parentEmail)
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'templates') {
      // Return communication templates
      const templates = [
        {
          id: 'position-update',
          name: 'Position Update',
          subject: 'Waitlist Position Update',
          content: 'Hi {parentName},\n\nWe wanted to update you on {childName}\'s waitlist position at {daycareName}.\n\nCurrent position: #{position}\nEstimated wait time: {estimatedWait}\n\nThank you for your patience.\n\nBest regards,\n{daycareName} Team'
        },
        {
          id: 'document-reminder',
          name: 'Document Reminder',
          subject: 'Document Submission Reminder',
          content: 'Hi {parentName},\n\nThis is a friendly reminder that we still need some documents for {childName}\'s waitlist application.\n\nPlease log into your parent portal to complete your application.\n\nThank you!\n{daycareName} Team'
        },
        {
          id: 'general-update',
          name: 'General Update',
          subject: 'Waitlist Update',
          content: 'Hi {parentName},\n\nWe have an update regarding {childName}\'s waitlist status at {daycareName}.\n\n[Your message here]\n\nBest regards,\n{daycareName} Team'
        }
      ];

      return NextResponse.json({
        success: true,
        templates
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Bulk action GET error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bulk action data" },
      { status: 500 }
    );
  }
}