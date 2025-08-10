import { differenceInMonths, endOfYear } from "date-fns";
import type { Employee } from "./supabase";

export interface LeaveAllocation {
  medical: number;
  casual: number;
  earned: number;
}

export interface LeaveBalance {
  leaveType: "MEDICAL" | "CL" | "EL";
  allocated: number;
  used: number;
  remaining: number;
  carryForward?: number;
}

/**
 * Calculate leave allocation for an employee based on their service period
 */
export function calculateLeaveAllocation(
  employee: Employee,
  targetYear: number
): LeaveAllocation {
  const doj = new Date(employee.doj);
  const targetYearEnd = endOfYear(new Date(targetYear, 0, 1));

  // Medical Leave: 365 days total for entire career (one-time allocation)
  const medicalLeave = 365;

  // Casual Leave: 12 days per calendar year (no carry forward)
  const casualLeave = 12;

  // Earned Leave: 6 days every 6 months from date of joining
  const monthsOfService = differenceInMonths(targetYearEnd, doj);
  const earnedLeave = Math.floor(monthsOfService / 6) * 6;

  return {
    medical: medicalLeave,
    casual: casualLeave,
    earned: earnedLeave,
  };
}

/**
 * Calculate earned leave for a specific period
 */
export function calculateEarnedLeave(
  dateOfJoining: string,
  targetDate: string = new Date().toISOString()
): number {
  const doj = new Date(dateOfJoining);
  const target = new Date(targetDate);

  const monthsOfService = differenceInMonths(target, doj);
  return Math.floor(monthsOfService / 6.0) * 6;
}

/**
 * Check if casual leave expires at year end
 */
export function isCasualLeaveExpiring(currentDate: Date = new Date()): boolean {
  const yearEnd = endOfYear(currentDate);
  const daysUntilYearEnd = Math.ceil(
    (yearEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilYearEnd <= 30; // Alert if less than 30 days remaining
}

/**
 * Calculate leave balance after applying for leave
 */
export function calculateBalanceAfterApplication(
  currentBalance: number,
  daysRequested: number
): { newBalance: number; isValid: boolean; error?: string } {
  if (daysRequested <= 0) {
    return {
      newBalance: currentBalance,
      isValid: false,
      error: "Days requested must be greater than 0",
    };
  }

  if (daysRequested > currentBalance) {
    return {
      newBalance: currentBalance,
      isValid: false,
      error: "Insufficient leave balance",
    };
  }

  return {
    newBalance: currentBalance - daysRequested,
    isValid: true,
  };
}

/**
 * Get leave type rules and restrictions
 */
export function getLeaveTypeRules(leaveType: "MEDICAL" | "CL" | "EL") {
  const rules = {
    MEDICAL: {
      name: "Medical Leave",
      totalAllocation: 365,
      period: "Entire Career",
      carryForward: false,
      maxConsecutive: 365,
      description:
        "Total of 365 days in entire career. Deducted manually when applied. Cannot be replenished.",
      restrictions: [
        "Cannot exceed 365 days in total career",
        "Requires medical certificate for more than 3 consecutive days",
        "Cannot be replenished once used",
      ],
    },
    CL: {
      name: "Casual Leave",
      totalAllocation: 12,
      period: "Calendar Year",
      carryForward: false,
      maxConsecutive: 5,
      description:
        "12 days per calendar year (Jan-Dec). Do not carry forward if unused.",
      restrictions: [
        "Maximum 12 days per calendar year",
        "Cannot carry forward to next year",
        "Maximum 5 consecutive days recommended",
        "Resets to 12 on January 1st",
      ],
    },
    EL: {
      name: "Earned Leave",
      totalAllocation: null, // Calculated based on service
      period: "Every 6 months",
      carryForward: true,
      maxConsecutive: 30,
      description:
        "6 days every 6 months from date of joining. Carry forward if not used.",
      restrictions: [
        "Earned at rate of 6 days per 6 months of service",
        "Can be carried forward to subsequent years",
        "Maximum 30 consecutive days recommended",
        "Can be encashed on retirement",
      ],
    },
  };

  return rules[leaveType];
}

/**
 * Validate leave application based on business rules
 */
export function validateLeaveApplication(
  leaveType: "MEDICAL" | "CL" | "EL",
  daysRequested: number,
  currentBalance: number,
  startDate: string,
  endDate: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rules = getLeaveTypeRules(leaveType);

  // Basic validation
  if (daysRequested <= 0) {
    errors.push("Days requested must be greater than 0");
  }

  if (daysRequested > currentBalance) {
    errors.push(
      `Insufficient ${rules.name} balance. Available: ${currentBalance} days`
    );
  }

  // Date validation
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    errors.push("Start date cannot be after end date");
  }

  if (start < new Date()) {
    errors.push("Cannot apply for leave in the past");
  }

  // Leave type specific validations
  if (leaveType === "CL" && daysRequested > 5) {
    errors.push("Casual leave: Maximum 5 consecutive days recommended");
  }

  if (leaveType === "EL" && daysRequested > 30) {
    errors.push("Earned leave: Maximum 30 consecutive days recommended");
  }

  if (leaveType === "MEDICAL" && daysRequested > 30) {
    errors.push(
      "Medical leave: Consider splitting long medical leave into multiple applications"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate working days between two dates (excluding weekends)
 */
export function calculateWorkingDays(
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      workingDays++;
    }
  }

  return workingDays;
}

/**
 * Get leave summary for an employee
 */
export function getLeaveTypeSummary() {
  return [
    {
      type: "MEDICAL" as const,
      name: "Medical Leave",
      allocation: "365 days (Career)",
      carryForward: "No",
      color: "bg-red-100 text-red-800",
    },
    {
      type: "CL" as const,
      name: "Casual Leave",
      allocation: "12 days (Annual)",
      carryForward: "No",
      color: "bg-blue-100 text-blue-800",
    },
    {
      type: "EL" as const,
      name: "Earned Leave",
      allocation: "6 days (Per 6 months)",
      carryForward: "Yes",
      color: "bg-green-100 text-green-800",
    },
  ];
}
