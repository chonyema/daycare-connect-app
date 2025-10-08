import { Child, JurisdictionRule, Daycare } from '@prisma/client';

/**
 * Age-Rules Capacity Planning Utilities
 *
 * Core calculation functions for automated capacity tracking
 * based on jurisdiction-specific child care regulations.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CapacityCounts {
  total: number;           // Total children counting toward capacity
  under2: number;          // Children under 2 years old
  providerChildren: number; // Provider's own children counting
  clientChildren: number;   // Client children counting
}

export interface WhatIfResult {
  canAccept: boolean;
  reason?: string;
  constraints: {
    totalCapacity: { current: number; max: number; available: number };
    under2Capacity: { current: number; max: number; available: number };
  };
  minDOBFor2YearsOld?: Date;  // Minimum DOB for child to be 2+ on proposed start
  minDOBFor4YearsOld?: Date;  // Minimum DOB for child to be 4+ on proposed start
}

export interface MonthlyForecast {
  month: string;              // "YYYY-MM-01"
  totalCount: number;
  under2Count: number;
  availableSlots: number;
  availableUnder2Slots: number;
  eventsThisMonth: CapacityEvent[];
}

export interface CapacityEvent {
  type: 'BIRTHDAY_2' | 'BIRTHDAY_4' | 'EXIT' | 'ENROLLMENT';
  date: Date;
  childName: string;
  description: string;
}

// ============================================================================
// CORE AGE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate a child's age in months on a specific date
 *
 * @param dob - Child's date of birth
 * @param onDate - The date to calculate age on
 * @returns Age in months (rounded down)
 */
export function ageInMonths(dob: Date, onDate: Date): number {
  const birthDate = new Date(dob);
  const targetDate = new Date(onDate);

  const yearsDiff = targetDate.getFullYear() - birthDate.getFullYear();
  const monthsDiff = targetDate.getMonth() - birthDate.getMonth();

  let totalMonths = yearsDiff * 12 + monthsDiff;

  // If the day hasn't arrived yet this month, subtract 1
  if (targetDate.getDate() < birthDate.getDate()) {
    totalMonths--;
  }

  return Math.max(0, totalMonths); // Never return negative
}

/**
 * Calculate a child's age in years on a specific date
 *
 * @param dob - Child's date of birth
 * @param onDate - The date to calculate age on
 * @returns Age in years (rounded down)
 */
export function ageInYears(dob: Date, onDate: Date): number {
  return Math.floor(ageInMonths(dob, onDate) / 12);
}

/**
 * Check if a child counts toward capacity on a specific date
 *
 * @param child - Child object with DOB and provider flag
 * @param onDate - Date to evaluate
 * @param rules - Jurisdiction rules
 * @returns Whether this child counts toward total capacity
 */
