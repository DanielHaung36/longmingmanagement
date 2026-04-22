"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useGetProjectsQuery, useGetAllTasksQuery } from "@/state/api"
import type { Project, Task } from "@/state/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PaginationMUI } from "@/components/ui/pagination-mui"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListChecks,
  ExternalLink,
  Edit,
  Building2,
  TrendingUp,
  User as UserIcon,
  Search,
  X,
} from "lucide-react"
import { useAppSelector } from "@/redux"
import { selectCurrentUser } from "@/state/authSlice"

// ==================== Configuration ====================
const JOB_TYPE_META = {
  AC: { label: "Consulting", color: "bg-sky-500/10 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  AP: { label: "Production", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  AQ: { label: "Quote", color: "bg-teal-500/10 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  AS: { label: "Sales", color: "bg-slate-500/10 text-slate-700 border-slate-200", dot: "bg-slate-500" },
  AT: { label: "Testwork", color: "bg-amber-500/10 text-amber-700 border-amber-200", dot: "bg-amber-500" },
} as const

const PROJECT_STATUS_META = {
  PLANNING: { label: "Planning", color: "bg-blue-100 text-blue-800 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ON_HOLD: { label: "On Hold", color: "bg-amber-100 text-amber-800 border-amber-200" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-800 border-gray-200" },
} as const

const TASK_STATUS_META = {
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

const getProjectStats = (project: Project) => {
  const tasks = project.tasks || []
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "DONE").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
  }
}

