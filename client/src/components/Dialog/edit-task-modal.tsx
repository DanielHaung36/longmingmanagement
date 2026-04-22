"use client"

import { useState, useEffect, useMemo } from "react"
import {
  useUpdateTaskMutation,
  useGetProjectsQuery,
  useGetUsersQuery,
  useGetMineralsQuery,
  Task,
} from "@/state/api"
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  InputNumber,
  message,
  Space,
  Tag,
  Avatar,
  Row,
  Col,
  Divider,
  AutoComplete,
  Typography,
  Descriptions,
} from "antd"
import {
  UserOutlined,
  ProjectOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons"
import dayjs from "dayjs"

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  task: Task | null
}

const JOB_TYPES = [
  { value: "AC", label: "Consulting", color: "cyan" },
  { value: "AP", label: "Production", color: "blue" },
  { value: "AQ", label: "Quote", color: "green" },
  { value: "AS", label: "Sales", color: "purple" },
  { value: "AT", label: "Testwork", color: "gold" },
]

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "default" },
  { value: "MEDIUM", label: "Medium", color: "blue" },
  { value: "HIGH", label: "High", color: "orange" },
  { value: "URGENT", label: "Urgent", color: "red" },
]

const STATUS_OPTIONS = [
  { value: "TODO", label: "Todo", color: "default" },
  { value: "IN_PROGRESS", label: "In Progress", color: "processing" },
  { value: "REVIEW", label: "Review", color: "purple" },
  { value: "DONE", label: "Done", color: "success" },
  { value: "CANCELLED", label: "Cancelled", color: "error" },
]

