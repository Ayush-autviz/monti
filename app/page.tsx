import { MainLayout } from '@/components/layout/main-layout'
import { DashboardStats } from '@/components/dashboard-stats'
import { DashboardCharts } from '@/components/dashboard-charts'

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <DashboardStats />
        <DashboardCharts />
      </div>
    </MainLayout>
  )
}


