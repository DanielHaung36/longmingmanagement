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
  CalendarOutlined,
  EyeOutlined,
} from "@ant-design/icons"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import {
  useGetPendingDeletionTasksQuery,
  useApproveTaskDeletionMutation,
  Task,
} from "@/state/api"

const { Search } = Input
const { TextArea } = Input

// Priority Configuration
const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "default" },
  MEDIUM: { label: "Medium", color: "blue" },
  HIGH: { label: "High", color: "orange" },
  URGENT: { label: "Urgent", color: "red" },
  BACKLOG: { label: "Backlog", color: "gray" },
}

export function TaskDeleteApprovalQueue() {
  const [searchText, setSearchText] = useState("")
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<"approve" | "reject" | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [comment, setComment] = useState("")

  // API Hooks
  const {
    data: pendingDeleteData,
    isLoading,
    refetch,
  } = useGetPendingDeletionTasksQuery()
  const [approveTaskDeletion, { isLoading: approving }] = useApproveTaskDeletionMutation()

  // 数据源
  const pendingDeleteTasks = pendingDeleteData?.data || []

  // 过滤和搜索
  const filteredData = useMemo(() => {
    return pendingDeleteTasks.filter((task) => {
      const matchSearch =
        !searchText ||
        task.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        task.taskCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        task.projects?.name?.toLowerCase().includes(searchText.toLowerCase())

      return matchSearch
    })
  }, [pendingDeleteTasks, searchText])

  // 统计数据
  const stats = useMemo(() => {
    const total = pendingDeleteTasks.length
    const oldestDays =
      pendingDeleteTasks.length > 0
        ? Math.floor(
            (Date.now() - Math.min(...pendingDeleteTasks.map((t) => new Date(t.deleteRequestedAt || new Date()).getTime()))) /
              (1000 * 60 * 60 * 24),
          )
        : 0

    return { total, oldestDays }
  }, [pendingDeleteTasks])

  // 打开审批/拒绝对话框
  const handleAction = (task: Task, action: "approve" | "reject") => {
    setSelectedTask(task)
    setCurrentAction(action)
    setComment("")
    setIsModalVisible(true)
  }

  // 提交审批/拒绝
  const handleSubmit = async () => {
    if (!selectedTask || !currentAction) return

    if (currentAction === "reject" && !comment.trim()) {
      message.error("Rejection reason is required")
      return
    }

    try {
      const result = await approveTaskDeletion({
        id: selectedTask.id,
        approved: currentAction === "approve",
        comment: comment || undefined,
      }).unwrap()

      message.success(result.message || `Deletion ${currentAction === "approve" ? "approved" : "rejected"} successfully`)
      setIsModalVisible(false)
      setSelectedTask(null)
      setCurrentAction(null)
      setComment("")
      refetch()
    } catch (error: any) {
      message.error(error?.data?.message || `Operation failed`)
    }
  }

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredData.map((task) => ({
      "Task Code": task.taskCode,
      "Task Title": task.title,
      "Project": task.projects?.name,
      "Priority": PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]?.label,
      "Delete Reason": task.deleteReason || "N/A",
      "Requested By": task.deleteRequestedBy || "Unknown",
      "Requested At": task.deleteRequestedAt ? format(new Date(task.deleteRequestedAt), "yyyy-MM-dd HH:mm") : "N/A",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Task Delete Approvals")
    XLSX.writeFile(wb, `Task_Delete_Approvals_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`)
    message.success("Export successful")
  }

  // Table columns definition
  const columns: ColumnsType<Task> = [
    {
      title: "Task Code",
      dataIndex: "taskCode",
      key: "taskCode",
      width: 120,
      fixed: "left",
      render: (code) => <span className="font-mono font-medium">{code}</span>,
    },
    {
      title: "Task Title",
      dataIndex: "title",
      key: "title",
      width: 250,
      ellipsis: true,
      render: (title) => <Tooltip title={title}>{title}</Tooltip>,
    },
    {
      title: "Project",
      dataIndex: ["projects", "name"],
      key: "project",
      width: 180,
      ellipsis: true,
      render: (name) => name || "N/A",
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      align: "center",
      render: (priority) => {
        const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]
        return config ? <Tag color={config.color}>{config.label}</Tag> : priority
      },
    },
    {
      title: "Delete Reason",
      dataIndex: "deleteReason",
      key: "deleteReason",
      width: 200,
      ellipsis: true,
      render: (reason) => <Tooltip title={reason}>{reason || "No reason provided"}</Tooltip>,
    },
    {
      title: "Requested At",
      dataIndex: "deleteRequestedAt",
      key: "deleteRequestedAt",
      width: 180,
      render: (date) => date ? format(new Date(date), "yyyy-MM-dd HH:mm") : "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open(`/tasks/${record.id}`, '_blank')}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAction(record, "approve")}
          >
            Approve Delete
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleAction(record, "reject")}
          >
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
        <Col span={8}>
          <Card variant="borderless">
            <Statistic
              title="Pending Delete Approvals"
              value={stats.total}
              prefix={<DeleteOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card variant="borderless">
            <Statistic
              title="Longest Waiting Days"
              value={stats.oldestDays}
              suffix="days"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: stats.oldestDays > 7 ? "#ff4d4f" : "#52c41a" }}
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
              placeholder="Search by title, code, or project"
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
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Card>

      {/* Approval/Rejection Dialog */}
      <Modal
        title={currentAction === "approve" ? "Approve Task Deletion" : "Reject Deletion Request"}
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
        {selectedTask && (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Task Code" span={1}>
                {selectedTask.taskCode}
              </Descriptions.Item>
              <Descriptions.Item label="Priority" span={1}>
                <Tag color={PRIORITY_CONFIG[selectedTask.priority as keyof typeof PRIORITY_CONFIG]?.color}>
                  {PRIORITY_CONFIG[selectedTask.priority as keyof typeof PRIORITY_CONFIG]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Task Title" span={2}>
                {selectedTask.title}
              </Descriptions.Item>
              <Descriptions.Item label="Project" span={2}>
                {selectedTask.projects?.name || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Delete Reason" span={2}>
                {selectedTask.deleteReason || "No reason provided"}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="mb-2">
                {currentAction === "approve" ? "Confirmation Comments (Optional):" : "Rejection Reason (Required):"}
                {currentAction === "reject" && <span className="text-red-500">*</span>}
              </div>
              <TextArea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={currentAction === "approve" ? "Enter confirmation comments..." : "Please explain the rejection reason..."}
              />
            </div>

            {currentAction === "approve" && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                <strong>Warning:</strong> Approving this deletion request will permanently delete the task and all associated data. This action cannot be undone.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
