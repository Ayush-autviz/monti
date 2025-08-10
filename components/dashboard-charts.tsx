'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getLeaveStatistics } from '@/lib/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardChartsProps {
  year?: number
}

const COLORS = {
  MEDICAL: '#ef4444',
  CL: '#3b82f6',
  EL: '#10b981',
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444'
}

interface ChartData {
  name: string
  value: number
  count?: number
  color?: string
}

interface MonthlyData {
  month: string
  applications: number
  days: number
}

export function DashboardCharts({ year = new Date().getFullYear() }: DashboardChartsProps) {
  const [leaveTypeData, setLeaveTypeData] = useState<ChartData[]>([])
  const [statusData, setStatusData] = useState<ChartData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadChartData()
  }, [year])

  const loadChartData = async () => {
    try {
      setIsLoading(true)
      const stats = await getLeaveStatistics(year)

      // Process leave type data
      const leaveByType = stats.typeStats.reduce((acc, leave: any) => {
        const leaveType = leave.leave_types
        if (leaveType) {
          const code = leaveType.code
          const name = leaveType.name
          acc[code] = {
            name,
            value: (acc[code]?.value || 0) + leave.days_requested,
            count: (acc[code]?.count || 0) + 1
          }
        }
        return acc
      }, {} as Record<string, { name: string; value: number; count: number }>)

      const leaveTypeChartData = Object.entries(leaveByType).map(([code, data]) => ({
        name: data.name,
        value: data.value,
        count: data.count,
        color: COLORS[code as keyof typeof COLORS]
      }))

      // Process status data
      const statusCounts = stats.statusStats.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: COLORS[status as keyof typeof COLORS]
      }))

      // Process monthly data
      const monthlyStats = stats.monthlyStats.reduce((acc, leave) => {
        const month = new Date(leave.start_date).getMonth()
        const monthName = new Date(year, month).toLocaleString('default', { month: 'short' })

        if (!acc[month]) {
          acc[month] = {
            month: monthName,
            applications: 0,
            days: 0
          }
        }

        acc[month].applications += 1
        acc[month].days += leave.days_requested
        return acc
      }, {} as Record<number, MonthlyData>)

      // Fill missing months with zero data
      const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(year, i).toLocaleString('default', { month: 'short' })
        return monthlyStats[i] || {
          month: monthName,
          applications: 0,
          days: 0
        }
      })

      setLeaveTypeData(leaveTypeChartData)
      setStatusData(statusChartData)
      setMonthlyData(monthlyChartData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
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

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics & Reports</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Types Distribution</CardTitle>
            <CardDescription>Breakdown of leave days by type</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leaveTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value} days`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No leave data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Status distribution of leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No application data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Leave Trends</CardTitle>
            <CardDescription>Leave applications and days taken by month</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.some(d => d.applications > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
                  <Bar dataKey="days" fill="#10b981" name="Total Days" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No monthly data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Most Used Leave Type</CardTitle>
          </CardHeader>
          <CardContent>
            {leaveTypeData.length > 0 ? (
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {leaveTypeData.reduce((max, current) =>
                    current.value > max.value ? current : max
                  ).name}
                </div>
                <div className="text-sm text-gray-500">
                  {leaveTypeData.reduce((max, current) =>
                    current.value > max.value ? current : max
                  ).value} days total
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Peak Month</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.some(d => d.applications > 0) ? (
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {monthlyData.reduce((max, current) =>
                    current.applications > max.applications ? current : max
                  ).month}
                </div>
                <div className="text-sm text-gray-500">
                  {monthlyData.reduce((max, current) =>
                    current.applications > max.applications ? current : max
                  ).applications} applications
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Average Duration</CardTitle>
          </CardHeader>
          <CardContent>
            {leaveTypeData.length > 0 ? (
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    leaveTypeData.reduce((sum, type) => sum + type.value, 0) /
                    leaveTypeData.reduce((sum, type) => sum + type.count, 0) * 10
                  ) / 10} days
                </div>
                <div className="text-sm text-gray-500">per application</div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
