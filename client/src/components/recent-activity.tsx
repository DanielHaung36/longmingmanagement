import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, CheckCircle2, XCircle, MessageSquare, Upload, Edit, Trash2, UserPlus, FolderPlus, Loader2, AlertCircle } from "lucide-react"
import { useGetRecentActivitiesQuery } from "@/state/api"
import { formatDistanceToNow } from "date-fns"

// Map activity actions to icons and colors
const activityConfig: Record<string, { icon: any; color: string }> = {
  CREATE: { icon: FolderPlus, color: "text-blue-600" },
  UPDATE: { icon: Edit, color: "text-amber-600" },
  DELETE: { icon: Trash2, color: "text-red-600" },
  APPROVE: { icon: CheckCircle2, color: "text-green-600" },
  REJECT: { icon: XCircle, color: "text-red-600" },
  COMMENT: { icon: MessageSquare, color: "text-purple-600" },
  UPLOAD: { icon: Upload, color: "text-indigo-600" },
  REGISTER: { icon: UserPlus, color: "text-emerald-600" },
}

const getActionText = (action: string, tableName: string): string => {
  const actionMap: Record<string, Record<string, string>> = {
    CREATE: {
      projects: "created project",
      tasks: "created task",
      users: "created user",
      comments: "commented on",
      default: "created",
    },
    UPDATE: {
      projects: "updated project",
      tasks: "updated task",
      users: "updated user",
      default: "updated",
    },
    DELETE: {
      projects: "deleted project",
      tasks: "deleted task",
      users: "deleted user",
      default: "deleted",
    },
    APPROVE: {
      projects: "approved project",
      tasks: "approved task",
      default: "approved",
    },
    REJECT: {
      projects: "rejected project",
      tasks: "rejected task",
      default: "rejected",
    },
  }

  return actionMap[action]?.[tableName] || actionMap[action]?.default || action.toLowerCase()
}

export function RecentActivity() {
  const { data, isLoading, error } = useGetRecentActivitiesQuery({ limit: 10 })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load activities</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activities = data?.data || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your team</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const config = activityConfig[activity.action] || activityConfig.CREATE
              const Icon = config.icon
              const username = activity.user?.realName || activity.user?.username || "Unknown User"
              const actionText = getActionText(activity.action, activity.tableName)
              const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })

              return (
                <div key={activity.id} className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {username
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{username}</span>{" "}
                      <span className="text-muted-foreground">{actionText}</span>{" "}
                      <span className="font-medium">{activity.tableName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
