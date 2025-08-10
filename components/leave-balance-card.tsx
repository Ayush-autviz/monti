'use client'

import { useState, useEffect } from 'react'
import { getLeaveBalances } from '@/lib/database'
import type { Employee } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LeaveBalanceData {
  id: string
  total_allocated: number
  used: number
  remaining: number
  year: number
  leave_types: {
    name: string
    code: string
    description: string
  }
}

interface LeaveBalanceCardProps {
  employee: Employee
  year?: number
}

export function LeaveBalanceCard({ employee, year = new Date().getFullYear() }: LeaveBalanceCardProps) {
  const [balances, setBalances] = useState<LeaveBalanceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBalances()
  }, [employee.id, year])

  const loadBalances = async () => {
    try {
      setIsLoading(true)
      const data = await getLeaveBalances(employee.id, year)
      setBalances(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave balances')
    } finally {
      setIsLoading(false)
    }
  }

  const getBalanceColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100
    if (percentage > 70) return 'text-green-600 bg-green-50'
    if (percentage > 30) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getProgressColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100
    if (percentage > 70) return 'bg-green-500'
    if (percentage > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balance - {year}</CardTitle>
        <CardDescription>
          {employee.name} ({employee.employee_code})
        </CardDescription>
      </CardHeader>
      <CardContent>

        <div className="space-y-4">
          {balances.map((balance) => {
            const usagePercentage = (balance.used / balance.total_allocated) * 100
            const remainingPercentage = (balance.remaining / balance.total_allocated) * 100

            return (
              <div key={balance.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{balance.leave_types.name}</h4>
                  <Badge variant="outline" className={getBalanceColor(balance.remaining, balance.total_allocated)}>
                    {balance.remaining} / {balance.total_allocated} days
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  {balance.leave_types.description}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used: {balance.used} days</span>
                    <span>Remaining: {balance.remaining} days</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(balance.remaining, balance.total_allocated)}`}
                      style={{ width: `${Math.max(remainingPercentage, 5)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{usagePercentage.toFixed(1)}% used</span>
                    <span>{remainingPercentage.toFixed(1)}% remaining</span>
                  </div>
                </div>

                {balance.leave_types.code === 'CL' && balance.remaining > 0 && (
                  <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    ⚠️ Casual leaves expire at year end and don&apos;t carry forward
                  </div>
                )}

                {balance.leave_types.code === 'MEDICAL' && balance.remaining < 30 && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ Medical leave balance is running low
                  </div>
                )}
              </div>
            )
          })}

          {balances.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No leave balance data found for {year}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
