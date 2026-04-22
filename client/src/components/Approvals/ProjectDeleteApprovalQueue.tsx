"use client"

import { useState, useMemo } from "react"
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Input,
  Card,
  Statistic,
  Row,
  Col,
  Badge,
  Tooltip,
  message,
  Descriptions,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExportOutlined,
  EyeOutlined,
  CalendarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import {
  useGetPendingDeleteProjectsQuery,
  useApproveProjectDeletionMutation,
  Project,
} from "@/state/api"

const { Search } = Input
const { TextArea } = Input

// Job Type Configuration
const JOB_TYPE_CONFIG = {
  AT: { label: "Testwork", color: "blue" },
  AQ: { label: "Quote", color: "purple" },
  AC: { label: "Consulting", color: "green" },
  AS: { label: "Sales", color: "orange" },
  AP: { label: "Production", color: "pink" },
}

// 审批意见模板（用于删除审批）
const DELETE_APPROVAL_COMMENT_TEMPLATES = {
  approve: [
    "Approved - Deletion request valid",
    "Approved - Duplicate entry",
    "Approved - Outdated data",
    "Approved - Project cancelled",
  ],
  reject: [
    "Active tasks still exist",
    "Requires data archiving first",
    "Missing authorization",
    "Project still in progress",
  ],
}

