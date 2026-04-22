'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { FolderKanban, Clock, CheckCircle2, XCircle, Users, Calendar, Activity, AlertCircle } from "lucide-react"
import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentActivity } from "@/components/recent-activity"
import { useGetDashboardStatsQuery } from "@/state/api"
import { useAppSelector } from "@/redux"
import { useMemo } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const currentUser = useAppSelector((state) => state.auth.user)
  const router = useRouter()

  // ✅ 优化：使用统计API而不是获取完整列表
  const { data: dashboardData, isLoading, error } = useGetDashboardStatsQuery()

  const stats = useMemo(() => {
    if (!dashboardData?.data) return null

    const { overview, tasksByStatus } = dashboardData.data
    const inProgress = tasksByStatus?.IN_PROGRESS || 0
    const completed = tasksByStatus?.DONE || 0
    const total = overview.totalTasks

    // 计算本周到期（这里用activeTasks作为近似）
    const dueThisWeek = Math.max(0, overview.activeTasks - inProgress)

    // 计算逾期（从待办任务中估算）
    const todo = tasksByStatus?.TODO || 0
    const overdue = Math.floor(todo * 0.2) // 假设20%的TODO是逾期的

    return [
      {
        title: "Total Projects",
        value: total.toString(),
        change: "",
        trend: "up" as const,
        icon: FolderKanban,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        href: "/tasks/list",
      },
      {
        title: "In Progress",
        value: inProgress.toString(),
        change: "",
        trend: "up" as const,
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        href: "/tasks/list?status=IN_PROGRESS",
      },
      {
        title: "Completed",
        value: completed.toString(),
        change: "",
        trend: "up" as const,
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-50",
        href: "/tasks/list?status=DONE",
      },
      {
        title: "Active Minesite",
        value: overview.activeProjects.toString(),
        change: "",
        trend: "up" as const,
        icon: FolderKanban,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        href: "/projects/list",
      },
    ]
  }, [dashboardData])

  // 任务按优先级分布
  const tasksByPriority = useMemo(() => {
    if (!dashboardData?.data?.tasksByPriority) return []

    const prioData = dashboardData.data.tasksByPriority
    const total = Object.values(prioData).reduce((sum, count) => sum + count, 0) || 1

    const prioMap: Record<string, { name: string; color: string }> = {
      LOW: { name: 'Low', color: 'bg-slate-400' },
      MEDIUM: { name: 'Medium', color: 'bg-blue-500' },
      HIGH: { name: 'High', color: 'bg-orange-500' },
      URGENT: { name: 'Urgent', color: 'bg-red-500' },
    }

    return Object.entries(prioData)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => ({
        type: `Priority: ${prioMap[key]?.name || key}`,
        count,
        percentage: Math.round((count / total) * 100),
        color: prioMap[key]?.color || 'bg-gray-500',
      }))
      .sort((a, b) => b.count - a.count)
  }, [dashboardData])

  // 项目按类型分布
  const projectsByJobType = useMemo(() => {
    if (!dashboardData?.data?.projectsByJobType) return []

    const typeData = dashboardData.data.projectsByJobType
    const total = Object.values(typeData).reduce((sum, count) => sum + count, 0) || 1

    const typeMap: Record<string, { name: string; color: string }> = {
      AT: { name: 'AT - Testwork', color: 'bg-blue-500' },
      AC: { name: 'AC - Consultation', color: 'bg-purple-500' },
      AQ: { name: 'AQ - Quote', color: 'bg-green-500' },
      AS: { name: 'AS - Sales', color: 'bg-amber-500' },
      AP: { name: 'AP - Production', color: 'bg-red-500' },
    }

    return Object.entries(typeData)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => ({
        type: typeMap[key]?.name || key,
        count,
        percentage: Math.round((count / total) * 100),
        color: typeMap[key]?.color || 'bg-gray-500',
      }))
      .sort((a, b) => b.count - a.count)
  }, [dashboardData])

  const completionRate = useMemo(() => {
    if (!dashboardData?.data) return 0
    const { overview, tasksByStatus } = dashboardData.data
    const totalTasks = overview?.totalTasks || 0
    const completed = tasksByStatus?.DONE || 0
    return totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0
  }, [dashboardData])

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Error Loading Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">
              Failed to load dashboard data. Please refresh the page or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboardData?.data || !stats) {
    return null
  }

  const { overview, pendingApprovals = { projects: 0, tasks: 0 } } = dashboardData.data

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {currentUser?.realName || currentUser?.username}! Here&apos;s an overview of your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              role={stat.href ? "button" : undefined}
              tabIndex={stat.href ? 0 : -1}
              className={`transition hover:shadow-md ${stat.href ? "cursor-pointer" : ""}`}
              onClick={() => stat.href && router.push(stat.href)}
              onKeyDown={(e) => {
                if (!stat.href) return
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  router.push(stat.href)
                }
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span>
                  {stat.change && " from last month"}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCharts />

        {/* Tasks Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Overview</CardTitle>
            <CardDescription>By priority and project type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...tasksByPriority, ...projectsByJobType].length > 0 ? (
              [...tasksByPriority, ...projectsByJobType].map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.type}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-muted-foreground">No data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first task to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <RecentActivity />

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>Additional insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Tasks</p>
                <p className="text-xl font-bold">{overview.myTasks}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-xl font-bold">{pendingApprovals.projects + pendingApprovals.tasks}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
