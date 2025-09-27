// Enhanced Waitlist Priority Engine
// Calculates priority scores based on configurable rules

import { PriorityRuleType, WaitlistEntry, PriorityRule, Program } from '@prisma/client';

export interface PriorityCalculationInput {
  waitlistEntry: WaitlistEntry & {
    program?: Program | null;
  };
  rules: PriorityRule[];
  daysOnWaitlist: number;
}

export interface PriorityCalculationResult {
  totalScore: number;
  ruleBreakdown: Array<{
    ruleId: string;
    ruleName: string;
    ruleType: PriorityRuleType;
    points: number;
    applied: boolean;
    reason?: string;
  }>;
  previousScore?: number;
}

export class WaitlistPriorityEngine {

  /**
   * Calculate priority score for a waitlist entry
   */
  static calculatePriorityScore(input: PriorityCalculationInput): PriorityCalculationResult {
    const { waitlistEntry, rules, daysOnWaitlist } = input;
    const ruleBreakdown: PriorityCalculationResult['ruleBreakdown'] = [];
    let totalScore = 0;

    // Sort rules by sortOrder
    const sortedRules = rules
      .filter(rule => rule.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    for (const rule of sortedRules) {
      const result = this.evaluateRule(rule, waitlistEntry, daysOnWaitlist);

      ruleBreakdown.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        points: result.applied ? rule.points : 0,
        applied: result.applied,
        reason: result.reason
      });

      if (result.applied) {
        totalScore += rule.points;
      }
    }

