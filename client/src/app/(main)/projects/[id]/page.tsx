"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useMemo, useState } from "react"
import { format } from "date-fns"
import {
  Task,
  TaskFile,
  useDeleteProjectMutation,
  useGetProjectByIdQuery,
  useGetTasksByProjectQuery,
  useSubmitProjectForApprovalMutation,
  useWithdrawProjectApprovalMutation,
  useRequestProjectDeletionMutation,
  useWithdrawProjectDeletionMutation,
} from "@/state/api"
import { EditProjectDialogMUI } from "@/components/Dialog/edit-project-dialog-mui"
import { CreateTaskDialogMUI } from "@/components/Dialog/create-task-dialog-mui"
import { EditTaskDialogMUI } from "@/components/Dialog/edit-task-dialog-mui"
import { ProjectFolderPreviewMUI } from "@/components/FileManagement/project-folder-preview-mui"
import { CommentSection } from "@/components/Comments/CommentSection"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Layers,
  ListChecks,
  MessageSquare,
  TrendingUp,
  User,
  Trash2,
  Download,
  Eye,
  Send,
  XCircle,
  FolderOpen,
} from "lucide-react"

const JOB_TYPE_META: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  AC: {
    label: "Consulting Services",
    badgeClass: "border-sky-400 text-sky-50 bg-sky-900/30",
    dotClass: "bg-sky-400",
  },
  AP: {
    label: "Planning & Design",
    badgeClass: "border-indigo-400 text-indigo-50 bg-indigo-900/30",
    dotClass: "bg-indigo-400",
  },
  AQ: {
    label: "Quality Assurance",
    badgeClass: "border-teal-400 text-teal-50 bg-teal-900/30",
    dotClass: "bg-teal-400",
  },
  AS: {
    label: "Technical Support",
    badgeClass: "border-slate-400 text-slate-50 bg-slate-900/30",
    dotClass: "bg-slate-300",
  },
  AT: {
    label: "Analysis & Testing",
    badgeClass: "border-amber-400 text-amber-50 bg-amber-900/30",
    dotClass: "bg-amber-400",
  },
}

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  PLANNING: {
    label: "Planning",
    badgeClass: "border-blue-400 text-blue-50 bg-blue-900/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "border-sky-400 text-sky-50 bg-sky-900/30",
  },
  ON_HOLD: {
    label: "On Hold",
    badgeClass: "border-amber-400 text-amber-50 bg-amber-900/30",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "border-emerald-400 text-emerald-50 bg-emerald-900/30",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "border-rose-400 text-rose-50 bg-rose-900/30",
  },
}

const APPROVAL_META: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "text-slate-50 bg-slate-900/70",
    dotClass: "bg-slate-400",
  },
  PENDING: {
    label: "Pending Approval",
    badgeClass: "text-amber-50 bg-amber-900/70",
    dotClass: "bg-amber-400",
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "text-emerald-50 bg-emerald-600",
    dotClass: "bg-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "text-rose-50 bg-rose-900/70",
    dotClass: "bg-rose-400",
  },
  DELETE_PENDING: {
    label: "Delete Pending",
    badgeClass: "text-orange-50 bg-orange-900/70",
    dotClass: "bg-orange-400",
  },
}

const TASK_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  TODO: {
    label: "Todo",
    badgeClass: "text-slate-50 bg-slate-900/70 ",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "text-sky-50 bg-sky-900/70",
  },
  REVIEW: {
    label: "Review",
    badgeClass: "text-purple-50 bg-purple-900/70",
  },
  DONE: {
    label: "Done",
    badgeClass: "text-emerald-50 bg-emerald-900/70",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "text-rose-50 bg-rose-900/70",
  },
}

const formatDate = (value?: string | Date | null, pattern = "MMM d, yyyy") => {
  if (!value) return "Not set"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return format(date, pattern)
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "Not set"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return format(date, "MMM d, yyyy • h:mm a")
}

const formatNumber = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—"
  return value.toLocaleString()
}

