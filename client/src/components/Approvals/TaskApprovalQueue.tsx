'use client'



import { useState, useMemo, useEffect } from 'react'

import { message } from '@/lib/message'

import { useRequireApprover } from '@/hooks/useRoleCheck'

import {

  Table,

  Button,

  Tag,



  Modal,

  Input,

  Select,

  Tabs,

  Card,

  Statistic,

  Row,

  Col,

  Badge,

  Tooltip,

  Descriptions,

  Progress,

  Space,

  Collapse,

  Tree,

  Spin,
  notification,
  Pagination,

} from 'antd'

import type { ColumnsType, TableProps } from 'antd/es/table'

import {

  CheckCircleOutlined,

  CloseCircleOutlined,

  ClockCircleOutlined,

  SearchOutlined,

  ExportOutlined,

  EyeOutlined,

  FileTextOutlined,

  UserOutlined,

  CalendarOutlined,

  FlagOutlined,

  ProjectOutlined,

  DeleteOutlined,

  WarningOutlined,

  ThunderboltOutlined,

  FireOutlined,

  InfoCircleOutlined,

  FolderOutlined,

  FileOutlined,

} from '@ant-design/icons'

import { format } from 'date-fns'

import * as XLSX from 'xlsx'

import {

  useGetPendingTasksQuery,

  useGetDraftTasksQuery,

  useGetPendingDeletionTasksQuery,

  useApproveTaskMutation,

  useBatchApproveTasksMutation,

  useApproveTaskDeletionMutation,

  useGetTaskFolderContentsQuery,

  Task,

} from '@/state/api'



const { Search } = Input

const { Option } = Select

const { TextArea } = Input

const { Panel } = Collapse

type NotificationType = 'success' | 'info' | 'warning' | 'error';


// Priority Configuration

const PRIORITY_CONFIG = {

  LOW: { label: 'Low', color: 'default', icon: null },

  MEDIUM: { label: 'Medium', color: 'blue', icon: <ClockCircleOutlined /> },

  HIGH: { label: 'High', color: 'orange', icon: <WarningOutlined /> },

  URGENT: { label: 'Urgent', color: 'red', icon: <FireOutlined /> },

  BACKLOG: { label: 'Backlog', color: 'gray', icon: null },

}



// Status Configuration

const STATUS_CONFIG = {

  TODO: { label: 'To Do', color: 'default' },

  IN_PROGRESS: { label: 'In Progress', color: 'processing' },

  REVIEW: { label: 'Review', color: 'warning' },

  DONE: { label: 'Done', color: 'success' },

  CANCELLED: { label: 'Cancelled', color: 'error' },

}



// 审批意见模板

const APPROVAL_COMMENT_TEMPLATES = {

  approve: [

    'Approved - All requirements met',

    'Approved - Budget confirmed',

    'Approved - Urgent priority',

    'Approved - Standard process',

  ],

  reject: [

    'Insufficient information provided',

    'Budget not approved',

    'Resource conflict',

    'Timeline not feasible',

    'Requires additional documentation',

  ],

}

// 任务文件夹预览组件
function TaskFolderPreview({ taskId }: { taskId: number }) {
  const { data, isLoading, error } = useGetTaskFolderContentsQuery({ taskId })

  // 将文件夹数据转换为树形结构
  const convertToTreeData = (items: any[] | null) => {
    if (!items || items.length === 0) return []

    return items.map((item: any) => ({
      title: item.name,
      key: item.path,
      icon: item.type === 'folder' ? <FolderOutlined /> : <FileOutlined />,
      isLeaf: item.type === 'file',
      children: item.type === 'folder' ? [] : undefined,
    }))
  }

  if (isLoading) {
    return (
      <div className="mt-4">
        <Collapse defaultActiveKey={[]}>
          <Panel header={<><FolderOutlined className="mr-2" />Folder Structure</>} key="1">
            <div className="flex justify-center py-4">
              <Spin />
            </div>
          </Panel>
        </Collapse>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="mt-4">
        <Collapse defaultActiveKey={[]}>
          <Panel header={<><FolderOutlined className="mr-2" />Folder Structure</>} key="1">
            <div className="text-center text-gray-500 py-4">
              No folder information available
            </div>
          </Panel>
        </Collapse>
      </div>
    )
  }

  const { local, onedrive } = data.data

  return (
    <div className="mt-4">
      <Collapse defaultActiveKey={['1']}>
        <Panel
          header={
            <div className="flex items-center gap-2">
              <FolderOutlined />
              <span className="font-medium">Folder Structure Preview</span>
            </div>
          }
          key="1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onedrive && (
              <div className="border rounded p-3 bg-blue-50">
                <div className="text-xs font-medium text-gray-600 mb-2">📁 OneDrive</div>
                <div className="text-xs text-gray-500 mb-2 truncate" title={onedrive.path}>
                  {onedrive.path}
                </div>
                <Tree
                  treeData={convertToTreeData(onedrive.items)}
                  defaultExpandAll={false}
                  showIcon
                  style={{ background: 'transparent' }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {onedrive.items.length} items
                </div>
              </div>
            )}
            {local && (
              <div className="border rounded p-3 bg-green-50">
                <div className="text-xs font-medium text-gray-600 mb-2">💾 Local</div>
                <div className="text-xs text-gray-500 mb-2 truncate" title={local.path}>
                  {local.path}
                </div>
                <Tree
                  treeData={convertToTreeData(local.items)}
                  defaultExpandAll={false}
                  showIcon
                  style={{ background: 'transparent' }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {local.items.length} items
                </div>
              </div>
            )}
          </div>
          {!local && !onedrive && (
            <div className="text-center text-gray-500 py-4">
              No folders configured for this task
            </div>
          )}
        </Panel>
      </Collapse>
    </div>
  )
}

