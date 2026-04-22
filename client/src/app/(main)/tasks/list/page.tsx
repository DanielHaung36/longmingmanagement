"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import { useGetAllTasksQuery, useGetTaskStatsQuery, useRequestTaskDeletionMutation, api } from "@/state/api"
import type { Task } from "@/state/api"
import { useDispatch } from 'react-redux'
import { useWebSocketContext } from "@/contexts/WebSocketContext"
import type { TaskStatusChange } from "@/services/websocket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PaginationMUI } from "@/components/ui/pagination-mui"
import { CreateTaskDialogMUI } from "@/components/Dialog/create-task-dialog-mui"
import { EditTaskDialogMUI } from "@/components/Dialog/edit-task-dialog-mui"
import { isElectron, openFileInExplorer } from "@/utils/electronBridge"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ListChecks,
  ExternalLink,
  Edit,
  Building2,
  Calendar,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
} from "lucide-react"
import { message } from "@/lib/message"
import { env } from "@/lib/env"
import { useSearchParams } from "next/navigation"

// ==================== Configuration ====================
const JOB_TYPE_META = {
  AC: {
    label: "Consulting",
    color: "bg-sky-500/10 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  AP: {
    label: "Production",
    color: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  AQ: {
    label: "Quote",
    color: "bg-teal-500/10 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
  },
  AS: {
    label: "Sales",
    color: "bg-slate-500/10 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  AT: {
    label: "Testwork",
    color: "bg-amber-500/10 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
} as const

const STATUS_META = {
  TODO: { label: "To Do", color: "bg-gray-100 text-gray-800 border-gray-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" },
  REVIEW: { label: "Review", color: "bg-purple-100 text-purple-800 border-purple-200" },
  DONE: { label: "Done", color: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-800 border-slate-200" },
} as const

const PRIORITY_META = {
  LOW: { label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200" },
  MEDIUM: { label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-200" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200" },
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
} as const

const APPROVAL_META = {
  DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-800 border-rose-200" },
  DELETE_PENDING: { label: "Delete Pending", color: "bg-red-100 text-red-800 border-red-200" },
} as const

// ==================== Utility Functions ====================
const formatDate = (date?: Date | string | null) => {
  if (!date) return "Not set"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ==================== Main Component ====================
export default function TasksListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchDebounced, setSearchDebounced] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isElectronApp, setIsElectronApp] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [bulkDeleteReason, setBulkDeleteReason] = useState("Bulk removal via Tasks list")
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const [filterJobType, setFilterJobType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>("all")
  const [dueRangeFilter, setDueRangeFilter] = useState<"all" | "dueThisWeek" | "overdue">("all")
  const [isExporting, setIsExporting] = useState(false)

  // 排序状态
  type SortField = "taskCode" | "startDate" | "status" | null
  type SortOrder = "asc" | "desc"
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [initialFiltersApplied, setInitialFiltersApplied] = useState(false)
  const ws = useWebSocketContext()
  const dispatch = useDispatch()

  // 检查是否在 Electron 环境中运行
  useEffect(() => {
    setIsElectronApp(isElectron())
  }, [])

  useEffect(() => {
    if (initialFiltersApplied) return
    const statusParam = searchParams.get("status")
    const priorityParam = searchParams.get("priority")
    const approvalParam = searchParams.get("approvalStatus")
    const jobTypeParam = searchParams.get("jobType")
    const dueParam = searchParams.get("dueRange")

    if (statusParam) setFilterStatus(statusParam)
    if (priorityParam) setFilterPriority(priorityParam)
    if (approvalParam) setFilterApprovalStatus(approvalParam)
    if (jobTypeParam) setFilterJobType(jobTypeParam)
    if (dueParam === "dueThisWeek" || dueParam === "overdue") {
      setDueRangeFilter(dueParam)
    }
    setInitialFiltersApplied(true)
  }, [initialFiltersApplied, searchParams])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: tasksResponse, isLoading, error, refetch } = useGetAllTasksQuery({
    page: currentPage,
    limit: pageSize,
    search: searchDebounced || undefined,
    jobType: filterJobType !== "all" ? filterJobType : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    priority: filterPriority !== "all" ? filterPriority : undefined,
    approvalStatus: filterApprovalStatus !== "all" ? filterApprovalStatus : undefined,
    dueRange: dueRangeFilter !== "all" ? dueRangeFilter : undefined,
  })
  const { data: taskStatsResponse } = useGetTaskStatsQuery()

  const [requestTaskDeletion, { isLoading: isRequestingDeletion }] = useRequestTaskDeletionMutation()

  const rawTasks = tasksResponse?.data || []
  const pagination = tasksResponse?.pagination

  // 排序逻辑
  const tasks = useMemo(() => {
    if (!sortField) return rawTasks

    const sorted = [...rawTasks].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "taskCode":
          comparison = (a.taskCode || "").localeCompare(b.taskCode || "")
          break
        case "startDate":
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
          comparison = dateA - dateB
          break
        case "status":
          // 状态排序：TODO < IN_PROGRESS < REVIEW < DONE < CANCELLED
          const statusOrder: Record<string, number> = {
            TODO: 0,
            IN_PROGRESS: 1,
            REVIEW: 2,
            DONE: 3,
            CANCELLED: 4,
          }
          comparison = (statusOrder[a.status || "TODO"] || 0) - (statusOrder[b.status || "TODO"] || 0)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return sorted
  }, [rawTasks, sortField, sortOrder])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterJobType, filterStatus, filterPriority, filterApprovalStatus, dueRangeFilter])

  useEffect(() => {
    setSelectedTaskIds((prev) => prev.filter((id) => tasks.some((task) => task.id === id)))
  }, [tasks])

  // ==================== WebSocket实时更新 ====================
  useEffect(() => {
    if (!ws.isConnected) return

    // 监听Task状态变更
    const handleTaskStatusChange = (data: TaskStatusChange) => {
      console.log('[Tasks List] Task status changed via WebSocket:', data)
      // 使缓存失效，触发自动重新获取
      dispatch(api.util.invalidateTags(['Tasks']))

      // 可选：显示通知
      toast({
        title: "Task Updated",
        description: `Task #${data.taskId} status changed to ${data.status}`,
      })
    }

    ws.on<TaskStatusChange>('task:status:change', handleTaskStatusChange)

    return () => {
      ws.off<TaskStatusChange>('task:status:change', handleTaskStatusChange)
    }
  }, [ws, dispatch, toast])

  const toggleTaskSelection = (taskId: number, checked: boolean) => {
    setSelectedTaskIds((prev) =>
      checked ? [...new Set([...prev, taskId])] : prev.filter((id) => id !== taskId),
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(tasks.map((task) => task.id))
    } else {
      setSelectedTaskIds([])
    }
  }

  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return
    setShowBulkDeleteDialog(true)
  }

  const handleConfirmBulkDelete = async () => {
    const reason = bulkDeleteReason.trim()
    if (!reason) {
      toast({
        title: "Deletion request cancelled",
        description: "A reason is required to submit deletion requests.",
      })
      return
    }
    try {
      setIsBulkDeleting(true)
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          requestTaskDeletion({
            id: taskId,
            reason,
          }).unwrap(),
        ),
      )
      toast({
        title: "Deletion requests submitted",
        description: `${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? "s have" : " has"} entered the approval queue.`,
      })
      setSelectedTaskIds([])
      setShowBulkDeleteDialog(false)
      setBulkDeleteReason("Bulk removal via Tasks list")
      // ✅ 不需要手动refetch，requestTaskDeletion mutation会自动invalidate
    } catch (err: any) {
      toast({
        title: "Failed to submit deletion requests",
        description: err?.data?.message || err?.message || "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // 处理编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditTaskDialog(true)
  }

  // 处理左边图标点击：桌面端打开文件夹，网页端跳转详情页
  const handleViewTask = (task: Task) => {
    if (isElectronApp) {
      // 桌面端：打开文件夹（使用服务器路径，openFileInExplorer会自动转换为本地路径）
      const serverPath = task.oneDriveFolderPath
      if (serverPath) {
        openFileInExplorer(serverPath, true)
      } else {
        toast({
          title: "文件夹不存在",
          description: "该任务尚未创建 OneDrive 文件夹",
          variant: "destructive",
        })
      }
    } else {
      // 网页端：跳转到详情页
      window.location.href = `/tasks/${task.id}`
    }
  }

  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      message.loading({ content: 'Exporting projects...', key: 'export' })

      // Build export URL with current filters
      const apiBaseUrl = (env.apiBaseUrl || '/api').replace(/\/$/, '')
      const params = new URLSearchParams()
      if (filterJobType !== "all") params.append('jobType', filterJobType)
      if (filterStatus !== "all") params.append('status', filterStatus)
      if (filterPriority !== "all") params.append('priority', filterPriority)
      if (filterApprovalStatus !== "all") params.append('approvalStatus', filterApprovalStatus)

      const exportUrl = `${apiBaseUrl}/tasks/export${params.toString() ? '?' + params.toString() : ''}`

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

      const blob = await response.blob()
      const filename = 'Longi_Projects_Export.xlsx'

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

  const stats = useMemo(() => {
    const overview = taskStatsResponse?.data?.overview
    const byStatus = taskStatsResponse?.data?.byStatus

    if (overview && byStatus) {
      return {
        total: overview.total,
        todo: byStatus["TODO"] ?? 0,
        inProgress: byStatus["IN_PROGRESS"] ?? 0,
        done: byStatus["DONE"] ?? 0,
      }
    }

    return {
      total: pagination?.total ?? tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
    }
  }, [taskStatsResponse, pagination, tasks])

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h3 className="mt-4 text-lg font-semibold">Failed to load projects</h3>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-8">
      <div className="  space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              All Projects
              {pagination && (
                <Badge variant="outline" className="text-xs font-normal">
                  {pagination.total}
                </Badge>
              )}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage and track all your tasks across all projects
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 active:bg-amber-100 transition-colors shadow-sm"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-all hover:scale-105"
              onClick={() => setShowCreateTaskDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Projects</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-full bg-slate-100 p-3">
                  <ListChecks className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-gray-500 to-slate-600 text-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-50">To Do</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.todo}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-50">In Progress</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.inProgress}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-50">Done</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.done}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Search project..."
                    value={searchQuery}
                    onChange={(e) => {console.log(e.target.value)
                        setSearchQuery(e.target.value)

                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType" className="text-sm">Job Type</Label>
                <Select value={filterJobType} onValueChange={setFilterJobType}>
                  <SelectTrigger id="jobType">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(JOB_TYPE_META).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_META).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm">Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {Object.entries(PRIORITY_META).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval" className="text-sm">Approval</Label>
                <Select value={filterApprovalStatus} onValueChange={setFilterApprovalStatus}>
                  <SelectTrigger id="approval">
                    <SelectValue placeholder="All approvals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Approvals</SelectItem>
                    {Object.entries(APPROVAL_META).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueRange" className="text-sm">Due Date</Label>
                <Select value={dueRangeFilter} onValueChange={(value) => setDueRangeFilter(value as typeof dueRangeFilter)}>
                  <SelectTrigger id="dueRange">
                    <SelectValue placeholder="All due dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="dueThisWeek">Due This Week</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <p className="text-sm text-slate-600">
                {pagination
                  ? `Showing ${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )} of ${pagination.total} tasks`
                  : `${tasks.length} tasks`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        {tasks.length === 0 ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="py-16 text-center">
              <ListChecks className="mx-auto h-16 w-16 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
              <p className="mt-2 text-sm text-slate-500">Try adjusting your filters or create a new task</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <div className="text-slate-600">
                {selectedTaskIds.length > 0
                  ? `${selectedTaskIds.length} selected`
                  : "Select tasks to perform bulk actions"}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedTaskIds.length === 0 || isRequestingDeletion || isBulkDeleting}
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Request Deletion
                </Button>
              </div>
            </div>

            <TasksTable
              tasks={tasks}
              selectedTaskIds={selectedTaskIds}
              onSelectTask={toggleTaskSelection}
              onSelectAll={toggleSelectAll}
              isElectronApp={isElectronApp}
              onViewTask={handleViewTask}
              onEditTask={handleEditTask}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={(field) => {
                if (sortField === field) {
                  // 切换排序方向
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                } else {
                  // 设置新字段，默认升序
                  setSortField(field)
                  setSortOrder("asc")
                }
              }}
            />

            {/* Pagination */}
            {pagination && (
              <PaginationMUI
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setCurrentPage(1)
                }}
                totalItems={pagination.total}
                pageSize={pagination.pageSize}
              />
            )}
          </>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialogMUI
        open={showCreateTaskDialog}
        onClose={() => setShowCreateTaskDialog(false)}
        onSuccess={() => {
          setShowCreateTaskDialog(false)
          // ✅ 不需要手动refetch，RTK Query的invalidatesTags会自动处理
        }}
      />

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialogMUI
          open={showEditTaskDialog}
          onClose={() => {
            setShowEditTaskDialog(false)
            setEditingTask(null)
          }}
          task={{
            ...editingTask,
            priority: editingTask.priority || "MEDIUM",
            status: editingTask.status || "TODO",
          } as any}
          onSuccess={() => {
            setShowEditTaskDialog(false)
            setEditingTask(null)
            // ✅ RTK Query会自动刷新
          }}
        />
      )}

      {/* Bulk delete confirmation dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={(open) => setShowBulkDeleteDialog(open)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Submit Deletion Requests
            </DialogTitle>
            <DialogDescription>
              Provide a reason for deleting {selectedTaskIds.length} selected task
              {selectedTaskIds.length > 1 ? "s" : ""}. Requests will enter the approval queue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Important</p>
              <p>
                Deleted tasks cannot be restored once approved. Please include enough context for
                approvers to understand why these tasks should be removed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-delete-reason">
                Deletion reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bulk-delete-reason"
                value={bulkDeleteReason}
                onChange={(e) => setBulkDeleteReason(e.target.value)}
                rows={4}
                placeholder="Explain why the selected tasks should be deleted..."
              />
              <p className="text-xs text-muted-foreground">
                This message will be attached to every deletion request.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkDeleteDialog(false)
                setBulkDeleteReason("Bulk removal via Tasks list")
              }}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              disabled={isBulkDeleting || !bulkDeleteReason.trim()}
            >
              {isBulkDeleting ? "Submitting..." : "Submit Requests"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== Tasks Table ====================
type SortField = "taskCode" | "startDate" | "status" | null
type SortOrder = "asc" | "desc"

function TasksTable({
  tasks,
  selectedTaskIds,
  onSelectTask,
  onSelectAll,
  isElectronApp,
  onViewTask,
  onEditTask,
  sortField,
  sortOrder,
  onSort,
}: {
  tasks: Task[]
  selectedTaskIds: number[]
  onSelectTask: (taskId: number, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  isElectronApp: boolean
  onViewTask: (task: Task) => void
  onEditTask: (task: Task) => void
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: NonNullable<SortField>) => void
}) {
  const allSelected = tasks.length > 0 && selectedTaskIds.length === tasks.length
  const partiallySelected = selectedTaskIds.length > 0 && !allSelected

  // 排序图标渲染函数
  const renderSortIcon = (field: NonNullable<SortField>) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-slate-400" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-blue-600" />
    )
  }
  return (
    <Card className="border-0 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected ? true : partiallySelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
                  aria-label="Select all projects"
                />
              </TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[100px]">
                <button
                  onClick={() => onSort("taskCode")}
                  className="flex items-center hover:text-blue-600 transition-colors"
                >
                  Code
                  {renderSortIcon("taskCode")}
                </button>
              </TableHead>
              <TableHead className="font-semibold min-w-[250px]">
                <button
                  onClick={() => onSort("startDate")}
                  className="flex items-center hover:text-blue-600 transition-colors"
                >
                  Project Details
                  {renderSortIcon("startDate")}
                </button>
              </TableHead>
              <TableHead className="font-semibold min-w-[150px]">Mine Site</TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[100px]">Assignee</TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[120px]">
                <button
                  onClick={() => onSort("status")}
                  className="flex items-center hover:text-blue-600 transition-colors"
                >
                  Status
                  {renderSortIcon("status")}
                </button>
              </TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[100px]">Priority</TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[120px]">Progress</TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[120px]">Due Date</TableHead>
              <TableHead className="text-right font-semibold whitespace-nowrap w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const jobType = task.jobType ? JOB_TYPE_META[task.jobType as keyof typeof JOB_TYPE_META] : JOB_TYPE_META.AT
              const status = task.status ? STATUS_META[task.status as keyof typeof STATUS_META] : STATUS_META.TODO
              const priority = task.priority ? PRIORITY_META[task.priority as keyof typeof PRIORITY_META] : PRIORITY_META.MEDIUM
              const progress = task.progress ?? 0
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    "hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors",
                    isOverdue && "bg-red-50/30"
                  )}
                >
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedTaskIds.includes(task.id)}
                      onCheckedChange={(checked) => onSelectTask(task.id, Boolean(checked))}
                      aria-label={`Select task ${task.taskCode}`}
                    />
                  </TableCell>

                  {/* Task Code */}
                  <TableCell className="font-mono text-xs font-semibold whitespace-nowrap">
                    <Link href={`/tasks/${task.id}`} className="hover:text-blue-600">
                      {task.taskCode}
                    </Link>
                  </TableCell>

                  {/* Task Details */}
                  <TableCell>
                    <Link href={`/tasks/${task.id}`} className="hover:underline">
                      <div className="font-semibold text-sm mb-1">{task.title}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Badge variant="outline" className={cn("text-xs", jobType.color)}>
                          <span className={cn("mr-1 h-1.5 w-1.5 rounded-full", jobType.dot)} />
                          {jobType.label}
                        </Badge>
                        {task.mineral && (
                          <span className="flex items-center gap-1">
                            <span className="text-purple-600 font-medium">{task.mineral}</span>
                          </span>
                        )}
                      </div>
                    </Link>
                  </TableCell>

                  {/* Mine Site */}
                  <TableCell>
                    {task.projects && (
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">{task.projects.mineSiteName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{task.projects.clientCompany}</span>
                        </div>
                      </div>
                    )}
                  </TableCell>

                  {/* Assignee */}
                  <TableCell>
                    {task.assignedUser ? (
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {task.assignedUser.username?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                        <div className="text-xs">
                          <div className="font-medium text-slate-900">{task.assignedUser.username}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs whitespace-nowrap font-medium", status.color)}>
                      {status.label}
                    </Badge>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs whitespace-nowrap font-medium",
                        priority.color,
                        task.priority === 'URGENT' && "animate-pulse"
                      )}
                    >
                      {priority.label}
                    </Badge>
                  </TableCell>

                  {/* Progress */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            progress === 100 ? "bg-green-500" :
                            progress >= 75 ? "bg-blue-500" :
                            progress >= 50 ? "bg-yellow-500" :
                            progress >= 25 ? "bg-orange-500" :
                            "bg-slate-400"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Due Date */}
                  <TableCell>
                    <div className="text-xs">
                      {task.dueDate ? (
                        <div className={cn(
                          "flex items-center gap-1",
                          isOverdue ? "text-red-600 font-semibold" : "text-slate-600"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                          {isOverdue && <span className="text-red-600">⚠️</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400">No due date</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* 左边图标：桌面端打开文件夹，网页端跳转详情页 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onViewTask(task)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {/* 右边图标：直接弹出编辑对话框 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEditTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
