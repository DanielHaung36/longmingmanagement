"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateTaskMutation } from "@/state/api"

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"] as const
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const
const APPROVAL_OPTIONS = ["DRAFT", "PENDING", "APPROVED", "REJECTED"] as const

type TaskFormState = {
  title: string
  description: string
  projectId: string
  status: (typeof STATUS_OPTIONS)[number]
  priority: (typeof PRIORITY_OPTIONS)[number]
  approvalStatus: (typeof APPROVAL_OPTIONS)[number]
  mineral: string
  estimatedHours: string
}

type FormErrors = Partial<Record<keyof TaskFormState, string>>

const validateField = (field: keyof TaskFormState, value: string): string => {
  switch (field) {
    case "title": {
      const trimmed = value.trim()
      if (!trimmed) return "Task title is required."
      if (trimmed.length < 3) return "Title must be at least 3 characters."
      return ""
    }
    case "projectId": {
      const trimmed = value.trim()
      if (!trimmed) return "Project id is required."
      const numeric = Number(trimmed)
      if (Number.isNaN(numeric) || numeric <= 0) return "Provide a positive project id."
      if (!Number.isInteger(numeric)) return "Project id must be an integer."
      return ""
    }
    case "description": {
      if (value.length > 500) return "Description cannot exceed 500 characters."
      return ""
    }
    case "mineral": {
      if (value.length > 120) return "Keep this under 120 characters."
      return ""
    }
    case "estimatedHours": {
      if (!value.trim()) return ""
      const numeric = Number(value)
      if (Number.isNaN(numeric) || numeric < 0) return "Estimated hours must be positive."
      return ""
    }
    default:
      return ""
  }
}

const validateForm = (state: TaskFormState): FormErrors => {
  const errors: FormErrors = {}
  ;(Object.keys(state) as Array<keyof TaskFormState>).forEach((key) => {
    const message = validateField(key, state[key])
    if (message) {
      errors[key] = message
    }
  })
  return errors
}

const TaskCreatePage = () => {
  const router = useRouter()
  const params = useSearchParams()
  const prefilledProjectId = params.get("projectId") ?? ""
  const [createTask, { isLoading }] = useCreateTaskMutation()
  const [formState, setFormState] = useState<TaskFormState>({
    title: "",
    description: "",
    projectId: prefilledProjectId,
    status: "TODO",
    priority: "MEDIUM",
    approvalStatus: "DRAFT",
    mineral: "",
    estimatedHours: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const requiredMissing = useMemo(() => {
    return !formState.title.trim() || !formState.projectId.trim()
  }, [formState.title, formState.projectId])

  const hasBlockingErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors]
  )

  const handleChange = (key: keyof TaskFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))
    setErrors((prev) => {
      const message = validateField(key, value)
      const next = { ...prev }
      if (message) {
        next[key] = message
      } else {
        delete next[key]
      }
      return next
    })
  }

  const handleBlur = (key: keyof TaskFormState) => {
    const message = validateField(key, formState[key])
    setErrors((prev) => {
      const next = { ...prev }
      if (message) {
        next[key] = message
      } else {
        delete next[key]
      }
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateForm(formState)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      setFormError("Please fix the highlighted fields before submitting.")
      return
    }

    try {
      setFormError(null)
      setSuccessMessage(null)
      const projectIdValue = Number(formState.projectId)
      const estimatedHoursValue = formState.estimatedHours ? Number(formState.estimatedHours) : undefined
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        projectId: projectIdValue,
        status: formState.status,
        priority: formState.priority,
        approvalStatus: formState.approvalStatus,
        mineral: formState.mineral.trim() || undefined,
        estimatedHours: estimatedHoursValue,
      }

      const response = await createTask(payload).unwrap()
      setSuccessMessage("Project created successfully. Redirecting…")
      const createdId = response?.data?.id
      if (createdId) {
        router.push(`/tasks/${createdId}`)
      } else {
        router.push("/projects")
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create task. Please try again.")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-6">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Create Task</CardTitle>
          <CardDescription>Fill in the required information to create a new task.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  onBlur={() => handleBlur("title")}
                  placeholder="Task title"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby="title-error"
                  required
                />
                {errors.title && (
                  <p id="title-error" className="text-sm text-destructive">
                    {errors.title}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="projectId">Project Id *</Label>
                <Input
                  id="projectId"
                  value={formState.projectId}
                  onChange={(event) => handleChange("projectId", event.target.value)}
                  onBlur={() => handleBlur("projectId")}
                  placeholder="Numeric project id"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.projectId)}
                  aria-describedby="projectId-error"
                  required
                />
                {errors.projectId && (
                  <p id="projectId-error" className="text-sm text-destructive">
                    {errors.projectId}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(event) => handleChange("description", event.target.value)}
                  onBlur={() => handleBlur("description")}
                  rows={4}
                  placeholder="Add a description or instructions (max 500 characters)"
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby="description-error"
                />
                {errors.description && (
                  <p id="description-error" className="text-sm text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formState.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formState.priority} onValueChange={(value) => handleChange("priority", value)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="approvalStatus">Approval Status</Label>
                <Select
                  value={formState.approvalStatus}
                  onValueChange={(value) => handleChange("approvalStatus", value)}
                >
                  <SelectTrigger id="approvalStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="mineral">Mineral</Label>
                <Input
                  id="mineral"
                  value={formState.mineral}
                  onChange={(event) => handleChange("mineral", event.target.value)}
                  onBlur={() => handleBlur("mineral")}
                  placeholder="e.g. Lithium"
                  aria-invalid={Boolean(errors.mineral)}
                  aria-describedby="mineral-error"
                />
                {errors.mineral && (
                  <p id="mineral-error" className="text-sm text-destructive">
                    {errors.mineral}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  value={formState.estimatedHours}
                  onChange={(event) => handleChange("estimatedHours", event.target.value)}
                  onBlur={() => handleBlur("estimatedHours")}
                  placeholder="e.g. 120"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.estimatedHours)}
                  aria-describedby="estimatedHours-error"
                />
                {errors.estimatedHours && (
                  <p id="estimatedHours-error" className="text-sm text-destructive">
                    {errors.estimatedHours}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" disabled={requiredMissing || hasBlockingErrors || isLoading}>
                {isLoading ? "Creating…" : "Create Task"}
              </Button>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TaskCreatePage
