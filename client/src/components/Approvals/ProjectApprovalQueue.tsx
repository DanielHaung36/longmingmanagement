"use client"

import { useState, useMemo } from "react"
import { useRequireApprover } from "@/hooks/useRoleCheck"
import {
  Table,
  Button,
  Tag,
  Space,
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
  message,
  notification,
  Menu,
  Descriptions,
  DatePicker,
  Collapse,
  Tree,
  Spin,
} from "antd"
import type { ColumnsType, TableProps } from "antd/es/table"
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  BuildOutlined,
  UserOutlined,
  CalendarOutlined,
  DownloadOutlined,
  WarningOutlined,
  FireOutlined,
  ThunderboltOutlined,
  FolderOutlined,
  FileOutlined,
} from "@ant-design/icons"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import {
  useGetPendingProjectsQuery,
  useGetDraftProjectsQuery,
  useGetPendingDeleteProjectsQuery,
  useApproveProjectMutation,
  useBatchApproveProjectsMutation,
  useApproveProjectDeletionMutation,
  useGetProjectFolderContentsQuery,
  Project,
} from "@/state/api"
import { log } from "console"

const { Search } = Input
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs
const { Panel } = Collapse

// Job Type Configuration
const JOB_TYPE_CONFIG = {
  AT: { label: "Testwork", color: "blue" },
  AQ: { label: "Quote", color: "purple" },
  AC: { label: "Consulting", color: "green" },
  AS: { label: "Sales", color: "orange" },
  AP: { label: "Production", color: "pink" },
}

type NotificationType = 'success' | 'info' | 'warning' | 'error';

// Priority Configuration
const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "default", icon: null },
  MEDIUM: { label: "Medium", color: "blue", icon: <ClockCircleOutlined /> },
  HIGH: { label: "High", color: "orange", icon: <WarningOutlined /> },
  URGENT: { label: "Urgent", color: "red", icon: <FireOutlined /> },
}

// 审批意见模板
const APPROVAL_COMMENT_TEMPLATES = {
  approve: [
    "Approved - All requirements met",
    "Approved - Budget confirmed",
    "Approved - Urgent priority",
    "Approved - Standard process",
  ],
  reject: [
    "Insufficient information provided",
    "Budget not approved",
    "Resource conflict",
    "Timeline not feasible",
    "Requires additional documentation",
  ],
}

// Status Configuration
const STATUS_CONFIG = {
  PLANNING: { label: "Planning", color: "blue" },
  IN_PROGRESS: { label: "In Progress", color: "processing" },
  ON_HOLD: { label: "On Hold", color: "warning" },
  COMPLETED: { label: "Completed", color: "success" },
  CANCELLED: { label: "Cancelled", color: "error" },
}

