"use client"

import { useState, useEffect } from "react"
import { useUpdateProjectMutation, useGetUsersQuery, useGetMineSitesQuery, useGetClientCompaniesQuery } from "@/state/api"
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
  Alert,
  Slider,
  Paper,
  Divider,
  LinearProgress,
} from "@mui/material"
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Folder as FolderIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Code as CodeIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material"
import { useToast } from "@/components/ui/use-toast"
import type { Project } from "@/state/api"

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  project: Project
}

const JOB_TYPES = [
  { value: "AC", label: "Consulting", color: "#0ea5e9" },
  { value: "AP", label: "Production", color: "#6366f1" },
  { value: "AQ", label: "Quote", color: "#14b8a6" },
  { value: "AS", label: "Sales", color: "#64748b" },
  { value: "AT", label: "Testwork", color: "#f59e0b" },
]

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "#94a3b8" },
  { value: "MEDIUM", label: "Medium", color: "#3b82f6" },
  { value: "HIGH", label: "High", color: "#f97316" },
  { value: "URGENT", label: "Urgent", color: "#ef4444" },
]

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planning", color: "#6366f1" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#3b82f6" },
  { value: "ON_HOLD", label: "On Hold", color: "#f59e0b" },
  { value: "COMPLETED", label: "Completed", color: "#10b981" },
  { value: "CANCELLED", label: "Cancelled", color: "#ef4444" },
]

const APPROVAL_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", color: "#64748b" },
  { value: "PENDING", label: "Pending", color: "#f59e0b" },
  { value: "APPROVED", label: "Approved", color: "#10b981" },
  { value: "REJECTED", label: "Rejected", color: "#ef4444" },
  { value: "DELETE_PENDING", label: "Delete Pending", color: "#f97316" },
]

interface FormData {
  name: string
  description: string
  priority: string
  status: string
  progress: number
  clientCompany: string
  mineSiteName: string
  ownerId: string
  teamMembers: string[]
}

interface FormErrors {
  name?: string
  ownerId?: string
}

