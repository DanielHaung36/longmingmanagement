"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useUpdateTaskMutation,
  useGetProjectsQuery,
  useGetClientCompaniesQuery,
  useGetUsersQuery,
  useGetMineralsQuery,
} from "@/state/api"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Avatar,
  Typography,
  Autocomplete,
  CircularProgress,
  InputAdornment,
} from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  FolderOpen as FolderIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material"
import { useToast } from "@/components/ui/use-toast"
import dayjs, { Dayjs } from "dayjs"

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  task: {
    id: number
    title: string
    description?: string
    projectId: number
    assignedUserId?: number
    priority: string
    status: string
    estimatedHours?: number
    actualHours?: number
    progress?: number
    startDate?: string
    dueDate?: string
    mineral?: string
    tags?: string
    quotationNumber?: string
    clientFeedback?: string
    projectManager?: string
    contactCompany?: string
  }
}

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "#94a3b8" },
  { value: "MEDIUM", label: "Medium", color: "#3b82f6" },
  { value: "HIGH", label: "High", color: "#f97316" },
  { value: "URGENT", label: "Urgent", color: "#ef4444" },
]

const STATUS_OPTIONS = [
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
]

interface FormData {
  title: string
  description: string
  projectId: string
  assignedUserId: string
  priority: string
  status: string
  estimatedHours: string
  actualHours: string
  progress: string
  startDate: Dayjs | null
  dueDate: Dayjs | null
  mineral: string
  tags: string
  quotationNumber: string
  clientFeedback: string
  projectManager: string
  contactCompany: string
}

interface FormErrors {
  title?: string
  projectId?: string
  estimatedHours?: string
  dueDate?: string
}

