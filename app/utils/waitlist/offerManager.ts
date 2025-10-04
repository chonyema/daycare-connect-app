/**
 * Waitlist-to-Offer Priority Manager
 * Handles the complete workflow for offering spots to waitlisted parents
 */

import { prisma } from '@/app/lib/prisma';
import { WaitlistEntry, WaitlistOffer, PriorityRule, Program } from '@prisma/client';
import {
  sendOfferNotification,
  sendOfferAcceptanceConfirmation,
  sendPositionUpdateNotification,
} from './notifications';

interface RankedCandidate {
  entry: WaitlistEntry;
  finalScore: number;
  reason: string;
}

interface OfferEligibilityCheck {
  isEligible: boolean;
  reason: string;
}

interface SpotAvailability {
  programId: string;
  programName: string;
  spotsAvailable: number;
  startDate: Date;
}

/**
 * Calculate priority score for a waitlist entry
 */
export async function calculatePriorityScore(
  entry: WaitlistEntry,
  rules: PriorityRule[]
): Promise<{ score: number; breakdown: Record<string, number> }> {
  let score = 0;
  const breakdown: Record<string, number> = {};

  // Base score: Time on waitlist (days since joined)
  const daysOnList = Math.floor(
    (Date.now() - new Date(entry.joinedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const timeScore = Math.min(daysOnList * 0.5, 50); // Cap at 50 points
  score += timeScore;
  breakdown['time_on_list'] = timeScore;

  // Apply priority rules
  for (const rule of rules.filter((r) => r.isActive)) {
    let ruleScore = 0;

    switch (rule.ruleType) {
      case 'SIBLING_ENROLLED':
        if (entry.hasSiblingEnrolled) {
          ruleScore = rule.points;
        }
        break;

      case 'STAFF_CHILD':
        if (entry.isStaffChild) {
          ruleScore = rule.points;
        }
        break;

      case 'SERVICE_AREA':
        if (entry.inServiceArea) {
          ruleScore = rule.points;
        }
        break;

      case 'SUBSIDY_APPROVED':
        if (entry.hasSubsidyApproval) {
          ruleScore = rule.points;
        }
        break;

      case 'CORPORATE_PARTNERSHIP':
        if (entry.hasCorporatePartnership) {
          ruleScore = rule.points;
        }
        break;

      case 'SPECIAL_NEEDS':
        if (entry.hasSpecialNeeds) {
          ruleScore = rule.points;
        }
        break;

      case 'TIME_ON_LIST':
        // Already handled above
        break;

      default:
        // Handle custom rules
        if (entry.providerTags) {
          try {
            const tags = JSON.parse(entry.providerTags);
            if (rule.conditions) {
              const conditions = JSON.parse(rule.conditions);
              if (conditions.tags && Array.isArray(conditions.tags)) {
                const hasMatchingTag = conditions.tags.some((tag: string) =>
                  tags.includes(tag)
                );
                if (hasMatchingTag) {
                  ruleScore = rule.points;
                }
              }
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }
    }

    if (ruleScore > 0) {
      score += ruleScore;
      breakdown[rule.ruleType] = ruleScore;
    }
  }

  return { score, breakdown };
}

/**
 * Check if a candidate is eligible for an offer
 */
export async function checkOfferEligibility(
  entry: WaitlistEntry,
  program: Program,
  spotStartDate: Date
): Promise<OfferEligibilityCheck> {
  // Check if already has an active offer
  const activeOffer = await prisma.waitlistOffer.findFirst({
    where: {
      waitlistEntryId: entry.id,
      response: null,
      offerExpiresAt: {
        gte: new Date(),
      },
    },
  });

  if (activeOffer) {
    return {
      isEligible: false,
      reason: 'Already has an active offer',
    };
  }

  // Check if paused
  if (entry.isPaused) {
    if (entry.pausedUntil && entry.pausedUntil > new Date()) {
      return {
        isEligible: false,
        reason: `Paused until ${entry.pausedUntil.toLocaleDateString()}`,
      };
    }
  }

  // Check status
  if (entry.status !== 'ACTIVE' && entry.status !== 'EXPIRED' && entry.status !== 'DECLINED') {
    return {
      isEligible: false,
      reason: `Status is ${entry.status}`,
    };
  }

  // Check desired start date
  if (entry.desiredStartDate > spotStartDate) {
    return {
      isEligible: false,
      reason: `Desired start date (${entry.desiredStartDate.toLocaleDateString()}) is after spot availability (${spotStartDate.toLocaleDateString()})`,
    };
  }

  // Check age eligibility
  if (entry.childBirthDate && program) {
    const ageInMonths =
      (spotStartDate.getTime() - entry.childBirthDate.getTime()) /
      (1000 * 60 * 60 * 24 * 30.44);

    if (ageInMonths < program.minAgeMonths || ageInMonths > program.maxAgeMonths) {
      return {
        isEligible: false,
        reason: `Child age (${Math.floor(ageInMonths)} months) outside program range (${program.minAgeMonths}-${program.maxAgeMonths} months)`,
      };
    }
  }

  // Check schedule compatibility
  if (entry.preferredDays && program.operatingDays) {
    try {
      const preferredDays = JSON.parse(entry.preferredDays);
      const operatingDays = JSON.parse(program.operatingDays);

      const hasOverlap = preferredDays.some((day: string) =>
        operatingDays.includes(day)
      );

      if (!hasOverlap) {
        return {
          isEligible: false,
          reason: 'Schedule incompatible with program operating days',
        };
      }
    } catch (e) {
      // Invalid JSON, skip check
    }
  }

  return {
    isEligible: true,
    reason: 'Eligible',
  };
}

/**
 * Rank all eligible candidates for a program
 */
export async function rankWaitlistCandidates(
  daycareId: string,
  programId: string,
  spotStartDate: Date
): Promise<RankedCandidate[]> {
  // Get all active waitlist entries for this program
  const entries = await prisma.waitlistEntry.findMany({
    where: {
      daycareId,
      programId,
      status: {
        in: ['ACTIVE', 'EXPIRED', 'DECLINED'],
      },
    },
    orderBy: {
      position: 'asc',
    },
  });

  // Get program details
  const program = await prisma.program.findUnique({
    where: { id: programId },
  });

  if (!program) {
    throw new Error(`Program ${programId} not found`);
  }

  // Get priority rules
  const rules = await prisma.priorityRule.findMany({
    where: {
      OR: [
        { daycareId, programId: null },
        { programId },
      ],
      isActive: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  // Filter eligible candidates and calculate scores
  const rankedCandidates: RankedCandidate[] = [];

  for (const entry of entries) {
    const eligibility = await checkOfferEligibility(entry, program, spotStartDate);

    if (eligibility.isEligible) {
      const { score, breakdown } = await calculatePriorityScore(entry, rules);

      rankedCandidates.push({
        entry,
        finalScore: score,
        reason: `Priority score: ${score} (${Object.entries(breakdown)
          .map(([k, v]) => `${k}:${v}`)
          .join(', ')})`,
      });
    }
  }

  // Sort by priority score (highest first), then by position
  rankedCandidates.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    return a.entry.position - b.entry.position;
  });

  return rankedCandidates;
}

/**
 * Create an offer for a waitlist candidate
 */
export async function createOffer(
  waitlistEntryId: string,
  spotStartDate: Date,
  settings: {
    offerWindowHours?: number;
    depositRequired?: boolean;
    depositAmount?: number;
    requiredDocuments?: string[];
  },
  createdBy?: string
): Promise<WaitlistOffer> {
  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: waitlistEntryId },
    include: {
      daycare: {
        include: {
          waitlistSettings: true,
        },
      },
    },
  });

  if (!entry) {
    throw new Error(`Waitlist entry ${waitlistEntryId} not found`);
  }

  // Get settings (use provided or defaults from daycare)
  const offerWindowHours =
    settings.offerWindowHours ||
    entry.daycare.waitlistSettings?.defaultOfferWindowHours ||
    48;

  const depositRequired =
    settings.depositRequired ??
    entry.daycare.waitlistSettings?.requireDeposit ??
    false;

  const depositAmount =
    settings.depositAmount || entry.daycare.waitlistSettings?.defaultDepositAmount;

  const requiredDocuments = settings.requiredDocuments || [];

  // Calculate expiration time
  const offerExpiresAt = new Date(Date.now() + offerWindowHours * 60 * 60 * 1000);

  // Create the offer
  const offer = await prisma.waitlistOffer.create({
    data: {
      waitlistEntryId,
      spotAvailableDate: spotStartDate,
      offerExpiresAt,
      depositRequired,
      depositAmount,
      requiredDocuments: JSON.stringify(requiredDocuments),
      priorityAtOffer: entry.priorityScore,
      positionAtOffer: entry.position,
      createdBy,
      isAutomated: !createdBy,
    },
  });

  // Update waitlist entry status
  await prisma.waitlistEntry.update({
    where: { id: waitlistEntryId },
    data: {
      status: 'OFFERED',
      lastOfferSentAt: new Date(),
      offerExpiresAt,
      offerAttempts: {
        increment: 1,
      },
    },
  });

  // Create audit log
  await prisma.waitlistAuditLog.create({
    data: {
      waitlistEntryId,
      daycareId: entry.daycareId,
      action: 'OFFER_SENT',
      description: `Offer sent for spot starting ${spotStartDate.toLocaleDateString()}`,
      performedBy: createdBy,
      newValues: JSON.stringify({
        offerId: offer.id,
        offerExpiresAt,
        depositRequired,
        depositAmount,
      }),
    },
  });

  // Send notification to parent
  const fullOffer = await prisma.waitlistOffer.findUnique({
    where: { id: offer.id },
    include: {
      waitlistEntry: {
        include: {
          parent: true,
          daycare: true,
        },
      },
    },
  });

  if (fullOffer) {
    await sendOfferNotification({ offer: fullOffer });
  }

  return offer;
}

/**
 * Process offer response (accept/decline)
 */
export async function processOfferResponse(
  offerId: string,
  response: 'ACCEPTED' | 'DECLINED',
  notes?: string,
  depositPaid?: boolean
): Promise<void> {
  const offer = await prisma.waitlistOffer.findUnique({
    where: { id: offerId },
    include: {
      waitlistEntry: {
        include: {
          daycare: {
            include: {
              waitlistSettings: true,
            },
          },
        },
      },
    },
  });

  if (!offer) {
    throw new Error(`Offer ${offerId} not found`);
  }

  const now = new Date();

  // Update offer
  await prisma.waitlistOffer.update({
    where: { id: offerId },
    data: {
      response,
      respondedAt: now,
      responseNotes: notes,
      depositPaid: depositPaid || false,
      depositPaidAt: depositPaid ? now : null,
    },
  });

  // Update waitlist entry
  const newStatus = response === 'ACCEPTED' ? 'ACCEPTED' : 'DECLINED';

  await prisma.waitlistEntry.update({
    where: { id: offer.waitlistEntryId },
    data: {
      status: newStatus,
      offerResponse: response,
      offerResponseAt: now,
    },
  });

  // Create audit log
  await prisma.waitlistAuditLog.create({
    data: {
      waitlistEntryId: offer.waitlistEntryId,
      daycareId: offer.waitlistEntry.daycareId,
      action: response === 'ACCEPTED' ? 'OFFER_ACCEPTED' : 'OFFER_DECLINED',
      description: `Offer ${response.toLowerCase()} ${notes ? `- ${notes}` : ''}`,
      performedByType: 'PARENT',
      newValues: JSON.stringify({
        offerId,
        response,
        depositPaid,
      }),
    },
  });

  // Send confirmation notification if accepted
  if (response === 'ACCEPTED') {
    const fullOffer = await prisma.waitlistOffer.findUnique({
      where: { id: offerId },
      include: {
        waitlistEntry: {
          include: {
            parent: true,
            daycare: true,
          },
        },
      },
    });

    if (fullOffer) {
      await sendOfferAcceptanceConfirmation({ offer: fullOffer });
    }
  }

  // If declined and auto-advance is enabled, trigger next offer
  if (
    response === 'DECLINED' &&
    offer.waitlistEntry.daycare.waitlistSettings?.autoAdvanceEnabled
  ) {
    await advanceToNextCandidate(
      offer.waitlistEntry.daycareId,
      offer.waitlistEntry.programId!,
      offer.spotAvailableDate
    );
  }
}

/**
 * Handle expired offers
 */
export async function handleExpiredOffers(): Promise<void> {
  const expiredOffers = await prisma.waitlistOffer.findMany({
    where: {
      response: null,
      offerExpiresAt: {
        lte: new Date(),
      },
    },
    include: {
      waitlistEntry: {
        include: {
          daycare: {
            include: {
              waitlistSettings: true,
            },
          },
        },
      },
    },
  });

  for (const offer of expiredOffers) {
    // Update offer as expired
    await prisma.waitlistOffer.update({
      where: { id: offer.id },
      data: {
        response: 'EXPIRED',
        respondedAt: new Date(),
      },
    });

    // Update waitlist entry
    await prisma.waitlistEntry.update({
      where: { id: offer.waitlistEntryId },
      data: {
        status: 'EXPIRED',
        offerResponse: 'EXPIRED',
        offerResponseAt: new Date(),
      },
    });

    // Create audit log
    await prisma.waitlistAuditLog.create({
      data: {
        waitlistEntryId: offer.waitlistEntryId,
        daycareId: offer.waitlistEntry.daycareId,
        action: 'OFFER_EXPIRED',
        description: 'Offer expired without response',
      },
    });

    // Auto-advance to next candidate if enabled
    if (offer.waitlistEntry.daycare.waitlistSettings?.autoAdvanceEnabled) {
      await advanceToNextCandidate(
        offer.waitlistEntry.daycareId,
        offer.waitlistEntry.programId!,
        offer.spotAvailableDate
      );
    }
  }
}

/**
 * Advance to the next candidate in the waitlist
 */
export async function advanceToNextCandidate(
  daycareId: string,
  programId: string,
  spotStartDate: Date
): Promise<WaitlistOffer | null> {
  // Get ranked candidates
  const candidates = await rankWaitlistCandidates(daycareId, programId, spotStartDate);

  if (candidates.length === 0) {
    // No more eligible candidates - spot can go public
    await markSpotAsPublic(daycareId, programId, spotStartDate);
    return null;
  }

  // Offer to top candidate
  const topCandidate = candidates[0];
  return await createOffer(topCandidate.entry.id, spotStartDate, {});
}

/**
 * Mark a spot as available to the public (all waitlist exhausted)
 */
async function markSpotAsPublic(
  daycareId: string,
  programId: string,
  spotStartDate: Date
): Promise<void> {
  // Create audit log
  await prisma.waitlistAuditLog.create({
    data: {
      daycareId,
      action: 'STATUS_UPDATED',
      description: `Spot for ${spotStartDate.toLocaleDateString()} marked as public - waitlist exhausted`,
      metadata: JSON.stringify({
        programId,
        spotStartDate,
        reason: 'waitlist_exhausted',
      }),
    },
  });

  // TODO: Trigger notification to marketing team or auto-publish to public marketplace
}
