import React, { useEffect, useMemo, useState } from "react"
import type { Project, Task as TaskType } from "@/state/api"
import { useGetAllTasksQuery } from "@/state/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, LayoutList, LayoutGrid, Edit, Trash2, User, Calendar, Building2, ClipboardCheck, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { EditProjectDialogMUI } from "@/components/Dialog/edit-project-dialog-mui"
import { DeleteProjectDialog } from "@/components/Dialog/delete-project-dialog"
import { CreateTaskDialogMUI } from "@/components/Dialog/create-task-dialog-mui"
import { EditTaskDialogMUI } from "@/components/Dialog/edit-task-dialog-mui"
import { Label } from "@/components/ui/label"
import { PaginationMUI } from "@/components/ui/pagination-mui"
import { message } from "@/lib/message"
import { env } from "@/lib/env"

type Props = {
  setIsModelNewTaskOpen: (isOpen: boolean) => void
  children?: React.ReactNode
}

type JobType = Project["jobType"]
type ApprovalStatus = NonNullable<TaskType["approvalStatus"]>
type WorkflowStatus = NonNullable<TaskType["status"]>

type EditDialogProject = {
  id: string
  name: string
  description: string
  jobType: JobType
  startDate: Date
  endDate: Date
  budget: number
  owner: string
  department: string
}

const JOB_TYPE_META: Record<JobType, { label: string; badgeClass: string; dotClass: string }> = {
  AC: {
    label: "AC · Consulting Services",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    dotClass: "bg-sky-500",
  },
  AP: {
    label: "AP · Planning & Design",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dotClass: "bg-indigo-500",
  },
  AQ: {
    label: "AQ · Quality Assurance",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    dotClass: "bg-teal-500",
  },
  AS: {
    label: "AS · Technical Support",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    dotClass: "bg-slate-500",
  },
  AT: {
    label: "AT · Analysis & Testing",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
}

const DEFAULT_JOB_META = {
  label: "Not specified",
  badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
  dotClass: "bg-gray-400",
}

const APPROVAL_STATUS_META: Record<ApprovalStatus, { label: string; badgeClass: string; dotClass: string }> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
  },
  PENDING: {
    label: "Pending Approval",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    dotClass: "bg-rose-500",
  },
  DELETE_PENDING: {
    label: "Pending Deletion Approval",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    dotClass: "bg-orange-500",
  },
}

const DEFAULT_APPROVAL_STATUS_META = {
  label: "Not set",
  badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
  dotClass: "bg-gray-400",
}