export function EditTaskModal({ open, onClose, onSuccess, task }: Props) {
  const [form] = Form.useForm()
  const [updateTask, { isLoading }] = useUpdateTaskMutation()

  const { data: projectsResponse } = useGetProjectsQuery({ pageSize: 500 })
  const { data: usersResponse } = useGetUsersQuery()
  const { data: mineralsResponse } = useGetMineralsQuery()

  const projects = projectsResponse?.data?.projects || []
  const users = usersResponse?.data?.data || []
  const mineralOptions = useMemo(() => {
    const minerals = mineralsResponse?.data || []
    return minerals.filter(Boolean).map(m => ({ value: m }))
  }, [mineralsResponse])

  // Populate form when task changes
  useEffect(() => {
    if (task && open) {
      form.setFieldsValue({
        title: task.title,
        description: task.description || "",
        projectId: task.projectId,
        assignedUserId: task.assignedUserId || undefined,
        mineral: task.mineral || "",
        priority: task.priority || "MEDIUM",
        status: task.status || "TODO",
        estimatedHours: task.estimatedHours || undefined,
        actualHours: task.actualHours || undefined,
        progress: task.progress || 0,
        startDate: task.startDate ? dayjs(task.startDate) : null,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      })
    }
  }, [task, open, form])

  const handleSubmit = async (values: any) => {
    if (!task) return

    try {
      await updateTask({
        id: task.id,
        data: {
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          assignedUserId: values.assignedUserId ? Number(values.assignedUserId) : undefined,
          mineral: values.mineral || undefined,
          priority: values.priority,
          status: values.status,
          estimatedHours: values.estimatedHours || undefined,
          actualHours: values.actualHours || undefined,
          progress: values.progress || 0,
          startDate: values.startDate ? values.startDate.toISOString() : undefined,
          dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        },
      }).unwrap()

      message.success("Task updated successfully")
      onClose()
      onSuccess?.()
    } catch (error: any) {
      message.error(error?.data?.message || "Failed to update task")
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  if (!task) return null

  return (
    <Modal
      title={
        <Space>
          <ProjectOutlined style={{ color: "#52c41a" }} />
          <span>Edit Task</span>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={900}
      destroyOnClose
    >
      {/* Task Info Card */}
      <Descriptions
        bordered
        size="small"
        column={2}
        style={{ marginBottom: 24, backgroundColor: "#fafafa" }}
      >
        <Descriptions.Item label="Task Code" span={1}>
          <Tag color="blue">{task.taskCode}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Project" span={1}>
          {task.projects?.name || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At" span={1}>
          {task.createdAt ? new Date(task.createdAt).toLocaleString() : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Approval Status" span={1}>
          <Tag color={task.approvalStatus === "APPROVED" ? "success" : task.approvalStatus === "PENDING" ? "warning" : "default"}>
            {task.approvalStatus}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: "16px 0" }} />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        {/* Task Title */}
        <Form.Item
          name="title"
          label="Task Title"
          rules={[
            { required: true, message: "Please enter task title" },
            { min: 3, message: "Title must be at least 3 characters" },
          ]}
        >
          <Input
            placeholder="Enter task title..."
            prefix={<ProjectOutlined />}
            size="large"
          />
        </Form.Item>

        {/* Description */}
        <Form.Item name="description" label="Description">
          <TextArea
            rows={3}
            placeholder="Describe what needs to be done..."
          />
        </Form.Item>

        {/* Task Type (Read-only - Cannot be changed after creation) */}
        <Form.Item label="Task Type">
          <Tag color={JOB_TYPES.find(t => t.value === task?.jobType)?.color || "default"} style={{ fontSize: 14, padding: "4px 12px" }}>
            <Space>
              <ExperimentOutlined />
              <span>{JOB_TYPES.find(t => t.value === task?.jobType)?.label || task?.jobType || "Not Set"}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({task?.jobType})
              </Text>
            </Space>
          </Tag>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ⚠️ Task type cannot be changed after creation
            </Text>
          </div>
        </Form.Item>

        {/* Project (Read-only) & Assigned User */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="projectId" label="Project">
              <Select
                placeholder="Select project"
                disabled
                size="large"
                suffixIcon={<ProjectOutlined />}
              >
                {projects.map((project) => (
                  <Option key={project.id} value={project.id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="assignedUserId" label="Assigned To">
              <Select
                placeholder="Select assignee (optional)"
                showSearch
                allowClear
                optionFilterProp="children"
                size="large"
                suffixIcon={<UserOutlined />}
              >
                {users?.map((user) => (
                  <Option key={user.id} value={user.id}>
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
                        {(user.realName?.[0] || user.username[0]).toUpperCase()}
                      </Avatar>
                      <span>{user.realName || user.username}</span>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Priority & Status */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="priority" label="Priority">
              <Select size="large">
                {PRIORITIES.map((p) => (
                  <Option key={p.value} value={p.value}>
                    <Tag color={p.color}>{p.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="status" label="Status">
              <Select size="large">
                {STATUS_OPTIONS.map((s) => (
                  <Option key={s.value} value={s.value}>
                    <Tag color={s.color}>{s.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Dates & Hours */}
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="startDate" label="Start Date">
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                size="large"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDate = getFieldValue("startDate")
                    if (!value || !startDate || value.isAfter(startDate)) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error("Due date must be after start date"))
                  },
                }),
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                size="large"
                suffixIcon={<CalendarOutlined />}
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="estimatedHours"
              label="Est. Hours"
              rules={[{ type: "number", min: 0, message: "Must be positive" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="40"
                min={0}
                size="large"
                prefix={<ClockCircleOutlined />}
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="actualHours"
              label="Actual Hours"
              rules={[{ type: "number", min: 0, message: "Must be positive" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="0"
                min={0}
                size="large"
                prefix={<ClockCircleOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Mineral & Progress */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="mineral" label="Mineral Type">
              <AutoComplete
                options={mineralOptions}
                placeholder="Select or enter mineral type"
                size="large"
                allowClear
                filterOption={(inputValue, option) =>
                  option?.value.toUpperCase().includes(inputValue.toUpperCase())
                }
              >
                <Input prefix={<ExperimentOutlined style={{ color: "#f59e0b" }} />} />
              </AutoComplete>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="progress"
              label="Progress (%)"
              rules={[
                { type: "number", min: 0, max: 100, message: "Must be 0-100" }
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={100}
                size="large"
                formatter={value => `${value}%`}
                parser={value => value!.replace('%', '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Footer Buttons */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ float: "right" }}>
            <Button onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Update Task
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
