"use client"

import { TaskApprovalQueue } from "@/components/Approvals/TaskApprovalQueue"
import { Alert } from "antd"
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons"

export default function TaskApprovalsPage() {
  return (
    <div className="h-full w-full p-4 md:p-8">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <CheckCircleOutlined className="text-blue-500" />
            Projects Approval Center
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-2">
            Review and approve pending project submissions
          </p>
        </div>

        <Alert
          message="Action Required"
          description="You have pending tasks that require your approval. Please review and take action on the items below."
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          className="bg-blue-50 border-blue-200"
        />
      </div>
      <TaskApprovalQueue />
    </div>
  )
}
