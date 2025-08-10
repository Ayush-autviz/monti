'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { EmployeeList } from '@/components/employee-list'
import { EmployeeForm } from '@/components/employee-form'
import { Button } from '@/components/ui/button'
import type { Employee } from '@/lib/supabase'
import { X } from 'lucide-react'

export default function EmployeesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAdd = () => {
    setEditingEmployee(null)
    setShowForm(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowForm(true)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingEmployee(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingEmployee(null)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {showForm ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <Button variant="outline" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <EmployeeForm
              employee={editingEmployee || undefined}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <EmployeeList
            key={refreshTrigger}
            onAdd={handleAdd}
            onEdit={handleEdit}
          />
        )}
      </div>
    </MainLayout>
  )
}
