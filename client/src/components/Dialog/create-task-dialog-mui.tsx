'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  useCreateTaskMutation,
  useGetProjectsQuery,
  useGetClientCompaniesQuery,
  useGetUsersQuery,
  useGetMineralsQuery,
  useCreateProjectMutation,
  useSubmitTaskForApprovalMutation,
} from '@/state/api'
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
  InputAdornment,
  Switch,
  FormControlLabel,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Person as PersonIcon,
  FolderOpen as FolderIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Business as BusinessIcon,
  Terrain as TerrainIcon,
} from '@mui/icons-material'
import { useToast } from '@/components/ui/use-toast'

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultProjectId?: number
}

const JOB_TYPES = [
  { value: 'AC', label: 'Consulting', color: '#0ea5e9' },
  { value: 'AP', label: 'Production', color: '#6366f1' },
  { value: 'AQ', label: 'Quote', color: '#14b8a6' },
  { value: 'AS', label: 'Sales', color: '#64748b' },
  { value: 'AT', label: 'Testwork', color: '#f59e0b' },
]

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#94a3b8' },
  { value: 'MEDIUM', label: 'Medium', color: '#3b82f6' },
  { value: 'HIGH', label: 'High', color: '#f97316' },
  { value: 'URGENT', label: 'Urgent', color: '#ef4444' },
]

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'Todo' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'DONE', label: 'Done' },
]

interface FormData {
  title: string
  description: string
  taskComment: string // 新增：任务备注
  jobType: string // 新增：任务类型（必填）
  projectId: string
  assignedUserId: string
  priority: string
  status: string
  estimatedHours: string
  startDate: Dayjs | null
  dueDate: Dayjs | null
  mineral: string
  // 新项目相关字段
  clientCompany: string
  mineSiteName: string
}

interface FormErrors {
  title?: string
  jobType?: string
  projectId?: string
  estimatedHours?: string
  dueDate?: string
}

