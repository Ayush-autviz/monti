'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateEarnedLeave } from '@/lib/leave-calculations'
import { Calculator } from 'lucide-react'

export function LeaveCalculationTest() {
  const [doj, setDoj] = useState('2022-07-10') // Default to the example date
  const [result, setResult] = useState<number | null>(null)

  const handleCalculate = () => {
    const earnedLeave = calculateEarnedLeave(doj)
    setResult(earnedLeave)
  }

  const getServiceDetails = () => {
    const dojDate = new Date(doj)
    const now = new Date()

    const years = now.getFullYear() - dojDate.getFullYear()
    const months = now.getMonth() - dojDate.getMonth()
    const totalMonths = years * 12 + months

    // Adjust if current date is before the DOJ date in the current month
    const adjustedMonths = now.getDate() < dojDate.getDate() ? totalMonths - 1 : totalMonths

    return {
      years: Math.floor(adjustedMonths / 12),
      months: adjustedMonths % 12,
      totalMonths: adjustedMonths,
      sixMonthPeriods: Math.floor(adjustedMonths / 6)
    }
  }

  const serviceDetails = getServiceDetails()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Leave Calculation Test
        </CardTitle>
        <CardDescription>
          Test the earned leave calculation for any date of joining
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="doj">Date of Joining</Label>
          <Input
            id="doj"
            type="date"
            value={doj}
            onChange={(e) => setDoj(e.target.value)}
          />
        </div>

        <Button onClick={handleCalculate} className="w-full">
          Calculate Earned Leave
        </Button>

        {result !== null && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Calculation Results:</h4>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Service Period:</span>
                <div className="font-medium">
                  {serviceDetails.years} years, {serviceDetails.months} months
                </div>
              </div>

              <div>
                <span className="text-blue-700">Total Months:</span>
                <div className="font-medium">{serviceDetails.totalMonths} months</div>
              </div>

              <div>
                <span className="text-blue-700">6-Month Periods:</span>
                <div className="font-medium">{serviceDetails.sixMonthPeriods} periods</div>
              </div>

              <div>
                <span className="text-blue-700">Earned Leave:</span>
                <div className="font-medium text-lg text-blue-900">{result} days</div>
              </div>
            </div>

            <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
              <strong>Formula:</strong> Floor(Total Months ÷ 6) × 6 days
              <br />
              <strong>Calculation:</strong> Floor({serviceDetails.totalMonths} ÷ 6) × 6 = {serviceDetails.sixMonthPeriods} × 6 = {result} days
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <h4 className="font-medium">Leave Rules:</h4>
          <ul className="space-y-1">
            <li>• <strong>Medical Leave:</strong> 365 days total for entire career</li>
            <li>• <strong>Casual Leave:</strong> 12 days per calendar year (no carry forward)</li>
            <li>• <strong>Earned Leave:</strong> 6 days earned every 6 months of service (carry forward allowed)</li>
          </ul>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <h4 className="font-medium">Example Calculations:</h4>
          <ul className="space-y-1">
            <li>• <strong>DOJ: 10/07/2022</strong> → Service: ~30 months → Earned: <strong>30 days</strong> (5 periods × 6 days)</li>
            <li>• DOJ: 01/01/2023 → Service: ~24 months → Earned: 24 days (4 periods × 6 days)</li>
            <li>• DOJ: 01/01/2024 → Service: ~12 months → Earned: 12 days (2 periods × 6 days)</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">🚨 If EL is still showing 0:</h4>
          <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
            <li>Go to Supabase Dashboard → SQL Editor</li>
            <li>Run the updated schema from database/schema.sql</li>
            <li>Come back and click "Refresh All Leave Balances"</li>
            <li>Check employee details - EL should now show correct value</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
