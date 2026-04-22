/* 'use client' */
'use client'
import { useAppSelector } from '@/redux'
import Navbar from '../../components/Navbar/page'
import Siderbar from '../../components/Sidebar/page'
import { PageLoading } from '@/components/loading/page-loading'
import { useEffect, useState, Suspense } from 'react'
type Props = {
  children?: React.ReactNode
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed)
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* sidebar */}
      <Siderbar />
      <main
        className={` dark:bg-dark-bg flex w-full flex-col bg-gray-50 ${isSidebarCollapsed ? '' : 'md:pl-64'}`}
      >
        {/* navbar */}
        <Navbar></Navbar>
        <Suspense fallback={<PageLoading />}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}

const DashboardWrapper = ({ children }: Props) => {
  return <DashboardLayout>{children}</DashboardLayout>
}

export default DashboardWrapper