export function CreateTaskDialogMUI({ open, onClose, onSuccess, defaultProjectId }: Props) {
  const { toast } = useToast()
  const [createTask, { isLoading }] = useCreateTaskMutation()
  const [createProject, { isLoading: isCreatingProject }] = useCreateProjectMutation()
  const [submitTaskForApproval] = useSubmitTaskForApprovalMutation()
  const { data: projectsResponse, refetch: refetchProjects } = useGetProjectsQuery({ pageSize: 1000 })
  const { data: clientCompaniesResponse } = useGetClientCompaniesQuery()
  const { data: usersResponse } = useGetUsersQuery({ pageSize: 500 })
  const { data: mineralsResponse } = useGetMineralsQuery()
  const [clientInput, setClientInput] = useState('')
  const [mineSiteInput, setMineSiteInput] = useState('')
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)

  const projects = projectsResponse?.data?.projects || []
  // 修复：确保正确获取用户列表
  const users = Array.isArray(usersResponse?.data?.data)
    ? usersResponse.data.data
    : Array.isArray(usersResponse?.data)
      ? usersResponse.data
      : []
  // Get unique mineral types from API
  const uniqueMineralTypes = mineralsResponse?.data || []
  // 直接使用后端返回的去重 client companies 列表（高效查询）
  const clientCompaniesFromApi = clientCompaniesResponse?.data || []

  // 优先使用后端 API 返回的 client companies（高效），否则从 projects 中提取
  const uniqueCompanies = useMemo(() => {
    if (clientCompaniesFromApi.length > 0) {
      return clientCompaniesFromApi
    }
    // 降级：从 projects 中提取（兼容旧数据）
    return Array.from(
      new Set(
        projects
          .filter((p) => p.approvalStatus === "APPROVED")
          .map((p) => p.clientCompany)
          .filter(Boolean)
      )
    ).sort() as string[];
  }, [clientCompaniesFromApi, projects]);

    const uniqueMineSites = useMemo(() => {
      return Array.from(
        new Set(
          projects
            .filter((p) => p.approvalStatus === "APPROVED")      // ✅ 同样过滤
            .map((p) => p.mineSiteName)
            .filter(Boolean)
        )
      ).sort() as string[];
    }, [projects]);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    taskComment: '',
    jobType: 'AT', // 默认为 Testwork 类型
    projectId: defaultProjectId ? String(defaultProjectId) : '',
    assignedUserId: '',
    priority: 'MEDIUM',
    status: 'TODO',
    startDate: null,
    dueDate: null,
    estimatedHours: '',
    mineral: '',
    clientCompany: '',
    mineSiteName: '',
  })

  // Get mine sites associated with selected client company
  const mineSitesForCompany = useMemo(() => {
    if (!formData.clientCompany) return []
    return Array.from(
      new Set(
        projects
          .filter((p) => p.clientCompany === formData.clientCompany)
          .map((p) => p.mineSiteName)
          .filter(Boolean),
      ),
    ).sort() as string[]
  }, [projects, formData.clientCompany])

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Project name is required'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Project name must be at least 3 characters'
    }

    if (!formData.jobType) {
      newErrors.jobType = 'Task type is required'
    }

    // ✅ 修复：根据是否创建新 minesite 来验证不同的字段
    if (showNewProjectForm) {
      // 创建新 minesite 时，验证 clientCompany 和 mineSiteName
      if (!formData.clientCompany?.trim()) {
        newErrors.projectId = 'Client company is required'
      } else if (!formData.mineSiteName?.trim()) {
        newErrors.projectId = 'Mine site name is required'
      }
    } else {
      // 选择现有 minesite 时，验证 projectId
      // if (!formData.projectId) {
      //   newErrors.projectId = 'Minesite is required'
      // }
    }

    if (formData.estimatedHours && isNaN(Number(formData.estimatedHours))) {
      newErrors.estimatedHours = 'Must be a valid number'
    } else if (Number(formData.estimatedHours) < 0) {
      newErrors.estimatedHours = 'Cannot be negative'
    }

    if (formData.startDate && formData.dueDate) {
      if (formData.dueDate.isBefore(formData.startDate)) {
        newErrors.dueDate = 'Due date must be after start date'
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
    console.log('🔵 handleSubmit 开始', { formData, showNewProjectForm })
    let finalProjectId: number | null = null
    setTouched({
      title: true,
      jobType: true,
      // projectId: true,
      estimatedHours: true,
      dueDate: true,
    })

    if (!validateForm()) {
      console.log('❌ 表单验证失败', errors)
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    console.log('✅ 表单验证通过')

    try {
      // ======= Auto-create Project Flow =======
      if (showNewProjectForm) {
        console.log('🆕 准备创建新 minesite', {
          clientCompany: formData.clientCompany,
          mineSiteName: formData.mineSiteName,
        })
        const { clientCompany, mineSiteName } = formData

        if (!clientCompany.trim() || !mineSiteName.trim()) {
          toast({
            title: 'Validation Error',
            description: 'Client company and mine site are required for new minesite',
            variant: 'destructive',
          })
          return
        }

        // Check for new entities
        const isNewCompany = !uniqueCompanies.includes(clientCompany)
        const isNewMineSite = !uniqueMineSites.includes(mineSiteName)
        const isNewMineral = formData.mineral && !uniqueMineralTypes.includes(formData.mineral)

        // Build new entities message
        const newEntities: string[] = []
        if (isNewCompany) newEntities.push(`🏢 Client Company: "${clientCompany}"`)
        if (isNewMineSite) newEntities.push(`⛏️ Mine Site: "${mineSiteName}"`)
        if (isNewMineral) newEntities.push(`💎 Mineral Type: "${formData.mineral}"`)

        // Show consolidated notification for new entities
        if (newEntities.length > 0) {
          toast({
            title: '⚠️ New Entities Detected',
            description: (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  The following new entities will be created:
                </Typography>
                {newEntities.map((entity, idx) => (
                  <Typography key={idx} variant="caption" sx={{ display: 'block', ml: 1 }}>
                    • {entity}
                  </Typography>
                ))}
                <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                  ℹ️ Project will auto approval before activation.
                </Typography>
              </Box>
            ),
          })
        }

        // Step 1: Create Project
        try {
          const projectPayload = {
            name: `${clientCompany} - ${mineSiteName}`,
            clientCompany: clientCompany.trim(),
            mineSiteName: mineSiteName.trim(),
            description: `[Auto-created from Task] ${formData.description || formData.title}`,
            // ✅ 不传 ownerId，让后端自动使用当前登录用户的ID
            jobType: formData.jobType, // ✅ 传递任务的 jobType，用于生成正式的项目编号
            autoApproveFromTask: true,
          }

          const newProject = await createProject(projectPayload).unwrap()
          // 重新拉取项目数据
          toast({
            title: 'Minesite Ready',
            description: '✅ New minesite created and auto-approved!',
          })
          console.log(newProject);
          
          const createdProjectId = newProject.data.id
          finalProjectId = createdProjectId

          await refetchProjects()
        } catch (projectError: any) {
          console.error('❌ 创建 minesite 失败', projectError)

          // Check for duplicate minesite (409 status code or message)
          if (
            projectError?.status === 409 ||
            projectError?.data?.message?.includes('already exists') ||
            projectError?.data?.message?.includes('duplicate') ||
            projectError?.data?.message?.includes('已存在') ||
            projectError?.data?.message?.includes('组合已存在')
          ) {
            // 提取现有项目的详细信息
            const existingProject = projectError?.data?.data
            const existingCode = existingProject?.existingProjectCode || 'Unknown'
            const existingStatus = existingProject?.approvalStatus || 'Unknown'

            alert(
              `⚠️ Minesite Already Exists!\n\n` +
                `The minesite "${clientCompany} - ${mineSiteName}" already exists.\n\n` +
                `Existing Code: ${existingCode}\n` +
                `Status: ${existingStatus}\n\n` +
                `💡 Please turn off "Create New Minesite" and select it from the dropdown instead.`,
            )
          } else {
            alert(
              `❌ Error Creating Minesite\n\n` +
                `${projectError?.data?.message || projectError?.message || 'Failed to create minesite. Please try again.'}`,
            )
          }
          console.log('⏹️ 停止任务创建')
          return // Stop task creation if minesite creation fails
        }
      }

      // ======= Create Task =======

      // 关键修改：全部 trim + toLowerCase 防大小写问题
     const trimmedClient = formData.clientCompany.trim()
     const trimmedMineSite = formData.mineSiteName.trim()

      if (!finalProjectId && formData.clientCompany && formData.mineSiteName) {
        console.log(formData.clientCompany, formData.mineSiteName)
        console.log("当前项目列表：", projects.map(p => ({
          id: p.id,
          clientCompany: p.clientCompany,
          mineSiteName: p.mineSiteName,
        })));

        const matchedProject = projects.find((proj) => {
         const projClient = proj.clientCompany?.trim()
          const projSite = proj.mineSiteName?.trim()
           return projClient === trimmedClient && projSite === trimmedMineSite
        })
        console.log('===================', matchedProject)
        finalProjectId = matchedProject?.id ?? null
      }
      console.log(finalProjectId);
      if (finalProjectId === null) {
        toast({
          title: 'Validation Error',
          description: 'Please select or create a minesite first',
          variant: 'destructive',
        })
        return
      }

      const projectIdForTask = finalProjectId

      const taskPayload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        taskComment: formData.taskComment.trim() || undefined,
        jobType: formData.jobType as any,
        projectId: Number(projectIdForTask),
        assignedUserId: formData.assignedUserId ? Number(formData.assignedUserId) : undefined,
        priority: formData.priority as any,
        status: formData.status as any,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        startDate: formData.startDate ? formData.startDate?.toDate() || '' : undefined,
        dueDate: formData.dueDate ? formData.dueDate?.toDate() || '' : undefined,
        mineral: formData.mineral || undefined,
      }

      console.log('📝 准备创建任务', taskPayload)
      const createdTaskResponse = await createTask(taskPayload).unwrap()
      console.log('✅ 任务创建成功')

      toast({
        title: 'Success',
        description: showNewProjectForm
          ? '✅ Project created successfully with new minesite!'
          : '✅ Project created successfully!',
      })

      const createdTaskId = createdTaskResponse?.data?.id

      if (createdTaskId) {
        try {
          await submitTaskForApproval(createdTaskId).unwrap()
          toast({
            title: 'Approval Requested',
            description: '✅ Task approval request submitted automatically!',
          })
        } catch (taskApprovalError) {
          console.error('❌ 自动提交任务审批失败', taskApprovalError)
          toast({
            title: 'Approval Submission Failed',
            description: '⚠️ Project created but failed to submit for approval. Please open the task to submit manually.',
            variant: 'destructive',
          })
        }
      } else {
        console.warn('⚠️ 创建任务返回数据缺少ID，无法自动提交审批')
      }

      handleClose()
      onSuccess?.()
    } catch (error: any) {
      console.error('❌ 创建任务失败', error)

      // 检查是否是项目未审批通过的错误
      if (
        error?.data?.error?.code === 'TASK_CREATE_FAILED' &&
        error?.data?.error?.message?.includes('未审批通过')
      ) {
        alert(
          `⚠️ Cannot Create Task\n\n` +
            `The minesite needs to be approved before you can create tasks.\n\n` +
            `The new minesite "${formData.clientCompany} - ${formData.mineSiteName}" has been created and submitted for approval.\n\n` +
            `✅ Please wait for approval, then try creating the task again.`,
        )
      } else {
        alert(
          `❌ Failed to Create Task\n\n` +
            `${error?.data?.error?.message || error?.data?.message || error?.message || 'An unknown error occurred'}`,
        )
      }
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      taskComment: '',
      jobType: 'AT', // 重置为默认的 Testwork 类型
      projectId: defaultProjectId ? String(defaultProjectId) : '',
      assignedUserId: '',
      priority: 'MEDIUM',
      status: 'TODO',
      estimatedHours: '',
      startDate: null,
      dueDate: null,
      mineral: '',
      clientCompany: '',
      mineSiteName: '',
    })
    setErrors({})
    setTouched({})
    setShowNewProjectForm(false)
    onClose()
  }

  const selectedProject = projects.find((p) => String(p.id) === formData.projectId)
  const selectedUser = users?.find((u) => String(u.id) === formData.assignedUserId)

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
        },
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
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              Create New Project
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              Add a Project to an existing minesite or create a new one
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
              },
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
            {/* Toggle for New Minesite Creation */}

            {/* Task Title */}
            <TextField
              label="Project name"
              placeholder="Enter project name..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onBlur={() => handleBlur('title')}
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

            {/* Task Comment */}
            <TextField
              label="Project Comment"
              placeholder="Add any additional comments or notes for this project..."
              value={formData.taskComment}
              onChange={(e) => setFormData({ ...formData, taskComment: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            {/* Task Type */}
            <FormControl fullWidth required error={touched.jobType && !!errors.jobType}>
              <InputLabel>Project Type</InputLabel>
              <Select
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                onBlur={() => handleBlur('jobType')}
                label="Project Type"
              >
                {JOB_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: type.color,
                        }}
                      />
                      <Typography>{type.label}</Typography>
                      <Chip
                        label={type.value}
                        size="small"
                        sx={{
                          backgroundColor: `${type.color}20`,
                          color: type.color,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {touched.jobType && errors.jobType && (
                <FormHelperText>{errors.jobType}</FormHelperText>
              )}
            </FormControl>

            <Card
              sx={{
                backgroundColor: showNewProjectForm ? '#e3f2fd' : '#f5f5f5',
                borderColor: showNewProjectForm ? '#2196f3' : '#e0e0e0',
                border: '2px solid',
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <BusinessIcon
                      sx={{
                        color: showNewProjectForm ? '#2196f3' : '#9e9e9e',
                        fontSize: 20,
                      }}
                    />
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={showNewProjectForm ? 'primary' : 'text.secondary'}
                      >
                        Create New Minesite
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {showNewProjectForm
                          ? 'Fill in new minesite details below'
                          : 'Enable to create a minesite while creating this task'}
                      </Typography>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showNewProjectForm}
                        onChange={(e) => {
                          setShowNewProjectForm(e.target.checked)
                          if (e.target.checked) {
                            // Clear projectId when switching to new project mode
                            setFormData({ ...formData, projectId: '' })
                          }
                        }}
                        color="primary"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Minesite Selection or New Minesite Form */}
            {!showNewProjectForm ? (
              // Existing Minesite Selection
              // <Autocomplete
              //   options={projects}
              //   getOptionLabel={(option) =>
              //     `${option.projectCode} - ${option.clientCompany || 'No Client'} - ${option.mineSiteName || 'No Site'}`
              //   }
              //   value={selectedProject || null}
              //   onChange={(_, newValue) => {
              //     setFormData({ ...formData, projectId: newValue ? String(newValue.id) : "" })
              //   }}
              //   onBlur={() => handleBlur("projectId")}
              //   renderInput={(params) => (
              //     <TextField
              //       {...params}
              //       label="Minesite"
              //       placeholder="Select minesite by client and mine site..."
              //       required
              //       error={touched.projectId && !!errors.projectId}
              //       helperText={touched.projectId && errors.projectId}
              //       InputProps={{
              //         ...params.InputProps,
              //         startAdornment: (
              //           <>
              //             <FolderIcon sx={{ mr: 1, color: 'action.active' }} />
              //             {params.InputProps.startAdornment}
              //           </>
              //         ),
              //       }}
              //     />
              //   )}
              //   renderOption={(props, option) => (
              //     <li {...props}>
              //       <Box sx={{ width: '100%' }}>
              //         <Typography
              //           variant="caption"
              //           sx={{
              //             color: 'primary.main',
              //             fontWeight: 600,
              //             fontFamily: 'monospace',
              //             fontSize: '0.75rem',
              //             mb: 0.5,
              //             backgroundColor: 'primary.light',
              //             px: 1,
              //             py: 0.25,
              //             borderRadius: 0.5,
              //             display: 'inline-block'
              //           }}
              //         >
              //           {option.projectCode}
              //         </Typography>
              //         <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, color: 'text.primary' }}>
              //           {option.clientCompany || "No client"}
              //         </Typography>
              //         <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              //           <TerrainIcon sx={{ fontSize: 12 }} />
              //           {option.mineSiteName || "No site"}
              //         </Typography>
              //       </Box>
              //     </li>
              //   )}
              // />
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                {/* CLIENT COMPANY */}
                <Autocomplete
                  options={uniqueCompanies}
                  value={formData.clientCompany || null}
                  inputValue={clientInput}
                  onInputChange={(_, newInput) => {
                    setClientInput(newInput)
                  }}
                  onChange={(_, newValue) => {
                    // 真正选择时才更新
                    setFormData({
                      ...formData,
                      clientCompany: newValue || '',
                      mineSiteName: '',
                      projectId: '',
                    })
                    setClientInput(newValue || '') // 同步输入框
                    setMineSiteInput('') // 清空 mineSite 输入框
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Client Company"
                      placeholder="Select client company"
                      required
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
                />

                {/* MINE SITE */}
                <Autocomplete
                  options={mineSitesForCompany.length > 0 ? mineSitesForCompany : uniqueMineSites}
                  value={formData.mineSiteName || null}
                  inputValue={mineSiteInput}
                  onInputChange={(_, newInput) => {
                    setMineSiteInput(newInput) // 输入时不更新 formData
                  }}
                  onChange={(_, newValue) => {
                    setFormData({
                      ...formData,
                      mineSiteName: newValue || '',
                    })
                    setMineSiteInput(newValue || '') // 同步输入框
                  }}
                  disabled={!formData.clientCompany}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Mine Site Name"
                      placeholder={
                        formData.clientCompany
                          ? `Sites for ${formData.clientCompany}`
                          : 'Select client first'
                      }
                      required={showNewProjectForm}
                      helperText={
                        !formData.clientCompany
                          ? 'Choose a client company first'
                          : mineSitesForCompany.length > 0
                            ? `${mineSitesForCompany.length} existing site(s) for this company`
                            : 'This company has no registered sites'
                      }
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <TerrainIcon sx={{ mr: 1, color: 'action.active' }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
            ) : (
              // New Minesite Form
              <>
                {/* <Alert severity="info" icon={<BusinessIcon />} sx={{ mb: 2 }}>
                  <AlertTitle>Creating New Minesite</AlertTitle>
                  Fill in the required fields below to create a new minesite. It will be submitted for approval automatically.
                </Alert> */}

                {/* Show real-time new entities detection */}
                {(() => {
                  const newEntities: string[] = []
                  const isNewClient =
                    formData.clientCompany && !uniqueCompanies.includes(formData.clientCompany)
                  const isNewMineSite =
                    formData.mineSiteName && !mineSitesForCompany.includes(formData.mineSiteName)
                  const isNewMineral =
                    formData.mineral && !uniqueMineralTypes.includes(formData.mineral)

                  // Check if this client + mine site combination exists
                  const existingCombination = projects.find(
                    (p) =>
                      p.clientCompany === formData.clientCompany &&
                      p.mineSiteName === formData.mineSiteName,
                  )

                  if (isNewClient) {
                    newEntities.push(`🏢 New Client Company: "${formData.clientCompany}"`)
                  }

                  if (formData.clientCompany && formData.mineSiteName && !existingCombination) {
                    if (isNewMineSite) {
                      newEntities.push(
                        `⛏️ New Mine Site: "${formData.mineSiteName}" for "${formData.clientCompany}"`,
                      )
                    } else {
                      // Mine site exists but not for this client
                      newEntities.push(
                        `🔄 New Minesite Combination: "${formData.clientCompany}" + "${formData.mineSiteName}"`,
                      )
                    }
                  }

                  if (isNewMineral) {
                    newEntities.push(`💎 New Mineral Type: "${formData.mineral}"`)
                  }

                  return newEntities.length > 0 ? (
                    <Alert
                      severity="warning"
                      sx={{ mb: 2, backgroundColor: '#fff3cd', borderColor: '#ffc107' }}
                    >
                      <AlertTitle sx={{ fontWeight: 700, color: '#856404' }}>
                        ⚠️ New Minesite Will Be Created
                      </AlertTitle>
                      <Typography variant="body2" sx={{ mb: 1.5, color: '#856404' }}>
                        The following new entities will be added to the system:
                      </Typography>
                      {newEntities.map((entity, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          sx={{
                            display: 'block',
                            ml: 1,
                            mb: 0.5,
                            color: '#856404',
                            fontWeight: 500,
                          }}
                        >
                          • {entity}
                        </Typography>
                      ))}
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1.5,
                          fontStyle: 'italic',
                          color: '#856404',
                          backgroundColor: '#fff',
                          padding: 1,
                          borderRadius: 1,
                          border: '1px dashed #ffc107',
                        }}
                      >
                        ℹ️ This minesite will require approval before it becomes active.
                      </Typography>
                    </Alert>
                  ) : formData.clientCompany && formData.mineSiteName && existingCombination ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <AlertTitle>✅ Existing Minesite</AlertTitle>
                      <Typography variant="body2">
                        This minesite already exists:{' '}
                        <strong>
                          {formData.clientCompany} - {formData.mineSiteName}
                        </strong>
                      </Typography>
                    </Alert>
                  ) : null
                })()}

                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                  <Autocomplete
                    freeSolo
                    options={uniqueCompanies}
                    value={formData.clientCompany}
                    onInputChange={(_, newValue) => {
                      setFormData({ ...formData, clientCompany: newValue || '' })
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Client Company"
                        placeholder="Enter or select company name"
                        required={showNewProjectForm}
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
                  />

                  <Autocomplete
                    freeSolo
                    options={mineSitesForCompany.length > 0 ? mineSitesForCompany : uniqueMineSites}
                    value={formData.mineSiteName}
                    onInputChange={(_, newValue) => {
                      setFormData({ ...formData, mineSiteName: newValue || '' })
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Mine Site Name"
                        placeholder={
                          formData.clientCompany
                            ? `Sites for ${formData.clientCompany} (or type new)`
                            : 'Enter or select mine site'
                        }
                        required={showNewProjectForm}
                        helperText={
                          mineSitesForCompany.length > 0
                            ? `${mineSitesForCompany.length} existing site(s) for this company`
                            : formData.clientCompany
                              ? 'No existing sites for this company - type to create new'
                              : ''
                        }
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <TerrainIcon sx={{ mr: 1, color: 'action.active' }} />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Box>
              </>
            )}

            {/* Assigned User */}
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.realName || option.username}
              value={selectedUser || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, assignedUserId: newValue ? String(newValue.id) : '' })
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

            {/* Priority & Status */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
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

            {/* Dates & Hours */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={2}>
                {/* Start Date */}
                <DatePicker
                  label="Start Date"
                  format="DD-MM-YYYY"
                  value={formData.startDate} // ← 不要格式化，保持 Dayjs 对象
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      startDate: value, // ← 直接存 Dayjs 对象
                    })
                  }
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

                {/* Due Date */}
                <DatePicker
                  label="Due Date"
                  format="DD-MM-YYYY"
                  value={formData.dueDate} // ← 直接 Dayjs 对象
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      dueDate: value, // ← 不要格式化
                    })
                  }
                  slotProps={{
                    textField: {
                      onBlur: () => handleBlur('dueDate'),
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

                {/* Estimated Hours */}
                <TextField
                  label="Est. Hours"
                  type="number"
                  placeholder="40"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  onBlur={() => handleBlur('estimatedHours')}
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
              </Box>
            </LocalizationProvider>

            {/* Mineral Type */}
            <Autocomplete
              options={uniqueMineralTypes}
              value={formData.mineral}
              onChange={(_, newValue) => {
                setFormData({ ...formData, mineral: newValue || '' })
              }}
              onInputChange={(_, newInputValue) => {
                setFormData({ ...formData, mineral: newInputValue })
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Mineral Type"
                  placeholder="Select or type mineral (e.g., Iron Ore, Gold, Copper)..."
                />
              )}
              renderOption={(props, option) => (
                <li key={option.id} {...props}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography
                      variant="body2"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {option}
                    </Typography>
                  </Box>
                </li>
              )}
            />

            {/* Folder Structure Preview */}
            {(selectedProject ||
              (showNewProjectForm && formData.clientCompany && formData.mineSiteName)) &&
              (() => {
                const clientCompany = selectedProject?.clientCompany || formData.clientCompany
                const mineSiteName = selectedProject?.mineSiteName || formData.mineSiteName
                const projectName = selectedProject?.name || `${clientCompany} - ${mineSiteName}`

                // Generate task code preview (format: AT0001, AQ0023, etc.)
                const taskCodePreview = formData.jobType
                  ? `${formData.jobType}####` // #### indicates auto-generated
                  : 'JOBTYPE####'

                return (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="primary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      📂 Minesite Folder Structure:
                    </Typography>
                    <Box
                      sx={{
                        pl: 2,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                      }}
                    >
                      <div>📁 Client/</div>
                      <div>
                        &nbsp;&nbsp;└── 📁 <strong>{clientCompany}/</strong>{' '}
                        <span style={{ color: '#3b82f6', fontSize: '0.7rem' }}>
                          ← Client company
                        </span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── 📄 01 Client General info/{' '}
                        <span style={{ color: '#10b981', fontSize: '0.7rem' }}>
                          ← Client information
                        </span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📁 <strong>{mineSiteName}/</strong>{' '}
                        <span style={{ color: '#3b82f6', fontSize: '0.7rem' }}>← Mine site</span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── 📄 01
                        Minesite General Info/{' '}
                        <span style={{ color: '#10b981', fontSize: '0.7rem' }}>
                          ← Minesite overview
                        </span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📄{' '}
                        <strong style={{ color: '#ec4899' }}>
                          {taskCodePreview}: {formData.title || '(Task Name)'}
                        </strong>{' '}
                        <span style={{ color: '#f97316', fontSize: '0.7rem' }}>
                          ← This task will be created here
                        </span>
                      </div>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1.5,
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                      }}
                    >
                      💡 This task will be added to: <strong>{projectName}</strong>
                      {showNewProjectForm && ' (New minesite - pending approval)'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        color: 'primary.main',
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                      }}
                    >
                      ℹ️ Task code will be auto-generated (e.g., {formData.jobType || 'AT'}0001,{' '}
                      {formData.jobType || 'AT'}0002, ...)
                    </Typography>
                  </Box>
                )
              })()}
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
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            onClick={(e) => {
              console.log('🔴 按钮被点击了！', { isLoading })
              // type="submit" 会自动触发 form 的 onSubmit
            }}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              boxShadow: '0 4px 12px rgba(56, 239, 125, 0.4)',
              px: 3,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #0f8078 0%, #2ed968 100%)',
                boxShadow: '0 6px 16px rgba(56, 239, 125, 0.5)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {isLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
