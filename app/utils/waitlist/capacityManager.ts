// Atomic Capacity Management System
// Prevents double-booking through database-level locks and atomic operations

import { prisma } from '@/app/lib/prisma';
import { PrismaClient } from '@prisma/client';

export interface CapacityCheckInput {
  daycareId: string;
  programId?: string;
  requiredSlots: number;
  excludeOfferId?: string; // Exclude specific offer when checking (for updates)
}

export interface CapacityCheckResult {
  hasCapacity: boolean;
  availableSlots: number;
  totalCapacity: number;
  currentOccupancy: number;
  pendingOffers: number;
  reservedSlots: number;
  details: {
    programName?: string;
    daycareHasCapacity: boolean;
    programHasCapacity?: boolean;
  };
}

export interface CapacityReservationInput {
  daycareId: string;
  programId?: string;
  slots: number;
  offerId: string;
  expiresAt: Date;
  userId: string;
}

export interface CapacityReservationResult {
  success: boolean;
  reservationId?: string;
  availableSlots?: number;
  error?: string;
}

export class CapacityManager {

  /**
   * Check available capacity atomically
   */
  static async checkCapacity(input: CapacityCheckInput): Promise<CapacityCheckResult> {
    const { daycareId, programId, requiredSlots, excludeOfferId } = input;

    // Use READ COMMITTED isolation to get consistent view
    const result = await prisma.$transaction(async (tx) => {
      // Get daycare capacity info
      const daycare = await tx.daycare.findUnique({
        where: { id: daycareId },
        select: {
          capacity: true,
          currentOccupancy: true,
          name: true
        }
      });

      if (!daycare) {
        throw new Error('Daycare not found');
      }

      let programCapacity = null;
      if (programId) {
        programCapacity = await tx.program.findUnique({
          where: { id: programId },
          select: {
            totalCapacity: true,
            currentEnrollment: true,
            name: true
          }
        });

        if (!programCapacity) {
          throw new Error('Program not found');
        }
      }

      // Count pending offers that reserve slots
      const pendingOffersWhere: any = {
        waitlistEntry: { daycareId },
        response: { in: ['PENDING', null] },
        offerExpiresAt: { gt: new Date() }
      };

      if (programId) {
        pendingOffersWhere.waitlistEntry.programId = programId;
      }

      if (excludeOfferId) {
        pendingOffersWhere.id = { not: excludeOfferId };
      }

      const [pendingOffers, confirmedBookings] = await Promise.all([
        tx.waitlistOffer.count({
          where: pendingOffersWhere
        }),
        tx.booking.count({
          where: {
            daycareId,
            status: { in: ['CONFIRMED', 'PENDING'] }
          }
        })
      ]);

      // Calculate available capacity (total capacity - confirmed bookings - pending offers)
      const daycareAvailable = daycare.capacity - confirmedBookings - pendingOffers;
      const programAvailable = programCapacity
        ? programCapacity.totalCapacity - programCapacity.currentEnrollment - pendingOffers
        : null;

      // Determine overall availability
      const availableSlots = programAvailable !== null
        ? Math.min(daycareAvailable, programAvailable)
        : daycareAvailable;

      const hasCapacity = availableSlots >= requiredSlots;

      return {
        hasCapacity,
        availableSlots: Math.max(0, availableSlots),
        totalCapacity: programCapacity?.totalCapacity || daycare.capacity,
        currentOccupancy: confirmedBookings, // Use actual confirmed bookings
        pendingOffers,
        reservedSlots: pendingOffers,
        details: {
          programName: programCapacity?.name,
          daycareHasCapacity: daycareAvailable >= requiredSlots,
          programHasCapacity: programAvailable !== null ? programAvailable >= requiredSlots : undefined
        }
      };
    }, {
      isolationLevel: 'ReadCommitted'
    });

    return result;
  }