// 项目文件夹预览组件
function ProjectFolderPreview({ projectId }: { projectId: number }) {
  const { data, isLoading, error } = useGetProjectFolderContentsQuery({ projectId })

  // 将文件夹数据转换为树形结构
  const convertToTreeData = (items: any[] | null, isOneDrive: boolean = false) => {
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

  const { localClient, onedriveClient, localMinesite, onedriveMinesite } = data.data

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
          <div className="space-y-4">
            {/* Client Folder */}
            {(localClient || onedriveClient) && (
              <div>
                <div className="font-medium mb-2 flex items-center gap-2">
                  <FolderOutlined className="text-blue-500" />
                  Client Folder
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onedriveClient && (
                    <div className="border rounded p-3 bg-blue-50">
                      <div className="text-xs font-medium text-gray-600 mb-2">📁 OneDrive</div>
                      <div className="text-xs text-gray-500 mb-2 truncate" title={onedriveClient.path}>
                        {onedriveClient.path}
                      </div>
                      <Tree
                        treeData={convertToTreeData(onedriveClient.items, true)}
                        defaultExpandAll={false}
                        showIcon
                        style={{ background: 'transparent' }}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {onedriveClient.items.length} items
                      </div>
                    </div>
                  )}
                  {localClient && (
                    <div className="border rounded p-3 bg-green-50">
                      <div className="text-xs font-medium text-gray-600 mb-2">💾 Local</div>
                      <div className="text-xs text-gray-500 mb-2 truncate" title={localClient.path}>
                        {localClient.path}
                      </div>
                      <Tree
                        treeData={convertToTreeData(localClient.items, false)}
                        defaultExpandAll={false}
                        showIcon
                        style={{ background: 'transparent' }}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {localClient.items.length} items
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Minesite Folder */}
            {(localMinesite || onedriveMinesite) && (
              <div>
                <div className="font-medium mb-2 flex items-center gap-2">
                  <FolderOutlined className="text-green-500" />
                  Minesite Folder
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onedriveMinesite && (
                    <div className="border rounded p-3 bg-blue-50">
                      <div className="text-xs font-medium text-gray-600 mb-2">📁 OneDrive</div>
                      <div className="text-xs text-gray-500 mb-2 truncate" title={onedriveMinesite.path}>
                        {onedriveMinesite.path}
                      </div>
                      <Tree
                        treeData={convertToTreeData(onedriveMinesite.items, true)}
                        defaultExpandAll={false}
                        showIcon
                        style={{ background: 'transparent' }}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {onedriveMinesite.items.length} items
                      </div>
                    </div>
                  )}
                  {localMinesite && (
                    <div className="border rounded p-3 bg-green-50">
                      <div className="text-xs font-medium text-gray-600 mb-2">💾 Local</div>
                      <div className="text-xs text-gray-500 mb-2 truncate" title={localMinesite.path}>
                        {localMinesite.path}
                      </div>
                      <Tree
                        treeData={convertToTreeData(localMinesite.items, false)}
                        defaultExpandAll={false}
                        showIcon
                        style={{ background: 'transparent' }}
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {localMinesite.items.length} items
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!localClient && !onedriveClient && !localMinesite && !onedriveMinesite && (
              <div className="text-center text-gray-500 py-4">
                No folders configured for this project
              </div>
            )}
          </div>
        </Panel>
      </Collapse>
    </div>
  )
}

export function ProjectApprovalQueue() {
  // 权限检查：要求审批权限
  const canApprove = useRequireApprover()
  const [api, contextHolder] = notification.useNotification();
  const [modal, modalContextHolder] = Modal.useModal();
  const [activeTab, setActiveTab] = useState("pending")
  const [searchText, setSearchText] = useState("")
  // selectedJobTypes 已删除 - jobType 只在 task 级别定义
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<"approve" | "reject" | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [comment, setComment] = useState("")
  const [previewProject, setPreviewProject] = useState<Project | null>(null)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)

  // const openNotificationWithIcon = (type: NotificationType) => {
  //   api[type]({
  //     message: 'Notification Title',
  //     description:
  //       'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
  //   });
  // };

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

  // API Hooks
  const {
    data: pendingData,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useGetPendingProjectsQuery({ page: 1, pageSize: 100 })
  const {
    data: draftData,
    isLoading: draftLoading,
    refetch: refetchDraft,
  } = useGetDraftProjectsQuery({ page: 1, pageSize: 100 })
  const {
    data: deleteData,
    isLoading: deleteLoading,
    refetch: refetchDelete,
  } = useGetPendingDeleteProjectsQuery({ page: 1, pageSize: 100 })
  const [approveProject, { isLoading: approving }] = useApproveProjectMutation()
  const [batchApproveProjects, { isLoading: batchApproving }] = useBatchApproveProjectsMutation()
  const [approveProjectDeletion, { isLoading: approvingDeletion }] = useApproveProjectDeletionMutation()

  // 数据源
  const pendingProjects = pendingData?.data?.projects || []
  const draftProjects = draftData?.data?.projects || []
  const deleteProjects = deleteData?.data?.projects || []

  // 当前显示的数据
  const currentData = activeTab === "pending" ? pendingProjects : activeTab === "draft" ? draftProjects : deleteProjects
  const currentLoading = activeTab === "pending" ? pendingLoading : activeTab === "draft" ? draftLoading : deleteLoading

  // 过滤和搜索
  const filteredData = useMemo(() => {
    return currentData.filter((project) => {
      // 搜索过滤
      const matchSearch =
        !searchText ||
        project.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        project.projectCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        project.clientCompany?.toLowerCase().includes(searchText.toLowerCase())

      // 业务类型过滤已删除 - jobType 只在 task 级别定义

      // 优先级过滤
      const matchPriority = selectedPriorities.length === 0 || selectedPriorities.includes(project.priority)

      return matchSearch && matchPriority
    })
  }, [currentData, searchText, selectedPriorities])

  // 统计数据
  const stats = useMemo(() => {
    const total = pendingProjects.length
    const oldestDays =
      pendingProjects.length > 0
        ? Math.floor(
          (Date.now() - Math.min(...pendingProjects.map((p) => new Date(p.createdAt).getTime()))) /
          (1000 * 60 * 60 * 24),
        )
        : 0
    // const byJobType = pendingProjects.reduce(
    //   (acc, p) => {
    //     acc[p.jobType] = (acc[p.jobType] || 0) + 1
    //     return acc
    //   },
    //   {} as Record<string, number>,
    // )

    // SLA 超时统计
    const overdueCount = pendingProjects.filter(p => {
      const waitingDays = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return waitingDays > 3
    }).length

    return { total, oldestDays, overdueCount }
  }, [pendingProjects])

  // 计算等待天数和SLA状态
  const getWaitingDaysInfo = (createdAt: string | Date) => {
    const time = new Date(createdAt)
    const diff = Date.now() - time.getTime()

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    let status: 'normal' | 'warning' | 'danger' = 'normal'
    let color = '#52c41a'
    let text = `${days}d`

    if (days === 0) {
      text = `${hours}h`
    } else if (days > 7) {
      status = 'danger'
      color = '#ff4d4f'
    } else if (days > 3) {
      status = 'warning'
      color = '#faad14'
    }

    return { days, hours, status, color, text }
  }

  // 打开审批/拒绝对话框
  const handleAction = (project: Project, action: "approve" | "reject") => {
    setSelectedProject(project)
    setCurrentAction(action)
    setComment("")
    setIsModalVisible(true)
  }

  // 提交审批/拒绝
  const handleSubmit = async () => {
    if (!selectedProject || !currentAction) return

    if (currentAction === "reject" && !comment.trim()) {
      openNotification("error", "Operation Failed", "Rejection reason is required");
      return
    }

    try {
      let result
      if (activeTab === "delete") {
        // 删除审批
        result = await approveProjectDeletion({
          id: selectedProject.id,
          approved: currentAction === "approve",
          comment: comment || undefined,
        }).unwrap()
      } else {
        // 普通审批
        result = await approveProject({
          id: selectedProject.id,
          approved: currentAction === "approve",
          comment: comment || undefined,
        }).unwrap()
      }
      openNotification("success", "Operation Successful", result.message || `Project ${currentAction === "approve" ? "approved" : "rejected"} successfully`)
      // message.success(result.message || `Project ${currentAction === "approve" ? "approved" : "rejected"} successfully`)
      setIsModalVisible(false)
      setSelectedProject(null)
      setCurrentAction(null)
      setComment("")
      refetchPending()
      refetchDelete()
    } catch (error: any) {
      console.log("ERR ===>", error);
      // message.error(
      //   error?.data?.message ||
      //   error?.error ||
      //   error?.message ||
      //   "Operation failed"
      // );

      openNotification("error", "Operation Failed", error?.data?.message || "An error occurred during the operation.");
    }

  }

  // Batch approve
  const handleBatchApprove = async () => {
    console.log('[BatchApprove] triggered', { selectedRowKeys, activeTab })
    if (selectedRowKeys.length === 0) {
      openNotification("warning", "Selection Required", "Please select projects to approve")
      return
    }

    modal.confirm({
      title: "Batch Approval Confirmation",
      content: `Are you sure you want to approve ${selectedRowKeys.length} selected project(s)?`,
      okText: "Confirm Approval",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await batchApproveProjects({
            projectIds: selectedRowKeys.map((key) => Number(key)),
            approved: true,
          }).unwrap()

          // ✅ 修复：使用正确的响应结构 data.success.length
          const successCount = result.data?.success?.length || 0
          const failedCount = result.data?.failed?.length || 0

          if (failedCount > 0) {
            openNotification(
              "warning",
              "Partial Approval",
              `Approved ${successCount} project(s), ${failedCount} failed`
            )
          } else {
            openNotification(
              "success",
              "Batch Approval Successful",
              `Successfully approved ${successCount} project(s)`
            )
          }

          setSelectedRowKeys([])
          refetchPending()
        } catch (error: any) {
          console.log(error);

          openNotification(
            "error",
            "Batch Approval Failed",
            error?.data?.message || "An unexpected error occurred during batch approval."
          )
        }
      },
    })
  }

  // 快速预览
  const handlePreview = (project: Project) => {
    setPreviewProject(project)
    setIsPreviewVisible(true)
  }

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredData.map((project) => ({
      "Minesite Code": project.projectCode,
      "Minesite Name": project.name,
      // "Job Type" 已删除 - jobType 只在 task 级别定义
      "Client Company": project.clientCompany,
      "Mine Site": project.mineSiteName,
      "Priority": PRIORITY_CONFIG[project.priority]?.label,
      "Status": STATUS_CONFIG[project.status]?.label,
      "Approval Status": project.approvalStatus,
      "Progress": `${project.progress}%`,
      "Submitter": project.owner?.realName || project.owner?.username || "N/A",
      "Waiting Days": getWaitingDaysInfo(project.createdAt).days,
      "Created At": format(new Date(project.createdAt), "yyyy-MM-dd HH:mm"),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Minesite Approvals")
    XLSX.writeFile(wb, `Minesite_Approvals_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`)
    message.success("Export successful")
  }

  // Table columns definition
  const columns: ColumnsType<Project> = [
    {
      title: "Minesite Code",
      dataIndex: "projectCode",
      key: "projectCode",
      width: 150,
      fixed: "left",
      render: (code) => <span className="font-mono font-medium">{code}</span>,
    },
    {
      title: "Minesite Name",
      dataIndex: "name",
      key: "name",
      width: 300,
      ellipsis: true,
      render: (name, record) => {
        const isAutoCreated = record.description?.includes("[Auto-created from Task]")
        return (
          <div className="space-y-1">
            <Tooltip title={name}>
              <div className="font-medium">{name}</div>
            </Tooltip>
            <div className="flex gap-1 flex-wrap">
              {isAutoCreated && (
                <Tooltip title="This minesite was automatically created when a task was submitted">
                  <Tag color="cyan" icon={<BuildOutlined />} className="text-xs">Auto-created</Tag>
                </Tooltip>
              )}
            </div>
          </div>
        )
      },
    },
    {
      title: "Submitter",
      dataIndex: "owner",
      key: "owner",
      width: 150,
      render: (owner) => (
        <Tooltip title={owner?.username}>
          <div className="flex items-center gap-1">
            <UserOutlined className="text-gray-400" />
            <span className="text-sm">{owner?.realName || owner?.username || "N/A"}</span>
          </div>
        </Tooltip>
      ),
    },
    // Job Type 列已删除 - jobType 只在 task 级别定义，project 没有此字段
    {
      title: "Client Company",
      dataIndex: "clientCompany",
      key: "clientCompany",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Mine Site",
      dataIndex: "mineSiteName",
      key: "mineSiteName",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 110,
      align: "center",
      render: (priority) => {
        const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]
        return config ? (
          <Tag
            color={config.color}
            icon={config.icon}
            className={priority === 'URGENT' ? 'animate-pulse' : ''}
          >
            {config.label}
          </Tag>
        ) : priority
      },
    },
    {
      title: "Waiting Time",
      dataIndex: "createdAt",
      key: "waitingTime",
      width: 160,
      align: "center",
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => {
        const info = getWaitingDaysInfo(date)
        return (
          <Tooltip title={`Created: ${format(new Date(date), "yyyy-MM-dd HH:mm")}`}>
            <Tag
              color={info.status === 'danger' ? 'red' : info.status === 'warning' ? 'orange' : 'green'}
              icon={info.status === 'danger' ? <WarningOutlined /> : <ClockCircleOutlined />}
            >
              {info.text}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      align: "center",
      render: (status) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
        return config ? <Badge status={config.color as any} text={config.label} /> : status
      },
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      width: 80,
      align: "center",
      render: (progress) => `${progress || 0}%`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 400,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
            type="text"
          >
            Quick View
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/projects/${record.id}`, '_blank')}
            type="link"
          >
            Details
          </Button>
          {(activeTab === "pending" || activeTab === "delete") && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleAction(record, "approve")}
                className="bg-green-600 hover:bg-green-700"
              >
                {activeTab === "delete" ? "Approve Delete" : "Approve"}
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleAction(record, "reject")}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  // 行选择配置
  const rowSelection: TableProps<Project>["rowSelection"] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
    getCheckboxProps: (record) => ({
      disabled: activeTab !== "pending",
    }),
  }

  if (!canApprove) {
    return (
      <>
        {contextHolder}
        {modalContextHolder}
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - 响应式布局 */}
      {contextHolder}
      {modalContextHolder}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Pending Approvals"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="SLA Overdue (>3 days)"
              value={stats.overdueCount}
              suffix={`/ ${stats.total}`}
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats.overdueCount > 0 ? "#ff4d4f" : "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Longest Waiting"
              value={stats.oldestDays}
              suffix="days"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: stats.oldestDays > 7 ? "#ff4d4f" : stats.oldestDays > 3 ? "#faad14" : "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless">
            <Statistic
              title="Draft Minesites"
              value={draftProjects.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
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
              key: "pending",
              label: (
                <span>
                  <ClockCircleOutlined />
                  Pending <Badge count={pendingProjects.length} showZero />
                </span>
              ),
            },
            {
              key: "draft",
              label: (
                <span>
                  <FileTextOutlined />
                  Draft <Badge count={draftProjects.length} showZero />
                </span>
              ),
            },
            {
              key: "delete",
              label: (
                <span>
                  <DeleteOutlined />
                  Delete Requests <Badge count={deleteProjects.length} showZero />
                </span>
              ),
            },
          ]}
        />

        {/* Toolbar */}
        <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center justify-between">
          <Space wrap className="w-full sm:w-auto">
            <Search
              placeholder="Search by name, code, or company"
              allowClear
              className="w-full sm:w-[300px]"
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />

            {/* Job Type 筛选已删除 - jobType 只在 task 级别定义 */}

            <Select
              mode="multiple"
              placeholder="Priority"
              className="w-full sm:min-w-[150px]"
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
          </Space>

          <Space wrap className="w-full sm:w-auto justify-end">
            {activeTab === "pending" && selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleBatchApprove}
                loading={batchApproving}
                className="flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Batch Approve </span>({selectedRowKeys.length})
              </Button>
            )}
            <Button icon={<ExportOutlined />} onClick={handleExport} className="flex-1 sm:flex-none">
              <span className="hidden xs:inline">Export </span>Excel
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Table
          rowSelection={activeTab === "pending" ? rowSelection : undefined}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={currentLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} records`,
            defaultPageSize: 20,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          scroll={{ x: 1700 }}
          tableLayout="auto"
          size="small"
        />
      </Card>

      {/* Quick Preview Dialog */}
      <Modal
        title="Minesite Quick Preview"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewVisible(false)}>
            Close
          </Button>,
          <Button
            key="detail"
            type="primary"
            onClick={() => {
              if (previewProject) {
                window.open(`/projects/${previewProject.id}`, '_blank')
              }
            }}
          >
            View Full Details
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: 1200 }}
      >
        {previewProject && (
          <>
            <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="small">
              <Descriptions.Item label="Minesite Code" span={3}>
                <span className="font-mono font-medium">{previewProject.projectCode}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Waiting Time" span={1}>
                {(() => {
                  const info = getWaitingDaysInfo(previewProject.createdAt)
                  return (
                    <Tag color={info.status === 'danger' ? 'red' : info.status === 'warning' ? 'orange' : 'green'}>
                      {info.text} ({format(new Date(previewProject.createdAt), "yyyy-MM-dd HH:mm")})
                    </Tag>
                  )
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Minesite Name" span={4}>
                {previewProject.name}
              </Descriptions.Item>
              <Descriptions.Item label="Submitter" span={3}>
                <div className="flex items-center gap-2">
                  <UserOutlined />
                  {previewProject.owner?.realName || previewProject.owner?.username || "N/A"}
                </div>
              </Descriptions.Item>
              {/* Job Type 已删除 - jobType 只在 task 级别定义，project 没有此字段 */}
              <Descriptions.Item label="Priority" span={1}>
                <Tag
                  color={PRIORITY_CONFIG[previewProject.priority as keyof typeof PRIORITY_CONFIG]?.color}
                  icon={PRIORITY_CONFIG[previewProject.priority as keyof typeof PRIORITY_CONFIG]?.icon}
                >
                  {PRIORITY_CONFIG[previewProject.priority as keyof typeof PRIORITY_CONFIG]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={1}>
                <Badge
                  status={STATUS_CONFIG[previewProject.status as keyof typeof STATUS_CONFIG]?.color as any}
                  text={STATUS_CONFIG[previewProject.status as keyof typeof STATUS_CONFIG]?.label}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Client Company" span={1}>
                {previewProject.clientCompany}
              </Descriptions.Item>
              <Descriptions.Item label="Mine Site" span={3}>
                {previewProject.mineSiteName}
              </Descriptions.Item>
              <Descriptions.Item label="Progress" span={3}>
                {previewProject.progress || 0}%
              </Descriptions.Item>
              <Descriptions.Item label="Approval Status" span={1}>
                <Tag color={previewProject.approvalStatus === 'PENDING' ? 'orange' : 'default'}>
                  {previewProject.approvalStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={4}>
                {previewProject.description || "N/A"}
              </Descriptions.Item>
            </Descriptions>

            <ProjectFolderPreview projectId={previewProject.id} />
          </>
        )}
      </Modal>

      {/* Approval/Rejection Dialog */}
      <Modal
        title={currentAction === "approve" ? "Approve Minesite" : "Reject Minesite"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={currentAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
        cancelText="Cancel"
        confirmLoading={activeTab === "delete" ? approvingDeletion : approving}
        width="90%"
        style={{ maxWidth: 900 }}
        okButtonProps={{
          danger: currentAction === "reject",
          style: {
            background: currentAction === "approve"
              ? "linear-gradient(to right, #10b981, #059669)"
              : "linear-gradient(to right, #ef4444, #dc2626)",
            borderColor: "transparent",
            color: "white",
            fontWeight: 600,
          }
        }}
        cancelButtonProps={{
          style: {
            borderColor: "#d1d5db",
            color: "#374151",
          }
        }}
      >
        {selectedProject && (
          <div className="space-y-4">
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Minesite Code" span={3}>
                <span className="font-mono font-medium">{selectedProject.projectCode}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Waiting Time" span={1}>
                {(() => {
                  const info = getWaitingDaysInfo(selectedProject.createdAt)
                  return (
                    <Tag
                      color={info.status === 'danger' ? 'red' : info.status === 'warning' ? 'orange' : 'green'}
                      icon={info.status === 'danger' ? <WarningOutlined /> : <ClockCircleOutlined />}
                    >
                      {info.text} ({format(new Date(selectedProject.createdAt), "yyyy-MM-dd HH:mm")})
                    </Tag>
                  )
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Minesite Name" span={4}>{selectedProject.name}</Descriptions.Item>
              <Descriptions.Item label="Submitter" span={1}>
                <div className="flex items-center gap-2">
                  <UserOutlined />
                  {selectedProject.owner?.realName || selectedProject.owner?.username || "N/A"}
                </div>
              </Descriptions.Item>
              {/* Job Type 已删除 - jobType 只在 task 级别定义，project 没有此字段 */}
              <Descriptions.Item label="Priority" span={1}>
                <Tag
                  color={PRIORITY_CONFIG[selectedProject.priority as keyof typeof PRIORITY_CONFIG]?.color}
                  icon={PRIORITY_CONFIG[selectedProject.priority as keyof typeof PRIORITY_CONFIG]?.icon}
                >
                  {PRIORITY_CONFIG[selectedProject.priority as keyof typeof PRIORITY_CONFIG]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Client Company" span={3}>{selectedProject.clientCompany}</Descriptions.Item>
              <Descriptions.Item label="Mine Site" span={1}>{selectedProject.mineSiteName}</Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Badge status={STATUS_CONFIG[selectedProject.status as keyof typeof STATUS_CONFIG]?.color as any} text={STATUS_CONFIG[selectedProject.status as keyof typeof STATUS_CONFIG]?.label} />
              </Descriptions.Item>
              <Descriptions.Item label="Progress" span={1}>{selectedProject.progress || 0}%</Descriptions.Item>
              <Descriptions.Item label="Approval Status" span={1}>
                <Tag color={selectedProject.approvalStatus === 'PENDING' ? 'orange' : 'default'}>
                  {selectedProject.approvalStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={6}>{selectedProject.description || "N/A"}</Descriptions.Item>
            </Descriptions>

            <div>
              <div className="mb-2">
                {currentAction === "approve" ? "Comments (Optional):" : "Rejection Reason (Required):"}
                {currentAction === "reject" && <span className="text-red-500">*</span>}
              </div>

              {/* 审批意见模板 */}
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-2">Quick Templates:</div>
                <Space wrap>
                  {(currentAction === "approve" ? APPROVAL_COMMENT_TEMPLATES.approve : APPROVAL_COMMENT_TEMPLATES.reject).map((template, index) => (
                    <Tag
                      key={index}
                      className="cursor-pointer hover:opacity-80"
                      color={currentAction === "approve" ? "green" : "red"}
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
                placeholder={currentAction === "approve" ? "Enter your comments..." : "Please explain the rejection reason..."}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
