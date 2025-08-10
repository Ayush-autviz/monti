'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { DashboardCharts } from '@/components/dashboard-charts'
import { DashboardStats } from '@/components/dashboard-stats'

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">
            Comprehensive leave management reports and statistics
          </p>
        </div>
        
        <DashboardStats />
        <DashboardCharts />
      </div>
    </MainLayout>
  )
}