export function EditProjectDialogMUI({ open, onClose, onSuccess, project }: Props) {
  const { toast } = useToast()
  const [updateProject, { isLoading }] = useUpdateProjectMutation()
  const { data: usersResponse } = useGetUsersQuery()
  const { data: mineSitesResponse } = useGetMineSitesQuery()
  const { data: clientCompaniesResponse } = useGetClientCompaniesQuery()

  const users = usersResponse?.data?.data || []
  const mineSites = mineSitesResponse?.data || []
  // 直接使用后端返回的去重 client companies 列表（高效查询）
  const uniqueClientCompanies = clientCompaniesResponse?.data || []

  const [formData, setFormData] = useState<FormData>({
    name: project.name,
    description: project.description || "",
    // jobType 已删除 - jobType 只在 task 级别定义
    priority: project.priority,
    status: project.status,
    progress: project.progress || 0,
    clientCompany: project.clientCompany || "",
    mineSiteName: project.mineSiteName || "",
    ownerId: String(project.ownerId),
    teamMembers: project.projectMembers?.map(m => String(m.id)) || [],
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Reset form when project changes
  useEffect(() => {
    setFormData({
      name: project.name,
      description: project.description || "",
      // jobType 已删除 - jobType 只在 task 级别定义
      priority: project.priority,
      status: project.status,
      progress: project.progress || 0,
      clientCompany: project.clientCompany || "",
      mineSiteName: project.mineSiteName || "",
      ownerId: String(project.ownerId),
      teamMembers: project.projectMembers?.map(m => String(m.id)) || [],
    })
    setErrors({})
    setTouched({})
  }, [project])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required"
    } else if (formData.name.length < 3) {
      newErrors.name = "Project name must be at least 3 characters"
    }

    if (!formData.ownerId) {
      newErrors.ownerId = "Project owner is required"
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
      name: true,
      ownerId: true,
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
      await updateProject({
        id: project.id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          // jobType 已删除 - jobType 只在 task 级别定义
          priority: formData.priority as any,
          status: formData.status as any,
          progress: formData.progress,
          clientCompany: formData.clientCompany.trim() || undefined,
          mineSiteName: formData.mineSiteName || undefined,
          ownerId: Number(formData.ownerId),
        }
      }).unwrap()

      toast({
        title: "Success",
        description: "Project updated successfully",
      })

      handleClose()
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update project",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    onClose()
  }

  const selectedOwner = users.find((u) => String(u.id) === formData.ownerId)
  const teamMembersData = users.filter((u) => formData.teamMembers.includes(String(u.id)))

  const approvalStatusConfig = APPROVAL_STATUS_OPTIONS.find(s => s.value === project.approvalStatus)

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              Edit Project
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              Update project information and track progress
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
            {/* Project Information Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                PROJECT INFORMATION
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CodeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Project Code</Typography>
                    <Typography variant="body2" fontWeight={500}>{project.projectCode || 'N/A'}</Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CheckCircleIcon sx={{ color: approvalStatusConfig?.color || 'grey.500', fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Approval Status</Typography>
                    <Chip
                      label={approvalStatusConfig?.label || project.approvalStatus}
                      size="small"
                      sx={{
                        backgroundColor: `${approvalStatusConfig?.color || '#64748b'}20`,
                        color: approvalStatusConfig?.color || '#64748b',
                        fontWeight: 500,
                        height: 20,
                        fontSize: '0.75rem',
                      }}
                    />
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CalendarIcon sx={{ color: 'info.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Created</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <CalendarIcon sx={{ color: 'info.main', fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                {project.clientFolderPath && (
                  <Box display="flex" alignItems="start" gap={1.5} gridColumn={{ xs: "1", sm: "1 / -1" }}>
                    <FolderIcon sx={{ color: 'warning.main', fontSize: 20, mt: 0.5 }} />
                    <Box flex={1}>
                      <Typography variant="caption" color="text.secondary">Folder Path</Typography>
                      <Typography variant="body2" fontWeight={400} sx={{ wordBreak: 'break-all' }}>
                        {project.clientFolderPath}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Project Name */}
            <TextField
              label="Project Name"
              placeholder="Enter project name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => handleBlur("name")}
              error={touched.name && !!errors.name}
              helperText={touched.name && errors.name}
              required
              fullWidth
              autoFocus
            />

            {/* Description */}
            <TextField
              label="Description"
              placeholder="Describe the project objectives and scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            {/* Priority - jobType 已删除，只在 task 级别定义 */}
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
            </Box>

            {/* Status & Progress */}
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
              <FormControl fullWidth>
                <InputLabel>Project Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Project Status"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      <Chip
                        label={s.label}
                        size="small"
                        sx={{
                          backgroundColor: `${s.color}20`,
                          color: s.color,
                          fontWeight: 500,
                        }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Progress: {formData.progress}%
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrendingUpIcon sx={{ color: 'success.main' }} />
                  <Slider
                    value={formData.progress}
                    onChange={(_, value) => setFormData({ ...formData, progress: value as number })}
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' },
                    ]}
                    valueLabelDisplay="auto"
                    sx={{ flex: 1 }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={formData.progress}
                  sx={{
                    mt: 1,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: formData.progress === 100
                        ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                    }
                  }}
                />
              </Box>

            {/* Client Company & Mine Site */}
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
              <Autocomplete
                options={uniqueClientCompanies}
                value={formData.clientCompany}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, clientCompany: newValue || "" })
                }}
                onInputChange={(_, newInputValue) => {
                  setFormData({ ...formData, clientCompany: newInputValue })
                }}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Client Company"
                    placeholder="Select or type company..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <BusinessIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body2">{option}</Typography>
                    </Box>
                  </li>
                )}
              />

              <Autocomplete
                options={mineSites}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                value={mineSites.find((s) => s.name === formData.mineSiteName) || formData.mineSiteName}
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setFormData({ ...formData, mineSiteName: newValue })
                  } else {
                    setFormData({ ...formData, mineSiteName: newValue?.name || "" })
                  }
                }}
                onInputChange={(_, newInputValue) => {
                  setFormData({ ...formData, mineSiteName: newInputValue })
                }}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Mine Site"
                    placeholder="Select or type site..."
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{option.name}</Typography>
                      {option.location && (
                        <Typography variant="caption" color="text.secondary">
                          📍 {option.location}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
              />
            </Box>

            {/* Project Owner */}
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.realName || option.username}
              value={selectedOwner || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, ownerId: newValue ? String(newValue.id) : "" })
              }}
              onBlur={() => handleBlur("ownerId")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Project Owner"
                  placeholder="Select project owner..."
                  required
                  error={touched.ownerId && !!errors.ownerId}
                  helperText={touched.ownerId && errors.ownerId}
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

            {/* Team Members */}
            <Autocomplete
              multiple
              options={users.filter((u) => String(u.id) !== formData.ownerId)}
              getOptionLabel={(option) => option.realName || option.username}
              value={teamMembersData}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  teamMembers: newValue.map((u) => String(u.id))
                })
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Team Members"
                  placeholder="Add team members..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    avatar={
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {(option.realName?.[0] || option.username[0]).toUpperCase()}
                      </Avatar>
                    }
                    label={option.realName || option.username}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
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

            {/* Approval Info */}
            {project.approvalStatus !== 'APPROVED' && (
              <Alert severity="info" icon={<CheckCircleIcon />}>
                <Typography variant="body2">
                  <strong>Approval Status:</strong> {approvalStatusConfig?.label || project.approvalStatus}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {project.approvalStatus === 'DRAFT' && 'This project is in draft mode. Submit it for approval when ready.'}
                  {project.approvalStatus === 'PENDING' && 'This project is pending approval from an administrator.'}
                  {project.approvalStatus === 'REJECTED' && 'This project was rejected. Please review feedback and resubmit.'}
                  {project.approvalStatus === 'DELETE_PENDING' && 'This project is pending deletion approval.'}
                </Typography>
              </Alert>
            )}
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              px: 3,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #63408b 100%)',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
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
