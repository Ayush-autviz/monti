'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getEmployeeById, getLeaveBalances, getLeaveApplications } from '@/lib/database'
import { LeaveBalanceCard } from './leave-balance-card'
import type { Employee } from '@/lib/supabase'
import { 
  User, 
  Phone, 
  Calendar, 
  Briefcase, 
  IndianRupee, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit
} from 'lucide-react'

interface EmployeeDetailsProps {
  employeeId: string
  onEdit?: (employee: Employee) => void
  onClose?: () => void
}

interface LeaveApplication {
  id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  applied_at: string
  leave_types: {
    name: string
    code: string
  }
}

export function EmployeeDetails({ employeeId, onEdit, onClose }: EmployeeDetailsProps) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEmployeeData()
  }, [employeeId])

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true)
      const [employeeData, applicationsData] = await Promise.all([
        getEmployeeById(employeeId),
        getLeaveApplications({ employeeId })
      ])
      
      setEmployee(employeeData)
      setApplications(applicationsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employee data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const pendingApplications = applications.filter(app => app.status === 'PENDING')
  const totalLeaveDays = applications
    .filter(app => app.status === 'APPROVED')
    .reduce((sum, app) => sum + app.days_requested, 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            {error || 'Employee not found'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
            <p className="text-gray-600">Employee Code: {employee.employee_code}</p>
            <div className="flex items-center gap-2 mt-1">
              {pendingApplications.length > 0 && (
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {pendingApplications.length} Pending Application{pendingApplications.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button onClick={() => onEdit(employee)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leave-balance">Leave Balance</TabsTrigger>
          <TabsTrigger value="leave-history">Leave History</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Leave Days Used</span>
                  <span className="font-semibold">{totalLeaveDays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Applications</span>
                  <span className="font-semibold text-yellow-600">{pendingApplications.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Applications</span>
                  <span className="font-semibold">{applications.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Service Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Date of Joining</p>
                  <p className="font-medium">{formatDate(employee.doj)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confirmation Date</p>
                  <p className="font-medium">{formatDate(employee.confirmation_date)}</p>
                </div>
                {employee.retirement_date && (
                  <div>
                    <p className="text-sm text-gray-600">Retirement Date</p>
                    <p className="font-medium">{formatDate(employee.retirement_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pay Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Pay Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Grade Pay</p>
                  <p className="font-medium">₹{employee.grade_pay.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Basic Pay</p>
                  <p className="font-medium">₹{employee.basic_pay.toLocaleString('en-IN')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Leave Applications</CardTitle>
              <CardDescription>Latest 5 leave applications</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No leave applications found</p>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(application.status)}
                        <div>
                          <p className="font-medium">{application.leave_types.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(application.start_date)} - {formatDate(application.end_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {application.days_requested} days
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-balance">
          <LeaveBalanceCard employee={employee} />
        </TabsContent>

        <TabsContent value="leave-history">
          <Card>
            <CardHeader>
              <CardTitle>Complete Leave History</CardTitle>
              <CardDescription>All leave applications for this employee</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No leave applications found</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{application.leave_types.name}</h4>
                            <Badge className={getStatusColor(application.status)}>
                              {application.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {formatDate(application.start_date)} - {formatDate(application.end_date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Applied: {formatDateTime(application.applied_at)}
                          </p>
                          <p className="text-sm">{application.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{application.days_requested} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium">{employee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sex</p>
                  <p className="font-medium">{employee.sex}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium">{formatDate(employee.dob)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mobile Number</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {employee.mobile_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employee Code</p>
                  <p className="font-medium">{employee.employee_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">PFMS Code</p>
                  <p className="font-medium">{employee.pfms_code}</p>
                </div>
              </div>
              
              {employee.marks && (
                <div>
                  <p className="text-sm text-gray-600">Identifying Marks</p>
                  <p className="font-medium">{employee.marks}</p>
                </div>
              )}
              
              {employee.death_date && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">Date of Death</p>
                  <p className="font-medium text-red-800">{formatDate(employee.death_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