  /**
   * Atomically reserve capacity for an offer
   */
  static async reserveCapacity(input: CapacityReservationInput): Promise<CapacityReservationResult> {
    const { daycareId, programId, slots, offerId, expiresAt, userId } = input;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // First check if capacity is still available with FOR UPDATE lock
        const capacityCheck = await this.checkCapacityWithLock(tx, {
          daycareId,
          programId,
          requiredSlots: slots,
          excludeOfferId: offerId
        });

        if (!capacityCheck.hasCapacity) {
          return {
            success: false,
            error: `Insufficient capacity. Available: ${capacityCheck.availableSlots}, Required: ${slots}`,
            availableSlots: capacityCheck.availableSlots
          };
        }

        // Create or update the offer with capacity reservation
        const offer = await tx.waitlistOffer.upsert({
          where: { id: offerId },
          create: {
            id: offerId,
            waitlistEntryId: '', // Will be set by caller
            spotAvailableDate: new Date(),
            offerExpiresAt: expiresAt,
            isAutomated: true,
            priorityAtOffer: 0,
            positionAtOffer: 0,
            createdBy: userId
          },
          update: {
            offerExpiresAt: expiresAt
          }
        });

        // Update program enrollment counts if applicable
        if (programId) {
          await tx.program.update({
            where: { id: programId },
            data: {
              // We don't increment enrollment here - that happens on acceptance
              // The pending offer count is what reserves the capacity
            }
          });
        }

        return {
          success: true,
          reservationId: offer.id,
          availableSlots: capacityCheck.availableSlots - slots
        };
      }, {
        isolationLevel: 'Serializable', // Highest isolation for capacity changes
        timeout: 10000 // 10 second timeout
      });

      return result;
    } catch (error: any) {
      console.error('Capacity reservation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to reserve capacity'
      };
    }
  }

  /**
   * Release reserved capacity when offer expires or is declined
   */
  static async releaseCapacity(offerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update offer status to released
        await tx.waitlistOffer.update({
          where: { id: offerId },
          data: {
            response: 'EXPIRED' // or could be 'DECLINED'
          }
        });

        // Capacity is automatically released since we count only pending/null offers
        // No need to manually decrement counters
      });

      return { success: true };
    } catch (error: any) {
      console.error('Failed to release capacity:', error);
      return {
        success: false,
        error: error.message || 'Failed to release capacity'
      };
    }
  }

  /**
   * Atomically convert offer acceptance to enrollment
   */
  static async convertToEnrollment(
    offerId: string,
    enrollmentData: {
      startDate: Date;
      endDate?: Date;
      dailyRate: number;
    }
  ): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get offer details with lock
        const offer = await tx.waitlistOffer.findUnique({
          where: { id: offerId },
          include: {
            waitlistEntry: {
              include: {
                parent: { select: { id: true } },
                daycare: { select: { id: true, dailyRate: true } },
                program: { select: { id: true } }
              }
            }
          }
        });

        if (!offer) {
          throw new Error('Offer not found');
        }

        if (offer.response !== 'ACCEPTED') {
          throw new Error('Offer has not been accepted');
        }

        const waitlistEntry = offer.waitlistEntry;

        // Create booking from waitlist entry
        const booking = await tx.booking.create({
          data: {
            parentId: waitlistEntry.parentId,
            daycareId: waitlistEntry.daycareId,
            childName: waitlistEntry.childName,
            childAge: waitlistEntry.childAge,
            startDate: enrollmentData.startDate,
            endDate: enrollmentData.endDate,
            careType: waitlistEntry.careType,
            status: 'CONFIRMED',
            dailyRate: enrollmentData.dailyRate || waitlistEntry.daycare.dailyRate,
            notes: `Converted from waitlist - Original position: ${waitlistEntry.position}`
          }
        });

        // Update waitlist entry status
        await tx.waitlistEntry.update({
          where: { id: waitlistEntry.id },
          data: {
            status: 'ENROLLED'
          }
        });

        // Increment enrollment counts
        await tx.daycare.update({
          where: { id: waitlistEntry.daycareId },
          data: {
            currentEnrollment: { increment: 1 }
          }
        });

        if (waitlistEntry.programId) {
          await tx.program.update({
            where: { id: waitlistEntry.programId },
            data: {
              currentEnrollment: { increment: 1 },
              waitlistCount: { decrement: 1 }
            }
          });
        }

        // Create audit log
        await tx.waitlistAuditLog.create({
          data: {
            waitlistEntryId: waitlistEntry.id,
            daycareId: waitlistEntry.daycareId,
            action: 'BULK_UPDATED', // Could add CONVERTED_TO_ENROLLMENT
            description: `Waitlist entry converted to enrollment - Booking ID: ${booking.id}`,
            newValues: JSON.stringify({
              bookingId: booking.id,
              startDate: enrollmentData.startDate,
              status: 'ENROLLED'
            }),
            metadata: JSON.stringify({
              offerId,
              originalPosition: waitlistEntry.position,
              originalPriorityScore: waitlistEntry.priorityScore
            })
          }
        });

        return {
          success: true,
          bookingId: booking.id
        };
      }, {
        isolationLevel: 'Serializable',
        timeout: 15000
      });

      return result;
    } catch (error: any) {
      console.error('Failed to convert to enrollment:', error);
      return {
        success: false,
        error: error.message || 'Failed to convert to enrollment'
      };
    }
  }

  /**
   * Check capacity with database locks (internal helper)
   */
  private static async checkCapacityWithLock(
    tx: PrismaClient,
    input: CapacityCheckInput
  ): Promise<CapacityCheckResult> {
    const { daycareId, programId, requiredSlots, excludeOfferId } = input;

    // Lock daycare record for update
    const daycare = await (tx as any).$queryRaw`
      SELECT "totalCapacity", "currentEnrollment", "name"
      FROM "daycares"
      WHERE "id" = ${daycareId}
      FOR UPDATE
    `;

    if (!daycare || daycare.length === 0) {
      throw new Error('Daycare not found');
    }

    const daycareData = daycare[0];

    let programData = null;
    if (programId) {
      const program = await (tx as any).$queryRaw`
        SELECT "totalCapacity", "currentEnrollment", "name"
        FROM "programs"
        WHERE "id" = ${programId}
        FOR UPDATE
      `;

      if (!program || program.length === 0) {
        throw new Error('Program not found');
      }
      programData = program[0];
    }

    // Count pending offers
    const pendingOffersQuery = programId
      ? `
        SELECT COUNT(*)::int as count
        FROM "waitlist_offers" wo
        JOIN "waitlist_entries" we ON wo."waitlistEntryId" = we."id"
        WHERE we."daycareId" = $1
          AND we."programId" = $2
          AND wo."response" IN ('PENDING') OR wo."response" IS NULL
          AND wo."offerExpiresAt" > NOW()
          ${excludeOfferId ? 'AND wo."id" != $3' : ''}
      `
      : `
        SELECT COUNT(*)::int as count
        FROM "waitlist_offers" wo
        JOIN "waitlist_entries" we ON wo."waitlistEntryId" = we."id"
        WHERE we."daycareId" = $1
          AND wo."response" IN ('PENDING') OR wo."response" IS NULL
          AND wo."offerExpiresAt" > NOW()
          ${excludeOfferId ? 'AND wo."id" != $2' : ''}
      `;

    const queryParams = programId
      ? excludeOfferId
        ? [daycareId, programId, excludeOfferId]
        : [daycareId, programId]
      : excludeOfferId
        ? [daycareId, excludeOfferId]
        : [daycareId];

    const pendingResult = await (tx as any).$queryRawUnsafe(pendingOffersQuery, ...queryParams);
    const pendingOffers = pendingResult[0]?.count || 0;

    // Calculate availability
    const daycareAvailable = daycareData.totalCapacity - daycareData.currentEnrollment - pendingOffers;
    const programAvailable = programData
      ? programData.totalCapacity - programData.currentEnrollment - pendingOffers
      : null;

    const availableSlots = programAvailable !== null
      ? Math.min(daycareAvailable, programAvailable)
      : daycareAvailable;

    const hasCapacity = availableSlots >= requiredSlots;

    return {
      hasCapacity,
      availableSlots: Math.max(0, availableSlots),
      totalCapacity: programData?.totalCapacity || daycareData.totalCapacity,
      currentOccupancy: programData?.currentEnrollment || daycareData.currentEnrollment,
      pendingOffers,
      reservedSlots: pendingOffers,
      details: {
        programName: programData?.name,
        daycareHasCapacity: daycareAvailable >= requiredSlots,
        programHasCapacity: programAvailable !== null ? programAvailable >= requiredSlots : undefined
      }
    };
  }

  /**
   * Cleanup expired offers and release their capacity
   */
  static async cleanupExpiredOffers(): Promise<{ releasedCount: number }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find expired offers
        const expiredOffers = await tx.waitlistOffer.findMany({
          where: {
            offerExpiresAt: { lt: new Date() },
            response: { in: ['PENDING', null] }
          },
          select: { id: true }
        });

        if (expiredOffers.length === 0) {
          return { releasedCount: 0 };
        }

        // Update expired offers
        await tx.waitlistOffer.updateMany({
          where: {
            id: { in: expiredOffers.map(o => o.id) }
          },
          data: {
            response: 'EXPIRED'
          }
        });

        // Update related waitlist entries
        await tx.waitlistEntry.updateMany({
          where: {
            offers: {
              some: {
                id: { in: expiredOffers.map(o => o.id) }
              }
            }
          },
          data: {
            status: 'ACTIVE', // Back to active waitlist
            offerExpiresAt: null
          }
        });

        return { releasedCount: expiredOffers.length };
      });

      return result;
    } catch (error: any) {
      console.error('Failed to cleanup expired offers:', error);
      return { releasedCount: 0 };
    }
  }
}

// Export singleton instance
export const capacityManager = new CapacityManager();