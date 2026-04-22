"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateProjectMutation } from "@/state/api"

const JOB_TYPES = ["AC", "AP", "AQ", "AS", "AT"] as const
const STATUS_OPTIONS = ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"] as const
const APPROVAL_OPTIONS = ["DRAFT", "PENDING", "APPROVED", "REJECTED"] as const

type FormState = {
  name: string
  projectCode: string
  description: string
  jobType: (typeof JOB_TYPES)[number]
  status: (typeof STATUS_OPTIONS)[number]
  approvalStatus: (typeof APPROVAL_OPTIONS)[number]
  clientCompany: string
  mineSiteName: string
  ownerId: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const INITIAL_FORM: FormState = {
  name: "",
  projectCode: "",
  description: "",
  jobType: "AC",
  status: "PLANNING",
  approvalStatus: "DRAFT",
  clientCompany: "",
  mineSiteName: "",
  ownerId: "",
}

const validateField = (field: keyof FormState, value: string, state: FormState): string => {
  switch (field) {
    case "name": {
      const trimmed = value.trim()
      if (!trimmed) return "Project name is required."
      if (trimmed.length < 3) return "Name must be at least 3 characters."
      return ""
    }
    case "projectCode": {
      const trimmed = value.trim()
      if (!trimmed) return "Project code is required."
      if (!/^[A-Za-z0-9_-]{3,}$/.test(trimmed)) {
        return "Use 3+ letters, numbers, - or _."
      }
      return ""
    }
    case "description": {
      if (value.length > 500) return "Description cannot exceed 500 characters."
      return ""
    }
    case "clientCompany":
    case "mineSiteName": {
      if (value.length > 120) return "Keep this under 120 characters."
      return ""
    }
    case "ownerId": {
      if (!value.trim()) return ""
      const numeric = Number(value)
      if (Number.isNaN(numeric) || numeric < 0) {
        return "Owner id must be a positive number."
      }
      if (!Number.isInteger(numeric)) {
        return "Owner id must be an integer."
      }
      return ""
    }
    case "jobType":
    case "status":
    case "approvalStatus":
    default:
      return ""
  }
}

const validateForm = (state: FormState): FormErrors => {
  const errors: FormErrors = {}
  (Object.keys(state) as Array<keyof FormState>).forEach((key) => {
    const message = validateField(key, String(state[key] ?? ""), state)
    if (message) {
      errors[key] = message
    }
  })
  return errors
}

const ProjectCreatePage = () => {
  const router = useRouter()
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [createProject, { isLoading }] = useCreateProjectMutation()

  const requiredMissing = !formState.name.trim() || !formState.projectCode.trim()
  const hasBlockingErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors]
  )

  const handleChange = (key: keyof FormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }))

    setErrors((prev) => {
      const next = { ...prev }
      const validationMessage = validateField(key, value, {
        ...formState,
        [key]: value,
      })
      if (validationMessage) {
        next[key] = validationMessage
      } else {
        delete next[key]
      }
      return next
    })
  }

  const handleBlur = (key: keyof FormState) => {
    const message = validateField(key, formState[key], formState)
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
      const ownerIdValue = formState.ownerId ? Number(formState.ownerId) : undefined
      const payload = {
        name: formState.name.trim(),
        projectCode: formState.projectCode.trim(),
        description: formState.description.trim() || undefined,
        jobType: formState.jobType,
        status: formState.status,
        approvalStatus: formState.approvalStatus,
        clientCompany: formState.clientCompany.trim() || undefined,
        mineSiteName: formState.mineSiteName.trim() || undefined,
        ownerId: ownerIdValue,
      }

      const response = await createProject(payload).unwrap()
      setSuccessMessage("Project created successfully. Redirecting…")
      const createdId = response?.data?.id
      if (createdId) {
        router.push(`/projects/${createdId}`)
      } else {
        router.push("/projects")
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to create project. Please try again."
      )
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-6">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
          <CardDescription>
            Provide the mandatory details to launch a project record. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g. Mine Expansion Program"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby="name-error"
                  required
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code">Project Code *</Label>
                <Input
                  id="code"
                  value={formState.projectCode}
                  onChange={(event) => handleChange("projectCode", event.target.value)}
                  onBlur={() => handleBlur("projectCode")}
                  placeholder="e.g. PRJ-2025-001"
                  aria-invalid={Boolean(errors.projectCode)}
                  aria-describedby="code-error"
                  required
                />
                {errors.projectCode && (
                  <p id="code-error" className="text-sm text-destructive">
                    {errors.projectCode}
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
                  placeholder="Add a short description or scope summary (max 500 characters)"
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
                <Label htmlFor="jobType">Job Type</Label>
                <Select value={formState.jobType} onValueChange={(value) => handleChange("jobType", value)}>
                  <SelectTrigger id="jobType">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formState.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
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
                <Label htmlFor="approvalStatus">Approval Status</Label>
                <Select
                  value={formState.approvalStatus}
                  onValueChange={(value) => handleChange("approvalStatus", value)}
                >
                  <SelectTrigger id="approvalStatus">
                    <SelectValue placeholder="Select approval status" />
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
                <Label htmlFor="clientCompany">Client Company</Label>
                <Input
                  id="clientCompany"
                  value={formState.clientCompany}
                  onChange={(event) => handleChange("clientCompany", event.target.value)}
                  onBlur={() => handleBlur("clientCompany")}
                  placeholder="Client name (optional)"
                  aria-invalid={Boolean(errors.clientCompany)}
                  aria-describedby="clientCompany-error"
                />
                {errors.clientCompany && (
                  <p id="clientCompany-error" className="text-sm text-destructive">
                    {errors.clientCompany}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mineSiteName">Mine Site</Label>
                <Input
                  id="mineSiteName"
                  value={formState.mineSiteName}
                  onChange={(event) => handleChange("mineSiteName", event.target.value)}
                  onBlur={() => handleBlur("mineSiteName")}
                  placeholder="Mine site name (optional)"
                  aria-invalid={Boolean(errors.mineSiteName)}
                  aria-describedby="mineSiteName-error"
                />
                {errors.mineSiteName && (
                  <p id="mineSiteName-error" className="text-sm text-destructive">
                    {errors.mineSiteName}
                  </p>
                )}
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="ownerId">Owner Id</Label>
                <Input
                  id="ownerId"
                  value={formState.ownerId}
                  onChange={(event) => handleChange("ownerId", event.target.value)}
                  onBlur={() => handleBlur("ownerId")}
                  placeholder="Numeric owner id (optional)"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.ownerId)}
                  aria-describedby="ownerId-error"
                />
                {errors.ownerId && (
                  <p id="ownerId-error" className="text-sm text-destructive">
                    {errors.ownerId}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button type="submit" disabled={requiredMissing || hasBlockingErrors || isLoading}>
                {isLoading ? "Creating…" : "Create Project"}
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

export default ProjectCreatePage
