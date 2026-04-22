"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useMemo, useState } from "react"
import { format } from "date-fns"
import {
  TaskFile,
  useGetTaskByIdQuery,
  useSubmitTaskForApprovalMutation,
  useWithdrawTaskApprovalMutation,
  useRequestTaskDeletionMutation,
  useWithdrawTaskDeletionMutation,
  useApproveTaskMutation,
  useDeleteTaskMutation,
} from "@/state/api"
import { useCanApprove } from "@/hooks/useRoleCheck"
import { useAppSelector } from "@/redux"
import { selectCurrentUser } from "@/state/authSlice"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Activity,
  ArrowLeft,
  BadgeAlert,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit,
  FileText,
  MessageSquare,
  Trash2,
  User,
  Send,
  XCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { FolderPreviewMUI } from "@/components/FileManagement/folder-preview-mui"
import { CommentSection } from "@/components/Comments/CommentSection"
import { EditTaskDialogMUI } from "@/components/Dialog/edit-task-dialog-mui"

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  TODO: {
    label: "To Do",
    badgeClass: "border-slate-400 text-slate-50 bg-slate-900/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "border-sky-400 text-sky-50 bg-sky-900/30",
  },
  REVIEW: {
    label: "In Review",
    badgeClass: "border-purple-400 text-purple-50 bg-purple-900/30",
  },
  DONE: {
    label: "Done",
    badgeClass: "border-emerald-400 text-emerald-50 bg-emerald-900/30",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "border-rose-400 text-rose-50 bg-rose-900/30",
  },
}

const PRIORITY_META: Record<string, { label: string; badgeClass: string }> = {
  LOW: {
    label: "Low",
    badgeClass: "border-slate-400 text-slate-50 bg-slate-900/30",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "border-amber-400 text-amber-50 bg-amber-900/30",
  },
  HIGH: {
    label: "High",
    badgeClass: "border-orange-400 text-orange-50 bg-orange-900/30",
  },
  URGENT: {
    label: "Urgent",
    badgeClass: "border-red-400 text-red-50 bg-red-900/30",
  },
}

const APPROVAL_META: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  DRAFT: {
    label: "Draft",
    badgeClass: "border-slate-400 text-slate-50 bg-slate-900/40",
    dotClass: "bg-slate-400",
  },
  PENDING: {
    label: "Pending Approval",
    badgeClass: "border-amber-400 text-amber-50 bg-amber-900/40",
    dotClass: "bg-amber-400",
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "border-emerald-400 text-emerald-50 bg-emerald-900/40",
    dotClass: "bg-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "border-rose-400 text-rose-50 bg-rose-900/40",
    dotClass: "bg-rose-400",
  },
  DELETE_PENDING: {
    label: "Delete Pending",
    badgeClass: "border-orange-400 text-orange-50 bg-orange-900/40",
    dotClass: "bg-orange-400",
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

const clampProgress = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null
  return Math.min(Math.max(value, 0), 100)
}

type TaskActivityItem = {
  id: string
  title: string
  description: string
  timestamp: Date | null
  type: "comment" | "status"
}

const TaskDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params)
  const taskId = Number(id)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [editingTask, setEditingTask] = useState<typeof task | null>(null)
  const [approveComment, setApproveComment] = useState("")
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [approveAction, setApproveAction] = useState<"approve" | "reject" | null>(null)
  const { toast } = useToast()
  const canApprove = useCanApprove()
  const currentUser = useAppSelector(selectCurrentUser)
  const [confirmState, setConfirmState] = useState<{
    title: string
    description?: string
    type?: "info" | "success" | "warning" | "danger"
    action: () => Promise<void>
    confirmText?: string
  } | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const {
    data: taskResponse,
    isLoading,
    isError,
    refetch,
  } = useGetTaskByIdQuery(taskId, { skip: Number.isNaN(taskId) })

  const [submitTaskForApproval, { isLoading: isSubmitting }] = useSubmitTaskForApprovalMutation()
  const [withdrawTaskApproval, { isLoading: isWithdrawing }] = useWithdrawTaskApprovalMutation()
  const [requestTaskDeletion, { isLoading: isRequestingDeletion }] = useRequestTaskDeletionMutation()
  const [withdrawTaskDeletion, { isLoading: isWithdrawingDeletion }] = useWithdrawTaskDeletionMutation()
  const [approveTask, { isLoading: isApproving }] = useApproveTaskMutation()
  const [deleteTaskDirect, { isLoading: isDeleting }] = useDeleteTaskMutation()

  const task = taskResponse?.data
  const files = (task?.taskFiles ?? []) as TaskFile[]
  const comments = task?.comments ?? []

  const statusMeta =
    (task?.status && STATUS_META[task.status]) ?? STATUS_META.TODO ?? {
      label: task?.status ?? "Unknown",
      badgeClass: "border-slate-400 text-slate-50 bg-slate-900/30",
    }

  const priorityMeta =
    (task?.priority && PRIORITY_META[task.priority]) ?? PRIORITY_META.MEDIUM ?? {
      label: task?.priority ?? "Not set",
      badgeClass: "border-slate-400 text-slate-50 bg-slate-900/30",
    }

  const approvalMeta =
    (task?.approvalStatus && APPROVAL_META[task.approvalStatus]) ?? APPROVAL_META.DRAFT ?? {
      label: task?.approvalStatus ?? "Unknown",
      badgeClass: "border-slate-400 text-slate-50 bg-slate-900/30",
      dotClass: "bg-slate-400",
    }

  const progressValue = clampProgress(task?.progress)

  const handleRequestDeletion = async () => {
    if (!task || !deleteReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason before submitting a deletion request.",
        variant: "destructive",
      })
      return
    }

    try {
      setDeleteError(null)
      await requestTaskDeletion({ id: task.id, reason: deleteReason }).unwrap()
      toast({
        title: "Deletion request submitted",
        description: "This task is now waiting for deletion approval.",
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
    if (!task) return
    setConfirmState({
      title: "Withdraw deletion request",
      description: `Are you sure you want to withdraw the deletion request for "${task.title}"?`,
      type: "warning",
      confirmText: "Withdraw",
      action: async () => {
        try {
          await withdrawTaskDeletion(task.id).unwrap()
          toast({
            title: "Deletion request withdrawn",
            description: "This task will remain active.",
          })
          refetch()
        } catch (error: any) {
          toast({
            title: "Failed to withdraw deletion request",
            description: error?.data?.message || error?.message || "Please try again.",
            variant: "destructive",
          })
        }
      },
    })
  }

  const handleDirectDelete = () => {
    if (!task) return
    setConfirmState({
      title: "Delete Task",
      description: `Permanently delete "${task.title}"? This cannot be undone.`,
      type: "danger",
      confirmText: "Delete",
      action: async () => {
        try {
          await deleteTaskDirect(task.id).unwrap()
          toast({ title: "Task deleted" })
          router.push("/tasks")
        } catch (error: any) {
          toast({
            title: "Failed to delete task",
            description: error?.data?.message || error?.message || "Please try again.",
            variant: "destructive",
          })
        }
      },
    })
  }

  const handleSubmitApproval = async () => {
    if (!task) return
    try {
      await submitTaskForApproval(task.id).unwrap()
      toast({
        title: "Approval requested",
        description: "This task has been submitted for approval.",
      })
      refetch()
    } catch (error: any) {
      toast({
        title: "Failed to submit for approval",
        description: error?.data?.message || error?.message || "Please try again later.",
        variant: "destructive",
      })
    }
  }

  const handleWithdrawApproval = async () => {
    if (!task) return
    setConfirmState({
      title: "Withdraw approval request",
      description: `Are you sure you want to withdraw the approval request for "${task.title}"?`,
      type: "warning",
      confirmText: "Withdraw",
      action: async () => {
        try {
          await withdrawTaskApproval(task.id).unwrap()
          toast({
            title: "Approval withdrawn",
            description: "The approval workflow has been cancelled.",
          })
          refetch()
        } catch (error: any) {
          toast({
            title: "Failed to withdraw approval",
            description: error?.data?.message || error?.message || "Please try again.",
            variant: "destructive",
          })
        }
      },
    })
  }

  const handleApproveTask = async () => {
    if (!task || !approveAction) return
    try {
      await approveTask({
        id: task.id,
        approved: approveAction === "approve",
        comment: approveComment.trim() || undefined,
      }).unwrap()
      toast({
        title: approveAction === "approve" ? "Task approved" : "Task rejected",
        description: approveAction === "approve"
          ? "The task has been approved and is now active."
          : "The task has been rejected.",
      })
      setShowApproveDialog(false)
      setApproveComment("")
      setApproveAction(null)
      refetch()
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error?.data?.message || error?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const activityItems = useMemo<TaskActivityItem[]>(() => {
    const items: TaskActivityItem[] = []
    comments.forEach((comment) => {
      const created = comment.createdAt ? new Date(comment.createdAt) : null
      items.push({
        id: `comment-${comment.id}`,
        title: comment.user?.username ?? "Comment",
        description: comment.content,
        timestamp: created && !Number.isNaN(created.getTime()) ? created : null,
        type: "comment",
      })
    })
    if (task?.status) {
      const updated = task.updatedAt ? new Date(task.updatedAt as Date) : null
      items.push({
        id: `status-${task.id}`,
        title: "Status Updated",
        description: `Current status: ${task.status}`,
        timestamp: updated && !Number.isNaN(updated.getTime()) ? updated : null,
        type: "status",
      })
    }
    return items.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0
      if (!a.timestamp) return 1
      if (!b.timestamp) return -1
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }, [comments, task?.id, task?.status, task?.updatedAt])

  if (Number.isNaN(taskId)) {
    return <div className="px-4 py-6 text-destructive">Invalid task id.</div>
  }

  if (isLoading) {
    return <div className="px-4 py-6 text-muted-foreground">Loading task details…</div>
  }

  if (isError || !task) {
    return (
      <div className="px-4 py-6 text-destructive">
        Failed to load task information.{" "}
        <button type="button" className="underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    )
  }

  const assignedUser =
    task.assignedUser?.realName ??
    task.assignedUser?.username ??
    "Unassigned"

  return (
    <div className="pb-16">
      <header className="border-b border-slate-900 bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="icon"
                  className="border border-slate-700 bg-slate-900 text-slate-50 hover:bg-slate-800"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
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
                  {task.priority && (
                    <Badge
                      variant="outline"
                      className={cn("border px-2 py-1 text-xs font-semibold uppercase", priorityMeta.badgeClass)}
                    >
                      Priority: {priorityMeta.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{task.title}</h1>
                <p className="mt-2 text-sm text-slate-200/80">
                  Task code: {task.taskCode ?? "Not specified"}
                </p>
                {task.description && (
                  <p className="mt-3 max-w-3xl text-sm text-slate-200/90">{task.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 self-start">
              {/* Submit for Approval - only for DRAFT status */}
              {task.approvalStatus === 'DRAFT' && (
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmitApproval}
                  disabled={isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Submitting…" : "Submit for Approval"}
                </Button>
              )}

              {/* Withdraw Approval - only for PENDING status */}
              {task.approvalStatus === 'PENDING' && (
                <Button
                  variant="outline"
                  className="border-amber-600 text-amber-600 hover:bg-amber-50"
                  onClick={handleWithdrawApproval}
                  disabled={isWithdrawing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {isWithdrawing ? "Withdrawing…" : "Withdraw Approval"}
                </Button>
              )}

              {/* Approve / Reject - admin & manager only, when task is PENDING */}
              {canApprove && task.approvalStatus === 'PENDING' && (
                <>
                  <Button
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => { setApproveAction("approve"); setShowApproveDialog(true) }}
                    disabled={isApproving}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="border-rose-600 text-rose-600 hover:bg-rose-50"
                    onClick={() => { setApproveAction("reject"); setShowApproveDialog(true) }}
                    disabled={isApproving}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}

              <Button
                variant="secondary"
                className="border border-slate-700 bg-white text-slate-900 hover:border-slate-500"
                onClick={() => setEditingTask(task)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>

              {/* Delete / Request Deletion */}
              {canApprove ? (
                <Button
                  variant="destructive"
                  onClick={handleDirectDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting…" : "Delete"}
                </Button>
              ) : task.approvalStatus === 'DELETE_PENDING' ? (
                <Button
                  variant="outline"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  onClick={handleWithdrawDeletion}
                  disabled={isWithdrawingDeletion}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {isWithdrawingDeletion ? "Withdrawing…" : "Withdraw Deletion"}
                </Button>
              ) : task.approvalStatus === 'DRAFT' ? (
                <Button
                  variant="destructive"
                  onClick={handleDirectDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting…" : "Cancel Task"}
                </Button>
              ) : task.approvalStatus === 'APPROVED' || task.approvalStatus === 'REJECTED' ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isRequestingDeletion}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Request Deletion
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-none">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-slate-900 p-2 text-slate-50">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Start Date</p>
                  <p className="text-sm font-medium text-slate-50">{formatDate(task.startDate)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-none">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-slate-900 p-2 text-slate-50">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Due Date</p>
                  <p className="text-sm font-medium text-slate-50">{formatDate(task.dueDate)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-none">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-slate-900 p-2 text-slate-50">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Assignee</p>
                  <p className="text-sm font-medium text-slate-50">{assignedUser}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-none">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-full bg-slate-900 p-2 text-slate-50">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Project</p>
                  <p className="text-sm font-medium text-slate-50">
                    {task.projects?.name ?? (task.projectId ? `Project #${task.projectId}` : "Unlinked")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 flex max-w-5xl flex-col gap-8 px-4 md:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 text-slate-700 dark:bg-slate-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="links">Links & Files</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Execution Status</CardTitle>
                <CardDescription>Effort tracking and completion signals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Task Progress</span>
                    <span className="font-medium">
                      {progressValue !== null ? `${progressValue}%` : "Not tracked"}
                    </span>
                  </div>
                  <Progress value={progressValue ?? 0} className="h-2" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-xs text-muted-foreground">Estimated Hours</p>
                    <p className="mt-1 text-base font-semibold">
                      {typeof task.estimatedHours === "number"
                        ? `${task.estimatedHours.toLocaleString()} h`
                        : "Not estimated"}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-xs text-muted-foreground">Actual Hours</p>
                    <p className="mt-1 text-base font-semibold">
                      {typeof task.actualHours === "number"
                        ? `${task.actualHours.toLocaleString()} h`
                        : "Not captured"}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                    <p className="text-xs text-muted-foreground">Mineral Focus</p>
                    <p className="mt-1 text-base font-semibold">{task.mineral ?? "Unspecified"}</p>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-muted-foreground">
                    Approval Status:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {approvalMeta.label}
                    </span>
                  </p>
                  {task.approvedAt && (
                    <p className="text-xs text-muted-foreground">
                      Approved {formatDateTime(task.approvedAt)} by {task.approvedBy ?? "N/A"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Additional Context</CardTitle>
                <CardDescription>Links, metadata, and supporting information</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Minesite Link</p>
                  {task.projectId ? (
                    <Link
                      href={`/projects/${task.projectId}`}
                      className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {task.projects?.name ?? `Project #${task.projectId}`}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">Not linked</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Client Feedback</p>
                  <p className="text-sm font-medium">{task.clientFeedback ?? "No feedback recorded"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{formatDateTime(task.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{formatDateTime(task.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tags</p>
                  <p className="text-sm font-medium">{task.tags ?? "No tags"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quotation Number</p>
                  <p className="text-sm font-medium">{task.quotationNumber ?? "Not provided"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            {/* Folder Preview Component - New Feature */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Folder Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and manage files in local and OneDrive folders
                  </p>
                </div>
              </div>
              <FolderPreviewMUI
                taskId={taskId}
                taskCode={task?.taskCode ?? undefined}
                projectId={task?.projectId ?? undefined}
                onRefresh={() => refetch()}
              />
            </div>

            <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Linked Files (Database Records)</CardTitle>
                <CardDescription>Documents uploaded and tracked in database</CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 opacity-60" />
                    <p>No files attached to this task yet.</p>
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
                                {file.fileType ?? "File"} • {file.mimeType}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs font-medium uppercase">
                            v{file.version ?? 1}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            Uploaded by{" "}
                            {file.uploadedByUser?.username ?? file.uploadedBy ?? "Unknown user"}
                          </span>
                          <span>{formatDateTime(file.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Key Contacts</CardTitle>
                <CardDescription>People responsible for this task</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <span className="text-muted-foreground">Assigned</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{assignedUser}</span>
                </div>
                <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <span className="text-muted-foreground">Project Manager</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {task.projectManager ?? "Not specified"}
                  </span>
                </div>
                <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                  <span className="text-muted-foreground">Contact Company</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {task.contactCompany ?? "Not provided"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {/* Comments Section */}
            <CommentSection entityType="task" entityId={taskId} />

            {/* Activity Log */}
            <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Status updates and changes to this task</CardDescription>
              </CardHeader>
              <CardContent>
                {activityItems.filter(item => item.type === "status").length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <Activity className="h-10 w-10 opacity-60" />
                    <p>No recorded activity yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityItems.filter(item => item.type === "status").map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
                      >
                        <div
                          className={cn(
                            "mt-1 flex h-10 w-10 items-center justify-center rounded-full",
                            "bg-emerald-500/10 text-emerald-700"
                          )}
                        >
                          <CheckCircle2 className="h-5 w-5" />
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

      {/* Delete Request Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Request Task Deletion
            </DialogTitle>
            <DialogDescription>
              Submit a deletion request for task <strong>{task?.title}</strong>.
              This request will need to be approved before the task is permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deleteReason" className="text-sm font-medium">
                Deletion Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="deleteReason"
                placeholder="Please explain why this task should be deleted..."
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
                <strong>Note:</strong> The task will not be deleted immediately.
                An administrator must approve this request first.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
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

      <ConfirmDialog
        open={!!confirmState}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmState(null)
            setConfirmLoading(false)
          }
        }}
        onConfirm={async () => {
          if (!confirmState) return
          try {
            setConfirmLoading(true)
            await confirmState.action()
          } finally {
            setConfirmLoading(false)
            setConfirmState(null)
          }
        }}
        title={confirmState?.title ?? ""}
        description={confirmState?.description}
        type={confirmState?.type ?? "info"}
        confirmText={confirmState?.confirmText ?? "Confirm"}
        loading={confirmLoading}
      />

      {/* Approve / Reject Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={(open) => {
        if (!open) { setShowApproveDialog(false); setApproveComment(""); setApproveAction(null) }
      }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className={approveAction === "approve" ? "text-emerald-600" : "text-rose-600"}>
              {approveAction === "approve" ? "Approve Task" : "Reject Task"}
            </DialogTitle>
            <DialogDescription>
              {approveAction === "approve"
                ? "This task will be approved and moved to active status."
                : "This task will be rejected. The author will be notified."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="approve-comment">Comment (optional)</Label>
            <Textarea
              id="approve-comment"
              placeholder={approveAction === "approve" ? "Add approval notes…" : "Provide a reason for rejection…"}
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowApproveDialog(false); setApproveComment(""); setApproveAction(null) }}>
              Cancel
            </Button>
            <Button
              variant={approveAction === "approve" ? "default" : "destructive"}
              className={approveAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={handleApproveTask}
              disabled={isApproving}
            >
              {isApproving ? "Processing…" : approveAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TaskDetailPage