const formatFileSize = (size?: number | null) => {
  if (typeof size !== "number" || Number.isNaN(size)) return "Unknown size"
  if (size === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const formatted = size / 1024 ** exponent
  return `${formatted.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

const clampProgress = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null
  return Math.min(Math.max(value, 0), 100)
}

type ActivityItem = {
  id: string
  title: string
  description: string
  type: "comment" | "task" | "status"
  timestamp: Date | null
}

const ProjectDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params)
  const projectId = Number(id)
  const router = useRouter()
  const { toast } = useToast()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [editingProject, setEditingProject] = useState<typeof project | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [showWithdrawDeletionConfirm, setShowWithdrawDeletionConfirm] = useState(false)
  const [showWithdrawApprovalConfirm, setShowWithdrawApprovalConfirm] = useState(false)
  const [showSubmitApprovalConfirm, setShowSubmitApprovalConfirm] = useState(false)

  const handleFileDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tasks/files/${fileId}`)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: `File "${fileName}" downloaded successfully`,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const {
    data: projectResponse,
    isLoading,
    isError,
    refetch,
  } = useGetProjectByIdQuery(projectId, {
    skip: Number.isNaN(projectId),
  })

  const { data: projectTasks } = useGetTasksByProjectQuery(
    { projectId },
    { skip: Number.isNaN(projectId) }
  )

  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation()
  const [submitProjectForApproval, { isLoading: isSubmitting }] = useSubmitProjectForApprovalMutation()
  const [withdrawProjectApproval, { isLoading: isWithdrawing }] = useWithdrawProjectApprovalMutation()
  const [requestProjectDeletion, { isLoading: isRequestingDeletion }] = useRequestProjectDeletionMutation()
  const [withdrawProjectDeletion, { isLoading: isWithdrawingDeletion }] = useWithdrawProjectDeletionMutation()

  const project = projectResponse?.data
  const tasks: Task[] = useMemo(
    () => projectTasks?.data ?? project?.tasks ?? [],
    [project?.tasks, projectTasks?.data]
  )
  const projectMembers = project?.projectMembers ?? []
  const comments = project?.comments ?? []

  const statusMeta =
    (project?.status && STATUS_META[project.status]) ?? STATUS_META.PLANNING ?? {
      label: project?.status ?? "Unknown",
      badgeClass: "border-slate-400 text-slate-50 bg-slate-900/30",
    }

  const approvalMeta =
    (project?.approvalStatus && APPROVAL_META[project.approvalStatus]) ?? APPROVAL_META.DRAFT ?? {
      label: project?.approvalStatus ?? "Unknown",
      badgeClass: "border-slate-400 text-slate-50 bg-slate-900/30",
      dotClass: "bg-slate-400",
    }

  const progressValue = clampProgress(project?.progress)

  const tasksByStatus = useMemo(() => {
    const totals: Record<string, number> = {}
    tasks.forEach((task) => {
      const key = task.status ?? "UNKNOWN"
      totals[key] = (totals[key] ?? 0) + 1
    })
    return totals
  }, [tasks])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "DONE").length

  const now = useMemo(() => new Date(), [])
  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status === "DONE" || task.status === "CANCELLED") return false
    const due = new Date(task.dueDate)
    return !Number.isNaN(due.getTime()) && due < now
  }).length

  const upcomingTask = useMemo(() => {
    const upcoming = tasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const due = new Date(task.dueDate as Date)
        return Number.isNaN(due.getTime())
          ? null
          : {
              id: task.id,
              title: task.title ?? `Task #${task.id}`,
              due,
            }
      })
      .filter(Boolean) as Array<{ id: number; title: string; due: Date }>

    if (upcoming.length === 0) return null

    const sorted = upcoming.sort((a, b) => a.due.getTime() - b.due.getTime())
    return sorted[0]
  }, [tasks])

  const files = useMemo(() => {
    const output: Array<TaskFile & { taskId: number; taskTitle: string | undefined }> = []
    tasks.forEach((task) => {
      task.taskFiles?.forEach((file) => {
        output.push({
          ...file,
          taskId: task.id,
          taskTitle: task.title,
        })
      })
    })
    return output
  }, [tasks])

  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = []

    comments.forEach((comment) => {
      const created = comment.createdAt ? new Date(comment.createdAt) : null
      items.push({
        id: `comment-${comment.id}`,
        title: comment.user?.username ?? "Comment",
        description: comment.content,
        type: "comment",
        timestamp: created && !Number.isNaN(created.getTime()) ? created : null,
      })
    })

    tasks.forEach((task) => {
      const updated = task.updatedAt ? new Date(task.updatedAt as Date) : null
      items.push({
        id: `task-${task.id}`,
        title: task.title ?? `Task #${task.id}`,
        description: task.status ? `Status: ${task.status}` : "Task updated",
        type: "task",
        timestamp: updated && !Number.isNaN(updated.getTime()) ? updated : null,
      })
    })

    const created = project?.createdAt ? new Date(project.createdAt) : null
    if (created && !Number.isNaN(created.getTime())) {
      items.push({
        id: `status-${project.id}-created`,
        title: "Project Created",
        description: `Project ${project?.name ?? ""} created`,
        type: "status",
        timestamp: created,
      })
    }

    return items.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0
      if (!a.timestamp) return 1
      if (!b.timestamp) return -1
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }, [comments, tasks, project?.createdAt, project?.id, project?.name])

  const handleRequestDeletion = async () => {
    if (!project || !deleteReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for deletion",
        variant: "destructive",
      })
      return
    }

    try {
      setDeleteError(null)
      await requestProjectDeletion({ id: project.id, reason: deleteReason }).unwrap()
      toast({
        title: "Success",
        description: "Deletion request submitted successfully!",
      })
      setShowDeleteDialog(false)
      setDeleteReason("")
      refetch()
    } catch (error: any) {
      setDeleteError(
        error?.data?.message || error?.message || "Failed to submit deletion request. Please try again."
      )
    }
  }

  const handleWithdrawDeletion = async () => {
    if (!project) return

    try {
      await withdrawProjectDeletion(project.id).unwrap()
      toast({
        title: "Success",
        description: "Deletion request withdrawn successfully!",
      })
      setShowWithdrawDeletionConfirm(false)
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to withdraw deletion request",
        variant: "destructive",
      })
    }
  }

  const handleSubmitApproval = async () => {
    if (!project) return
    try {
      await submitProjectForApproval(project.id).unwrap()
      toast({
        title: "Success",
        description: "Project submitted for approval successfully!",
      })
      setShowSubmitApprovalConfirm(false)
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to submit for approval",
        variant: "destructive",
      })
    }
  }

  const handleWithdrawApproval = async () => {
    if (!project) return

    try {
      await withdrawProjectApproval(project.id).unwrap()
      toast({
        title: "Success",
        description: "Approval request withdrawn successfully!",
      })
      setShowWithdrawApprovalConfirm(false)
      refetch()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to withdraw approval",
        variant: "destructive",
      })
    }
  }

  if (Number.isNaN(projectId)) {
    return <div className="px-4 py-6 text-destructive">Invalid project id.</div>
  }

  if (isLoading) {
    return <div className="px-4 py-6 text-muted-foreground">Loading project…</div>
  }

  if (isError || !project) {
    return (
      <div className="px-4 py-6 text-destructive">
        Failed to load project details.{" "}
        <button type="button" className="underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    )
  }

  const ownerName =
    project.owner?.realName ??
    project.owner?.username ??
    (project.owner?.id ? `User #${project.owner.id}` : "Unassigned")

  return (
    <div className="pb-16">
      <header className="border-b border-slate-900 bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Link href="/projects">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="border border-slate-700 bg-slate-900 text-slate-50 hover:bg-slate-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("border px-2 py-1 text-xs font-semibold uppercase", statusMeta.badgeClass)}
                  >
                    {statusMeta.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("gap-2 border px-2 py-1 text-xs font-semibold", approvalMeta.badgeClass)}
                  >
                    <span className={cn("h-2 w-2 rounded-full", approvalMeta.dotClass)} />
                    {approvalMeta.label}
                  </Badge>
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
                {project.description && (
                  <p className="mt-2 max-w-3xl text-sm text-slate-200/80">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 self-start w-full md:w-auto">
              {/* Submit for Approval - only for DRAFT status */}
              {project.approvalStatus === 'DRAFT' && (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 border-0"
                  onClick={() => setShowSubmitApprovalConfirm(true)}
                  disabled={isSubmitting}
                >
                  <Send className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Submitting…" : "Submit for Approval"}
                </Button>
              )}

              {/* Withdraw Approval - only for PENDING status */}
              {project.approvalStatus === 'PENDING' && (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 border-0"
                  onClick={() => setShowWithdrawApprovalConfirm(true)}
                  disabled={isWithdrawing}
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  {isWithdrawing ? "Withdrawing…" : "Withdraw Approval"}
                </Button>
              )}

              <Button
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 border-0"
                onClick={() => setEditingProject(project)}
              >
                <Edit className="mr-2 h-5 w-5" />
                Edit Minesite
              </Button>

              {/* Request Deletion or Withdraw Deletion */}
              {project.approvalStatus === 'DELETE_PENDING' ? (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 border-0"
                  onClick={() => setShowWithdrawDeletionConfirm(true)}
                  disabled={isWithdrawingDeletion}
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  {isWithdrawingDeletion ? "Withdrawing…" : "Withdraw Deletion"}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 border-0"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isRequestingDeletion}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Request Deletion
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-none">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-slate-900 p-2 text-slate-50">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Project Owner</p>
                  <p className="text-sm font-medium text-slate-50">{ownerName}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-none">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-slate-900 p-2 text-slate-50">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Client Company</p>
                  <p className="text-sm font-medium text-slate-50">
                    {project.clientCompany ?? "Not provided"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-none">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-slate-900 p-2 text-slate-50">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Linked Projects</p>
                  <p className="text-sm font-medium text-slate-50">{totalTasks}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-none">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-slate-900 p-2 text-slate-50">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Last Updated</p>
                  <p className="text-sm font-medium text-slate-50">{formatDateTime(project.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 flex max-w-6xl flex-col gap-8 px-4 md:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-100 text-slate-700 dark:bg-slate-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Projects</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Project Health</CardTitle>
                  <CardDescription>Progress, workload, and current priorities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {progressValue !== null ? `${progressValue}%` : "Not tracked"}
                      </span>
                    </div>
                    <Progress value={progressValue ?? 0} className="h-2" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-emerald-50">Completed Tasks</p>
                          <p className="mt-1 text-2xl font-semibold">{completedTasks}</p>
                        </div>
                        <div className="rounded-full bg-white/20 p-2">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border-0 bg-gradient-to-br from-red-500 to-rose-600 text-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-red-50">Overdue</p>
                          <p className="mt-1 text-2xl font-semibold">{overdueTasks}</p>
                        </div>
                        <div className="rounded-full bg-white/20 p-2">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {upcomingTask ? (
                    <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <TrendingUp className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Next milestone</p>
                        <p className="text-xs">
                          {upcomingTask.title} &mdash; due {formatDate(upcomingTask.due, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                      <AlertTriangle className="h-4 w-4" />
                      No upcoming milestones with due dates.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Project Metadata</CardTitle>
                  <CardDescription>Key attributes and timeline references</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Client Company</span>
                    <span className="font-medium">{project.clientCompany ?? "Not provided"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mine Site</span>
                    <span className="font-medium">{project.mineSiteName ?? "Not provided"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formatDateTime(project.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">{formatDateTime(project.updatedAt)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approval Status</span>
                    <span className="font-medium">{approvalMeta.label}</span>
                  </div>

                  {/* ✅ 添加文件夹路径显示 */}
                  {(project.oneDriveClientFolderPath || project.oneDriveMineSiteFolderPath) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <FolderOpen className="h-4 w-4" />
                          <span className="text-sm font-semibold">Project Folders</span>
                        </div>
                        {project.oneDriveClientFolderPath && (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Client Folder:</span>
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded break-all">
                              {project.oneDriveClientFolderPath}
                            </code>
                          </div>
                        )}
                        {project.oneDriveMineSiteFolderPath && (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Mine Site Folder:</span>
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 p-1 rounded break-all">
                              {project.oneDriveMineSiteFolderPath}
                            </code>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground">Project Members</span>
                    <span className="text-right font-medium">
                      {projectMembers.length > 0
                        ? projectMembers.map((member) => member.username).join(", ")
                        : "No members assigned"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Task Breakdown</CardTitle>
                <CardDescription>Status distribution for linked tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {totalTasks === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks recorded for this project.</p>
                ) : (
                  Object.entries(tasksByStatus).map(([status, count]) => {
                    const meta = TASK_STATUS_META[status] ?? {
                      label: status,
                      badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
                    }

                    return (
                      <div
                        key={status}
                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/40"
                      >
                        <Badge variant="outline" className={cn("mb-2 text-xs font-semibold", meta.badgeClass)}>
                          {meta.label}
                        </Badge>
                        <p className="text-2xl font-semibold">{count}</p>
                        <p className="text-xs text-muted-foreground">
                          {((count / totalTasks) * 100).toFixed(0)}% of project tasks
                        </p>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Minesite tasks</h2>
                <p className="text-sm text-muted-foreground">
                  {totalTasks > 0
                    ? `Tracking ${totalTasks} linked task${totalTasks > 1 ? "s" : ""}.`
                    : "No tasks associated yet."}
                </p>
              </div>
              <Button variant="default" onClick={() => setShowCreateTaskDialog(true)}>
                <ListChecks className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>

            {totalTasks === 0 ? (
              <Card className="border border-dashed border-slate-300 bg-slate-50/60 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40">
                <CardContent className="py-8 text-center">
                  No tasks yet. Use the button above to create one.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tasks.map((task) => {
                  const statusMetaTask =
                    (task.status && TASK_STATUS_META[task.status]) ?? TASK_STATUS_META.TODO
                  const approval =
                    (task.approvalStatus && APPROVAL_META[task.approvalStatus]) ?? APPROVAL_META.DRAFT
                  const taskProgress = clampProgress(task.progress)

                  return (
                    <Card key={task.id} className="border border-slate-200 shadow-sm hover:border-primary/50">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="text-base font-semibold text-slate-900 hover:underline dark:text-slate-100"
                            >
                              {task.title ?? "Untitled Task"}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              Task code: {task.taskCode ?? "Not set"}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn("text-xs font-semibold", statusMetaTask.badgeClass)}>
                            {statusMetaTask.label}
                          </Badge>
                        </div>
                        {task.description && (
                          <CardDescription className="line-clamp-2 text-sm">{task.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("gap-2 text-xs font-semibold", approval.badgeClass)}
                          >
                            <span className={cn("h-2 w-2 rounded-full", approval.dotClass)} />
                            {approval.label}
                          </Badge>
                          {task.mineral && (
                            <Badge variant="outline" className="border border-stone-300 bg-stone-100 text-[11px] font-semibold uppercase text-stone-700">
                              {task.mineral}
                            </Badge>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Assigned To</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {task.assignedUser?.username ?? "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Schedule</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {formatDate(task.startDate, "MMM d")} - {formatDate(task.dueDate, "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        {typeof taskProgress === "number" && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {taskProgress}%
                              </span>
                            </div>
                            <Progress value={taskProgress} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <Link href={`/tasks/${task.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              View Project
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditingTask(task)}
                          >
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            {/* Project Folder Browser */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Project Folder Browser</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and manage files in project folder: {project.clientCompany}/{project.mineSiteName}
                  </p>
                </div>
              </div>
              <ProjectFolderPreviewMUI
                projectId={projectId}
                clientCompany={project.clientCompany ?? undefined}
                mineSiteName={project.mineSiteName ?? undefined}
                localFolderPath={project.mineSiteFolderPath}
                oneDriveFolderPath={project.oneDriveMineSiteFolderPath}
                onRefresh={() => refetch()}
              />
            </div>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Task Files (Database Records)</CardTitle>
                <CardDescription>Aggregated attachments from all linked tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 opacity-60" />
                    <p>No files have been uploaded for this project yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {file.fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {file.fileType ?? "File"} • {formatFileSize(file.fileSize)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs font-medium uppercase">
                            Task #{file.taskId}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            Uploaded by{" "}
                            {file.uploadedByUser?.username ?? file.uploadedBy ?? "Unknown user"}
                          </span>
                          <span>{formatDateTime(file.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Linked Task:</span>
                            <Link
                              href={`/tasks/${file.taskId}`}
                              className="font-medium text-primary underline-offset-2 hover:underline"
                            >
                              {file.taskTitle ?? `Task #${file.taskId}`}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => window.open(file.oneDrivePath || file.localPath, '_blank')}
                              disabled={!file.oneDrivePath && !file.localPath}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleFileDownload(file.id, file.fileName)}
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <CommentSection entityType="project" entityId={Number(id)} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent updates and collaboration on this project</CardDescription>
              </CardHeader>
              <CardContent>
                {activityItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <Activity className="h-10 w-10 opacity-60" />
                    <p>No recorded activity yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
                      >
                        <div
                          className={cn(
                            "mt-1 flex h-10 w-10 items-center justify-center rounded-full",
                            item.type === "comment" && "bg-blue-500/10 text-blue-700",
                            item.type === "task" && "bg-emerald-500/10 text-emerald-700",
                            item.type === "status" && "bg-slate-500/10 text-slate-700"
                          )}
                        >
                          {item.type === "comment" && <MessageSquare className="h-5 w-5" />}
                          {item.type === "task" && <ListChecks className="h-5 w-5" />}
                          {item.type === "status" && <CheckCircle2 className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 space-y-1 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {item.timestamp ? format(item.timestamp, "MMM d, yyyy 'at' h:mm a") : "Date unknown"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
      </main>

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

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialogMUI
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null)
            refetch()
          }}
          task={editingTask}
        />
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialogMUI
        open={showCreateTaskDialog}
        onClose={() => setShowCreateTaskDialog(false)}
        onSuccess={() => {
          setShowCreateTaskDialog(false)
          refetch()
        }}
        defaultProjectId={projectId}
      />

      {/* Delete Request Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Request Project Deletion
            </DialogTitle>
            <DialogDescription>
              Submit a deletion request for project <strong>{project?.name}</strong>.
              This request will need to be approved before the project is permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deleteReason" className="text-sm font-medium">
                Deletion Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="deleteReason"
                placeholder="Please explain why this project should be deleted..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be reviewed by administrators
              </p>
            </div>

            {deleteError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{deleteError}</p>
              </div>
            )}

            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> The project will not be deleted immediately.
                An administrator must approve this request first.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteReason("")
                setDeleteError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold"
              variant="destructive"
              onClick={handleRequestDeletion}
              disabled={isRequestingDeletion || !deleteReason.trim()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isRequestingDeletion ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog - Submit for Approval */}
      <ConfirmDialog
        open={showSubmitApprovalConfirm}
        onOpenChange={setShowSubmitApprovalConfirm}
        onConfirm={handleSubmitApproval}
        title="Submit for Approval"
        description={`Are you sure you want to submit "${project?.name}" for approval? This action will notify administrators.`}
        confirmText="Submit"
        type="info"
        loading={isSubmitting}
      />

      {/* Confirm Dialog - Withdraw Approval */}
      <ConfirmDialog
        open={showWithdrawApprovalConfirm}
        onOpenChange={setShowWithdrawApprovalConfirm}
        onConfirm={handleWithdrawApproval}
        title="Withdraw Approval Request"
        description={`Are you sure you want to withdraw the approval request for "${project?.name}"? The project will return to draft status.`}
        confirmText="Withdraw"
        type="warning"
        loading={isWithdrawing}
      />

      {/* Confirm Dialog - Withdraw Deletion */}
      <ConfirmDialog
        open={showWithdrawDeletionConfirm}
        onOpenChange={setShowWithdrawDeletionConfirm}
        onConfirm={handleWithdrawDeletion}
        title="Withdraw Deletion Request"
        description={`Are you sure you want to withdraw the deletion request for "${project?.name}"? The project will be restored to approved status.`}
        confirmText="Withdraw"
        type="warning"
        loading={isWithdrawingDeletion}
      />
    </div>
  )
}

export default ProjectDetailPage
