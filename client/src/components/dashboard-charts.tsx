'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import { useGetProjectsQuery, useGetAllTasksQuery } from '@/state/api'
import { useMemo } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'

export function DashboardCharts() {
  const { data: projectsData } = useGetProjectsQuery({ page: 1, pageSize: 1000 })
  const { data: tasksData } = useGetAllTasksQuery({ page: 1, limit: 1000 })

  // 项目趋势数据（最近6个月）
  const projectTrendData = useMemo(() => {
    if (!projectsData?.data?.projects) return []

    const projects = projectsData.data.projects
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return {
        month: format(date, 'MMM'),
        date: startOfMonth(date),
        created: 0,
        completed: 0,
      }
    })

    projects.forEach((project) => {
      const createdDate = new Date(project.createdAt)
      const monthIndex = months.findIndex((m) =>
        m.date.getMonth() === createdDate.getMonth() &&
        m.date.getFullYear() === createdDate.getFullYear()
      )
      if (monthIndex !== -1) {
        months[monthIndex].created++
      }

      if (project.status === 'COMPLETED' && project.updatedAt) {
        const completedDate = new Date(project.updatedAt)
        const monthIndex = months.findIndex((m) =>
          m.date.getMonth() === completedDate.getMonth() &&
          m.date.getFullYear() === completedDate.getFullYear()
        )
        if (monthIndex !== -1) {
          months[monthIndex].completed++
        }
      }
    })

    return months.map(({ month, created, completed }) => ({ month, created, completed }))
  }, [projectsData])

  // 审批状态数据
  const statusData = useMemo(() => {
    if (!projectsData?.data?.projects) return []

    const projects = projectsData.data.projects
    const statusCounts = {
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    }

    projects.forEach((project) => {
      if (statusCounts[project.approvalStatus] !== undefined) {
        statusCounts[project.approvalStatus]++
      }
    })

    return [
      { name: 'Draft', value: statusCounts.DRAFT, fill: '#94a3b8' },
      { name: 'Pending', value: statusCounts.PENDING, fill: '#f59e0b' },
      { name: 'Approved', value: statusCounts.APPROVED, fill: '#10b981' },
      { name: 'Rejected', value: statusCounts.REJECTED, fill: '#ef4444' },
    ].filter(item => item.value > 0)
  }, [projectsData])

  // 任务完成率数据
  const taskProgressData = useMemo(() => {
    if (!tasksData?.data) return []

    const tasks = tasksData.data
    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    }

    tasks.forEach((task) => {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++
      }
    })

    return [
      { name: 'To Do', value: statusCounts.TODO, fill: '#64748b' },
      { name: 'In Progress', value: statusCounts.IN_PROGRESS, fill: '#3b82f6' },
      { name: 'Review', value: statusCounts.REVIEW, fill: '#f59e0b' },
      { name: 'Done', value: statusCounts.DONE, fill: '#10b981' },
    ].filter(item => item.value > 0)
  }, [tasksData])

  return (
    <>
      {/* 项目趋势图 */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
            Project Trends
          </CardTitle>
          <CardDescription>Projects created vs completed (Last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={projectTrendData}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorCreated)"
                name="Created"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorCompleted)"
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 审批状态分布 */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></div>
            Approval Status
          </CardTitle>
          <CardDescription>Current project approval distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 任务进度分布 */}
      <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
            Project Progress
          </CardTitle>
          <CardDescription>Project status distribution across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={taskProgressData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#d1d5db' }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              />
              <Bar
                dataKey="value"
                radius={[0, 8, 8, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  )
}
