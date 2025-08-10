'use client'

import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { EmployeeDetails } from '@/components/employee-details'
import { useState } from 'react'
import { EmployeeForm } from '@/components/employee-form'
import type { Employee } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, X } from 'lucide-react'

export default function EmployeeDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const employeeId = params.id as string

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    setEditingEmployee(null)
    // Refresh the page to show updated data
    window.location.reload()
  }

  const handleEditCancel = () => {
    setShowEditForm(false)
    setEditingEmployee(null)
  }

  const handleBack = () => {
    router.push('/employees')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Button>

        {showEditForm ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit Employee</h2>
              <Button variant="outline" size="icon" onClick={handleEditCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <EmployeeForm
              employee={editingEmployee || undefined}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </div>
        ) : (
          <EmployeeDetails 
            employeeId={employeeId} 
            onEdit={handleEdit}
          />
        )}
      </div>
    </MainLayout>
  )
}