export function childCountsOnDate(
  child: Child,
  onDate: Date,
  rules: JurisdictionRule
): boolean {
  const age = ageInYears(child.dateOfBirth, onDate);

  // Check if child is too old to count
  if (age >= rules.countUnder) {
    return false;
  }

  // Provider's own children may be exempt if old enough
  if (child.isProviderChild && rules.providerChildExemptAge) {
    if (age >= rules.providerChildExemptAge) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a child counts as "under 2" on a specific date
 *
 * @param child - Child object with DOB
 * @param onDate - Date to evaluate
 * @param rules - Jurisdiction rules
 * @returns Whether this child counts as under 2
 */
export function childIsUnder2OnDate(
  child: Child,
  onDate: Date,
  rules: JurisdictionRule
): boolean {
  const age = ageInYears(child.dateOfBirth, onDate);
  return age < rules.under2Threshold;
}

/**
 * Count how many children count toward capacity on a specific date
 *
 * @param children - Array of children to count
 * @param onDate - Date to evaluate capacity
 * @param rules - Jurisdiction rules
 * @returns Capacity counts broken down by category
 */
export function countsForDate(
  children: Child[],
  onDate: Date,
  rules: JurisdictionRule
): CapacityCounts {
  const counts: CapacityCounts = {
    total: 0,
    under2: 0,
    providerChildren: 0,
    clientChildren: 0,
  };

  // Filter to only active children who haven't exited yet
  const activeChildren = children.filter(child => {
    if (!child.isActive) return false;
    if (child.actualExit && new Date(child.actualExit) <= onDate) return false;
    if (new Date(child.enrollmentStart) > onDate) return false; // Not enrolled yet
    return true;
  });

  activeChildren.forEach(child => {
    const countsTowardTotal = childCountsOnDate(child, onDate, rules);

    if (countsTowardTotal) {
      counts.total++;

      if (child.isProviderChild) {
        counts.providerChildren++;
      } else {
        counts.clientChildren++;
      }

      if (childIsUnder2OnDate(child, onDate, rules)) {
        counts.under2++;
      }
    }
  });

  return counts;
}

// ============================================================================
// DATE CALCULATION HELPERS
// ============================================================================

/**
 * Calculate the minimum date of birth for a child to be at least a certain age
 * on a target date
 *
 * @param targetAgeYears - Desired age in years
 * @param onDate - The date by which child must be this age
 * @returns Latest possible DOB for child to be targetAgeYears on onDate
 */
export function minDOBToBeAtLeastAgeOnDate(
  targetAgeYears: number,
  onDate: Date
): Date {
  const targetDate = new Date(onDate);
  const minDOB = new Date(targetDate);

  // Subtract the target age in years
  minDOB.setFullYear(targetDate.getFullYear() - targetAgeYears);

  // Add one day (child born on this date will be exactly targetAgeYears old)
  minDOB.setDate(minDOB.getDate() + 1);

  return minDOB;
}

/**
 * Calculate when a child will turn a specific age
 *
 * @param dob - Child's date of birth
 * @param targetAge - Age in years
 * @returns Date when child turns targetAge
 */
export function dateChildTurnsAge(dob: Date, targetAge: number): Date {
  const birthday = new Date(dob);
  birthday.setFullYear(birthday.getFullYear() + targetAge);
  return birthday;
}

/**
 * Get the first day of a month
 *
 * @param date - Any date
 * @returns First day of that month
 */
export function firstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Add months to a date
 *
 * @param date - Starting date
 * @param months - Number of months to add
 * @returns New date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// ============================================================================
// WHAT-IF SIMULATION
// ============================================================================

/**
 * Simulate adding a new child and determine if it's allowed
 *
 * @param daycare - Daycare provider info with jurisdiction
 * @param existingChildren - Current enrolled children
 * @param rules - Jurisdiction rules
 * @param proposedStart - When the new child would start
 * @param newChildDOB - Date of birth of proposed new child
 * @param isProviderChild - Is this the provider's own child?
 * @returns Simulation result with capacity analysis
 */
export function whatIf(
  daycare: Daycare,
  existingChildren: Child[],
  rules: JurisdictionRule,
  proposedStart: Date,
  newChildDOB: Date,
  isProviderChild: boolean = false
): WhatIfResult {
  // Calculate current capacity on proposed start date
  const currentCounts = countsForDate(existingChildren, proposedStart, rules);

  // Create hypothetical new child
  const hypotheticalChild: Child = {
    id: 'hypothetical',
    fullName: 'Hypothetical Child',
    dateOfBirth: newChildDOB,
    daycareId: daycare.id,
    isProviderChild,
    enrollmentStart: proposedStart,
    expectedExit: null,
    actualExit: null,
    isActive: true,
    parentName: null,
    parentContact: null,
    notes: null,
    allergies: null,
    medications: null,
    medicalConditions: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelation: null,
    doctorName: null,
    doctorPhone: null,
    insuranceProvider: null,
    insurancePolicyNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Check if this child would count
  const wouldCount = childCountsOnDate(hypotheticalChild, proposedStart, rules);
  const wouldBeUnder2 = childIsUnder2OnDate(hypotheticalChild, proposedStart, rules);

  // Calculate what counts would be with new child
  const newTotal = wouldCount ? currentCounts.total + 1 : currentCounts.total;
  const newUnder2 = wouldBeUnder2 ? currentCounts.under2 + 1 : currentCounts.under2;

  // Check constraints
  const totalOK = newTotal <= rules.maxTotal;
  const under2OK = newUnder2 <= rules.maxUnder2;

  const canAccept = totalOK && under2OK;

  let reason: string | undefined;
  if (!canAccept) {
    if (!totalOK) {
      reason = `Total capacity would be ${newTotal}/${rules.maxTotal} (over limit)`;
    } else if (!under2OK) {
      reason = `Under-2 capacity would be ${newUnder2}/${rules.maxUnder2} (over limit)`;
    }
  }

  return {
    canAccept,
    reason,
    constraints: {
      totalCapacity: {
        current: currentCounts.total,
        max: rules.maxTotal,
        available: rules.maxTotal - currentCounts.total,
      },
      under2Capacity: {
        current: currentCounts.under2,
        max: rules.maxUnder2,
        available: rules.maxUnder2 - currentCounts.under2,
      },
    },
    minDOBFor2YearsOld: minDOBToBeAtLeastAgeOnDate(rules.under2Threshold, proposedStart),
    minDOBFor4YearsOld: rules.providerChildExemptAge
      ? minDOBToBeAtLeastAgeOnDate(rules.providerChildExemptAge, proposedStart)
      : undefined,
  };
}

// ============================================================================
// CAPACITY FORECAST
// ============================================================================

/**
 * Generate capacity events for a specific month
 *
 * @param children - All children to analyze
 * @param month - First day of target month
 * @param rules - Jurisdiction rules
 * @returns Array of capacity-affecting events
 */
export function getEventsForMonth(
  children: Child[],
  month: Date,
  rules: JurisdictionRule
): CapacityEvent[] {
  const events: CapacityEvent[] = [];
  const monthStart = firstDayOfMonth(month);
  const monthEnd = addMonths(monthStart, 1);

  children.forEach(child => {
    // Check for exits
    if (child.actualExit) {
      const exitDate = new Date(child.actualExit);
      if (exitDate >= monthStart && exitDate < monthEnd) {
        events.push({
          type: 'EXIT',
          date: exitDate,
          childName: child.fullName,
          description: `${child.fullName} exits`,
        });
      }
    } else if (child.expectedExit) {
      const exitDate = new Date(child.expectedExit);
      if (exitDate >= monthStart && exitDate < monthEnd) {
        events.push({
          type: 'EXIT',
          date: exitDate,
          childName: child.fullName,
          description: `${child.fullName} expected to exit`,
        });
      }
    }

    // Check for birthdays that affect capacity
    // Birthday when turning 2 (no longer counts as under-2)
    const secondBirthday = dateChildTurnsAge(child.dateOfBirth, rules.under2Threshold);
    if (secondBirthday >= monthStart && secondBirthday < monthEnd) {
      events.push({
        type: 'BIRTHDAY_2',
        date: secondBirthday,
        childName: child.fullName,
        description: `${child.fullName} turns ${rules.under2Threshold}`,
      });
    }

    // Birthday when provider's child becomes exempt
    if (child.isProviderChild && rules.providerChildExemptAge) {
      const exemptBirthday = dateChildTurnsAge(child.dateOfBirth, rules.providerChildExemptAge);
      if (exemptBirthday >= monthStart && exemptBirthday < monthEnd) {
        events.push({
          type: 'BIRTHDAY_4',
          date: exemptBirthday,
          childName: child.fullName,
          description: `${child.fullName} (provider's child) turns ${rules.providerChildExemptAge} - no longer counts`,
        });
      }
    }

    // Check for enrollments
    const enrollmentDate = new Date(child.enrollmentStart);
    if (enrollmentDate >= monthStart && enrollmentDate < monthEnd) {
      events.push({
        type: 'ENROLLMENT',
        date: enrollmentDate,
        childName: child.fullName,
        description: `${child.fullName} enrolls`,
      });
    }
  });

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}

/**
 * Generate a capacity forecast for the next N months
 *
 * @param children - All children to analyze
 * @param rules - Jurisdiction rules
 * @param startMonth - First day of starting month (defaults to current month)
 * @param months - Number of months to forecast (default 12)
 * @returns Array of monthly forecasts
 */
export function generateCapacityForecast(
  children: Child[],
  rules: JurisdictionRule,
  startMonth: Date = new Date(),
  months: number = 12
): MonthlyForecast[] {
  const forecast: MonthlyForecast[] = [];
  const firstMonth = firstDayOfMonth(startMonth);

  for (let i = 0; i < months; i++) {
    const month = addMonths(firstMonth, i);
    const monthEnd = addMonths(month, 1);

    // Use mid-month date for capacity calculation to capture most of the month
    const midMonth = new Date(month);
    midMonth.setDate(15);

    const counts = countsForDate(children, midMonth, rules);
    const events = getEventsForMonth(children, month, rules);

    forecast.push({
      month: month.toISOString().split('T')[0], // "YYYY-MM-DD"
      totalCount: counts.total,
      under2Count: counts.under2,
      availableSlots: rules.maxTotal - counts.total,
      availableUnder2Slots: rules.maxUnder2 - counts.under2,
      eventsThisMonth: events,
    });
  }

  return forecast;
}
