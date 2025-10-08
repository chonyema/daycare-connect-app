import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { WaitlistPriorityEngine, DEFAULT_PRIORITY_RULES } from '@/app/utils/waitlist/priorityEngine';
import { WaitlistStatus, CareType, WaitlistAction } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      parentId,
      daycareId,
      childName,
      childAge,
      childBirthDate,
      programId,
      desiredStartDate,
      preferredDays,
      careType = 'FULL_TIME',
      parentNotes,
      // Priority factors
      hasSiblingEnrolled = false,
      isStaffChild = false,
      inServiceArea = true,
      hasSubsidyApproval = false,
      hasCorporatePartnership = false,
      hasSpecialNeeds = false,
      providerTags = []
    } = body;

    if (!parentId || !daycareId || !childName) {
      return NextResponse.json(
        { success: false, error: "Parent ID, Daycare ID, and child name are required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!desiredStartDate) {
      return NextResponse.json(
        { success: false, error: "Desired start date is required" },
        { status: 400 }
      );
    }

    // Handle daycare ID mapping
    let actualDaycareId = daycareId;
    if (typeof daycareId === 'number' || !isNaN(Number(daycareId))) {
      const allDaycares = await prisma.daycare.findMany({
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });

      const daycareIndex = Number(daycareId) - 1;
      if (daycareIndex >= 0 && daycareIndex < allDaycares.length) {
        actualDaycareId = allDaycares[daycareIndex].id;
      }
    }

    // Verify daycare exists
    const daycare = await prisma.daycare.findUnique({
      where: { id: actualDaycareId },
      include: {
        programs: true,
        priorityRules: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!daycare) {
      return NextResponse.json(
        { success: false, error: "Daycare not found" },
        { status: 404 }
      );
    }

    // Check for duplicate entry
    const existingEntry = await prisma.waitlistEntry.findFirst({
      where: {
        parentId,
        daycareId: actualDaycareId,
        childName,
        status: {
          not: 'ENROLLED'
        }
      }
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: "Child is already on the waitlist for this daycare" },
        { status: 400 }
      );
    }

    // Validate program if specified
    if (programId && !daycare.programs.find(p => p.id === programId)) {
      return NextResponse.json(
        { success: false, error: "Invalid program selected" },
        { status: 400 }
      );
    }

    // Get current position in the queue for the specific program/daycare
    const currentEntriesCount = await prisma.waitlistEntry.count({
      where: {
        daycareId: actualDaycareId,
        ...(programId && { programId }),
        status: 'ACTIVE'
      }
    });

    const initialPosition = currentEntriesCount + 1;

    // Create the waitlist entry
    const waitlistEntry = await prisma.waitlistEntry.create({
      data: {
        parentId,
        daycareId: actualDaycareId,
        childName,
        childAge,
        childBirthDate: childBirthDate ? new Date(childBirthDate) : null,
        programId,
        desiredStartDate: new Date(desiredStartDate),
        preferredDays: preferredDays ? JSON.stringify(preferredDays) : null,
        careType: careType as CareType,
        position: initialPosition,
        hasSiblingEnrolled,
        isStaffChild,
        inServiceArea,
        hasSubsidyApproval,
        hasCorporatePartnership,
        hasSpecialNeeds,
        providerTags: providerTags.length > 0 ? JSON.stringify(providerTags) : null,
        parentNotes
      },
      include: {
        parent: {
          select: { name: true, email: true }
        },
        daycare: {
          select: { name: true, address: true }
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
            waitlistCount: true,
            createdAt: true,
            updatedAt: true,
            dailyRate: true,
            hourlyRate: true,
            operatingDays: true,
            operatingHours: true,
            acceptingWaitlist: true,
            daycareId: true,
            isActive: true
          }
        }
      }
    });

    // Calculate initial priority score
    let priorityRules = daycare.priorityRules;

    // If no custom rules exist, create default rules for this daycare
    if (priorityRules.length === 0) {
      const defaultRules = await prisma.priorityRule.createMany({
        data: DEFAULT_PRIORITY_RULES.map(rule => ({
          ...rule,
          daycareId: actualDaycareId,
          programId: programId || null
        }))
      });

      // Fetch the newly created rules
      priorityRules = await prisma.priorityRule.findMany({
        where: {
          daycareId: actualDaycareId,
          isActive: true
        },
        orderBy: { sortOrder: 'asc' }
      });
    }

    // Calculate priority score
    const daysOnWaitlist = 0; // New entry
    const priorityResult = WaitlistPriorityEngine.calculatePriorityScore({
      waitlistEntry,
      rules: priorityRules,
      daysOnWaitlist
    });

    // Update entry with calculated priority score
    const updatedEntry = await prisma.waitlistEntry.update({
      where: { id: waitlistEntry.id },
      data: { priorityScore: priorityResult.totalScore },
      include: {
        parent: { select: { name: true, email: true } },
        daycare: { select: { name: true, address: true } },
        program: { select: { name: true, description: true } }
      }
    });

    // Create audit log entry
    await prisma.waitlistAuditLog.create({
      data: {
        waitlistEntryId: waitlistEntry.id,
        daycareId: actualDaycareId,
        action: WaitlistAction.JOINED,
        description: `${childName} joined waitlist${programId ? ` for ${daycare.programs.find(p => p.id === programId)?.name}` : ''}`,
        performedBy: parentId,
        performedByType: 'PARENT',
        newValues: JSON.stringify({
          position: initialPosition,
          priorityScore: priorityResult.totalScore,
          priorityBreakdown: priorityResult.ruleBreakdown
        }),
        metadata: JSON.stringify({
          desiredStartDate,
          careType,
          priorityFactors: {
            hasSiblingEnrolled,
            isStaffChild,
            inServiceArea,
            hasSubsidyApproval,
            hasCorporatePartnership,
            hasSpecialNeeds
          }
        })
      }
    });

    // Update program waitlist count if applicable
    if (programId) {
      await prisma.program.update({
        where: { id: programId },
        data: { waitlistCount: { increment: 1 } }
      });
    }

    // Calculate estimated wait time
    // For now, use simple calculation - can be enhanced with historical data
    const estimatedWaitDays = WaitlistPriorityEngine.calculateEstimatedWaitDays(
      initialPosition,
      {
        averageOfferPerMonth: 2, // Default assumption
        averageAcceptanceRate: 0.7, // Default assumption
        seasonalAdjustment: 1
      }
    );

    await prisma.waitlistEntry.update({
      where: { id: waitlistEntry.id },
      data: { estimatedWaitDays }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined waitlist for ${daycare.name}`,
      data: {
        waitlistEntry: updatedEntry,
        position: initialPosition,
        priorityScore: priorityResult.totalScore,
        priorityBreakdown: priorityResult.ruleBreakdown,
        estimatedWaitDays,
        positionBand: WaitlistPriorityEngine.getPositionBand(initialPosition)
      }
    });

  } catch (error: any) {
    console.error('Enhanced waitlist error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to join waitlist",
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');
    const daycareId = searchParams.get('daycareId');
    const programId = searchParams.get('programId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    console.log('Enhanced waitlist GET request:', { parentId, daycareId, programId, includeInactive });

    if (!parentId && !daycareId) {
      return NextResponse.json(
        { success: false, error: "Either Parent ID or Daycare ID is required" },
        { status: 400 }
      );
    }

    const whereClause: any = {};

    if (parentId) {
      whereClause.parentId = parentId;
      if (!includeInactive) {
        whereClause.status = { in: ['ACTIVE', 'PAUSED', 'OFFERED'] };
      }
    }

    if (daycareId) {
      whereClause.daycareId = daycareId;
      if (programId) {
        whereClause.programId = programId;
      }
      if (!includeInactive) {
        whereClause.status = 'ACTIVE';
      }
    }

    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: whereClause,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true
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
            maxAgeMonths: true
          }
        },
        offers: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            spotAvailableDate: true,
            offerExpiresAt: true,
            response: true,
            responseNotes: true,
            createdAt: true
          }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            description: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { priorityScore: 'desc' },
        { joinedAt: 'asc' }
      ]
    });

    console.log('Database query result:', {
      entriesFound: waitlistEntries.length,
      whereClause,
      firstEntry: waitlistEntries[0] ? {
        id: waitlistEntries[0].id,
        childName: waitlistEntries[0].childName,
        status: waitlistEntries[0].status
      } : null
    });

    // Check for expired offers and update them
    const now = new Date();
    const expiredOfferUpdates = [];
    let hasExpiredOffers = false;

    for (const entry of waitlistEntries) {
      if (entry.status === 'OFFERED' && entry.offers && entry.offers.length > 0) {
        const latestOffer = entry.offers[0]; // Most recent offer
        const isExpired = now > new Date(latestOffer.offerExpiresAt);

        // If the latest offer is expired and hasn't been responded to, update the entry
        if (isExpired && (!latestOffer.response || latestOffer.response === 'PENDING')) {
          hasExpiredOffers = true;

          expiredOfferUpdates.push(
            prisma.waitlistEntry.update({
              where: { id: entry.id },
              data: {
                status: 'ACTIVE',
                lastUpdatedAt: now
              }
            })
          );

          // Also update the offer response to EXPIRED
          expiredOfferUpdates.push(
            prisma.waitlistOffer.update({
              where: { id: latestOffer.id },
              data: { response: 'EXPIRED' }
            })
          );

          // Create audit log for expired offer
          expiredOfferUpdates.push(
            prisma.waitlistAuditLog.create({
              data: {
                waitlistEntryId: entry.id,
                daycareId: entry.daycareId,
                action: WaitlistAction.STATUS_CHANGED,
                description: `Offer expired and returned to active waitlist`,
                performedBy: null,
                performedByType: null,
                oldValues: JSON.stringify({ status: 'OFFERED' }),
                newValues: JSON.stringify({ status: 'ACTIVE' }),
                metadata: JSON.stringify({
                  offerId: latestOffer.id,
                  offerExpiredAt: latestOffer.offerExpiresAt,
                  automaticExpiration: true
                })
              }
            })
          );
        }
      }
    }

    // Execute all expired offer updates
    if (expiredOfferUpdates.length > 0) {
      await Promise.all(expiredOfferUpdates);

      // Refetch the waitlist entries to get updated data
      const updatedWaitlistEntries = await prisma.waitlistEntry.findMany({
        where: whereClause,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true
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
              maxAgeMonths: true
            }
          },
          offers: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              spotAvailableDate: true,
              offerExpiresAt: true,
              response: true,
              responseNotes: true,
              createdAt: true
            }
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              action: true,
              description: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          { priorityScore: 'desc' },
          { joinedAt: 'asc' }
        ]
      });

      // Use updated entries for further processing
      waitlistEntries.splice(0, waitlistEntries.length, ...updatedWaitlistEntries);

      // Recalculate positions for all ACTIVE entries when offers expire
      if (hasExpiredOffers) {
        const activeEntries = updatedWaitlistEntries.filter(e => e.status === 'ACTIVE');

        // Add days on waitlist for position calculation
        const entriesWithDays = activeEntries.map(entry => {
          const daysOnWaitlist = Math.floor(
            (now.getTime() - entry.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          return { ...entry, daysOnWaitlist };
        });

        // Calculate new positions based on priority score and join date
        const positionUpdates = WaitlistPriorityEngine.calculatePositions(entriesWithDays);

        // Update positions in database
        const positionUpdatePromises = positionUpdates.map(update =>
          prisma.waitlistEntry.update({
            where: { id: update.entryId },
            data: {
              position: update.newPosition,
              lastPositionChange: update.oldPosition !== update.newPosition ? now : undefined
            }
          })
        );

        await Promise.all(positionUpdatePromises);

        // Refetch one more time to get the final updated positions
        const finalWaitlistEntries = await prisma.waitlistEntry.findMany({
          where: whereClause,
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true
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
                maxAgeMonths: true
              }
            },
            offers: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true,
                spotAvailableDate: true,
                offerExpiresAt: true,
                response: true,
                responseNotes: true,
                createdAt: true
              }
            },
            auditLogs: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                id: true,
                action: true,
                description: true,
                createdAt: true
              }
            }
          },
          orderBy: [
            { priorityScore: 'desc' },
            { joinedAt: 'asc' }
          ]
        });

        waitlistEntries.splice(0, waitlistEntries.length, ...finalWaitlistEntries);
      }
    }

    // Add calculated fields for each entry
    const enhancedEntries = waitlistEntries.map((entry, index) => {
      const daysOnWaitlist = Math.floor(
        (now.getTime() - entry.joinedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Process offers to add calculated fields
      const processedOffers = entry.offers?.map((offer: any) => {
        const expiresAt = new Date(offer.offerExpiresAt);
        const isExpired = now > expiresAt;
        const hoursRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
        const canRespond = !isExpired && (!offer.response || offer.response === 'PENDING');

        return {
          ...offer,
          isExpired,
          hoursRemaining,
          canRespond
        };
      }) || [];

      return {
        ...entry,
        offers: processedOffers,
        daysOnWaitlist,
        positionBand: WaitlistPriorityEngine.getPositionBand(entry.position),
        currentPosition: daycareId ? index + 1 : entry.position // Recalculated position for provider view
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedEntries,
      meta: {
        total: enhancedEntries.length,
        activeCount: enhancedEntries.filter(e => e.status === 'ACTIVE').length,
        pausedCount: enhancedEntries.filter(e => e.status === 'PAUSED').length,
        offeredCount: enhancedEntries.filter(e => e.status === 'OFFERED').length
      }
    });

  } catch (error: any) {
    console.error('Get enhanced waitlist error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to get waitlist entries" },
      { status: 500 }
    );
  }
}