export function EditTaskDialogMUI({ open, onClose, onSuccess, task }: Props) {
  const { toast } = useToast()
  const [updateTask, { isLoading }] = useUpdateTaskMutation()
  const { data: projectsResponse } = useGetProjectsQuery({ pageSize: 1000 })
  const { data: clientCompaniesResponse } = useGetClientCompaniesQuery()
  const { data: usersResponse } = useGetUsersQuery()
  const { data: mineralsResponse } = useGetMineralsQuery()

  const projects = projectsResponse?.data?.projects || []
  const users = usersResponse?.data?.data || []
  // 直接使用后端返回的去重 client companies 列表（高效查询）
  const clientCompaniesFromApi = clientCompaniesResponse?.data || []

  const [clientFilter, setClientFilter] = useState("")
  const [mineSiteFilter, setMineSiteFilter] = useState("")

  const [formData, setFormData] = useState<FormData>({
    title: task.title,
    description: task.description || "",
    projectId: String(task.projectId),
    assignedUserId: task.assignedUserId ? String(task.assignedUserId) : "",
    priority: task.priority,
    status: task.status,
    estimatedHours: task.estimatedHours ? String(task.estimatedHours) : "",
    actualHours: task.actualHours ? String(task.actualHours) : "",
    progress: task.progress !== undefined ? String(task.progress) : "0",
    startDate: task.startDate ? dayjs(task.startDate) : null,  // ✅ 改为 dayjs 对象
    dueDate: task.dueDate ? dayjs(task.dueDate) : null,        // ✅ 改为 dayjs 对象
    mineral: task.mineral || "",
    tags: task.tags || "",
    quotationNumber: task.quotationNumber || "",
    clientFeedback: task.clientFeedback || "",
    projectManager: task.projectManager || "",
    contactCompany: task.contactCompany || "",
  })

  const uniqueMineralTypes = mineralsResponse?.data || []

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // 优先使用后端 API 返回的 client companies（高效），否则从 projects 中提取
  const clientOptions = useMemo(() => {
    if (clientCompaniesFromApi.length > 0) {
      return clientCompaniesFromApi
    }
    // 降级：从 projects 中提取（兼容旧数据）
    const set = new Set<string>()
    projects.forEach((project) => {
      const client = project.clientCompany?.trim()
      if (client) {
        set.add(client)
      }
    })
    return Array.from(set)
  }, [clientCompaniesFromApi, projects])

  const mineSiteOptions = useMemo(() => {
    if (!clientFilter) return []
    const set = new Set<string>()
    projects.forEach((project) => {
      const client = project.clientCompany?.trim()
      const site = project.mineSiteName?.trim()
      if (client && client === clientFilter.trim() && site) {
        set.add(site)
      }
    })
    return Array.from(set)
  }, [projects, clientFilter])

  const selectedProject = projects.find((p) => String(p.id) === formData.projectId) || null

  // Reset form when task changes
  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description || "",
      projectId: String(task.projectId),
      assignedUserId: task.assignedUserId ? String(task.assignedUserId) : "",
      priority: task.priority,
      status: task.status,
      estimatedHours: task.estimatedHours ? String(task.estimatedHours) : "",
      actualHours: task.actualHours ? String(task.actualHours) : "",
      progress: task.progress !== undefined ? String(task.progress) : "0",
      startDate: task.startDate ? dayjs(task.startDate) : null,  // ✅ 确保这里也是 dayjs
      dueDate: task.dueDate ? dayjs(task.dueDate) : null,        // ✅ 确保这里也是 dayjs
      mineral: task.mineral || "",
      tags: task.tags || "",
      quotationNumber: task.quotationNumber || "",
      clientFeedback: task.clientFeedback || "",
      projectManager: task.projectManager || "",
      contactCompany: task.contactCompany || "",
    })
    setErrors({})
    setTouched({})
    const matchedProject = projects.find((p) => p.id === task.projectId)
    setClientFilter(matchedProject?.clientCompany || "")
    setMineSiteFilter(matchedProject?.mineSiteName || "")
  }, [task, projects])

  useEffect(() => {
    if (!clientFilter) return
    const normalizedClient = clientFilter.trim()
    const normalizedMine = mineSiteFilter.trim()

    let matchedProject = projects.find(
      (project) =>
        (project.clientCompany || "").trim() === normalizedClient &&
        (normalizedMine ? (project.mineSiteName || "").trim() === normalizedMine : true),
    )

    if (!matchedProject && !normalizedMine) {
      matchedProject = projects.find(
        (project) => (project.clientCompany || "").trim() === normalizedClient,
      )
    }

    if (matchedProject && String(matchedProject.id) !== formData.projectId) {
      setFormData((prev) => ({
        ...prev,
        projectId: String(matchedProject!.id),
      }))
    }
  }, [clientFilter, mineSiteFilter, projects])

  useEffect(() => {
    const project = projects.find((p) => String(p.id) === formData.projectId)
    const client = project?.clientCompany || ""
    const site = project?.mineSiteName || ""
    if (client && client !== clientFilter) {
      setClientFilter(client)
    }
    if (site !== mineSiteFilter) {
      setMineSiteFilter(site)
    }
    if (!project) {
      setClientFilter("")
      setMineSiteFilter("")
    }
  }, [formData.projectId, projects])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required"
    } else if (formData.title.length < 3) {
      newErrors.title = "Task title must be at least 3 characters"
    }

    if (!formData.projectId) {
      newErrors.projectId = "Project is required"
    }

    if (formData.estimatedHours && isNaN(Number(formData.estimatedHours))) {
      newErrors.estimatedHours = "Must be a valid number"
    } else if (Number(formData.estimatedHours) < 0) {
      newErrors.estimatedHours = "Cannot be negative"
    }

    if (formData.actualHours && isNaN(Number(formData.actualHours))) {
      newErrors.estimatedHours = "Must be a valid number"
    } else if (Number(formData.actualHours) < 0) {
      newErrors.estimatedHours = "Cannot be negative"
    }

    if (formData.progress && (isNaN(Number(formData.progress)) || Number(formData.progress) < 0 || Number(formData.progress) > 100)) {
      newErrors.estimatedHours = "Progress must be between 0 and 100"
    }

    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate)
      const due = new Date(formData.dueDate)
      if (due < start) {
        newErrors.dueDate = "Due date must be after start date"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    validateForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setTouched({
      title: true,
      projectId: true,
      estimatedHours: true,
      dueDate: true,
    })

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      })
      return
    }

    try {
      await updateTask({
        id: task.id,
        data: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          projectId: Number(formData.projectId),
          assignedUserId: formData.assignedUserId ? Number(formData.assignedUserId) : undefined,
          priority: formData.priority as any,
          status: formData.status as any,
          estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
          actualHours: formData.actualHours ? Number(formData.actualHours) : undefined,
          progress: formData.progress ? Number(formData.progress) : undefined,
          startDate: formData.startDate ? formData.startDate.toISOString() : null,
          dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
          mineral: formData.mineral || undefined,
          tags: formData.tags || undefined,
          quotationNumber: formData.quotationNumber || undefined,
          clientFeedback: formData.clientFeedback || undefined,
          projectManager: formData.projectManager || undefined,
          contactCompany: formData.contactCompany || undefined,
        }
      }).unwrap()

      toast({
        title: "Success",
        description: "Task updated successfully",
      })

      handleClose()
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    onClose()
  }

  const selectedProjectDetail = projects.find((p) => String(p.id) === formData.projectId)
  const selectedUser = users.find((u) => String(u.id) === formData.assignedUserId)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
        }
      }}
      TransitionProps={{
        timeout: 400,
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          pt: 3,
          px: 3,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              Edit Project
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              Update project details and assignments
            </Typography>
          </Box>
          <Button
            onClick={handleClose}
            size="small"
            sx={{
              minWidth: 'auto',
              p: 1,
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent
          dividers
          sx={{
            py: 4,
            px: 3,
            backgroundColor: '#fafbfc',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Task Title */}
            <TextField
              label="Project Name"
              placeholder="Enter name title..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onBlur={() => handleBlur("title")}
              error={touched.title && !!errors.title}
              helperText={touched.title && errors.title}
              required
              fullWidth
              autoFocus
            />

            {/* Description */}
            <TextField
              label="Description"
              placeholder="Describe what needs to be done..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            {/* Client & Mine Site selectors */}
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
              gap={2}
            >
              <Autocomplete
                options={clientOptions}
                value={clientFilter || null}
                onChange={(_, value) => setClientFilter(value || "")}
                renderInput={(params) => (
                  <TextField {...params} label="Client Company" placeholder="Select client..." />
                )}
              />
              <Autocomplete
                options={mineSiteOptions}
                value={mineSiteFilter || null}
                onChange={(_, value) => setMineSiteFilter(value || "")}
                disabled={!clientFilter}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Mine Site"
                    placeholder={clientFilter ? "Select mine site..." : "Select client first"}
                  />
                )}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {selectedProjectDetail
                ? `Current project: ${selectedProjectDetail.name} (${selectedProjectDetail.clientCompany || "No client"} - ${
                    selectedProjectDetail.mineSiteName || "No site"
                })`
                : "No project selected"}
            </Typography>

            {/* Project & Assigned User */}
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
              <Autocomplete
                options={projects}
                getOptionLabel={(option) => `${option.projectCode} - ${option.name}`}
                value={selectedProjectDetail || null}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, projectId: newValue ? String(newValue.id) : "" })
                }}
                onBlur={() => handleBlur("projectId")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Project"
                    placeholder="Select project..."
                    required
                    error={touched.projectId && !!errors.projectId}
                    helperText={touched.projectId && errors.projectId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <FolderIcon sx={{ mr: 1, color: 'action.active' }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.projectCode} • {option.clientCompany || "No client"}
                      </Typography>
                    </Box>
                  </li>
                )}
              />

              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.realName || option.username}
                value={selectedUser || null}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, assignedUserId: newValue ? String(newValue.id) : "" })
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned To"
                    placeholder="Select assignee..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                        {(option.realName?.[0] || option.username[0]).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{option.realName || option.username}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
              />
            </Box>

            {/* Priority & Status */}
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  {PRIORITIES.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      <Chip
                        label={p.label}
                        size="small"
                        sx={{
                          backgroundColor: `${p.color}20`,
                          color: p.color,
                          fontWeight: 500,
                        }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  format="DD-MM-YYYY"
                  onChange={(value) => {
                    console.log(value);
                    setFormData({ ...formData, startDate: value })
                  }}
                  slotProps={{
                    textField: {
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />

                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  format="DD-MM-YYYY"
                  onChange={(value) => setFormData({ ...formData, dueDate: value })}
                  slotProps={{
                    textField: {
                      onBlur: () => handleBlur("dueDate"),
                      error: touched.dueDate && !!errors.dueDate,
                      helperText: touched.dueDate && errors.dueDate,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </Box>
            </LocalizationProvider>

            {/* Hours & Progress */}
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr 1fr" }} gap={2}>
              <TextField
                label="Est. Hours"
                type="number"
                placeholder="40"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                onBlur={() => handleBlur("estimatedHours")}
                error={touched.estimatedHours && !!errors.estimatedHours}
                helperText={touched.estimatedHours && errors.estimatedHours}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimeIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />

              <TextField
                label="Actual Hours"
                type="number"
                placeholder="35"
                value={formData.actualHours}
                onChange={(e) => setFormData({ ...formData, actualHours: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimeIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />

              <TextField
                label="Progress (%)"
                type="number"
                placeholder="50"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                InputProps={{
                  inputProps: { min: 0, max: 100 }
                }}
                fullWidth
              />
            </Box>

            {/* Mineral & Tags */}
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
              <Autocomplete
                options={uniqueMineralTypes}
                freeSolo
                value={formData.mineral || ""}
                onChange={(_, value) => setFormData({ ...formData, mineral: value || "" })}
                onInputChange={(_, value) => setFormData({ ...formData, mineral: value })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Mineral Type"
                    placeholder="e.g., Iron Ore, Gold, Copper..."
                  />
                )}
                fullWidth
              />

              <TextField
                label="Tags"
                placeholder="e.g., urgent, sample-analysis..."
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                fullWidth
              />
            </Box>

            {/* Quotation & Contact Info */}
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
              <TextField
                label="Quotation Number"
                placeholder="QT-2024-001"
                value={formData.quotationNumber}
                onChange={(e) => setFormData({ ...formData, quotationNumber: e.target.value })}
                fullWidth
              />

              <TextField
                label="Contact Company"
                placeholder="Client company name"
                value={formData.contactCompany}
                onChange={(e) => setFormData({ ...formData, contactCompany: e.target.value })}
                fullWidth
              />
            </Box>

            {/* Project Manager */}
            <TextField
              label="Project Manager"
              placeholder="Manager name"
              value={formData.projectManager}
              onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
              fullWidth
            />

            {/* Client Feedback */}
            <TextField
              label="Client Feedback"
              placeholder="Client comments or feedback..."
              value={formData.clientFeedback}
              onChange={(e) => setFormData({ ...formData, clientFeedback: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            backgroundColor: '#ffffff',
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={isLoading}
            variant="outlined"
            sx={{
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.secondary',
                backgroundColor: 'action.hover',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              boxShadow: '0 4px 12px rgba(245, 87, 108, 0.4)',
              px: 3,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #d97fe3 0%, #d64555 100%)',
                boxShadow: '0 6px 16px rgba(245, 87, 108, 0.5)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              }
            }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