const WORKFLOW_STATUS_META: Record<WorkflowStatus, { label: string; badgeClass: string }> = {
  TODO: {
    label: "Not Started",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  REVIEW: {
    label: "In Review",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  DONE: {
    label: "Completed",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
}

const getJobTypeMeta = (jobType?: string | null) => {
  if (jobType && jobType in JOB_TYPE_META) {
    return JOB_TYPE_META[jobType as JobType]
  }
  return DEFAULT_JOB_META
}

const getApprovalStatusMeta = (status?: string | null) => {
  if (status && status in APPROVAL_STATUS_META) {
    return APPROVAL_STATUS_META[status as ApprovalStatus]
  }
  return DEFAULT_APPROVAL_STATUS_META
}

const getWorkflowStatusMeta = (status?: string | null) => {
  if (status && status in WORKFLOW_STATUS_META) {
    return WORKFLOW_STATUS_META[status as WorkflowStatus]
  }
  return null
}

const formatDate = (value?: string | Date | null, pattern = "yyyy-MM-dd") => {
  if (!value) return null
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null
  return format(date, pattern)
}

const parseDateValue = (value?: string | Date | null) => {
  if (!value) return null
  const date = typeof value === "string" ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateRange = (start?: string | Date | null, end?: string | Date | null) => {
  const formattedStart = formatDate(start)
  const formattedEnd = formatDate(end)

  if (!formattedStart && !formattedEnd) {
    return "Not set"
  }
  if (formattedStart && formattedEnd) {
    return `${formattedStart} → ${formattedEnd}`
  }
  return formattedStart ?? formattedEnd ?? "Not set"
}

type ViewMode = "table" | "grid"

const TableView = (props: Props) => {
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterJobType, setFilterJobType] = useState<string>("all")
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>("all")
  const [filterMineral, setFilterMineral] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20) // 每页显示20条

  // 服务端分页 - 传递所有过滤参数
  const { data: taskResponse, isLoading, error } = useGetAllTasksQuery({
    search: searchQuery || undefined,
    jobType: filterJobType !== "all" ? filterJobType : undefined,
    mineral: filterMineral !== "all" ? filterMineral : undefined,
    approvalStatus: filterApprovalStatus !== "all" ? filterApprovalStatus : undefined,
    page: currentPage,
    limit: pageSize,
  })

  const [editDialogProject, setEditDialogProject] = useState<EditDialogProject | null>(null)
  const [taskPendingDeletion, setTaskPendingDeletion] = useState<{ id: number; title: string } | null>(null)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false)
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false)
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<TaskType | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const enforceMobileView = () => {
      if (window.innerWidth < 768) {
        setViewMode("grid")
      }
    }
    enforceMobileView()
    window.addEventListener("resize", enforceMobileView)
    return () => window.removeEventListener("resize", enforceMobileView)
  }, [])

  // 使用服务端返回的数据（已过滤和分页）
  const tasks = taskResponse?.data ?? []
  const pagination = taskResponse?.pagination
  const totalTasks = pagination?.total ?? 0

  // Mineral 选项需要从所有tasks获取（需要单独请求或从当前页提取）
  const minerals = useMemo(() => {
    const values = tasks
      .map((task) => task.mineral)
      .filter((value): value is string => Boolean(value))
    return Array.from(new Set(values))
  }, [tasks])

  // 当过滤条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterJobType, filterApprovalStatus, filterMineral])

  // 计算当前页显示范围
  const rangeStart = totalTasks === 0 ? 0 : (pagination?.page ? (pagination.page - 1) * pageSize + 1 : 0)
  const rangeEnd = totalTasks === 0 ? 0 : Math.min(rangeStart + tasks.length - 1, totalTasks)

  const jobTypeOptions = useMemo(
    () =>
      Object.entries(JOB_TYPE_META).map(([value, meta]) => ({
        value,
        label: meta.label,
      })),
    []
  )

  const approvalStatusOptions = useMemo(
    () =>
      Object.entries(APPROVAL_STATUS_META).map(([value, meta]) => ({
        value,
        label: meta.label,
      })),
    []
  )

  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      message.loading({ content: 'Exporting projects...', key: 'export' })

      // Build export URL with current filters
      const apiBaseUrl = (env.apiBaseUrl || '/api').replace(/\/$/, '')
      const params = new URLSearchParams()
      if (filterJobType !== "all") params.append('jobType', filterJobType)
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

  const handleSaveTask = (updatedProject: EditDialogProject) => {
    // TODO: Implement API call to update task/project once backend is ready
    console.log("[TableView] Saving task/project placeholder:", updatedProject)
  }

  const handleDeleteTask = () => {
    if (!taskPendingDeletion) return
    // TODO: Implement API call to delete task/project once backend is ready
    console.log("[TableView] Deleting task placeholder:", taskPendingDeletion.id)
    setTaskPendingDeletion(null)
  }

  if (isLoading) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Loading projects...</div>
  }
  if (error) {
    return <div className="px-4 py-6 text-sm text-destructive">Failed to load projects. Please try again later.</div>
  }

  return (
    <div className="space-y-6 px-4 mb-10">
      <Card className="border border-slate-200 shadow-md bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Projects Filters</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Search projects by keyword, job type, approval status, or mineral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Keyword</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="search"
                  placeholder="Search by project title, customer, or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-slate-200 shadow-sm focus-visible:ring-primary/30"
                />
              </div>
            </div>

            <div className="hidden gap-2 md:flex">
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={viewMode === "table"}
                className={cn(
                  "border border-transparent text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800",
                  viewMode === "table" && "border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                )}
                onClick={() => setViewMode("table")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "border border-transparent text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800",
                  viewMode === "grid" && "border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                )}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={filterJobType} onValueChange={setFilterJobType}>
                <SelectTrigger id="jobType" className="bg-white border-slate-200 shadow-sm">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Job Types</SelectItem>
                  {jobTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvalStatus">Approval Status</Label>
              <Select value={filterApprovalStatus} onValueChange={setFilterApprovalStatus}>
                <SelectTrigger id="approvalStatus" className="bg-white border-slate-200 shadow-sm">
                  <SelectValue placeholder="Select approval status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {approvalStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mineral">Mineral</Label>
              <Select value={filterMineral} onValueChange={setFilterMineral}>
                <SelectTrigger id="mineral" className="bg-white border-slate-200 shadow-sm">
                  <SelectValue placeholder="Select mineral" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Minerals</SelectItem>
                  {minerals.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Showing {rangeStart === 0 ? 0 : rangeStart}-{rangeEnd} of {totalTasks} tasks
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 active:bg-amber-100 transition-colors shadow-sm"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setFilterJobType("all")
                  setFilterApprovalStatus("all")
                  setFilterMineral("all")
                  setCurrentPage(1)
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "table" && (
        <div className="hidden md:block">
          <Card className="border border-slate-200 shadow-lg dark:border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-b-lg border-t border-slate-200 dark:border-slate-700">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow className="bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-50 hover:bg-slate-900 dark:hover:bg-slate-800">
                      <TableHead className="w-[200px] font-semibold uppercase tracking-wide text-white">Project</TableHead>
                      <TableHead className="w-[100px] font-semibold uppercase tracking-wide text-white">Code</TableHead>
                      <TableHead className="w-[180px] font-semibold uppercase tracking-wide text-white">Minesite</TableHead>
                      <TableHead className="font-semibold uppercase tracking-wide text-white">Job Type</TableHead>
                      <TableHead className="font-semibold uppercase tracking-wide text-white">Status</TableHead>
                      <TableHead className="font-semibold uppercase tracking-wide text-white">Owner</TableHead>
                      <TableHead className="font-semibold uppercase tracking-wide text-white">Mineral</TableHead>
                      <TableHead className="font-semibold uppercase tracking-wide text-white">Est. Hours</TableHead>
                      <TableHead className="w-[180px] font-semibold uppercase tracking-wide text-white">Schedule</TableHead>
                      <TableHead className="text-right w-[120px] font-semibold uppercase tracking-wide text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      No projects match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task, index) => {
                    const jobTypeMeta = getJobTypeMeta(task?.jobType)
                    const approvalMeta = getApprovalStatusMeta(task.approvalStatus)
                    const workflowMeta = getWorkflowStatusMeta(task.status)

                    return (
                      <TableRow
                        key={task.id}
                        className={cn(
                          "border-b border-slate-200 dark:border-slate-700 transition-colors",
                          index % 2 === 0 ? "bg-slate-50/80 dark:bg-slate-900/60" : "bg-white dark:bg-slate-900",
                          "hover:bg-slate-100 hover:dark:bg-slate-800"
                        )}
                      >
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-1">
                            <Link href={`/tasks/${task.id}`} className="font-semibold text-base leading-tight hover:underline">
                              {task.title ?? "Untitled Task"}
                            </Link>
                            {task.description && (
                              <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{task.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {task.taskCode || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="font-medium flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary" />
                              {task.projects?.name ? (
                                <Link href={`/projects/${task.projectId ?? task.projects.id}`} className="hover:underline">
                                  {task.projects.name}
                                </Link>
                              ) : task.projectId ? (
                                <Link href={`/projects/${task.projectId}`} className="hover:underline">
                                  Project #{task.projectId}
                                </Link>
                              ) : (
                                "No linked project"
                              )}
                            </div>
                            {task.projects?.clientCompany && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                {task.projects.clientCompany}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant="outline" className={cn("gap-1.5 border px-3 py-1 text-xs font-semibold shadow-sm", jobTypeMeta.badgeClass)}>
                            <span className={cn("w-2 h-2 rounded-full", jobTypeMeta.dotClass)} />
                            <span className="text-sm whitespace-nowrap">
                            {jobTypeMeta.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-2">
                             <Badge
                              variant="outline"
                              className={cn("gap-1.5 border px-2 py-1 text-xs font-semibold shadow-sm", approvalMeta.badgeClass)}
                            >
                              <span className={cn("w-2 h-2 rounded-full", approvalMeta.dotClass)} />
                              {approvalMeta.label}
                            </Badge>
                            {workflowMeta && (
                              <Badge
                                variant="outline"
                                className={cn("border px-2 py-1 text-xs font-semibold shadow-sm", workflowMeta.badgeClass)}
                              >
                                {workflowMeta.label}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col text-sm">
                            <span className="font-medium">{task.assignedUser?.username ?? "Unassigned"}</span>
                            {task.projects?.projectManager && (
                              <span className="text-xs text-slate-600 dark:text-slate-400">Project Manager: {task.projects.projectManager}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {task.mineral ? (
                            <Badge variant="outline" className="border px-2 py-1 text-xs font-semibold bg-stone-100 text-stone-800 border-stone-300 shadow-sm">
                              {task.mineral}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top text-sm text-slate-900 dark:text-slate-100">
                          {typeof task.estimatedHours === "number"
                            ? `${task.estimatedHours.toLocaleString()} hours`
                            : <span className="text-muted-foreground">Not estimated</span>}
                        </TableCell>
                        <TableCell className="align-top text-sm text-slate-700 dark:text-slate-300">
                          {formatDateRange(task.startDate, task.dueDate)}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTaskForEdit(task)
                                setEditTaskModalOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTaskPendingDeletion({ id: task.id, title: task.title ?? "Untitled Task" })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Link href={`/tasks/${task.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div
        className={cn(
          "grid gap-6 sm:grid-cols-2 xl:grid-cols-3",
          viewMode === "grid" ? "md:grid" : "md:hidden"
        )}
      >
          {tasks.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No tasks match the current filters
            </div>
          ) : (
            tasks.map((task) => {
              const jobTypeMeta = getJobTypeMeta(task.projects?.jobType)
              const approvalMeta = getApprovalStatusMeta(task.approvalStatus)
              const workflowMeta = getWorkflowStatusMeta(task.status)

              return (
                <Card
                  key={task.id}
                  className="border border-slate-200 shadow-md transition-shadow hover:shadow-xl dark:border-slate-700"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                      <Link href={`/tasks/${task.id}`} className="hover:underline">
                          {task.title ?? "Untitled Task"}
                        </Link>
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn("gap-1.5 border px-2 py-1 text-xs font-semibold shrink-0 shadow-sm", approvalMeta.badgeClass)}
                      >
                        <span className={cn("w-2 h-2 rounded-full", approvalMeta.dotClass)} />
                        {approvalMeta.label}
                      </Badge>
                    </div>
                    {task.description && (
                      <CardDescription className="line-clamp-2 text-slate-600 dark:text-slate-300">
                        {task.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("gap-1.5 border px-2 py-1 text-xs font-semibold shadow-sm", jobTypeMeta.badgeClass)}
                      >
                        <span className={cn("w-2 h-2 rounded-full", jobTypeMeta.dotClass)} />
                        {jobTypeMeta.label}
                      </Badge>
                      {task.mineral && (
                        <Badge variant="outline" className="border px-2 py-1 text-xs font-semibold bg-stone-100 text-stone-800 border-stone-300 shadow-sm">
                          {task.mineral}
                        </Badge>
                      )}
                      {workflowMeta && (
                        <Badge variant="outline" className={cn("border px-2 py-1 text-xs font-semibold shadow-sm", workflowMeta.badgeClass)}>
                          {workflowMeta.label}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Building2 className="h-4 w-4 text-primary" />
                        {task.projects?.name ? (
                          <Link href={`/projects/${task.projectId ?? task.projects.id}`} className="hover:underline">
                            {task.projects.name}
                          </Link>
                        ) : task.projectId ? (
                          <Link href={`/projects/${task.projectId}`} className="hover:underline">
                            Project #{task.projectId}
                          </Link>
                        ) : (
                          <span>No linked project</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{task.assignedUser?.username ?? "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateRange(task.startDate, task.dueDate)}</span>
                      </div>
                      {typeof task.estimatedHours === "number" && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs font-semibold uppercase tracking-wide">ET</span>
                          <span>{task.estimatedHours.toLocaleString()} hours</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTaskForEdit(task)
                          setEditTaskModalOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => setTaskPendingDeletion({ id: task.id, title: task.title ?? "Untitled Task" })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>

                    <Link href={`/tasks/${task.id}`} className="block">
                      <Button variant="ghost" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })
          )}
      </div>

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
   

      {editDialogProject && (
        <EditProjectDialogMUI
          key={editDialogProject.id}
          project={editDialogProject}
          open={!!editDialogProject}
          onClose={() => setEditDialogProject(null)}
          onSuccess={() => {
            setEditDialogProject(null)
            handleSaveTask()
          }}
        />
      )} 

      {taskPendingDeletion && (
        <DeleteProjectDialog
          projectName={taskPendingDeletion.title}
          open={!!taskPendingDeletion}
          onOpenChange={(open) => !open && setTaskPendingDeletion(null)}
          onConfirm={handleDeleteTask}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskDialogMUI
        open={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        onSuccess={() => {
          // Refetch tasks or update state
          window.location.reload() // Temporary solution, better to use RTK Query invalidation
        }}
      />

      {/* Edit Task Modal */}
      {selectedTaskForEdit && (
        <EditTaskDialogMUI
          open={editTaskModalOpen}
          task={selectedTaskForEdit}
          onClose={() => {
            setEditTaskModalOpen(false)
            setSelectedTaskForEdit(null)
          }}
          onSuccess={() => {
            // Refetch tasks or update state
            window.location.reload() // Temporary solution, better to use RTK Query invalidation
          }}
        />
      )}
    </div>
  )
}

export default TableView
