'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getEmployees, getLeaveTypes, getLeaveBalances, updateLeaveBalance } from '@/lib/database'
import type { Employee } from '@/lib/supabase'
import { Edit, Save, RefreshCw } from 'lucide-react'

interface LeaveType {
  id: string
  name: string
  code: string
}

interface LeaveBalance {
  id: string
  total_allocated: number
  used: number
  remaining: number
  year: number
  leave_types: {
    name: string
    code: string
  }
}

export function EditLeaveBalance() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('')
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [editingBalance, setEditingBalance] = useState<{
    total_allocated: number
    used: number
    remaining: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeBalances()
    }
  }, [selectedEmployee])

  const loadInitialData = async () => {
    try {
      const [employeesData, leaveTypesData] = await Promise.all([
        getEmployees(),
        getLeaveTypes()
      ])
      setEmployees(employeesData)
      setLeaveTypes(leaveTypesData)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load data'
      })
    }
  }

  const loadEmployeeBalances = async () => {
    if (!selectedEmployee) return

    try {
      setIsLoading(true)
      const currentYear = new Date().getFullYear()
      const balancesData = await getLeaveBalances(selectedEmployee, currentYear)
      setBalances(balancesData)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load balances'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (balance: LeaveBalance) => {
    setSelectedLeaveType(balance.leave_types.code)
    setEditingBalance({
      total_allocated: balance.total_allocated,
      used: balance.used,
      remaining: balance.remaining
    })
  }

  const handleSave = async () => {
    if (!selectedEmployee || !selectedLeaveType || !editingBalance) return

    try {
      setIsLoading(true)
      setMessage(null)

      const currentYear = new Date().getFullYear()
      const leaveType = leaveTypes.find(lt => lt.code === selectedLeaveType)
      
      if (!leaveType) {
        throw new Error('Leave type not found')
      }

      await updateLeaveBalance(
        selectedEmployee,
        leaveType.id,
        currentYear,
        {
          total_allocated: editingBalance.total_allocated,
          used: editingBalance.used,
          remaining: editingBalance.remaining
        }
      )

      setMessage({
        type: 'success',
        text: 'Leave balance updated successfully!'
      })

      setEditingBalance(null)
      setSelectedLeaveType('')
      await loadEmployeeBalances()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update balance'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingBalance(null)
    setSelectedLeaveType('')
  }

  const calculateRemaining = (allocated: number, used: number) => {
    return Math.max(0, allocated - used)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Edit Leave Balances
        </CardTitle>
        <CardDescription>
          Manually adjust employee leave balances when needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Current Leave Balances</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEmployeeBalances}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-4">Loading balances...</div>
              ) : balances.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No leave balances found. Try refreshing all balances from Admin Tools.
                </div>
              ) : (
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div key={balance.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">{balance.leave_types.name}</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(balance)}
                          disabled={editingBalance !== null}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>

                      {editingBalance && selectedLeaveType === balance.leave_types.code ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="allocated">Total Allocated</Label>
                              <Input
                                id="allocated"
                                type="number"
                                value={editingBalance.total_allocated}
                                onChange={(e) => setEditingBalance({
                                  ...editingBalance,
                                  total_allocated: Number(e.target.value),
                                  remaining: calculateRemaining(Number(e.target.value), editingBalance.used)
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="used">Used</Label>
                              <Input
                                id="used"
                                type="number"
                                value={editingBalance.used}
                                onChange={(e) => setEditingBalance({
                                  ...editingBalance,
                                  used: Number(e.target.value),
                                  remaining: calculateRemaining(editingBalance.total_allocated, Number(e.target.value))
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="remaining">Remaining</Label>
                              <Input
                                id="remaining"
                                type="number"
                                value={editingBalance.remaining}
                                readOnly
                                className="bg-gray-50"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={isLoading}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Allocated:</span>
                            <div className="font-medium">{balance.total_allocated} days</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Used:</span>
                            <div className="font-medium">{balance.used} days</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Remaining:</span>
                            <div className="font-medium">{balance.remaining} days</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Changes are immediate and will affect leave applications</li>
            <li>• Remaining balance is automatically calculated (Allocated - Used)</li>
            <li>• Medical leave is lifetime total (365 days max)</li>
            <li>• Casual leave resets every year (12 days max)</li>
            <li>• Earned leave carries forward year to year</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
