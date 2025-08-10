import { supabase } from "./supabase";
import type { Employee, LeaveApplication, LeaveBalance } from "./supabase";

// Employee operations
export async function createEmployee(
  employee: Omit<Employee, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("employees")
    .insert([employee])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getEmployeeById(id: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase.from("employees").delete().eq("id", id);

  if (error) throw error;
}

// Leave balance operations
export async function getLeaveBalances(employeeId: string, year?: number) {
  let query = supabase
    .from("leave_balances")
    .select(
      `
      *,
      leave_types (
        name,
        code,
        description
      )
    `
    )
    .eq("employee_id", employeeId);

  if (year) {
    query = query.eq("year", year);
  }

  const { data, error } = await query.order("year", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateLeaveBalance(
  employeeId: string,
  leaveTypeId: string,
  year: number,
  updates: Partial<
    Omit<
      LeaveBalance,
      | "id"
      | "employee_id"
      | "leave_type_id"
      | "year"
      | "created_at"
      | "updated_at"
    >
  >
) {
  // First check if balance record exists
  const { data: existingBalance, error: fetchError } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("year", year)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  if (existingBalance) {
    // Update existing record
    const { data, error } = await supabase
      .from("leave_balances")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("employee_id", employeeId)
      .eq("leave_type_id", leaveTypeId)
      .eq("year", year)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new record if it doesn't exist
    const { data, error } = await supabase
      .from("leave_balances")
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year: year,
        total_allocated: updates.total_allocated || 0,
        used: updates.used || 0,
        remaining: updates.remaining || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Leave application operations
export async function createLeaveApplication(
  application: Omit<
    LeaveApplication,
    "id" | "applied_at" | "created_at" | "updated_at"
  >
) {
  const { data, error } = await supabase
    .from("leave_applications")
    .insert([application])
    .select(
      `
      *,
      employees (
        name,
        employee_code
      ),
      leave_types (
        name,
        code
      )
    `
    )
    .single();

  if (error) throw error;
  return data;
}

export async function getLeaveApplications(filters?: {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase.from("leave_applications").select(`
      *,
      employees (
        name,
        employee_code
      ),
      leave_types (
        name,
        code
      )
    `);

  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.startDate) {
    query = query.gte("start_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("end_date", filters.endDate);
  }

  const { data, error } = await query.order("applied_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateLeaveApplicationStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
  approvedBy?: string
) {
  const updates: {
    status: string;
    approved_at: string;
    approved_by?: string;
  } = {
    status,
    approved_at: new Date().toISOString(),
  };

  if (approvedBy) {
    updates.approved_by = approvedBy;
  }

  // First get the application details
  const { data: application, error: fetchError } = await supabase
    .from("leave_applications")
    .select(
      `
      *,
      employees (
        name,
        employee_code
      ),
      leave_types (
        name,
        code
      )
    `
    )
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // Update the application status
  const { data, error } = await supabase
    .from("leave_applications")
    .update(updates)
    .eq("id", id)
    .select(
      `
      *,
      employees (
        name,
        employee_code
      ),
      leave_types (
        name,
        code
      )
    `
    )
    .single();

  if (error) throw error;

  // Manually update leave balance if approved
  if (status === "APPROVED" && application) {
    await updateLeaveBalanceManually(
      application.employee_id,
      application.leave_type_id,
      application.days_requested,
      application.start_date
    );
  }

  return data;
}

// Manually update leave balance
async function updateLeaveBalanceManually(
  employeeId: string,
  leaveTypeId: string,
  daysRequested: number,
  startDate: string
) {
  const year = new Date(startDate).getFullYear();

  // Get current balance
  const { data: currentBalance, error: balanceError } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("leave_type_id", leaveTypeId)
    .eq("year", year)
    .single();

  if (balanceError) {
    // If no balance record exists, create one
    const { data: leaveType } = await supabase
      .from("leave_types")
      .select("code")
      .eq("id", leaveTypeId)
      .single();

    const { data: employee } = await supabase
      .from("employees")
      .select("doj")
      .eq("id", employeeId)
      .single();

    if (leaveType && employee) {
      let totalAllocated = 0;

      if (leaveType.code === "CL") {
        totalAllocated = 12;
      } else if (leaveType.code === "MEDICAL") {
        totalAllocated = 365;
      } else if (leaveType.code === "EL") {
        // Calculate earned leave based on service
        const doj = new Date(employee.doj);
        const targetDate = new Date(startDate);
        const monthsOfService =
          (targetDate.getFullYear() - doj.getFullYear()) * 12 +
          (targetDate.getMonth() - doj.getMonth());
        totalAllocated = Math.floor(monthsOfService / 6) * 6;
      }

      await supabase.from("leave_balances").insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year,
        total_allocated: totalAllocated,
        used: daysRequested,
        remaining: totalAllocated - daysRequested,
      });
    }
  } else {
    // Update existing balance
    await supabase
      .from("leave_balances")
      .update({
        used: currentBalance.used + daysRequested,
        remaining: currentBalance.remaining - daysRequested,
        updated_at: new Date().toISOString(),
      })
      .eq("employee_id", employeeId)
      .eq("leave_type_id", leaveTypeId)
      .eq("year", year);
  }
}

// Leave types
export async function getLeaveTypes() {
  const { data, error } = await supabase
    .from("leave_types")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

// Statistics and reports
export async function getLeaveStatistics(year?: number) {
  const currentYear = year || new Date().getFullYear();

  // Get total applications by status
  const { data: statusStats, error: statusError } = await supabase
    .from("leave_applications")
    .select("status")
    .gte("start_date", `${currentYear}-01-01`)
    .lte("end_date", `${currentYear}-12-31`);

  if (statusError) throw statusError;

  // Get applications by leave type
  const { data: typeStats, error: typeError } = await supabase
    .from("leave_applications")
    .select(
      `
      days_requested,
      leave_types (
        name,
        code
      )
    `
    )
    .eq("status", "APPROVED")
    .gte("start_date", `${currentYear}-01-01`)
    .lte("end_date", `${currentYear}-12-31`);

  if (typeError) throw typeError;

  // Get monthly trends
  const { data: monthlyStats, error: monthlyError } = await supabase
    .from("leave_applications")
    .select("start_date, days_requested")
    .eq("status", "APPROVED")
    .gte("start_date", `${currentYear}-01-01`)
    .lte("end_date", `${currentYear}-12-31`);

  if (monthlyError) throw monthlyError;

  return {
    statusStats,
    typeStats,
    monthlyStats,
  };
}

// Calculate working days between two dates (excluding weekends)
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

// Refresh leave balances for an employee (recalculate based on current rules)
export async function refreshEmployeeLeaveBalances(employeeId: string) {
  const { data, error } = await supabase.rpc(
    "initialize_employee_leave_balances",
    {
      emp_id: employeeId,
    }
  );

  if (error) throw error;
  return data;
}

// Refresh leave balances for all employees
export async function refreshAllLeaveBalances() {
  const employees = await getEmployees();
  const currentYear = new Date().getFullYear();

  for (const employee of employees) {
    // Delete existing balances for current year
    await supabase
      .from("leave_balances")
      .delete()
      .eq("employee_id", employee.id)
      .eq("year", currentYear);

    // Calculate proper leave balances
    await initializeEmployeeLeaveBalancesCorrectly(employee.id, employee);
  }
}

// Correctly initialize leave balances for an employee
async function initializeEmployeeLeaveBalancesCorrectly(
  employeeId: string,
  employee: any
) {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();
  const doj = new Date(employee.doj);

  // Calculate months of service from DOJ to current date
  const monthsOfService =
    (currentDate.getFullYear() - doj.getFullYear()) * 12 +
    (currentDate.getMonth() - doj.getMonth()) +
    (currentDate.getDate() >= doj.getDate() ? 0 : -1);

  // Get leave types
  const { data: leaveTypes } = await supabase.from("leave_types").select("*");

  if (!leaveTypes) return;

  for (const leaveType of leaveTypes) {
    let totalAllocated = 0;
    let used = 0;

    if (leaveType.code === "CL") {
      totalAllocated = 12;
    } else if (leaveType.code === "MEDICAL") {
      totalAllocated = 365;
      // Get total medical leave used across all years
      const { data: medicalUsed } = await supabase
        .from("leave_applications")
        .select("days_requested")
        .eq("employee_id", employeeId)
        .eq("leave_type_id", leaveType.id)
        .eq("status", "APPROVED");

      used =
        medicalUsed?.reduce((sum, app) => sum + app.days_requested, 0) || 0;
    } else if (leaveType.code === "EL") {
      // Calculate earned leave: 6 days per 6 months
      totalAllocated = Math.floor(Math.max(0, monthsOfService) / 6) * 6;

      // Get total EL used across all years (carries forward)
      const { data: elUsed } = await supabase
        .from("leave_applications")
        .select("days_requested")
        .eq("employee_id", employeeId)
        .eq("leave_type_id", leaveType.id)
        .eq("status", "APPROVED");

      used = elUsed?.reduce((sum, app) => sum + app.days_requested, 0) || 0;
    }

    // Get used leave for current year (for CL)
    if (leaveType.code === "CL") {
      const { data: clUsed } = await supabase
        .from("leave_applications")
        .select("days_requested")
        .eq("employee_id", employeeId)
        .eq("leave_type_id", leaveType.id)
        .eq("status", "APPROVED")
        .gte("start_date", `${currentYear}-01-01`)
        .lte("start_date", `${currentYear}-12-31`);

      used = clUsed?.reduce((sum, app) => sum + app.days_requested, 0) || 0;
    }

    const remaining = Math.max(0, totalAllocated - used);

    // Insert the balance record
    await supabase.from("leave_balances").insert({
      employee_id: employeeId,
      leave_type_id: leaveType.id,
      year: currentYear,
      total_allocated: totalAllocated,
      used: used,
      remaining: remaining,
    });
  }
}
