'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { LeaveApplicationsList } from '@/components/leave-applications-list'

export default function ApplicationsPage() {
  return (
    <MainLayout>
      <LeaveApplicationsList />
    </MainLayout>
  )
}