// ==================== Main Component ====================
export default function MyWorkPage() {
  const currentUser = useAppSelector(selectCurrentUser)
  const currentUserId = currentUser?.id ?? null
  const isAdminRole = currentUser?.role === "ADMIN"
  const isManagerRole = currentUser?.role === "MANAGER"
  const isAdminOrManager = isAdminRole || isManagerRole
  const [projectsPage, setProjectsPage] = useState(1)
  const [tasksPage, setTasksPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  // Search and filter states
  const [projectSearchQuery, setProjectSearchQuery] = useState("")
  const [taskSearchQuery, setTaskSearchQuery] = useState("")
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("all")
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all")
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>("all")

  // Client-side pagination
  const [projectsPerPage, setProjectsPerPage] = useState(12)
  const [tasksPerPage, setTasksPerPage] = useState(12)
  const [currentProjectsPage, setCurrentProjectsPage] = useState(1)
  const [currentTasksPage, setCurrentTasksPage] = useState(1)

  // ✅ 获取所有项目（不使用 ownerId 过滤）- 然后在客户端过滤相关项目
  const { data: projectsResponse, isLoading: projectsLoading, error: projectsError } = useGetProjectsQuery({
    page: projectsPage,
    pageSize,
    // 不使用 ownerId 过滤，获取所有项目
  })
  let assignedUserId:number|null = 0
  if (!isAdminOrManager){
    assignedUserId = currentUserId
  }
  const { data: tasksResponse, isLoading: tasksLoading, error: tasksError } = useGetAllTasksQuery({
    page: tasksPage,
    limit: pageSize,
    assignedUserId:assignedUserId,
  })

  const allProjects = projectsResponse?.data?.projects || []
  const projectsPagination = projectsResponse?.data?.pagination
  const allTasks = tasksResponse?.data || []
  const pagination = tasksResponse?.pagination
  console.log(tasksResponse);
  
  // ✅ 过滤与当前用户相关的所有项目（owner、author、team member）+ 搜索和筛选
  const myProjects = useMemo(() => {
    let result = allProjects

    // Admin 和 Manager 可以看到所有项目
    if (!isAdminOrManager) {
      if (!currentUserId) {
        return []
      }
      result = result.filter((p) => {
        const isOwner = p.ownerId === currentUserId
        const isTeamMember = p.projectMembers?.some((member: any) => member.userId === currentUserId)
        return isOwner || isTeamMember
      })
    }

    // 搜索过滤
    if (projectSearchQuery) {
      const query = projectSearchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.projectCode?.toLowerCase().includes(query) ||
          p.clientCompany?.toLowerCase().includes(query) ||
          p.mineSiteName?.toLowerCase().includes(query)
      )
    }

    // 状态过滤
    if (projectStatusFilter !== "all") {
      result = result.filter((p) => p.status === projectStatusFilter)
    }

    return result
  }, [allProjects, currentUserId, isAdminOrManager, projectSearchQuery, projectStatusFilter])

  // ✅ 过滤草稿项目（未提交审批的项目）
  const draftProjects = useMemo(() => {
    return myProjects.filter((p) => p.approvalStatus === "DRAFT")
  }, [myProjects])

  // ✅ 过滤待审批项目（已提交但未批准的项目）
  const pendingProjects = useMemo(() => {
    return myProjects.filter((p) => p.approvalStatus === "PENDING")
  }, [myProjects])

  // Filter my tasks (where I'm assigned) + 搜索和筛选
  const myTasks = useMemo(() => {
    let result = allTasks

    // Admin 和 Manager 可以看到所有任务
    if (!isAdminOrManager) {
      if (!currentUserId) {
        return []
      }
      result = result.filter((t) => t.assignedUserId === currentUserId)
    }

    // 搜索过滤
    if (taskSearchQuery) {
      const query = taskSearchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(query) ||
          t.taskCode?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.projects?.mineSiteName?.toLowerCase().includes(query) ||
          t.projects?.clientCompany?.toLowerCase().includes(query)
      )
    }

    // 状态过滤
    if (taskStatusFilter !== "all") {
      result = result.filter((t) => t.status === taskStatusFilter)
    }

    // 优先级过滤
    if (taskPriorityFilter !== "all") {
      result = result.filter((t) => t.priority === taskPriorityFilter)
    }

    return result
  }, [allTasks, currentUserId, isAdminOrManager, taskSearchQuery, taskStatusFilter, taskPriorityFilter])

  // ✅ 过滤待审批任务（所有PENDING状态的任务）
  const pendingTasks = useMemo(() => {
    return allTasks.filter((t) => t.approvalStatus === "PENDING")
  }, [allTasks])

  const projectStats = useMemo(() => {
    return {
      total: myProjects.length,
      inProgress: myProjects.filter((p) => p.status === "IN_PROGRESS").length,
      completed: myProjects.filter((p) => p.status === "COMPLETED").length,
      planning: myProjects.filter((p) => p.status === "PLANNING" || p.status === "ON_HOLD").length,
    }
  }, [myProjects])

  const taskStats = useMemo(() => {
    return {
      total: myTasks.length,
      todo: myTasks.filter((t) => t.status === "TODO").length,
      inProgress: myTasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: myTasks.filter((t) => t.status === "DONE").length,
    }
  }, [myTasks])

  // Client-side pagination for projects
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentProjectsPage - 1) * projectsPerPage
    const endIndex = startIndex + projectsPerPage
    return myProjects.slice(startIndex, endIndex)
  }, [myProjects, currentProjectsPage, projectsPerPage])

  const projectsTotalPages = Math.ceil(myProjects.length / projectsPerPage)
  const projectsStartItem = myProjects.length > 0 ? (currentProjectsPage - 1) * projectsPerPage + 1 : 0
  const projectsEndItem = Math.min(currentProjectsPage * projectsPerPage, myProjects.length)

  // Client-side pagination for tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentTasksPage - 1) * tasksPerPage
    const endIndex = startIndex + tasksPerPage
    return myTasks.slice(startIndex, endIndex)
  }, [myTasks, currentTasksPage, tasksPerPage])

  const tasksTotalPages = Math.ceil(myTasks.length / tasksPerPage)
  const tasksStartItem = myTasks.length > 0 ? (currentTasksPage - 1) * tasksPerPage + 1 : 0
  const tasksEndItem = Math.min(currentTasksPage * tasksPerPage, myTasks.length)

  if (projectsLoading || tasksLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-8">
      <div className="  space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserIcon className="h-6 w-6" />
            My Work
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Projects assigned to you
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              My Projects
              {/* <Badge variant="secondary" className="ml-1">{myTasks.length}</Badge> */}
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              My Mine Sites
              {/* <Badge variant="secondary" className="ml-1">{myProjects.length}</Badge> */}
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            {/* Filters Card */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Filters</CardTitle>
                {(projectSearchQuery || projectStatusFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs transition-all hover:scale-105"
                    onClick={() => {
                      setProjectSearchQuery("")
                      setProjectStatusFilter("all")
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="project-search" className="text-sm">Search Projects</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="project-search"
                        placeholder="Search by name, code, client..."
                        value={projectSearchQuery}
                        onChange={(e) => setProjectSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-status" className="text-sm">Status</Label>
                    <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
                      <SelectTrigger id="project-status">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.entries(PROJECT_STATUS_META).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-slate-600">
                    {myProjects.length} {myProjects.length === 1 ? "project" : "projects"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alert Cards Container */}
            <div className="space-y-4">
              {/* Draft Projects Alert - 草稿项目（未提交审批）*/}
              {draftProjects.length > 0 && (
                <Card className="border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      <div className="flex items-center gap-3 md:block">
                        <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-amber-600 flex-shrink-0" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-amber-900">
                            ⚠️ {draftProjects.length} Draft Project{draftProjects.length > 1 ? 's' : ''} - Not Submitted
                          </h4>
                          <p className="text-sm md:text-base text-amber-800 mt-1 font-medium">
                            These projects haven't been submitted for approval yet. Click to submit them.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {draftProjects.slice(0, 3).map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`} className="block">
                              <Button
                                variant="default"
                                size="lg"
                                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all text-left justify-start"
                              >
                                <ExternalLink className="mr-2 h-5 w-5 flex-shrink-0" />
                                <span className="truncate">{project.mineSiteName || project.name}</span>
                              </Button>
                            </Link>
                          ))}
                          {draftProjects.length > 3 && (
                            <p className="text-sm md:text-base text-amber-800 font-semibold text-center py-2">
                              + {draftProjects.length - 3} more draft project{draftProjects.length - 3 > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pending Projects Alert - 待审批项目（已提交，等待批准）*/}
              {pendingProjects.length > 0 && (
                <Card className="border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      <div className="flex items-center gap-3 md:block">
                        <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-blue-900">
                            ⏳ {pendingProjects.length} Project{pendingProjects.length > 1 ? 's' : ''} Pending Approval
                          </h4>
                          <p className="text-sm md:text-base text-blue-800 mt-1 font-medium">
                            These projects are waiting for administrator approval.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {pendingProjects.slice(0, 3).map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`} className="block">
                              <Button
                                variant="default"
                                size="lg"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all text-left justify-start"
                              >
                                <ExternalLink className="mr-2 h-5 w-5 flex-shrink-0" />
                                <span className="truncate">{project.mineSiteName || project.name}</span>
                              </Button>
                            </Link>
                          ))}
                          {pendingProjects.length > 3 && (
                            <p className="text-sm md:text-base text-blue-800 font-semibold text-center py-2">
                              + {pendingProjects.length - 3} more pending project{pendingProjects.length - 3 > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 grid-cols-2 md:gap-4 md:grid-cols-4">
              <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-slate-600">Total</p>
                      <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold text-slate-900">{projectsPagination?.total}</p>
                    </div>
                    <div className="rounded-full bg-slate-100 p-2 md:p-3 self-start md:self-center">
                      <FolderKanban className="h-4 w-4 md:h-6 md:w-6 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-emerald-50">In Progress</p>
                      <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold">{projectStats.inProgress}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2 md:p-3 self-start md:self-center">
                      <TrendingUp className="h-4 w-4 md:h-6 md:w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-green-50">Completed</p>
                      <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold">{projectStats.completed}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2 md:p-3 self-start md:self-center">
                      <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-amber-50">Planning</p>
                      <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold">{projectStats.planning}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2 md:p-3 self-start md:self-center">
                      <Clock className="h-4 w-4 md:h-6 md:w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projects List */}
            {myProjects.length === 0 ? (
              <Card className="border-dashed border-slate-300">
                <CardContent className="py-16 text-center">
                  <FolderKanban className="mx-auto h-16 w-16 text-slate-300" />
                  <h3 className="mt-4 text-lg font-semibold">No projects assigned</h3>
                  <p className="mt-2 text-sm text-slate-500">You don't have any projects assigned to you yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <MyProjectsTable projects={myProjects} />
                    {projectsPagination && (
                             <PaginationMUI
                               currentPage={projectsPagination.page}
                               totalPages={projectsPagination.totalPages}
                               onPageChange={setTasksPage}
                               onPageSizeChange={(newSize) => {
                                 setPageSize(newSize)
                                 setCurrentPage(1)
                               }}
                               totalItems={projectsPagination.total}
                               pageSize={projectsPagination.pageSize}
                             />
                           )}
                {/* {projectsPagination && projectsPagination.totalPages > 1 && (
                  <Card className="border-slate-200 dark:border-slate-800 mt-4">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Page {projectsPagination.page}</span> of{" "}
                          <span className="font-medium">{projectsPagination.totalPages}</span>
                          {projectsPagination.total && (
                            <span className="ml-2 text-slate-500">
                              ({projectsPagination?.total} total projects)
                            </span>
                          )}
                        </div>

                      

                       <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProjectsPage(1)}
                            disabled={projectsPage === 1}
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProjectsPage((p) => Math.max(1, p - 1))}
                            disabled={projectsPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProjectsPage((p) => Math.min(projectsPagination.totalPages, p + 1))}
                            disabled={projectsPage === projectsPagination.totalPages}
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProjectsPage(projectsPagination.totalPages)}
                            disabled={projectsPage === projectsPagination.totalPages}
                          >
                            Last
                          </Button>
                        </div> 


                      </div>
                    </CardContent>
                  </Card>
                )} */}
              </>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Filters Card for Tasks */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Filters</CardTitle>
                {(taskSearchQuery || taskStatusFilter !== "all" || taskPriorityFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs transition-all hover:scale-105"
                    onClick={() => {
                      setTaskSearchQuery("")
                      setTaskStatusFilter("all")
                      setTaskPriorityFilter("all")
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="task-search" className="text-sm">Search Minesite</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="task-search"
                        placeholder="Search by title, code, site..."
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-status" className="text-sm">Status</Label>
                    <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                      <SelectTrigger id="task-status">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.entries(TASK_STATUS_META).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-priority" className="text-sm">Priority</Label>
                    <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                      <SelectTrigger id="task-priority">
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
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-slate-600">
                    {myTasks.length} {myTasks.length === 1 ? "task" : "tasks"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alert Cards Container for Tasks */}
            <div className="space-y-4">
              {/* Pending Tasks Alert - 待审批任务 */}
              {pendingTasks.length > 0 && (
                <Card className="border-2 border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      <div className="flex items-center gap-3 md:block">
                        <Clock className="h-6 w-6 md:h-8 md:w-8 text-purple-600 flex-shrink-0" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-purple-900">
                            ⏳ {pendingTasks.length} Task{pendingTasks.length > 1 ? 's' : ''} Pending Approval
                          </h4>
                          <p className="text-sm md:text-base text-purple-800 mt-1 font-medium">
                            These tasks are waiting for administrator approval.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {pendingTasks.slice(0, 3).map((task) => (
                            <Link key={task.id} href={`/tasks/${task.id}`} className="block">
                              <Button
                                variant="default"
                                size="lg"
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-md hover:shadow-lg transition-all text-left justify-start"
                              >
                                <ExternalLink className="mr-2 h-5 w-5 flex-shrink-0" />
                                <span className="truncate">{task.taskCode} - {task.title}</span>
                              </Button>
                            </Link>
                          ))}
                          {pendingTasks.length > 3 && (
                            <p className="text-sm md:text-base text-purple-800 font-semibold text-center py-2">
                              + {pendingTasks.length - 3} more pending task{pendingTasks.length - 3 > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 grid-cols-2 md:gap-4 md:grid-cols-4">
              <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-slate-600">Total Projects</p>
                      <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold text-slate-900">{pagination?.total}</p>
                    </div>
                    <div className="rounded-full bg-slate-100 p-2 md:p-3 self-start md:self-center">
                      <ListChecks className="h-4 w-4 md:h-6 md:w-6 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-gray-500 to-slate-600 text-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-gray-50">To Do</p>
                      <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold">{taskStats.todo}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2 md:p-3 self-start md:self-center">
                      <Clock className="h-4 w-4 md:h-6 md:w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-blue-50">In Progress</p>
                      <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold">{taskStats.inProgress}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2 md:p-3 self-start md:self-center">
                      <AlertCircle className="h-4 w-4 md:h-6 md:w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium text-green-50">Done</p>
                      <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-semibold">{taskStats.done}</p>
                    </div>
                    <div className="rounded-full bg-white/20 p-2 md:p-3 self-start md:self-center">
                      <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Tasks Cards */}
            {myTasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent & Urgent Tasks
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myTasks
                    .filter(t => t.status !== 'DONE')
                    .sort((a, b) => {
                      // 优先级排序：URGENT > HIGH > MEDIUM > LOW
                      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
                             (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
                    })
                    .slice(0, 6)
                    .map((task) => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <Card className="border-2 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer h-full">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono text-xs",
                                  task.priority === 'URGENT' && "border-red-300 bg-red-50 text-red-700"
                                )}
                              >
                                {task.taskCode}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  task.priority === 'URGENT' && "border-red-500 bg-red-100 text-red-700",
                                  task.priority === 'HIGH' && "border-orange-500 bg-orange-100 text-orange-700",
                                  task.priority === 'MEDIUM' && "border-blue-500 bg-blue-100 text-blue-700",
                                  task.priority === 'LOW' && "border-slate-400 bg-slate-100 text-slate-700"
                                )}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            <h4 className="font-semibold mb-2 line-clamp-2">{task.title}</h4>
                            {task.projects && (
                              <div className="text-sm text-slate-600 mb-2">
                                <div className="font-medium">{task.projects.mineSiteName}</div>
                                <div className="text-xs text-slate-500">{task.projects.clientCompany}</div>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                              <Badge variant="outline" className={cn("text-xs", TASK_STATUS_META[task.status as keyof typeof TASK_STATUS_META]?.color)}>
                                {TASK_STATUS_META[task.status as keyof typeof TASK_STATUS_META]?.label}
                              </Badge>
                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Tasks List */}
            {myTasks.length === 0 ? (
              <Card className="border-dashed border-slate-300">
                <CardContent className="py-16 text-center">
                  <ListChecks className="mx-auto h-16 w-16 text-slate-300" />
                  <h3 className="mt-4 text-lg font-semibold">No tasks assigned</h3>
                  <p className="mt-2 text-sm text-slate-500">You don't have any tasks assigned to you yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    All Projects
                  </h3>
                </div>
                <MyTasksTable tasks={myTasks} />
                {/* {tasksPagination && tasksPagination.totalPages > 1 && (
                  <Card className="border-slate-200 dark:border-slate-800 mt-4">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-600">
                          <span className="font-medium">Page {tasksPagination.page}</span> of{" "}
                          <span className="font-medium">{tasksPagination.totalPages}</span>
                          {tasksPagination.total && (
                            <span className="ml-2 text-slate-500">
                              ({tasksPagination.total} total tasks)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTasksPage(1)}
                            disabled={tasksPage === 1}
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTasksPage((p) => Math.max(1, p - 1))}
                            disabled={tasksPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTasksPage((p) => Math.min(tasksPagination.totalPages, p + 1))}
                            disabled={tasksPage === tasksPagination.totalPages}
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTasksPage(tasksPagination.totalPages)}
                            disabled={tasksPage === tasksPagination.totalPages}
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )} */}

                     {pagination && (
                             <PaginationMUI
                               currentPage={pagination.page}
                               totalPages={pagination.totalPages}
                               onPageChange={setTasksPage}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ==================== My Projects Table ====================
function MyProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900">
            <TableHead className="font-semibold">Mine Site</TableHead>
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
            const status = PROJECT_STATUS_META[project.status] || PROJECT_STATUS_META.PLANNING
            const stats = getProjectStats(project)

            return (
              <TableRow key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <TableCell>
                  <Link href={`/projects/${project.id}`} className="hover:underline">
                    <div className="font-medium">{project.mineSiteName || project.name}</div>
                    <div className="text-xs text-slate-500">
                      {project.clientCompany || "No client"}
                    </div>
                  </Link>
                </TableCell>
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

// ==================== My Tasks Table ====================
function MyTasksTable({ tasks }: { tasks: Task[] }) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900">
              <TableHead className="font-semibold whitespace-nowrap w-[100px]">Code</TableHead>
              <TableHead className="font-semibold min-w-[250px]">Task Details</TableHead>
              <TableHead className="font-semibold min-w-[150px]">Mine Site</TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[120px]">Status</TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[100px]">Priority</TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[120px]">Progress</TableHead>
              <TableHead className="font-semibold whitespace-nowrap w-[120px]">Due Date</TableHead>
              <TableHead className="text-right font-semibold whitespace-nowrap w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const jobType = task.jobType ? JOB_TYPE_META[task.jobType as keyof typeof JOB_TYPE_META] : JOB_TYPE_META.AT
              const status = task.status ? TASK_STATUS_META[task.status as keyof typeof TASK_STATUS_META] : TASK_STATUS_META.TODO
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
                          <span className="text-purple-600 font-medium">{task.mineral}</span>
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
                          <Clock className="h-3 w-3" />
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
                      <Link href={`/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/tasks/${task.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
      </div>
    </Card>
  )
}
