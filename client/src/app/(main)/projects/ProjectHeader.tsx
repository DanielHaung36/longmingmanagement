'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header/page'
import { Button } from '@/components/ui/button'
import { Grid3X3, List, Clock, Table, PlusSquare, Filter, Grid3x3, Share2, ListChecks, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateProjectDialogMUI } from '@/components/Dialog/create-project-dialog-mui'
import { CreateTaskDialogMUI } from '@/components/Dialog/create-task-dialog-mui'
import { message } from '@/lib/message'
import { env } from '@/lib/env'

type Props = {
  activeTab: string
  setActiveTab: (tabName: string) => void
}

const ProjectHeader = ({ activeTab, setActiveTab }: Props) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      message.loading({ content: 'Exporting projects...', key: 'export' })

      // Construct export URL from configured API base to work across environments
      const apiBaseUrl = (env.apiBaseUrl || '/api').replace(/\/$/, '')
      const exportUrl = `${apiBaseUrl}/projects/export`

      // Call backend API to export Excel
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the blob from response
      const blob = await response.blob()

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Longi_Projects_Export.xlsx'
      // if (contentDisposition) {
      //   const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
      //   if (filenameMatch && filenameMatch[1]) {
      //     filename = filenameMatch[1]
      //   }
      // }
      // if (filename) {
      //   // 移除末尾多余的下划线
      //   while (filename.endsWith('_')) {
      //       filename = filename.slice(0, -1); 
      //   }
      // }

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success({ content: 'Projects exported successfully!', key: 'export', duration: 2 })
    } catch (error) {
      console.error('Export error:', error)
      message.error({ content: 'Failed to export projects', key: 'export', duration: 2 })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <CreateProjectDialogMUI
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          // Refresh projects list
          window.location.reload()
        }}
      />
      <CreateTaskDialogMUI
        open={showCreateTaskDialog}
        onClose={() => setShowCreateTaskDialog(false)}
        onSuccess={() => {
          setShowCreateTaskDialog(false)
          window.location.reload()
        }}
      />
    <div className="pt-6 pb-6 lg:pt-8 lg:pb-4 ">
      <Header
        name="Product Design Development"
        buttonComponent={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm flex-1 sm:flex-none whitespace-nowrap"
              onClick={() => setShowCreateDialog(true)}
            >
              <PlusSquare className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">New </span>Minesite
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 transition-colors shadow-sm flex-1 sm:flex-none whitespace-nowrap"
              onClick={() => setShowCreateTaskDialog(true)}
            >
              <ListChecks className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">New </span>Project
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 active:bg-amber-100 transition-colors shadow-sm flex-1 sm:flex-none whitespace-nowrap"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              <FileSpreadsheet className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden xs:inline">{isExporting ? 'Exporting...' : 'Export '}</span>Excel
            </Button>
          </div>
        }
      />
      {/* TABS */}
      <div className="mx-auto dark:border-slate-700 flex flex-wrap-reverse justify-between border-y border-gray-200 pt-2 pb-2 px-4 md:items-center md:px-8">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          <TabButton
            name="Minesites"
            icon={<Grid3X3 className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
          <TabButton
            name="Board"
            icon={<Grid3X3 className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
          {/* <TabButton
            name="List"
            icon={<List className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          /> */}
          <TabButton
            name="Timeline"
            icon={<Clock className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
          <TabButton
            name="Projects"
            icon={<Table className="h-5 w-5" />}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-4 py-2">
          <button className="text-gray-500 transition-colors hover:text-emerald-700 dark:text-neutral-500 dark:hover:text-gray-300">
            <Filter className="h-5 w-5" />
          </button>
          <button className="text-gray-500 transition-colors hover:text-emerald-700 dark:text-neutral-500 dark:hover:text-gray-300">
            <Share2 className="h-5 w-5" />
          </button>
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search Task"
              className="dark:border-dark-secondary dark:bg-dark-secondary rounded-md border border-gray-300 py-1 pr-4 pl-10 focus:outline-none dark:text-white w-40 lg:w-auto"
            />
            <Grid3x3 className="absolute top-2 left-3 h-4 w-4 text-gray-400 dark:text-neutral-500" />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

type TabButtonProps = {
  name: string
  icon: React.ReactNode
  setActiveTab: (tabName: string) => void
  activeTab: string
}
const TabButton = ({ name, icon, setActiveTab, activeTab }: TabButtonProps) => {
  const isActive = activeTab === name

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-md",
        isActive
          ? "bg-emerald-600 text-white hover:bg-emerald-800 dark:bg-slate-100 dark:text-slate-900"
          : " hover:text-white hover:bg-emerald-600 dark:text-white dark:hover:text-slate-100 dark:hover:bg-slate-800"
      )}
      onClick={() => setActiveTab(name)}
    >
      {icon}
      {name}
    </Button>
  )
}
export default ProjectHeader
