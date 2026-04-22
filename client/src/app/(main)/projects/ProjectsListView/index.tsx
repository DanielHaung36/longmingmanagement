"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useGetProjectsQuery } from "@/state/api"
import type { Project } from "@/state/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditProjectDialogMUI } from "@/components/Dialog/edit-project-dialog-mui"
import { PaginationMUI } from "@/components/ui/pagination-mui"
import { cn } from "@/lib/utils"
import {
  Search,
  LayoutGrid,
  LayoutList,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderKanban,
  ExternalLink,
  Edit,
} from "lucide-react"

// ==================== Type Definitions ====================
type ViewMode = "grid" | "list" | "table"

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
  PLANNING: { label: "Planning", color: "bg-blue-100 text-blue-800 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ON_HOLD: { label: "On Hold", color: "bg-amber-100 text-amber-800 border-amber-200" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-800 border-gray-200" },
} as const

const APPROVAL_META = {
  DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-800 border-rose-200" },
} as const

// ==================== Utility Functions ====================
const formatDate = (date?: Date | string | null) => {
  if (!date) return "Not set"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const getProjectStats = (project: Project) => {
  const tasks = project.tasks || []
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "DONE").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
  }
}

// ==================== Main Component ====================
export default function ProjectsListView({ initialFilter }: { initialFilter?: string | null }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  const [filterJobType, setFilterJobType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>("all")
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  // 📌 开发模式：当前用户ID固定为11（管理员）
  // TODO: 实际应用中应从登录状态获取
  const currentUserId = 11

  // 🔧 监听 URL 参数变化，更新过滤状态
  useEffect(() => {
    if (initialFilter === "draft") {
      setFilterApprovalStatus("DRAFT")
    } else if (initialFilter === "pending") {
      setFilterApprovalStatus("PENDING")
    } else if (initialFilter === "my") {
      setFilterApprovalStatus("all")
    } else {
      setFilterApprovalStatus("all")
    }
    setCurrentPage(1) // 重置到第一页
  }, [initialFilter])

  // 📡 构建API查询参数
  const apiParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      pageSize,
    }

    // filter=my: 显示我的项目（不分审批状态）
    if (initialFilter === "my") {
      params.ownerId = currentUserId
    }
    // filter=draft: 显示草稿项目
    else if (initialFilter === "draft") {
      params.approvalStatus = "DRAFT"
    }
    // filter=pending: 显示待审批项目
    else if (initialFilter === "pending") {
      params.approvalStatus = "PENDING"
    }

    return params
  }, [currentPage, pageSize, initialFilter, currentUserId])

  const { data: projectsResponse, isLoading, error, refetch } = useGetProjectsQuery(apiParams)

  const projects = projectsResponse?.data?.projects || []
  const pagination = projectsResponse?.data?.pagination

  const filteredProjects = useMemo(() => {
    let result = [...projects]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.projectCode?.toLowerCase().includes(query) ||
          p.clientCompany?.toLowerCase().includes(query) ||
          p.mineSiteName?.toLowerCase().includes(query)
      )
    }

    // if (filterJobType !== "all") result = result.filter((p) => p.jobType === filterJobType)
    if (filterStatus !== "all") result = result.filter((p) => p.status === filterStatus)
    if (filterApprovalStatus !== "all") result = result.filter((p) => p.approvalStatus === filterApprovalStatus)

    return result
  }, [projects, searchQuery, filterJobType, filterStatus, filterApprovalStatus])

  const stats = useMemo(() => {
    const totalCount = pagination?.total || projects.length
    return {
      total: totalCount,
      inProgress: projects.filter((p) => p.status === "IN_PROGRESS").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      planning: projects.filter((p) => p.status === "PLANNING" || p.status === "ON_HOLD").length,
    }
  }, [projects, pagination])

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
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
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Minesites</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-full bg-slate-100 p-3">
                  <FolderKanban className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-50">In Progress</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.inProgress}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-50">Completed</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.completed}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-50">Planning</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.planning}</p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <Clock className="h-6 w-6" />
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
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* <div className="space-y-2">
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
              </div> */}

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
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="h-4 w-4 mr-1.5" />
                  List
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="h-4 w-4 mr-1.5" />
                  Table
                </Button>
              </div>

              <p className="text-sm text-slate-600">
                {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="py-16 text-center">
              <FolderKanban className="mx-auto h-16 w-16 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
              <p className="mt-2 text-sm text-slate-500">Try adjusting your filters or create a new project</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <ProjectTable projects={filteredProjects} onEdit={setEditingProject} />
        )}

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
      </div>

      {/* Edit Project Dialog */}
      {editingProject && (
        <EditProjectDialogMUI
          open={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null)
            refetch()
          }}
          project={editingProject}
        />
      )}
    </div>
  )
}

