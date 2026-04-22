"use client"

import { useGetPendingProjectsQuery } from "@/state/api"
import { ProjectApprovalQueue } from "@/components/Approvals/ProjectApprovalQueue"

export default function ProjectApprovalsPage() {
  return (
    <div className="h-full w-full p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Project Approvals</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Review and approve pending project submissions
        </p>
      </div>
      <ProjectApprovalQueue />
    </div>
  )
}
