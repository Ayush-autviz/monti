'use client'

import { useState, useEffect } from 'react'
import { getLeaveStatistics, getEmployees } from '@/lib/database'
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardStatsProps {
  year?: number
}

interface StatsData {
  totalEmployees: number
  totalApplications: number
  pendingApplications: number
  approvedApplications: number
  rejectedApplications: number
  totalLeaveDays: number
  medicalLeaves: number
  casualLeaves: number
  earnedLeaves: number
}

export function DashboardStats({ year = new Date().getFullYear() }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [year])

  const loadStats = async () => {
    try {
      setIsLoading(true)

      const [employees, leaveStats] = await Promise.all([
        getEmployees(),
        getLeaveStatistics(year)
      ])

      // Calculate statistics
      const totalEmployees = employees.length
      const totalApplications = leaveStats.statusStats.length
      const pendingApplications = leaveStats.statusStats.filter(app => app.status === 'PENDING').length
      const approvedApplications = leaveStats.statusStats.filter(app => app.status === 'APPROVED').length
      const rejectedApplications = leaveStats.statusStats.filter(app => app.status === 'REJECTED').length

      // Calculate leave days by type
      const leaveByType = leaveStats.typeStats.reduce((acc, leave) => {
        const code = leave.leave_types.code
        acc[code] = (acc[code] || 0) + leave.days_requested
        return acc
      }, {} as Record<string, number>)

      const totalLeaveDays = Object.values(leaveByType).reduce((sum, days) => sum + days, 0)

      setStats({
        totalEmployees,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalLeaveDays,
        medicalLeaves: leaveByType.MEDICAL || 0,
        casualLeaves: leaveByType.CL || 0,
        earnedLeaves: leaveByType.EL || 0,
      })

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Pending Applications',
      value: stats.pendingApplications,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Total Leave Days',
      value: stats.totalLeaveDays,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Medical Leaves',
      value: stats.medicalLeaves,
      subtitle: 'days taken',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Casual Leaves',
      value: stats.casualLeaves,
      subtitle: 'days taken',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Earned Leaves',
      value: stats.earnedLeaves,
      subtitle: 'days taken',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Approval Rate',
      value: stats.totalApplications > 0
        ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
        : 0,
      subtitle: '% approved',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <div className="text-sm text-gray-500">Year: {year}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className={`${card.bgColor} border-gray-200`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${card.textColor}`}>
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value.toLocaleString()}
                    {card.subtitle && (
                      <span className="text-sm font-normal text-gray-600 ml-1">
                        {card.subtitle}
                      </span>
                    )}
                  </p>
                </div>
                {card.icon && (
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick insights */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
          <CardDescription>Key metrics and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalApplications > 0
                  ? Math.round((stats.pendingApplications / stats.totalApplications) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Applications Pending</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalEmployees > 0
                  ? Math.round((stats.totalApplications / stats.totalEmployees) * 100) / 100
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Applications per Employee</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalApplications > 0
                  ? Math.round((stats.totalLeaveDays / stats.totalApplications) * 100) / 100
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Days per Application</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
