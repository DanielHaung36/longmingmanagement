"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
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
import { cn } from "@/lib/utils"
import {
  Search,
  LayoutGrid,
  LayoutList,
  Plus,
  Building2,
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderKanban,
  ArrowUpDown,
  Edit,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react"

// ==================== Type Definitions ====================
type ViewMode = "grid" | "list" | "table"
type SortField = "name" | "createdAt" | "updatedAt" | "progress"
type SortOrder = "asc" | "desc"

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
export default function ProjectsListPage() {
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter') // 'my', 'draft', 'pending'

  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)

  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>("all")
  const [filterClient, setFilterClient] = useState<string>("all")
  const [filterMineSite, setFilterMineSite] = useState<string>("all")

  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // 当前登录用户ID（开发环境默认为11）
  const currentUserId = 11

  const { data: projectsResponse, isLoading, error, refetch } = useGetProjectsQuery({
    page: currentPage,
    pageSize,
  })

  const projects = projectsResponse?.data?.projects || []
  const pagination = projectsResponse?.data?.pagination

  // 提取唯一的 clients 和 mine sites
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.clientCompany).filter(Boolean))).sort()
  }, [projects])

  const filteredMineSites = useMemo(() => {
    if (filterClient === "all") {
      return Array.from(new Set(projects.map(p => p.mineSiteName).filter(Boolean))).sort()
    }
    return Array.from(
      new Set(
        projects
          .filter(p => p.clientCompany === filterClient)
          .map(p => p.mineSiteName)
          .filter(Boolean)
      )
    ).sort()
  }, [projects, filterClient])

  // 当 client 改变时，重置 minesite 筛选
  useEffect(() => {
    if (filterClient === "all") {
      setFilterMineSite("all")
    } else {
      const currentMineSiteStillValid = filteredMineSites.includes(filterMineSite)
      if (!currentMineSiteStillValid && filterMineSite !== "all") {
        setFilterMineSite("all")
      }
    }
  }, [filterClient, filteredMineSites, filterMineSite])

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    // 根据URL参数过滤
    if (filterParam === 'my') {
      // My Projects - 显示当前用户负责的项目
      result = result.filter((p) => p.ownerId === currentUserId)
    } else if (filterParam === 'draft') {
      // All Drafts - 显示所有草稿项目
      result = result.filter((p) => p.approvalStatus === 'DRAFT')
    } else if (filterParam === 'pending') {
      // Pending Approval - 显示待审批项目
      result = result.filter((p) => p.approvalStatus === 'PENDING')
    }

    // 搜索过滤
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

    // 其他过滤器
    if (filterStatus !== "all") result = result.filter((p) => p.status === filterStatus)
    if (filterApprovalStatus !== "all") result = result.filter((p) => p.approvalStatus === filterApprovalStatus)
    if (filterClient !== "all") result = result.filter((p) => p.clientCompany === filterClient)
    if (filterMineSite !== "all") result = result.filter((p) => p.mineSiteName === filterMineSite)

    result.sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (sortField === "createdAt" || sortField === "updatedAt") {
        aVal = new Date(aVal || 0).getTime()
        bVal = new Date(bVal || 0).getTime()
      } else if (sortField === "progress") {
        aVal = a.progress || 0
        bVal = b.progress || 0
      } else {
        aVal = String(aVal || "").toLowerCase()
        bVal = String(bVal || "").toLowerCase()
      }

      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [projects, searchQuery, filterStatus, filterApprovalStatus, filterClient, filterMineSite, sortField, sortOrder, filterParam, currentUserId])

  const stats = useMemo(() => {
    return {
      total: projects.length,
      inProgress: projects.filter((p) => p.status === "IN_PROGRESS").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      planning: projects.filter((p) => p.status === "PLANNING" || p.status === "ON_HOLD").length,
    }
  }, [projects])

  // 动态标题和描述
  const pageTitle = useMemo(() => {
    switch (filterParam) {
      case 'my':
        return 'My Minesites'
      case 'draft':
        return 'Draft Minesites'
      case 'pending':
        return 'Pending Approval'
      default:
        return 'All Minesites'
    }
  }, [filterParam])

  const pageDescription = useMemo(() => {
    switch (filterParam) {
      case 'my':
        return 'Minesites you are responsible for'
      case 'draft':
        return 'Minesites in draft status waiting to be submitted'
      case 'pending':
        return 'Projects awaiting approval from administrators'
      default:
        return 'Manage and track all your mining projects'
    }
  }, [filterParam])

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
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
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {pageTitle}
              {filterParam && (
                <Badge variant="outline" className="text-xs font-normal">
                  {filteredAndSortedProjects.length}
                </Badge>
              )}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {pageDescription}
            </p>
          </div>

          <Link href="/projects/new">
            <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-all hover:scale-105">
              <Plus className="mr-2 h-4 w-4" />
              New Minesite
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Projects</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{stats.total}</p>
                </div>
                <FolderKanban className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">In Progress</p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.inProgress}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
                  <p className="mt-2 text-3xl font-semibold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Planning</p>
                  <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.planning}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            {filterParam && (
              <Link href="/projects">
                <Button variant="outline" size="sm" className="text-xs transition-all hover:scale-105">
                  <X className="mr-1 h-3 w-3" />
                  Clear Filter
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* First Row: Search + Basic Filters */}
            <div className="grid gap-4 md:grid-cols-3">
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

            {/* Second Row: Client & Mine Site Filters */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client" className="text-sm">Client Company</Label>
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {uniqueClients.map((client) => (
                      <SelectItem key={client} value={client}>{client}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mineSite" className="text-sm">
                  Mine Site
                  {filterClient !== "all" && (
                    <span className="ml-2 text-xs text-blue-600">
                      (filtered by {filterClient})
                    </span>
                  )}
                </Label>
                <Select
                  value={filterMineSite}
                  onValueChange={setFilterMineSite}
                  disabled={filteredMineSites.length === 0}
                >
                  <SelectTrigger id="mineSite">
                    <SelectValue placeholder={filteredMineSites.length === 0 ? "No sites available" : "All mine sites"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Mine Sites</SelectItem>
                    {filteredMineSites.map((site) => (
                      <SelectItem key={site} value={site}>{site}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-slate-600">
                {filteredAndSortedProjects.length} {filteredAndSortedProjects.length === 1 ? "project" : "projects"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        {filteredAndSortedProjects.length === 0 ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="py-16 text-center">
              <FolderKanban className="mx-auto h-16 w-16 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
              <p className="mt-2 text-sm text-slate-500">Try adjusting your filters or create a new project</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-3">
            {filteredAndSortedProjects.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <ProjectTable projects={filteredAndSortedProjects} />
        )}
      </div>
    </div>
  )
}

// ==================== Project Card (Grid View) ====================
function ProjectCard({ project }: { project: Project }) {
  const status = STATUS_META[project.status] || STATUS_META.PLANNING
  const approval = APPROVAL_META[project.approvalStatus as keyof typeof APPROVAL_META] || APPROVAL_META.DRAFT
  const stats = getProjectStats(project)

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group h-full border-slate-200 transition-all hover:border-slate-400 hover:shadow-lg dark:border-slate-800 dark:hover:border-slate-600">
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
            <span className="text-slate-600">Tasks</span>
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
  const status = STATUS_META[project.status] || STATUS_META.PLANNING
  const approval = APPROVAL_META[project.approvalStatus as keyof typeof APPROVAL_META] || APPROVAL_META.DRAFT
  const stats = getProjectStats(project)

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group border-slate-200 transition-all hover:border-slate-400 hover:shadow-md dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold group-hover:text-blue-600">
                  {project.name}
                </h3>
                <Badge variant="outline" className={cn("text-xs shrink-0", status.color)}>
                  {status.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs shrink-0", approval.color)}>
                  {approval.label}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                {project.clientCompany && project.mineSiteName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {project.clientCompany} • {project.mineSiteName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  Updated {formatDate(project.updatedAt)}
                </span>
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
function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900">
            <TableHead className="font-semibold">Mine Site</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Approval</TableHead>
            <TableHead className="font-semibold">Client</TableHead>
            <TableHead className="font-semibold">Progress</TableHead>
            <TableHead className="font-semibold">Tasks</TableHead>
            <TableHead className="font-semibold">Updated</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const status = STATUS_META[project.status] || STATUS_META.PLANNING
            const approval = APPROVAL_META[project.approvalStatus as keyof typeof APPROVAL_META] || APPROVAL_META.DRAFT
            const stats = getProjectStats(project)

            return (
              <TableRow key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <TableCell>
                  <Link href={`/projects/${project.id}`} className="hover:underline">
                    <div className="font-medium">{project.mineSiteName || project.name}</div>
                    <div className="text-xs text-slate-500">
                      {project.projectCode}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs", approval.color)}>
                    {approval.label}
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
                    <Link href={`/projects/${project.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
