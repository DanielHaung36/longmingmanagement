"use client"

import { useState, useEffect, useMemo } from "react"
import { useCreateProjectMutation, useGetUsersQuery, useGetMineSitesQuery, useGetProjectsQuery, useGetClientCompaniesQuery } from "@/state/api"
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
  FormHelperText,
  Chip,
  Box,
  Avatar,
  Typography,
  Autocomplete,
  CircularProgress,
  Alert,
} from "@mui/material"
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from "@mui/icons-material"
import { useToast } from "@/components/ui/use-toast"

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
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

interface FormData {
  name: string
  description: string
  // jobType 已删除 - jobType 只在 task 级别定义
  priority: string
  clientCompany: string
  mineSiteName: string
  ownerId: string
  teamMembers: string[]
}

interface FormErrors {
  name?: string
  ownerId?: string
  clientCompany?: string
}

export function CreateProjectDialogMUI({ open, onClose, onSuccess }: Props) {
  const { toast } = useToast()
  const [createProject, { isLoading }] = useCreateProjectMutation()
  const { data: usersResponse } = useGetUsersQuery({ pageSize: 500 })
  const { data: mineSitesResponse } = useGetMineSitesQuery()
  const { data: projectsResponse } = useGetProjectsQuery({ pageSize: 1000 })
  const { data: clientCompaniesResponse } = useGetClientCompaniesQuery()

  // 错误对话框状态
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean
    title: string
    message: string
    details?: any
  }>({
    open: false,
    title: '',
    message: '',
  })

  const usersPayload = usersResponse?.data?.data
  const users = Array.isArray(usersPayload) ? usersPayload : []
  const mineSites = mineSitesResponse?.data || []
  const projects = projectsResponse?.data?.projects || []
  // 直接使用后端返回的去重 client companies 列表（高效查询）
  const clientCompaniesFromApi = clientCompaniesResponse?.data || []

  // 优先使用后端 API 返回的 client companies（高效），否则从 projects 中提取
  const uniqueClientCompanies = useMemo(() => {
    if (clientCompaniesFromApi.length > 0) {
      return clientCompaniesFromApi
    }
    // 降级：从 projects 中提取（兼容旧数据）
    return Array.from(new Set(projects.map(p => p.clientCompany).filter(Boolean))).sort() as string[]
  }, [clientCompaniesFromApi, projects])

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    // jobType 已删除 - jobType 只在 task 级别定义
    priority: "MEDIUM",
    clientCompany: "",
    mineSiteName: "",
    ownerId: "",
    teamMembers: [],
  })

  // 根据选择的 client 过滤 mineSites
  const filteredMineSites = useMemo(() => {
    if (!formData.clientCompany) {
      // 如果没有选择 client，显示所有 mineSites
      return Array.from(new Set(projects.map(p => p.mineSiteName).filter(Boolean))).sort() as string[]
    }
    // 过滤出该 client 对应的 mineSites
    const sites = projects
      .filter(p => p.clientCompany === formData.clientCompany)
      .map(p => p.mineSiteName)
      .filter(Boolean)
    return Array.from(new Set(sites)).sort() as string[]
  }, [formData.clientCompany, projects])

  // 当选择 mineSite 时，自动填充对应的 client
  const handleMineSiteChange = (mineSite: string) => {
    const project = projects.find(p => p.mineSiteName === mineSite)
    if (project && project.clientCompany) {
      setFormData(prev => ({
        ...prev,
        mineSiteName: mineSite,
        clientCompany: project.clientCompany || prev.clientCompany
      }))
    } else {
      setFormData(prev => ({ ...prev, mineSiteName: mineSite }))
    }
  }

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

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

    // Mark all fields as touched
    setTouched({
      name: true,
      ownerId: true,
      clientCompany: true,
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
      await createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        // jobType 已删除 - jobType 只在 task 级别定义
        priority: formData.priority as any,
        status: "PLANNING",
        clientCompany: formData.clientCompany.trim() || undefined,
        mineSiteName: formData.mineSiteName || undefined,
        ownerId: Number(formData.ownerId),
        teamMembers: formData.teamMembers.map(id => Number(id)), // ✅ 添加团队成员
      }).unwrap()

      toast({
        title: "Success",
        description: "Project created successfully",
      })

      handleClose()
      onSuccess?.()
    } catch (error: any) {
      console.error('Create project error:', error)

      // 处理409冲突错误
      if (error?.status === 409) {
        const errorData = error?.data?.data
        const errorMsg = error?.data?.message || "项目已存在"

        // 先关闭当前对话框
        onClose()

        // 延迟显示错误对话框，确保创建对话框已经关闭
        setTimeout(() => {
          setErrorDialog({
            open: true,
            title: '⚠️ 项目重复',
            message: errorMsg,
            details: errorData,
          })
        }, 300)
      } else {
        // 其他错误
        setErrorDialog({
          open: true,
          title: '创建失败',
          message: error?.data?.message || 'Failed to create project',
        })
      }
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      // jobType 已删除 - jobType 只在 task 级别定义
      priority: "MEDIUM",
      clientCompany: "",
      mineSiteName: "",
      ownerId: "",
      teamMembers: [],
    })
    setErrors({})
    setTouched({})
    onClose()
  }

  const selectedOwner = users.find((u) => String(u.id) === formData.ownerId)
  const teamMembersData = users.filter((u) => formData.teamMembers.includes(String(u.id)))

  return (
    <>
      {/* 错误对话框 */}
      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          {errorDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {errorDialog.message}
          </Typography>
          {errorDialog.details && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#666' }}>
                现有项目信息：
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {errorDialog.details.existingProjectCode && (
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 90, color: '#666' }}>
                      项目编号:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {errorDialog.details.existingProjectCode}
                    </Typography>
                  </Box>
                )}
                {errorDialog.details.existingProjectName && (
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 90, color: '#666' }}>
                      项目名称:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {errorDialog.details.existingProjectName}
                    </Typography>
                  </Box>
                )}
                {errorDialog.details.clientCompany && (
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 90, color: '#666' }}>
                      客户公司:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {errorDialog.details.clientCompany}
                    </Typography>
                  </Box>
                )}
                {errorDialog.details.mineSiteName && (
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 90, color: '#666' }}>
                      矿区:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {errorDialog.details.mineSiteName}
                    </Typography>
                  </Box>
                )}
                {errorDialog.details.approvalStatus && (
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 90, color: '#666' }}>
                      审批状态:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000' }}>
                      {errorDialog.details.approvalStatus}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog({ ...errorDialog, open: false })} variant="contained" color="primary">
            知道了
          </Button>
        </DialogActions>
      </Dialog>

      {/* 创建项目对话框 */}
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
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              Create New Minesite
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              Fill in the details below to create a new minesite
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
                    placeholder="Select or type new company..."
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
                freeSolo
                options={filteredMineSites}
                value={formData.mineSiteName}
                onChange={(_, newValue) => {
                  const siteName = typeof newValue === 'string' ? newValue : newValue || ""
                  handleMineSiteChange(siteName)
                }}
                onInputChange={(_, newInputValue) => {
                  handleMineSiteChange(newInputValue)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Mine Site"
                    placeholder="Select or type new site..."
                    helperText={
                      formData.clientCompany && filteredMineSites.length === 0
                        ? "No existing sites for this client. Type a new one."
                        : formData.clientCompany
                        ? `${filteredMineSites.length} site(s) available for this client`
                        : "Select a client first or type a new site"
                    }
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option}
                      </Typography>
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

            {/* Folder Structure Preview */}
            {formData.clientCompany && formData.mineSiteName && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 2,
                  mt: 2,
                }}
              >
                <Typography variant="caption" fontWeight={600} color="primary" sx={{ display: 'block', mb: 1 }}>
                  📂 Folder Structure (Created after approval):
                </Typography>
                <Box sx={{ pl: 2, fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                  <div>📁 Client/</div>
                  <div>&nbsp;&nbsp;└── 📁 <strong>{formData.clientCompany}/</strong> <span style={{color: '#3b82f6', fontSize: '0.7rem'}}>← Client company folder</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── 📄 01 Client General info/ <span style={{color: '#10b981', fontSize: '0.7rem'}}>← Client information</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📁 <strong>{formData.mineSiteName}/</strong> <span style={{color: '#3b82f6', fontSize: '0.7rem'}}>← Mine site folder</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📄 01 Project General Info/ <span style={{color: '#10b981', fontSize: '0.7rem'}}>← Project overview</span></div>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary', fontSize: '0.7rem' }}>
                  💡 Note: Folders will be created automatically in OneDrive after project approval.<br/>
                  📍 Location: {process.env.NEXT_PUBLIC_ONEDRIVE_ROOT || 'OneDrive/Project Management'}/Client/
                </Typography>
              </Box>
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
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.4)',
              px: 3,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #3d8fd9 0%, #00d4e6 100%)',
                boxShadow: '0 6px 16px rgba(79, 172, 254, 0.5)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              }
            }}
          >
            {isLoading ? "Creating..." : "Create Minesite"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
    </>
  )
}
