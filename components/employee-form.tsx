'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createEmployee, updateEmployee } from '@/lib/database'
import type { Employee } from '@/lib/supabase'

const employeeSchema = z.object({
  employee_code: z.string().length(6, 'Employee code must be exactly 6 characters'),
  pfms_code: z.string().length(14, 'PFMS code must be exactly 14 characters'),
  name: z.string().min(1, 'Name is required'),
  sex: z.enum(['Male', 'Female'], { required_error: 'Sex is required' }),
  dob: z.string().min(1, 'Date of birth is required'),
  doj: z.string().min(1, 'Date of joining is required'),
  confirmation_date: z.string().min(1, 'Confirmation date is required'),
  retirement_date: z.string().optional(),
  death_date: z.string().optional(),
  marks: z.string().optional(),
  mobile_number: z.string().min(10, 'Mobile number must be at least 10 digits'),
  grade_pay: z.number().min(0, 'Grade pay must be positive'),
  basic_pay: z.number().min(0, 'Basic pay must be positive'),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface EmployeeFormProps {
  employee?: Employee
  onSuccess?: () => void
  onCancel?: () => void
}

export function EmployeeForm({ employee, onSuccess, onCancel }: EmployeeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      employee_code: employee.employee_code,
      pfms_code: employee.pfms_code,
      name: employee.name,
      sex: employee.sex,
      dob: employee.dob,
      doj: employee.doj,
      confirmation_date: employee.confirmation_date,
      retirement_date: employee.retirement_date || '',
      death_date: employee.death_date || '',
      marks: employee.marks || '',
      mobile_number: employee.mobile_number,
      grade_pay: employee.grade_pay,
      basic_pay: employee.basic_pay,
    } : undefined,
  })

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const employeeData = {
        ...data,
        retirement_date: data.retirement_date || undefined,
        death_date: data.death_date || undefined,
        marks: data.marks || undefined,
      }

      if (employee) {
        await updateEmployee(employee.id, employeeData)
      } else {
        await createEmployee(employeeData)
      }

      reset()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="employee_code">Employee Code *</Label>
          <Input
            id="employee_code"
            {...register('employee_code')}
            placeholder="6-character code"
            maxLength={6}
          />
          {errors.employee_code && (
            <p className="text-sm text-red-600">{errors.employee_code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pfms_code">PFMS Code *</Label>
          <Input
            id="pfms_code"
            {...register('pfms_code')}
            placeholder="14-character PFMS code"
            maxLength={14}
          />
          {errors.pfms_code && (
            <p className="text-sm text-red-600">{errors.pfms_code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter full name"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Sex *</Label>
          <select
            id="sex"
            {...register('sex')}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.sex && (
            <p className="text-sm text-red-600">{errors.sex.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth *</Label>
          <Input
            id="dob"
            type="date"
            {...register('dob')}
          />
          {errors.dob && (
            <p className="text-sm text-red-600">{errors.dob.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="doj">Date of Joining *</Label>
          <Input
            id="doj"
            type="date"
            {...register('doj')}
          />
          {errors.doj && (
            <p className="text-sm text-red-600">{errors.doj.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmation_date">Confirmation Date *</Label>
          <Input
            id="confirmation_date"
            type="date"
            {...register('confirmation_date')}
          />
          {errors.confirmation_date && (
            <p className="text-sm text-red-600">{errors.confirmation_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="retirement_date">Retirement Date</Label>
          <Input
            id="retirement_date"
            type="date"
            {...register('retirement_date')}
          />
          {errors.retirement_date && (
            <p className="text-sm text-red-600">{errors.retirement_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="death_date">Death Date</Label>
          <Input
            id="death_date"
            type="date"
            {...register('death_date')}
          />
          {errors.death_date && (
            <p className="text-sm text-red-600">{errors.death_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile_number">Mobile Number *</Label>
          <Input
            id="mobile_number"
            {...register('mobile_number')}
            placeholder="Enter mobile number"
          />
          {errors.mobile_number && (
            <p className="text-sm text-red-600">{errors.mobile_number.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade_pay">Grade Pay *</Label>
          <Input
            id="grade_pay"
            type="number"
            step="0.01"
            {...register('grade_pay', { valueAsNumber: true })}
            placeholder="Enter grade pay"
          />
          {errors.grade_pay && (
            <p className="text-sm text-red-600">{errors.grade_pay.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="basic_pay">Basic Pay *</Label>
          <Input
            id="basic_pay"
            type="number"
            step="0.01"
            {...register('basic_pay', { valueAsNumber: true })}
            placeholder="Enter basic pay"
          />
          {errors.basic_pay && (
            <p className="text-sm text-red-600">{errors.basic_pay.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="marks">Identifying Marks</Label>
        <textarea
          id="marks"
          {...register('marks')}
          className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter identifying marks on body"
        />
        {errors.marks && (
          <p className="text-sm text-red-600">{errors.marks.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : employee ? 'Update Employee' : 'Create Employee'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
