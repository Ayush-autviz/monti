'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { LeaveApplicationForm } from '@/components/leave-application-form'

export default function ApplyLeavePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    // You could add a success message or redirect here
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <LeaveApplicationForm onSuccess={handleSuccess} />
        
        {refreshTrigger > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Leave application submitted successfully!
          </div>
        )}
      </div>
    </MainLayout>
  )
}
