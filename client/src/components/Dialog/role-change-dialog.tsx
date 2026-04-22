/**
 * 角色更改对话框 - Role Change Dialog
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useUpdateUserRoleMutation, useGetRolePermissionsQuery, type UserRole, type User } from '@/state/api'
import { Shield, Crown, Briefcase, User as UserIcon, UserCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_CONFIG: Record<UserRole, { label: string, color: string, bgColor: string, icon: any, description: string }> = {
  USER: {
    label: '普通用户',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: UserIcon,
    description: '基础权限，可查看和管理自己的任务'
  },
  PROJECT_MANAGER: {
    label: '项目经理',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: Briefcase,
    description: '管理项目和团队，可以创建和分配任务'
  },
  TEAM_LEAD: {
    label: '团队主管',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: UserCheck,
    description: '管理团队成员，审批团队相关事务'
  },
  ADMIN: {
    label: '管理员',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    icon: Shield,
    description: '系统管理员，拥有大部分管理权限'
  },
  SUPER_ADMIN: {
    label: '超级管理员',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: Crown,
    description: '最高权限，可以执行所有操作'
  }
}

// 权限分组配置
const PERMISSION_GROUPS = {
  '系统管理': ['SYSTEM_ADMIN', 'USER_MANAGE', 'ROLE_MANAGE', 'TEAM_MANAGE'],
  '项目管理': ['PROJECT_CREATE', 'PROJECT_READ', 'PROJECT_UPDATE', 'PROJECT_DELETE', 'PROJECT_MEMBER_MANAGE'],
  '任务管理': ['TASK_CREATE', 'TASK_READ', 'TASK_UPDATE', 'TASK_DELETE', 'TASK_ASSIGN'],
  '测试工作': ['TESTWORK_CREATE', 'TESTWORK_READ', 'TESTWORK_UPDATE', 'TESTWORK_DELETE', 'TESTWORK_EXECUTE', 'TESTWORK_MONITOR', 'TESTWORK_ANALYZE'],
  '文件管理': ['FILE_UPLOAD', 'FILE_DOWNLOAD', 'FILE_DELETE', 'FILE_SHARE'],
  '评论聊天': ['COMMENT_CREATE', 'COMMENT_READ', 'COMMENT_DELETE', 'CHAT_PARTICIPATE', 'CHAT_MANAGE'],
  '工作流': ['WORKFLOW_CREATE', 'WORKFLOW_APPROVE', 'WORKFLOW_DELEGATE', 'WORKFLOW_MANAGE'],
  '报表': ['REPORT_VIEW', 'REPORT_EXPORT', 'REPORT_MANAGE'],
  '通知': ['NOTIFICATION_SEND', 'NOTIFICATION_MANAGE'],
  '矿区': ['MINE_ZONE_CREATE', 'MINE_ZONE_READ', 'MINE_ZONE_UPDATE', 'MINE_ZONE_DELETE'],
}

interface RoleChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSuccess?: () => void
}

export function RoleChangeDialog({ open, onOpenChange, user, onSuccess }: RoleChangeDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const [updateUserRole, { isLoading }] = useUpdateUserRoleMutation()

  // 获取选中角色的权限
  const { data: permissionsData } = useGetRolePermissionsQuery(selectedRole, {
    skip: !selectedRole,
  })

  const permissions = permissionsData?.data || []

  const handleSubmit = async () => {
    if (selectedRole === user.role) {
      onOpenChange(false)
      return
    }

    try {
      await updateUserRole({ userId: user.id, role: selectedRole }).unwrap()
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  // 按组分类权限
  const groupedPermissions = Object.entries(PERMISSION_GROUPS).map(([groupName, groupPerms]) => ({
    name: groupName,
    permissions: groupPerms.filter(p => permissions.includes(p)),
    count: groupPerms.filter(p => permissions.includes(p)).length,
    total: groupPerms.length,
  })).filter(group => group.count > 0)

  const RoleIcon = ROLE_CONFIG[selectedRole]?.icon || UserIcon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            更改用户角色
          </DialogTitle>
          <DialogDescription>
            为用户 <span className="font-semibold text-gray-900">{user.realName || user.username}</span> 分配新的角色和权限
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 当前角色 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">当前角色:</div>
            <Badge className={cn('px-3 py-1', ROLE_CONFIG[user.role]?.bgColor)}>
              <span className={ROLE_CONFIG[user.role]?.color}>
                {ROLE_CONFIG[user.role]?.label}
              </span>
            </Badge>
          </div>

          {/* 选择新角色 */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-base font-semibold">
              选择新角色
            </Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
                  const config = ROLE_CONFIG[role]
                  const Icon = config.icon
                  return (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{config.label}</span>
                        <span className="text-xs text-gray-500">• {config.description}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 角色信息卡片 */}
          <div className={cn('p-4 rounded-lg border-2', ROLE_CONFIG[selectedRole]?.bgColor)}>
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-lg', ROLE_CONFIG[selectedRole]?.bgColor)}>
                <RoleIcon className={cn('w-6 h-6', ROLE_CONFIG[selectedRole]?.color)} />
              </div>
              <div className="flex-1">
                <h3 className={cn('font-semibold text-lg', ROLE_CONFIG[selectedRole]?.color)}>
                  {ROLE_CONFIG[selectedRole]?.label}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {ROLE_CONFIG[selectedRole]?.description}
                </p>
              </div>
            </div>
          </div>

          {/* 权限预览 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">此角色拥有的权限</Label>
              <Badge variant="secondary" className="text-xs">
                共 {permissions.length} 项权限
              </Badge>
            </div>

            {groupedPermissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedPermissions.map((group) => (
                  <div key={group.name} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">{group.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {group.count}/{group.total}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {group.permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>{perm.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>此角色暂无权限</p>
              </div>
            )}
          </div>

          {/* 警告信息 */}
          {selectedRole !== user.role && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-600 mt-0.5">⚠️</div>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">重要提示：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>角色更改将立即生效</li>
                  <li>用户的权限将根据新角色进行调整</li>
                  <li>此操作会被记录在审计日志中</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedRole === user.role}
            className="min-w-24"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                更新中...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                确认更改
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