    return {
      totalScore,
      ruleBreakdown,
      previousScore: waitlistEntry.priorityScore
    };
  }

  /**
   * Evaluate a specific priority rule
   */
  private static evaluateRule(
    rule: PriorityRule,
    entry: WaitlistEntry,
    daysOnWaitlist: number
  ): { applied: boolean; reason?: string } {

    try {
      // Parse conditions if they exist
      const conditions = rule.conditions ? JSON.parse(rule.conditions) : {};

      switch (rule.ruleType) {
        case 'SIBLING_ENROLLED':
          return {
            applied: entry.hasSiblingEnrolled,
            reason: entry.hasSiblingEnrolled ? 'Has sibling enrolled' : 'No sibling enrolled'
          };

        case 'STAFF_CHILD':
          return {
            applied: entry.isStaffChild,
            reason: entry.isStaffChild ? 'Staff child' : 'Not a staff child'
          };

        case 'SERVICE_AREA':
          return {
            applied: entry.inServiceArea,
            reason: entry.inServiceArea ? 'Lives in service area' : 'Outside service area'
          };

        case 'SUBSIDY_APPROVED':
          return {
            applied: entry.hasSubsidyApproval,
            reason: entry.hasSubsidyApproval ? 'Has subsidy approval' : 'No subsidy approval'
          };

        case 'CORPORATE_PARTNERSHIP':
          return {
            applied: entry.hasCorporatePartnership,
            reason: entry.hasCorporatePartnership ? 'Corporate partnership' : 'No corporate partnership'
          };

        case 'SPECIAL_NEEDS':
          return {
            applied: entry.hasSpecialNeeds,
            reason: entry.hasSpecialNeeds ? 'Has special needs' : 'No special needs'
          };

        case 'TIME_ON_LIST':
          // Time-based scoring with thresholds
          const minDays = conditions.minDays || 30;
          const maxDays = conditions.maxDays || 365;
          const applied = daysOnWaitlist >= minDays && daysOnWaitlist <= maxDays;

          return {
            applied,
            reason: applied
              ? `On waitlist for ${daysOnWaitlist} days (qualifies: ${minDays}-${maxDays} days)`
              : `On waitlist for ${daysOnWaitlist} days (doesn't qualify: ${minDays}-${maxDays} days)`
          };

        case 'PROVIDER_CUSTOM':
          // Custom provider-defined tags
          const requiredTags = conditions.requiredTags || [];
          const entryTags = entry.providerTags ? JSON.parse(entry.providerTags) : [];
          const hasRequiredTags = requiredTags.every((tag: string) => entryTags.includes(tag));

          return {
            applied: hasRequiredTags,
            reason: hasRequiredTags
              ? `Has required tags: ${requiredTags.join(', ')}`
              : `Missing required tags: ${requiredTags.join(', ')}`
          };

        case 'FIRST_TIME_PARENT':
          // Would need additional data collection
          return {
            applied: false,
            reason: 'First-time parent status not available'
          };

        case 'MILITARY_FAMILY':
          // Would need additional data collection
          return {
            applied: false,
            reason: 'Military family status not available'
          };

        default:
          return {
            applied: false,
            reason: `Unknown rule type: ${rule.ruleType}`
          };
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      return {
        applied: false,
        reason: `Error evaluating rule: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Calculate new positions for all entries in a waitlist
   */
  static calculatePositions(entries: Array<WaitlistEntry & { daysOnWaitlist: number }>): Array<{
    entryId: string;
    newPosition: number;
    oldPosition: number;
    positionChange: number;
  }> {
    // Sort by priority score (descending), then by joinedAt (ascending - FIFO tie-breaker)
    const sortedEntries = entries
      .filter(entry => entry.status === 'ACTIVE')
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore; // Higher score = better position
        }
        return a.joinedAt.getTime() - b.joinedAt.getTime(); // Earlier join = better position
      });

    return sortedEntries.map((entry, index) => {
      const newPosition = index + 1;
      const oldPosition = entry.position;

      return {
        entryId: entry.id,
        newPosition,
        oldPosition,
        positionChange: oldPosition - newPosition // Positive = moved up, negative = moved down
      };
    });
  }

  /**
   * Calculate estimated wait time based on historical data
   */
  static calculateEstimatedWaitDays(
    position: number,
    historicalData: {
      averageOfferPerMonth: number;
      averageAcceptanceRate: number;
      seasonalAdjustment?: number;
    }
  ): number {
    const { averageOfferPerMonth, averageAcceptanceRate, seasonalAdjustment = 1 } = historicalData;

    // Calculate effective slots per month (considering acceptance rate)
    const effectiveSlotsPerMonth = averageOfferPerMonth * averageAcceptanceRate;

    // Apply seasonal adjustment (e.g., summer might be slower)
    const adjustedSlotsPerMonth = effectiveSlotsPerMonth * seasonalAdjustment;

    // Calculate months to clear the queue ahead of this position
    const monthsToWait = Math.max(0, (position - 1) / adjustedSlotsPerMonth);

    // Convert to days (assume 30.4 days per month)
    const daysToWait = Math.round(monthsToWait * 30.4);

    return daysToWait;
  }

  /**
   * Get position band for display (e.g., "Top 5", "6-10", "11-20")
   */
  static getPositionBand(position: number): string {
    if (position <= 5) return 'Top 5';
    if (position <= 10) return '6-10';
    if (position <= 20) return '11-20';
    if (position <= 50) return '21-50';
    return '50+';
  }

  /**
   * Determine if position change is significant enough to notify
   */
  static isSignificantPositionChange(
    oldPosition: number,
    newPosition: number,
    threshold: number = 3
  ): boolean {
    const change = Math.abs(oldPosition - newPosition);
    return change >= threshold;
  }
}

// Default priority rules for new daycares
export const DEFAULT_PRIORITY_RULES: Omit<PriorityRule, 'id' | 'createdAt' | 'updatedAt' | 'daycareId' | 'programId'>[] = [
  {
    name: 'Sibling Already Enrolled',
    description: 'Priority for families with siblings already enrolled',
    ruleType: 'SIBLING_ENROLLED',
    points: 50,
    isActive: true,
    conditions: null,
    sortOrder: 1
  },
  {
    name: 'Staff Child',
    description: 'Priority for children of daycare staff',
    ruleType: 'STAFF_CHILD',
    points: 40,
    isActive: true,
    conditions: null,
    sortOrder: 2
  },
  {
    name: 'Service Area Resident',
    description: 'Priority for families living in the primary service area',
    ruleType: 'SERVICE_AREA',
    points: 20,
    isActive: true,
    conditions: null,
    sortOrder: 3
  },
  {
    name: 'Special Needs Child',
    description: 'Priority for children with special needs',
    ruleType: 'SPECIAL_NEEDS',
    points: 30,
    isActive: true,
    conditions: null,
    sortOrder: 4
  },
  {
    name: 'Subsidy Approved',
    description: 'Priority for families with approved childcare subsidies',
    ruleType: 'SUBSIDY_APPROVED',
    points: 15,
    isActive: true,
    conditions: null,
    sortOrder: 5
  },
  {
    name: 'Long-term Waitlist',
    description: 'Bonus points for families on waitlist 6+ months',
    ruleType: 'TIME_ON_LIST',
    points: 10,
    isActive: true,
    conditions: JSON.stringify({ minDays: 180, maxDays: 999 }),
    sortOrder: 6
  }
];