export function ProjectDeleteApprovalQueue() {
  const [searchText, setSearchText] = useState("")
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<"approve" | "reject" | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [comment, setComment] = useState("")
  const [previewProject, setPreviewProject] = useState<Project | null>(null)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)

  // API Hooks
  const {
    data: pendingDeleteData,
    isLoading,
    refetch,
  } = useGetPendingDeleteProjectsQuery({ page: 1, pageSize: 100 })
  const [approveProjectDeletion, { isLoading: approving }] = useApproveProjectDeletionMutation()

  // 数据源
  const pendingDeleteProjects = pendingDeleteData?.data?.projects || []

  // 过滤和搜索
  const filteredData = useMemo(() => {
    return pendingDeleteProjects.filter((project) => {
      const matchSearch =
        !searchText ||
        project.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        project.projectCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        project.clientCompany?.toLowerCase().includes(searchText.toLowerCase())

      return matchSearch
    })
  }, [pendingDeleteProjects, searchText])

  // 统计数据
  const stats = useMemo(() => {
    const total = pendingDeleteProjects.length
    const oldestDays =
      pendingDeleteProjects.length > 0
        ? Math.floor(
            (Date.now() - Math.min(...pendingDeleteProjects.map((p) => new Date(p.createdAt).getTime()))) /
              (1000 * 60 * 60 * 24),
          )
        : 0

    // SLA 超时统计 (删除审批超过 3 天视为超时)
    const overdueCount = pendingDeleteProjects.filter((p) => {
      const waitingDays = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      return waitingDays > 3
    }).length

    return { total, oldestDays, overdueCount }
  }, [pendingDeleteProjects])

  // 计算等待天数和SLA状态
  const getWaitingDaysInfo = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60))

    let status: "normal" | "warning" | "danger" = "normal"
    let color = "#52c41a" // green
    let text = `${days}d`

    if (days === 0) {
      text = `${hours}h`
    } else if (days > 7) {
      status = "danger"
      color = "#ff4d4f" // red
    } else if (days > 3) {
      status = "warning"
      color = "#faad14" // orange
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
      message.error("Rejection reason is required")
      return
    }

    try {
      const result = await approveProjectDeletion({
        id: selectedProject.id,
        approved: currentAction === "approve",
        comment: comment || undefined,
      }).unwrap()

      message.success(result.message || `Deletion ${currentAction === "approve" ? "approved" : "rejected"} successfully`)
      setIsModalVisible(false)
      setSelectedProject(null)
      setCurrentAction(null)
      setComment("")
      refetch()
    } catch (error: any) {
      message.error(error?.data?.message || `Operation failed`)
    }
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
      "Submitter": project.owner?.realName || project.owner?.username || "N/A",
      "Waiting Days": getWaitingDaysInfo(project.createdAt).days,
      "Deletion Requested At": project.createdAt ? format(new Date(project.createdAt), "yyyy-MM-dd HH:mm") : "N/A",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Minesite Delete Approvals")
    XLSX.writeFile(wb, `Minesite_Delete_Approvals_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`)
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
      width: 200,
      ellipsis: true,
      render: (name) => <Tooltip title={name}>{name}</Tooltip>,
    },
    {
      title: "Submitter",
      dataIndex: "owner",
      key: "owner",
      width: 120,
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
      title: "Waiting Time",
      dataIndex: "createdAt",
      key: "waitingTime",
      width: 120,
      align: "center",
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => {
        const info = getWaitingDaysInfo(date)
        return (
          <Tooltip title={`Requested: ${format(new Date(date), "yyyy-MM-dd HH:mm")}`}>
            <Tag
              color={info.status === "danger" ? "red" : info.status === "warning" ? "orange" : "green"}
              icon={info.status === "danger" ? <WarningOutlined /> : <ClockCircleOutlined />}
            >
              {info.text}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 320,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)} type="text">
            Quick View
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/projects/${record.id}`, "_blank")}
            type="link"
          >
            Details
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAction(record, "approve")}
            danger
          >
            Approve Delete
          </Button>
          <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleAction(record, "reject")}>
            Reject
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless">
            <Statistic
              title="Pending Delete Approvals"
              value={stats.total}
              prefix={<DeleteOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
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
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless">
            <Statistic
              title="Longest Waiting"
              value={stats.oldestDays}
              suffix="days"
              prefix={<CalendarOutlined />}
              valueStyle={{
                color: stats.oldestDays > 7 ? "#ff4d4f" : stats.oldestDays > 3 ? "#faad14" : "#52c41a",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Area */}
      <Card variant="borderless">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
          <Space wrap>
            <Search
              placeholder="Search by name, code, or company"
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Space>

          <Space>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              Export Excel
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} records`,
            defaultPageSize: 20,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Quick Preview Dialog */}
      <Modal
        title="Minesite Quick Preview - Deletion Request"
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
                window.open(`/projects/${previewProject.id}`, "_blank")
              }
            }}
          >
            View Full Details
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 800 }}
      >
        {previewProject && (
          <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Minesite Code" span={1}>
              <span className="font-mono font-medium">{previewProject.projectCode}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Waiting Time" span={1}>
              {(() => {
                const info = getWaitingDaysInfo(previewProject.createdAt)
                return (
                  <Tag color={info.status === "danger" ? "red" : info.status === "warning" ? "orange" : "green"}>
                    {info.text} ({format(new Date(previewProject.createdAt), "yyyy-MM-dd HH:mm")})
                  </Tag>
                )
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Minesite Name" span={2}>
              {previewProject.name}
            </Descriptions.Item>
            <Descriptions.Item label="Submitter" span={1}>
              <div className="flex items-center gap-2">
                <UserOutlined />
                {previewProject.owner?.realName || previewProject.owner?.username || "N/A"}
              </div>
            </Descriptions.Item>
            {/* Job Type 已删除 - jobType 只在 task 级别定义，project 没有此字段 */}
            <Descriptions.Item label="Client Company" span={1}>
              {previewProject.clientCompany}
            </Descriptions.Item>
            <Descriptions.Item label="Mine Site" span={1}>
              {previewProject.mineSiteName}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {previewProject.description || "N/A"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Approval/Rejection Dialog */}
      <Modal
        title={currentAction === "approve" ? "Approve Minesite Deletion" : "Reject Deletion Request"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={currentAction === "approve" ? "Confirm Deletion" : "Confirm Rejection"}
        cancelText="Cancel"
        confirmLoading={approving}
        width={700}
        okButtonProps={{
          danger: currentAction === "approve",
        }}
      >
        {selectedProject && (
          <div className="space-y-4">
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Minesite Code" span={1}>
                <span className="font-mono font-medium">{selectedProject.projectCode}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Waiting Time" span={1}>
                {(() => {
                  const info = getWaitingDaysInfo(selectedProject.createdAt)
                  return (
                    <Tag
                      color={info.status === "danger" ? "red" : info.status === "warning" ? "orange" : "green"}
                      icon={info.status === "danger" ? <WarningOutlined /> : <ClockCircleOutlined />}
                    >
                      {info.text} ({format(new Date(selectedProject.createdAt), "yyyy-MM-dd HH:mm")})
                    </Tag>
                  )
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Minesite Name" span={2}>
                {selectedProject.name}
              </Descriptions.Item>
              <Descriptions.Item label="Submitter" span={1}>
                <div className="flex items-center gap-2">
                  <UserOutlined />
                  {selectedProject.owner?.realName || selectedProject.owner?.username || "N/A"}
                </div>
              </Descriptions.Item>
              {/* Job Type 已删除 - jobType 只在 task 级别定义，project 没有此字段 */}
              <Descriptions.Item label="Client Company" span={1}>
                {selectedProject.clientCompany}
              </Descriptions.Item>
              <Descriptions.Item label="Mine Site" span={1}>
                {selectedProject.mineSiteName}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="mb-2">
                {currentAction === "approve" ? "Confirmation Comments (Optional):" : "Rejection Reason (Required):"}
                {currentAction === "reject" && <span className="text-red-500">*</span>}
              </div>

              {/* 审批意见模板 */}
              <div className="mb-2">
                <div className="text-xs text-gray-500 mb-2">Quick Templates:</div>
                <Space wrap>
                  {(currentAction === "approve"
                    ? DELETE_APPROVAL_COMMENT_TEMPLATES.approve
                    : DELETE_APPROVAL_COMMENT_TEMPLATES.reject
                  ).map((template, index) => (
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
                placeholder={
                  currentAction === "approve" ? "Enter confirmation comments..." : "Please explain the rejection reason..."
                }
              />
            </div>

            {currentAction === "approve" && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                <strong>Warning:</strong> Approving this deletion request will permanently delete the minesite and all
                associated data. This action cannot be undone.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