// ==================== Project Card (Grid View) ====================
function ProjectCard({ project }: { project: Project }) {
  // jobType 已删除 - jobType 只在 task 级别定义
  const status = STATUS_META[project.status] || STATUS_META.PLANNING
  const approval = APPROVAL_META[project.approvalStatus as keyof typeof APPROVAL_META] || APPROVAL_META.DRAFT
  const stats = getProjectStats(project)

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group h-full border-0 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="line-clamp-1 text-lg font-semibold group-hover:text-blue-600">
                {project.name}
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                {project.clientCompany && project.mineSiteName
                  ? `${project.clientCompany} • ${project.mineSiteName}`
                  : project.clientCompany || project.mineSiteName || "No location info"}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {project.description && (
            <CardDescription className="line-clamp-2 text-sm">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {/* jobType Badge 已删除 - jobType 只在 task 级别定义 */}
            <Badge variant="outline" className={cn("text-xs", status.color)}>
              {status.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", approval.color)}>
              {approval.label}
            </Badge>
          </div>

          {project.clientCompany && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="truncate">{project.clientCompany}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Progress</span>
              <span className="font-semibold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>

          <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900">
            <span className="text-slate-600">Projects</span>
            <span>
              <span className="font-semibold text-emerald-600">{stats.completed}</span>
              <span className="text-slate-400"> / {stats.total}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ==================== Project List Item ====================
function ProjectListItem({ project }: { project: Project }) {
  // jobType 已删除 - jobType 只在 task 级别定义
  const status = STATUS_META[project.status] || STATUS_META.PLANNING
  const stats = getProjectStats(project)

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group border-0 bg-white shadow-sm transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold group-hover:text-blue-600">
                  {project.name}
                </h3>
                {/* jobType Badge 已删除 - jobType 只在 task 级别定义 */}
                <Badge variant="outline" className={cn("text-xs shrink-0", status.color)}>
                  {status.label}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                {project.clientCompany && project.mineSiteName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {project.clientCompany} • {project.mineSiteName}
                  </span>
                )}
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <p className="text-xs text-slate-600">Progress</p>
                <p className="text-lg font-semibold">{project.progress}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600">Tasks</p>
                <p className="text-lg font-semibold">
                  <span className="text-emerald-600">{stats.completed}</span>
                  <span className="text-slate-400">/{stats.total}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// ==================== Project Table ====================
function ProjectTable({ projects, onEdit }: { projects: Project[]; onEdit: (project: Project) => void }) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900">
            <TableHead className="font-semibold">Project</TableHead>
            {/* Type 列已删除 - jobType 只在 task 级别定义 */}
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Client</TableHead>
            <TableHead className="font-semibold">Progress</TableHead>
            <TableHead className="font-semibold">Tasks</TableHead>
            <TableHead className="font-semibold">Updated</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            // jobType 已删除 - jobType 只在 task 级别定义
            const status = STATUS_META[project.status] || STATUS_META.PLANNING
            const stats = getProjectStats(project)

            return (
              <TableRow key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <TableCell>
                  <Link href={`/projects/${project.id}`} className="hover:underline">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-slate-500">
                      {project.clientCompany && project.mineSiteName
                        ? `${project.clientCompany} • ${project.mineSiteName}`
                        : project.clientCompany || project.mineSiteName || "No location"}
                    </div>
                  </Link>
                </TableCell>
                {/* jobType TableCell 已删除 - jobType 只在 task 级别定义 */}
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{project.clientCompany || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-1.5 w-20" />
                    <span className="text-xs font-medium">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="text-emerald-600 font-medium">{stats.completed}</span>
                  <span className="text-slate-400"> / {stats.total}</span>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {formatDate(project.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        onEdit(project)
                      }}
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
