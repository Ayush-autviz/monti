import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Database types
export interface Employee {
  id: string;
  employee_code: string;
  pfms_code: string;
  name: string;
  sex: "Male" | "Female";
  dob: string;
  doj: string;
  confirmation_date: string;
  retirement_date?: string;
  death_date?: string;
  marks?: string;
  mobile_number: string;
  grade_pay: number;
  basic_pay: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: "MEDICAL" | "CL" | "EL";
  description: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  total_allocated: number;
  used: number;
  remaining: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveApplication {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  applied_at: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}
