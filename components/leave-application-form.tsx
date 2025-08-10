'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getEmployees, getLeaveTypes, createLeaveApplication, getLeaveBalances } from '@/lib/database'
import { calculateWorkingDays, validateLeaveApplication } from '@/lib/leave-calculations'
import type { Employee } from '@/lib/supabase'

const leaveApplicationSchema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  leave_type_id: z.string().min(1, 'Leave type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
})

type LeaveApplicationFormData = z.infer<typeof leaveApplicationSchema>

interface LeaveType {
  id: string
  name: string
  code: 'MEDICAL' | 'CL' | 'EL'
  description: string
}

interface LeaveApplicationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function LeaveApplicationForm({ onSuccess, onCancel }: LeaveApplicationFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null)
  const [leaveBalance, setLeaveBalance] = useState<number>(0)
  const [calculatedDays, setCalculatedDays] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<LeaveApplicationFormData>({
    resolver: zodResolver(leaveApplicationSchema),
  })

  const watchedValues = watch()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (watchedValues.employee_id) {
      const employee = employees.find(emp => emp.id === watchedValues.employee_id)
      setSelectedEmployee(employee || null)
    }
  }, [watchedValues.employee_id, employees])

  useEffect(() => {
    if (watchedValues.leave_type_id) {
      const leaveType = leaveTypes.find(lt => lt.id === watchedValues.leave_type_id)
      setSelectedLeaveType(leaveType || null)
    }
  }, [watchedValues.leave_type_id, leaveTypes])

  useEffect(() => {
    if (selectedEmployee && selectedLeaveType) {
      loadLeaveBalance()
    }
  }, [selectedEmployee, selectedLeaveType])

  useEffect(() => {
    if (watchedValues.start_date && watchedValues.end_date) {
      const days = calculateWorkingDays(watchedValues.start_date, watchedValues.end_date)
      setCalculatedDays(days)

      if (selectedLeaveType && days > 0) {
        const validation = validateLeaveApplication(
          selectedLeaveType.code,
          days,
          leaveBalance,
          watchedValues.start_date,
          watchedValues.end_date
        )
        setValidationErrors(validation.errors)
      }
    }
  }, [watchedValues.start_date, watchedValues.end_date, selectedLeaveType, leaveBalance])

  const loadInitialData = async () => {
    try {
      const [employeesData, leaveTypesData] = await Promise.all([
        getEmployees(),
        getLeaveTypes()
      ])
      setEmployees(employeesData)
      setLeaveTypes(leaveTypesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }
  }

  const loadLeaveBalance = async () => {
    if (!selectedEmployee || !selectedLeaveType) return

    try {
      const currentYear = new Date().getFullYear()
      const balances = await getLeaveBalances(selectedEmployee.id, currentYear)
      const balance = balances.find(b => b.leave_types.code === selectedLeaveType.code)
      setLeaveBalance(balance?.remaining || 0)
    } catch (err) {
      console.error('Failed to load leave balance:', err)
      setLeaveBalance(0)
    }
  }

  const onSubmit = async (data: LeaveApplicationFormData) => {
    if (validationErrors.length > 0) {
      setError('Please fix the validation errors before submitting')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await createLeaveApplication({
        employee_id: data.employee_id,
        leave_type_id: data.leave_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        days_requested: calculatedDays,
        reason: data.reason,
        status: 'PENDING',
      })

      reset()
      setSelectedEmployee(null)
      setSelectedLeaveType(null)
      setLeaveBalance(0)
      setCalculatedDays(0)
      setValidationErrors([])
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave application')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Apply for Leave</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            <div className="font-medium mb-2">Validation Warnings:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="employee_id">Employee *</Label>
            <select
              id="employee_id"
              {...register('employee_id')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.employee_code})
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="text-sm text-red-600">{errors.employee_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave_type_id">Leave Type *</Label>
            <select
              id="leave_type_id"
              {...register('leave_type_id')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </option>
              ))}
            </select>
            {errors.leave_type_id && (
              <p className="text-sm text-red-600">{errors.leave_type_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date')}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.start_date && (
              <p className="text-sm text-red-600">{errors.start_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date *</Label>
            <Input
              id="end_date"
              type="date"
              {...register('end_date')}
              min={watchedValues.start_date || new Date().toISOString().split('T')[0]}
            />
            {errors.end_date && (
              <p className="text-sm text-red-600">{errors.end_date.message}</p>
            )}
          </div>
        </div>

        {selectedEmployee && selectedLeaveType && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-900">Employee</div>
                <div className="text-blue-700">{selectedEmployee.name}</div>
                <div className="text-blue-600">Code: {selectedEmployee.employee_code}</div>
              </div>
              <div>
                <div className="font-medium text-blue-900">Leave Type</div>
                <div className="text-blue-700">{selectedLeaveType.name}</div>
                <div className="text-blue-600">Available: {leaveBalance} days</div>
              </div>
              <div>
                <div className="font-medium text-blue-900">Duration</div>
                <div className="text-blue-700">{calculatedDays} working days</div>
                <div className="text-blue-600">
                  Balance after: {Math.max(0, leaveBalance - calculatedDays)} days
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Leave *</Label>
          <textarea
            id="reason"
            {...register('reason')}
            className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please provide a detailed reason for your leave application"
          />
          {errors.reason && (
            <p className="text-sm text-red-600">{errors.reason.message}</p>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading || validationErrors.some(error => error.includes('Insufficient'))}
            className="flex-1 md:flex-none"
          >
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