export function TaskApprovalQueue() {

  // Require approver role before rendering the queue

  const canApprove = useRequireApprover()

 const [api, contextHolder] = notification.useNotification();

  const [activeTab, setActiveTab] = useState('pending')

  const [searchText, setSearchText] = useState('')

  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const [isModalVisible, setIsModalVisible] = useState(false)

  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | null>(null)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const [comment, setComment] = useState('')
  const [isBatchDeleteApproving, setIsBatchDeleteApproving] = useState(false)
  const [isBatchDeleteModalVisible, setIsBatchDeleteModalVisible] = useState(false)
  const [modal, modalContextHolder] = Modal.useModal();
  const [previewTask, setPreviewTask] = useState<Task | null>(null)

  const [isPreviewVisible, setIsPreviewVisible] = useState(false)

  // 移动端视图切换
  const [isMobileView, setIsMobileView] = useState(false)
  const [mobilePage, setMobilePage] = useState(1)
  const [mobilePageSize, setMobilePageSize] = useState(10)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 重置移动端分页当切换标签时
  useEffect(() => {
    setMobilePage(1)
  }, [activeTab, searchText, selectedPriorities])



// If the user lacks permission this component renders nothing (forbidden redirect handled elsewhere)

  if (!canApprove) {

    return null

  }



  // API Hooks

  const {

    data: pendingData,

    isLoading: pendingLoading,

    refetch: refetchPending,

  } = useGetPendingTasksQuery()

  const {

    data: draftData,

    isLoading: draftLoading,

    refetch: refetchDraft,

  } = useGetDraftTasksQuery()

  const {

    data: deleteData,

    isLoading: deleteLoading,

    refetch: refetchDelete,

  } = useGetPendingDeletionTasksQuery()

  const [approveTask, { isLoading: approving }] = useApproveTaskMutation()

  const [batchApproveTasks, { isLoading: batchApproving }] = useBatchApproveTasksMutation()

  const [approveTaskDeletion, { isLoading: approvingDeletion }] = useApproveTaskDeletionMutation()



  // Normalize tasks so assigned/author info is always accessible
  const normalizeTasks = (tasks: Task[] | undefined | null) =>
    (tasks || []).map((task) => ({
      ...task,
      assignedUser: task.assignedUser || null,
      authorUser: (task as any).authorUser || null,
    }))

  const pendingTasks = normalizeTasks(pendingData?.data)

  const draftTasks = normalizeTasks(draftData?.data)

  const deleteTasks = normalizeTasks(deleteData?.data)



  // Current displayed data

  const currentData =

    activeTab === 'pending' ? pendingTasks : activeTab === 'draft' ? draftTasks : deleteTasks

  const currentLoading =

    activeTab === 'pending' ? pendingLoading : activeTab === 'draft' ? draftLoading : deleteLoading


  useEffect(() => {
    setSelectedRowKeys([])
  }, [activeTab])


  // Filter and search

  const filteredData = useMemo(() => {

    return currentData.filter((task) => {

      // Search filter

      const matchSearch =

        !searchText ||

        task.title?.toLowerCase().includes(searchText.toLowerCase()) ||

        task.taskCode?.toLowerCase().includes(searchText.toLowerCase()) ||

        task.projects?.name?.toLowerCase().includes(searchText.toLowerCase())



      // Priority filter

      const matchPriority =

        selectedPriorities.length === 0 || selectedPriorities.includes(task?.priority)



      return matchSearch && matchPriority

    })

  }, [currentData, searchText, selectedPriorities])



  // Statistics

  const stats = useMemo(() => {

    const total = pendingTasks.length

    const totalHours = pendingTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)

    const oldestDays =

      pendingTasks.length > 0

        ? Math.floor(

            (Date.now() -

              Math.min(...pendingTasks.map((t) => new Date(t.createdAt || new Date()).getTime()))) /

              (1000 * 60 * 60 * 24),

          )

        : 0

    const byPriority = pendingTasks.reduce(

      (acc, t) => {

        acc[t.priority] = (acc[t.priority] || 0) + 1

        return acc

      },

      {} as Record<string, number>,

    )



    // SLA 超时统计 (超过 3 天视为超时)

    const overdueCount = pendingTasks.filter((t) => {

      const waitingDays = Math.floor(

        (Date.now() - new Date(t.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24)

      )

      return waitingDays > 3

    }).length



    return { total, totalHours, oldestDays, byPriority, overdueCount }

  }, [pendingTasks])



  // 计算等待天数和SLA状态

  const getWaitingDaysInfo = (createdAt: string | Date) => {

    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))

    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60))



    let status: 'normal' | 'warning' | 'danger' = 'normal'

    let color = '#52c41a' // green

    let text = `${days}d`



    if (days === 0) {

      text = `${hours}h`

    } else if (days > 7) {

      status = 'danger'

      color = '#ff4d4f' // red

    } else if (days > 3) {

      status = 'warning'

      color = '#faad14' // orange

    }



    return { days, hours, status, color, text }

  }



  // Open approval/rejection dialog

  const handleAction = (task: Task, action: 'approve' | 'reject') => {

    setSelectedTask(task)

    setCurrentAction(action)

    setComment('')

    setIsModalVisible(true)

  }



  // 快速预览

  const handlePreview = (task: Task) => {

    setPreviewTask(task)

    setIsPreviewVisible(true)

  }



  // Submit approval/rejection

  const handleSubmit = async () => {

    if (!selectedTask || !currentAction) return



    if (currentAction === 'reject' && !comment.trim()) {

      message.error('Rejection reason is required')

      return

    }



    try {

      let result

      if (activeTab === 'delete') {

        result = await approveTaskDeletion({

          id: selectedTask.id,

          approved: currentAction === 'approve',

          comment: comment || undefined,

        }).unwrap()

      } else {

        result = await approveTask({

          id: selectedTask.id,

          approved: currentAction === 'approve',

          comment: comment || undefined,

        }).unwrap()

      }



      message.success(

        result.message ||

          `Task ${currentAction === 'approve' ? 'approved' : 'rejected'} successfully`,

      )

      setIsModalVisible(false)

      setSelectedTask(null)

      setCurrentAction(null)

      setComment('')

      refetchPending()

      refetchDelete()

    } catch (error: any) {

      message.error(error?.data?.message || `Operation failed`)

    }

  }

 const openNotification = (
    type: NotificationType,
    title: string,
    description: string
  ) => {
    api[type]({
      message: title,
      description,
    })
  }


  // Batch approve

  const handleBatchApprove = async () => {

    if (selectedRowKeys.length === 0) {

      message.warning('Please select tasks to approve')

      return

    }



    modal.confirm({

      title: 'Batch Approval Confirmation',

      content: `Are you sure you want to approve ${selectedRowKeys.length} selected task(s)?`,

      okText: 'Confirm Approval',

      cancelText: 'Cancel',

      onOk: async () => {

        try {

          const result = await batchApproveTasks({

            taskIds: selectedRowKeys.map((key) => Number(key)),

            approved: true,

          }).unwrap()



          // Ensure we use the correct response structure: result.data.success.length

          const successCount = result.data?.success?.length || 0

          const failedCount = result.data?.failed?.length || 0



          if (failedCount > 0) {
               openNotification(
              "warning",
              "Partial Approval",
              `Approved ${successCount} project(s), ${failedCount} failed`
            )  
            message.warning(`Approved ${successCount} task(s), ${failedCount} failed`)

          } else {
            openNotification("success", "Operation Successful", result.message || `Project ${currentAction === "approve" ? "approved" : "rejected"} successfully`)
            message.success(`Successfully approved ${successCount} task(s)`)

          }



          setSelectedRowKeys([])

          refetchPending()

        } catch (error: any) {
          openNotification("error", "Operation Failed", error?.data?.message || "An error occurred during the operation.");
          message.error(error?.data?.message || 'Batch approval failed')

        }

      },

    })

  }

  const handleBatchDeleteApproveClick = () => {

    if (selectedRowKeys.length === 0) {

      message.warning('Please select deletion requests to approve')

      return

    }



    setIsBatchDeleteModalVisible(true)

  }



  const handleBatchDeleteApprove = async () => {

    if (selectedRowKeys.length === 0) {

      setIsBatchDeleteModalVisible(false)

      return

    }



    setIsBatchDeleteApproving(true)



    try {

      const results = await Promise.all(

        selectedRowKeys.map(async (key) => {

          try {

            await approveTaskDeletion({

              id: Number(key),

              approved: true,

            }).unwrap()

            return { success: true }

          } catch (error: any) {

            return { success: false, error: error?.data?.message || error?.message }

          }

        }),

      )



      const successCount = results.filter((result) => result.success).length

      const failedCount = results.length - successCount



      if (successCount > 0) {

        message.success(`Approved ${successCount} deletion request${successCount > 1 ? 's' : ''}`)

      }



      if (failedCount > 0) {

        const firstError = results.find((result) => !result.success)?.error

        message.warning(

          `${failedCount} deletion request${failedCount > 1 ? 's' : ''} failed${

            firstError ? `: ${firstError}` : ''

          }`,

        )

      }



      setSelectedRowKeys([])

      refetchDelete()

    } finally {

      setIsBatchDeleteApproving(false)

      setIsBatchDeleteModalVisible(false)

    }

  }



  // Export to Excel

  const handleExport = () => {

    const exportData = filteredData.map((task) => ({

      'Project Code': task.taskCode,

      'Project Name': task.title,

      Project: task.projects?.name,

      'Assigned To': task.assignedUser?.realName || task.assignedUser?.username,

      Priority: PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label,

      Status: STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]?.label,

      'Approval Status': task.approvalStatus,

      'Estimated Hours': task.estimatedHours,

      Progress: `${task.progress || 0}%`,

      'Start Date': task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : 'N/A',

      'Due Date': task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : 'N/A',

      'Created At': format(new Date(task.createdAt || new Date()), 'yyyy-MM-dd HH:mm'),

    }))



    const ws = XLSX.utils.json_to_sheet(exportData)

    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, 'Task Approvals')

    XLSX.writeFile(wb, `Task_Approvals_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`)

    message.success('Export successful')

  }



  // Table columns definition with responsive design

  const columns: ColumnsType<Task> = [

    {

      title: 'Project Code',

      dataIndex: 'taskCode',

      key: 'taskCode',

      width: 140,

      fixed: 'left',

      render: (code) => <span className="font-mono font-medium text-sm md:text-base">{code}</span>,

    },

    {

      title: 'Project Title',

      dataIndex: 'title',

      key: 'title',

      width: 280,

      ellipsis: true,

      render: (title) => (
        <Tooltip title={title}>
          <span className="text-sm md:text-base">{title}</span>
        </Tooltip>
      ),

    },

    {

      title: 'Project',

      dataIndex: ['projects', 'name'],

      key: 'project',

      width: 200,

      ellipsis: true,

      responsive: ['md'], // Hidden on mobile

      render: (name) => <span className="text-sm">{name || 'N/A'}</span>,

    },

    {

      title: 'Assigned To',

      dataIndex: 'assignedUser',

      key: 'assignedUser',

      width: 160,

      responsive: ['md'], // Hidden on mobile

      render: (user) => (
        <span className="text-sm">{user?.realName || user?.username || 'Unassigned'}</span>
      ),

    },

    {

      title: 'Waiting',

      dataIndex: 'createdAt',

      key: 'waitingTime',

      width: 110,

      align: 'center',

      render: (createdAt) => {

        const info = getWaitingDaysInfo(createdAt)

        return (

          <Tag

            color={

              info.status === 'danger' ? 'red' : info.status === 'warning' ? 'orange' : 'green'

            }

            className="text-xs md:text-sm font-medium"

          >

            {info.text}

          </Tag>

        )

      },

    },

    {

      title: 'Priority',

      dataIndex: 'priority',

      key: 'priority',

      width: 110,

      align: 'center',

      render: (priority) => {

        const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]

        return config ? (

          <Tag

            color={config.color}

            icon={config.icon}

            className={`text-xs md:text-sm ${priority === 'URGENT' ? 'animate-pulse' : ''}`}

          >

            {config.label}

          </Tag>

        ) : priority

      },

    },

    {

      title: 'Status',

      dataIndex: 'status',

      key: 'status',

      width: 140,

      align: 'center',

      responsive: ['md'], // Hidden on mobile

      render: (status) => {

        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]

        return config ? (
          <Badge status={config.color as any} text={<span className="text-sm">{config.label}</span>} />
        ) : status

      },

    },

    {

      title: 'Est. Hours',

      dataIndex: 'estimatedHours',

      key: 'estimatedHours',

      width: 110,

      align: 'center',

      responsive: ['lg'], // Only show on large screens

      render: (hours) => <span className="text-sm">{hours || 0}h</span>,

    },

    {

      title: 'Progress',

      dataIndex: 'progress',

      key: 'progress',

      width: 130,

      align: 'center',

      responsive: ['lg'], // Only show on large screens

      render: (progress) => (

        <Progress

          percent={progress || 0}

          size="small"

          strokeColor={progress >= 100 ? '#52c41a' : progress >= 50 ? '#1890ff' : '#faad14'}

        />

      ),

    },

    {

      title: 'Due Date',

      dataIndex: 'dueDate',

      key: 'dueDate',

      width: 130,

      responsive: ['lg'], // Only show on large screens

      render: (date) => (
        <span className="text-sm">{date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A'}</span>
      ),

    },

    {

      title: 'Created',

      dataIndex: 'createdAt',

      key: 'createdAt',

      width: 160,

      responsive: ['xl'], // Only show on extra large screens

      render: (date) => (
        <span className="text-sm">{format(new Date(date || new Date()), 'MM-dd HH:mm')}</span>
      ),

    },

    {

      title: 'Actions',

      key: 'actions',

      width: 220,

      fixed: 'right',

      render: (_, record) => (

        <div className="flex flex-nowrap items-center gap-1 md:gap-2">

        <Tooltip title="Quick View">
          <Button

            size="small"

            icon={<EyeOutlined />}

            onClick={() => handlePreview(record)}

            type="text"

            className="text-xs md:text-sm"

          >
          </Button>

        </Tooltip>
        
        <Tooltip title="Full Details">
              <Button
                    size="small"
                    icon={<FileTextOutlined />}
                    onClick={() => window.open(`/tasks/${record.id}`, '_blank')}
                    className="whitespace-nowrap text-xs md:text-sm"
                  >
                  </Button>
        </Tooltip>
    
          {(activeTab === 'pending' || activeTab === 'delete') && (
            <>
            {/* 分隔线 (可选，增加视觉区分) */}
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <Tooltip title={activeTab === 'delete' ? 'Approve Delete' : 'Approve'}>
                <Button
                  type="primary"
                  size="small"
                  // 移除文字，只保留图标，或者保留简短文字
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAction(record, 'approve')}
                  className="bg-green-600 hover:bg-green-700 border-green-600"
                />
              </Tooltip>
              
              <Tooltip title="Reject">
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleAction(record, 'reject')}
                />
              </Tooltip>
            </>

          )}

        </div>

      ),

    },

  ]



  // Row selection configuration

  const rowSelection: TableProps<Task>['rowSelection'] = {

    selectedRowKeys,

    onChange: (newSelectedRowKeys) => {

      setSelectedRowKeys(newSelectedRowKeys)

    },

    getCheckboxProps: () => ({

      disabled: !(activeTab === 'pending' || activeTab === 'delete'),

    }),

  }

  const tableRowSelection =

    activeTab === 'pending' || activeTab === 'delete' ? rowSelection : undefined



  return (

    <div className="space-y-6">
       {modalContextHolder}
      {/* Statistics Cards - responsive layout with enhanced design */}

      <Row gutter={[16, 16]}>

        <Col xs={24} sm={12} lg={6}>

          <Card
            className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white"
          >

            <Statistic

              title={<span className="text-sm md:text-base font-semibold text-gray-700">Pending Approvals</span>}

              value={stats.total}

              prefix={<ClockCircleOutlined className="text-2xl md:text-3xl" />}

              valueStyle={{ color: '#1890ff', fontSize: '2rem', fontWeight: 'bold' }}

            />

          </Card>

        </Col>

        <Col xs={24} sm={12} lg={6}>

          <Card
            className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white"
          >

            <Statistic

              title={<span className="text-sm md:text-base font-semibold text-gray-700">Total Est. Hours</span>}

              value={stats.totalHours.toFixed(1)}

              suffix="h"

              prefix={<ClockCircleOutlined className="text-2xl md:text-3xl" />}

              valueStyle={{ color: '#52c41a', fontSize: '2rem', fontWeight: 'bold' }}

            />

          </Card>

        </Col>

        <Col xs={24} sm={12} lg={6}>

          <Card
            className={`shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${
              stats.oldestDays > 7 ? 'border-l-red-500 bg-gradient-to-br from-red-50 to-white' : 'border-l-green-500 bg-gradient-to-br from-green-50 to-white'
            }`}
          >

            <Statistic

              title={<span className="text-sm md:text-base font-semibold text-gray-700">Longest Waiting</span>}

              value={stats.oldestDays}

              suffix="days"

              prefix={<CalendarOutlined className="text-2xl md:text-3xl" />}

              valueStyle={{ color: stats.oldestDays > 7 ? '#ff4d4f' : '#52c41a', fontSize: '2rem', fontWeight: 'bold' }}

            />

          </Card>

        </Col>

        <Col xs={24} sm={12} lg={6}>

          <Card
            className={`shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${
              stats.overdueCount > 0 ? 'border-l-red-500 bg-gradient-to-br from-red-50 to-white animate-pulse' : 'border-l-green-500 bg-gradient-to-br from-green-50 to-white'
            }`}
          >

            <Statistic

              title={<span className="text-sm md:text-base font-semibold text-gray-700">SLA Overdue (&gt;3d)</span>}

              value={stats.overdueCount}

              suffix={`/ ${stats.total}`}

              prefix={<WarningOutlined className="text-2xl md:text-3xl" />}

              valueStyle={{ color: stats.overdueCount > 0 ? '#ff4d4f' : '#52c41a', fontSize: '2rem', fontWeight: 'bold' }}

            />

          </Card>

        </Col>

        <Col xs={24} sm={24} lg={24}>

          <Card variant="borderless" className="h-full">

            <div className="space-y-2">

              <div className="text-sm text-gray-500">Priority Distribution</div>

              <div className="flex flex-wrap gap-2">

                {Object.keys(stats.byPriority || {}).length > 0 ? (

                  Object.entries(stats.byPriority).map(([priority, count]) => {

                    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]

                    return (

                      <Tag key={priority} color={config?.color}>

                        {config?.label}: {count}

                      </Tag>

                    )

                  })

                ) : (

                  <span className="text-sm text-gray-400">No priority data</span>

                )}

              </div>

            </div>

          </Card>

        </Col>

      </Row>



      {/* Main Content Area */}

      <Card variant="borderless">

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  <ClockCircleOutlined />
                  {' '}Pending <Badge count={pendingTasks.length} showZero />
                </span>
              ),
            },
            {
              key: 'draft',
              label: (
                <span>
                  <FileTextOutlined />
                  {' '}Draft <Badge count={draftTasks.length} showZero />
                </span>
              ),
            },
            {
              key: 'delete',
              label: (
                <span>
                  <DeleteOutlined />
                  {' '}Delete Requests <Badge count={deleteTasks.length} showZero />
                </span>
              ),
            },
          ]}
        />



        {/* Toolbar */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">

          <div className="flex flex-wrap items-center gap-2">

            <Search

              placeholder="Search by title, code, or project"

              allowClear

              style={{ width: 300 }}

              onChange={(e) => setSearchText(e.target.value)}

              prefix={<SearchOutlined />}

            />



            <Select

              mode="multiple"

              placeholder="Priority"

              style={{ minWidth: 200 }}

              allowClear

              value={selectedPriorities}

              onChange={setSelectedPriorities}

            >

              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (

                <Option key={key} value={key}>

                  <Tag color={config.color}>{config.label}</Tag>

                </Option>

              ))}

            </Select>

          </div>



          <div className="flex flex-wrap items-center gap-2">

            {activeTab === 'pending' && selectedRowKeys.length > 0 && (

              <Button

                type="primary"

                icon={<CheckCircleOutlined />}

                onClick={handleBatchApprove}

                loading={batchApproving}

              >

                Batch Approve ({selectedRowKeys.length})

              </Button>

            )}

            {activeTab === 'delete' && selectedRowKeys.length > 0 && (

              <Button

                type="primary"

                danger

                icon={<DeleteOutlined />}

                onClick={handleBatchDeleteApproveClick}

                loading={isBatchDeleteApproving}

              >

                Approve Deletes ({selectedRowKeys.length})

              </Button>

            )}

            <Button icon={<ExportOutlined />} onClick={handleExport}>

              Export Excel

            </Button>

          </div>

        </div>



        {/* Mobile Card View / Desktop Table View */}
        {isMobileView ? (
          // 移动端卡片视图
          <div className="space-y-3">
            {currentLoading ? (
              <div className="flex justify-center py-12">
                <Spin size="large" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="py-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <CheckCircleOutlined className="text-6xl text-green-400" />
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-700">
                      {activeTab === 'pending' ? 'All Clear!' : activeTab === 'draft' ? 'No Draft Tasks' : 'No Delete Requests'}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto px-4">
                      {activeTab === 'pending'
                        ? 'Great job! There are no pending task approvals at the moment.'
                        : activeTab === 'draft'
                        ? 'No draft tasks available.'
                        : 'No deletion requests at the moment.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {filteredData
                  .slice((mobilePage - 1) * mobilePageSize, mobilePage * mobilePageSize)
                  .map((task) => {
                const waitingInfo = getWaitingDaysInfo(task.createdAt)
                const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
                const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]
                const isSelected = selectedRowKeys.includes(task.id)

                return (
                  <Card
                    key={task.id}
                    className={`
                      ${waitingInfo.status === 'danger' ? 'border-l-4 border-l-red-500 bg-red-50' :
                        waitingInfo.status === 'warning' ? 'border-l-4 border-l-orange-400 bg-orange-50' :
                        'border-l-4 border-l-blue-400'}
                      ${isSelected ? 'bg-blue-50 shadow-md' : ''}
                    `}
                    size="small"
                  >
                    {/* 选择框 (仅在可选择时显示) */}
                    {(activeTab === 'pending' || activeTab === 'delete') && (
                      <div className="mb-3 flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRowKeys([...selectedRowKeys, task.id])
                            } else {
                              setSelectedRowKeys(selectedRowKeys.filter(key => key !== task.id))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-xs text-gray-600">Select for batch operation</span>
                      </div>
                    )}

                    {/* 任务代码和等待时间 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm">{task.taskCode}</span>
                      <Tag
                        color={
                          waitingInfo.status === 'danger' ? 'red' :
                          waitingInfo.status === 'warning' ? 'orange' : 'green'
                        }
                        className="text-xs font-medium"
                      >
                        Waiting {waitingInfo.text}
                      </Tag>
                    </div>

                    {/* 任务标题 */}
                    <h4 className="font-semibold text-base mb-2 line-clamp-2">{task.title}</h4>

                    {/* 优先级和状态 */}
                    <div className="flex items-center gap-2 mb-2">
                      <Tag
                        color={priorityConfig?.color}
                        icon={priorityConfig?.icon}
                        className={`text-xs ${task.priority === 'URGENT' ? 'animate-pulse' : ''}`}
                      >
                        {priorityConfig?.label}
                      </Tag>
                      <Badge
                        status={statusConfig?.color as any}
                        text={<span className="text-xs">{statusConfig?.label}</span>}
                      />
                    </div>

                    {/* 项目信息 */}
                    {task.projects?.name && (
                      <div className="text-xs text-gray-600 mb-2">
                        <ProjectOutlined className="mr-1" />
                        {task.projects.name}
                      </div>
                    )}

                    {/* 分配信息 */}
                    <div className="text-xs text-gray-600 mb-3">
                      <UserOutlined className="mr-1" />
                      {task.assignedUser?.realName || task.assignedUser?.username || 'Unassigned'}
                    </div>

                    {/* 进度条 (如果有进度信息) */}
                    {task.progress !== undefined && task.progress !== null && (
                      <div className="mb-3">
                        <Progress
                          percent={task.progress}
                          size="small"
                          strokeColor={task.progress >= 100 ? '#52c41a' : task.progress >= 50 ? '#1890ff' : '#faad14'}
                        />
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <div className="flex gap-2">
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview(task)}
                          block
                        >
                          Quick View
                        </Button>
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => window.open(`/tasks/${task.id}`, '_blank')}
                          block
                        >
                          Full Details
                        </Button>
                      </div>

                      {(activeTab === 'pending' || activeTab === 'delete') && (
                        <div className="flex gap-2">
                          <Button
                            type="primary"
                            size="middle"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleAction(task, 'approve')}
                            className="bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 font-semibold flex-1"
                            block
                          >
                            {activeTab === 'delete' ? 'Approve Delete' : 'Approve'}
                          </Button>
                          <Button
                            danger
                            size="middle"
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleAction(task, 'reject')}
                            className="font-semibold flex-1"
                            block
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}

              {/* 移动端分页 */}
              <div className="mt-4 flex justify-center">
                <Pagination
                  current={mobilePage}
                  pageSize={mobilePageSize}
                  total={filteredData.length}
                  onChange={(page, pageSize) => {
                    setMobilePage(page)
                    if (pageSize !== mobilePageSize) {
                      setMobilePageSize(pageSize)
                      setMobilePage(1) // 改变页面大小时重置到第一页
                    }
                  }}
                  showSizeChanger
                  showTotal={(total) => `Total ${total} items`}
                  pageSizeOptions={['5', '10', '20']}
                  size="small"
                  className="mb-4"
                />
              </div>
            </>
            )}
          </div>
        ) : (
          // 桌面端表格视图
          <Table

            rowSelection={tableRowSelection}

            columns={columns}

            dataSource={filteredData}

            rowKey="id"

            loading={currentLoading}

            scroll={{ x: 1600 }}

            tableLayout="auto"

            locale={{
              emptyText: (
                <div className="py-12 md:py-16">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <CheckCircleOutlined className="text-6xl md:text-7xl text-green-400" />
                    <div className="text-center space-y-2">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-700">
                        {activeTab === 'pending' ? 'All Clear!' : activeTab === 'approved' ? 'No Approved Tasks' : activeTab === 'rejected' ? 'No Rejected Tasks' : 'No Deleted Tasks'}
                      </h3>
                      <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto px-4">
                        {activeTab === 'pending'
                          ? 'Great job! There are no pending task approvals at the moment. Enjoy your well-deserved break! 🎉'
                          : activeTab === 'approved'
                          ? 'No tasks have been approved yet.'
                          : activeTab === 'rejected'
                          ? 'No tasks have been rejected yet.'
                          : 'No tasks have been deleted yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            }}

            pagination={{

              showSizeChanger: true,

              showQuickJumper: true,

              showTotal: (total) => `Total ${total} records`,

              defaultPageSize: 20,

              pageSizeOptions: ['10', '20', '50', '100'],

            }}

            scroll={{ x: 'max-content' }}

            size="middle"

            rowClassName={(record) => {

              const waitingInfo = getWaitingDaysInfo(record.createdAt)

              if (waitingInfo.status === 'danger') {

                return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'

              } else if (waitingInfo.status === 'warning') {

                return 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-400'

              }

              return 'hover:bg-blue-50'

            }}

            className="shadow-sm"

          />
        )}

      </Card>



      {/* Approval/Rejection Dialog */}

      <Modal

        title={currentAction === 'approve' ? 'Approve Task' : 'Reject Task'}

        open={isModalVisible}

        onOk={handleSubmit}

        onCancel={() => setIsModalVisible(false)}

        okText={currentAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}

        cancelText="Cancel"

        confirmLoading={activeTab === 'delete' ? approvingDeletion : approving}

        width="90%"

        style={{ maxWidth: 700 }}

        okButtonProps={{

          danger: currentAction === 'reject',

          style: {

            background: currentAction === 'approve'

              ? 'linear-gradient(to right, #10b981, #059669)'

              : 'linear-gradient(to right, #ef4444, #dc2626)',

            borderColor: 'transparent',

            color: 'white',

            fontWeight: 600,

          }

        }}

        cancelButtonProps={{

          style: {

            borderColor: '#d1d5db',

            color: '#374151',

          }

        }}

      >

        {selectedTask && (

          <div className="space-y-4">

            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">

              <Descriptions.Item label="Task Code" span={1}>

                {selectedTask.taskCode}

              </Descriptions.Item>

              <Descriptions.Item label="Created At" span={1}>

                {format(new Date(selectedTask.createdAt || new Date()), 'yyyy-MM-dd HH:mm')}

              </Descriptions.Item>

              <Descriptions.Item label="Task Title" span={2}>

                {selectedTask.title}

              </Descriptions.Item>

              <Descriptions.Item label="Project" span={2}>

                {selectedTask.projects?.name || 'N/A'}

              </Descriptions.Item>

              <Descriptions.Item label="Priority" span={1}>

                <Tag

                  color={

                    PRIORITY_CONFIG[selectedTask.priority as keyof typeof PRIORITY_CONFIG]?.color

                  }

                >

                  {PRIORITY_CONFIG[selectedTask.priority as keyof typeof PRIORITY_CONFIG]?.label}

                </Tag>

              </Descriptions.Item>

              <Descriptions.Item label="Status" span={1}>

                <Badge

                  status={

                    STATUS_CONFIG[selectedTask.status as keyof typeof STATUS_CONFIG]?.color as any

                  }

                  text={STATUS_CONFIG[selectedTask.status as keyof typeof STATUS_CONFIG]?.label}

                />

              </Descriptions.Item>

              <Descriptions.Item label="Assigned To" span={1}>

                {selectedTask.assignedUser?.realName ||

                  selectedTask.assignedUser?.username ||

                  'Unassigned'}

              </Descriptions.Item>

              <Descriptions.Item label="Author" span={1}>

                {(selectedTask as any).authorUser?.realName ||

                  (selectedTask as any).authorUser?.username ||

                  'N/A'}

              </Descriptions.Item>

              <Descriptions.Item label="Estimated Hours" span={1}>

                {selectedTask.estimatedHours || 0}h

              </Descriptions.Item>

              <Descriptions.Item label="Progress" span={1}>

                {selectedTask.progress || 0}%

              </Descriptions.Item>

              {selectedTask.startDate && (

                <Descriptions.Item label="Start Date" span={1}>

                  {format(new Date(selectedTask.startDate), 'yyyy-MM-dd')}

                </Descriptions.Item>

              )}

              {selectedTask.dueDate && (

                <Descriptions.Item label="Due Date" span={1}>

                  {format(new Date(selectedTask.dueDate), 'yyyy-MM-dd')}

                </Descriptions.Item>

              )}

              <Descriptions.Item label="Approval Status" span={1}>

                <Tag color={selectedTask.approvalStatus === 'PENDING' ? 'orange' : 'default'}>

                  {selectedTask.approvalStatus}

                </Tag>

              </Descriptions.Item>

              {selectedTask.mineral && (

                <Descriptions.Item label="Mineral" span={1}>

                  {selectedTask.mineral}

                </Descriptions.Item>

              )}

              <Descriptions.Item label="Description" span={2}>

                {selectedTask.description || 'N/A'}

              </Descriptions.Item>

            </Descriptions>



            <div>

              <div className="mb-2">

                {currentAction === 'approve'

                  ? 'Comments (Optional):'

                  : 'Rejection Reason (Required):'}

                {currentAction === 'reject' && <span className="text-red-500">*</span>}

              </div>

              <div className="mb-2">

                <div className="text-xs text-gray-500 mb-2">Quick Templates:</div>

                <Space wrap>

                  {(currentAction === 'approve'

                    ? APPROVAL_COMMENT_TEMPLATES.approve

                    : APPROVAL_COMMENT_TEMPLATES.reject

                  ).map((template, index) => (

                    <Tag

                      key={index}

                      className="cursor-pointer hover:opacity-80"

                      color={currentAction === 'approve' ? 'green' : 'red'}

                      onClick={() => setComment(template)}

                    >

                      {template}

                    </Tag>

                  ))}

                </Space>

              </div>

              <TextArea

                rows={4}

                value={comment}

                onChange={(e) => setComment(e.target.value)}

                placeholder={

                  currentAction === 'approve'

                    ? 'Enter your comments...'

                    : 'Please explain the rejection reason...'

                }

              />

            </div>

          </div>

        )}

      </Modal>



      {/* Quick Preview Dialog */}

      <Modal

        title="Task Quick Preview"

        open={isPreviewVisible}

        onCancel={() => setIsPreviewVisible(false)}

        footer={[

          <Button key="close" onClick={() => setIsPreviewVisible(false)}>

            Close

          </Button>,

          <Button

            key="detail"

            type="primary"

            icon={<EyeOutlined />}

            onClick={() => {

              if (previewTask) {

                window.open(`/tasks/${previewTask.id}`, '_blank')

              }

            }}

          >

            View Full Details

          </Button>,

        ]}

        width="95%"

        style={{ maxWidth: 1200 }}

      >

        {previewTask && (

          <>

            <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="middle">

              <Descriptions.Item label="Task Code" span={1}>

                <span className="font-mono font-medium">{previewTask.taskCode}</span>

              </Descriptions.Item>

              <Descriptions.Item label="Waiting Time" span={1}>

                {(() => {

                  const info = getWaitingDaysInfo(previewTask.createdAt)

                  return (

                    <Tag

                      color={

                        info.status === 'danger' ? 'red' : info.status === 'warning' ? 'orange' : 'green'

                      }

                    >

                      {info.text}

                    </Tag>

                  )

                })()}

              </Descriptions.Item>

              <Descriptions.Item label="Task Title" span={2}>

                {previewTask.title}

              </Descriptions.Item>

              <Descriptions.Item label="Priority" span={1}>

                <Tag

                  color={PRIORITY_CONFIG[previewTask.priority as keyof typeof PRIORITY_CONFIG]?.color}

                  icon={PRIORITY_CONFIG[previewTask.priority as keyof typeof PRIORITY_CONFIG]?.icon}

                >

                  {PRIORITY_CONFIG[previewTask.priority as keyof typeof PRIORITY_CONFIG]?.label}

                </Tag>

              </Descriptions.Item>

              <Descriptions.Item label="Status" span={1}>

                <Badge

                  status={STATUS_CONFIG[previewTask.status as keyof typeof STATUS_CONFIG]?.color as any}

                  text={STATUS_CONFIG[previewTask.status as keyof typeof STATUS_CONFIG]?.label}

                />

              </Descriptions.Item>

              <Descriptions.Item label="Submitter" span={1}>

                {previewTask.authorUser?.realName ||
                  previewTask.authorUser?.username ||
                  'N/A'}

              </Descriptions.Item>

              <Descriptions.Item label="Assigned To" span={1}>

                {previewTask.assignedUser?.realName ||
                  previewTask.assignedUser?.username ||
                  'Unassigned'}

              </Descriptions.Item>

              <Descriptions.Item label="Project" span={2}>

                {previewTask.projects?.name || 'N/A'}

              </Descriptions.Item>

              <Descriptions.Item label="Description" span={2}>

                {previewTask.description || 'N/A'}

              </Descriptions.Item>

            </Descriptions>

            <TaskFolderPreview taskId={previewTask.id} />

          </>

        )}

      </Modal>

      <Modal
        open={isBatchDeleteModalVisible}
        title="Approve Deletion Requests"
        okText="Approve Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        confirmLoading={isBatchDeleteApproving}
        onOk={handleBatchDeleteApprove}
        onCancel={() => {
          if (!isBatchDeleteApproving) {
            setIsBatchDeleteModalVisible(false)
          }
        }}
      >
        <p>
          Approve deletion for <strong>{selectedRowKeys.length}</strong> selected task
          {selectedRowKeys.length > 1 ? 's' : ''}? This action cannot be undone once completed.
        </p>
      </Modal>

    </div>

  )

}
