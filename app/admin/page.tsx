'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { refreshAllLeaveBalances } from '@/lib/database'
import { LeaveCalculationTest } from '@/components/leave-calculation-test'
import { EditLeaveBalance } from '@/components/edit-leave-balance'
import { RefreshCw, Database, AlertTriangle } from 'lucide-react'

export default function AdminPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleRefreshBalances = async () => {
    setIsRefreshing(true)
    setMessage(null)

    try {
      await refreshAllLeaveBalances()
      setMessage({
        type: 'success',
        text: 'All leave balances have been refreshed successfully! Earned leaves are now calculated correctly based on date of joining.'
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to refresh leave balances'
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Tools</h1>
          <p className="text-gray-600">
            Administrative tools for managing the leave management system
          </p>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Refresh Leave Balances
              </CardTitle>
              <CardDescription>
                Recalculate all employee leave balances based on current rules.
                This will fix any issues with earned leave calculations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">What this does:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• ✅ Recalculates Earned Leave based on Date of Joining (FIXED)</li>
                    <li>• ✅ Resets Casual Leave to 12 days for current year</li>
                    <li>• ✅ Maintains Medical Leave at 365 days total</li>
                    <li>• ✅ Properly deducts approved leave applications</li>
                    <li>• ✅ Creates missing balance records</li>
                  </ul>
                </div>

                <Button
                  onClick={handleRefreshBalances}
                  disabled={isRefreshing}
                  className="w-full"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh All Leave Balances
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Information
              </CardTitle>
              <CardDescription>
                Current database schema and trigger information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">Leave Calculation Rules:</h4>
                  <ul className="text-gray-600 mt-1 space-y-1">
                    <li>• Medical Leave: 365 days total career</li>
                    <li>• Casual Leave: 12 days per calendar year</li>
                    <li>• Earned Leave: 6 days per 6 months of service</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Automatic Features:</h4>
                  <ul className="text-gray-600 mt-1 space-y-1">
                    <li>• Leave balances auto-deduct on approval</li>
                    <li>• Balances restore if approval is revoked</li>
                    <li>• New employees get initial balances</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>
              Common issues and solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-green-700">✅ FIXED: Earned Leave showing 0</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Solution: Click "Refresh All Leave Balances" above. The calculation now properly
                  calculates 6 days per 6 months from date of joining.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-green-700">✅ FIXED: Leave balance not deducting after approval</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Solution: The system now automatically deducts leave when applications are approved.
                  Manual balance updates are also available below.
                </p>
              </div>

              <div>
                <h4 className="font-medium">Issue: Incorrect leave calculations</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Solution: Use the refresh function above to recalculate all balances based on current rules.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <LeaveCalculationTest />

        <EditLeaveBalance />
      </div>
    </MainLayout>
  )
}
