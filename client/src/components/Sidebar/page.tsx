'use client'
import {
  Briefcase,
  ClosedCaptionIcon,
  FolderClosed,
  List,
  Home,
  User,
  Users,
  Icon,
  LockIcon,
  LucideIcon,
  Search,
  X,
  Settings,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Layers3,
  Network,
  CheckCircle,
  FileCheck,
  ListChecks,
  Trash2,
  Bell,
  FolderKanban,
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/redux'
import { setIsSidebarCollapsed } from '@/state'
import { usePathname } from 'next/navigation'
import path from 'path'
import Link from 'next/link'
import Navbar from '../Navbar/page'
import {
  useGetPendingProjectsQuery,
  useGetPendingTasksQuery,
  useGetPendingDeleteProjectsQuery,
  useGetPendingDeletionTasksQuery,
  useGetDraftProjectsQuery,
  useGetMyDraftProjectsQuery,
  UserRole,
  api,
} from '@/state/api'
import { cn } from '@/lib/utils'
import { selectCurrentUser } from '@/state/authSlice'
import { useWebSocketContext } from '@/contexts/WebSocketContext'

/* 'use client' */
type Props = {
  children?: React.ReactNode
}

const Siderbar = ({ }: Props) => {
  const [showPriority, setShowPriority] = useState(true)
  const [showApprovals, setShowApprovals] = useState(true)
  const dispatch = useAppDispatch()
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed)

  // 获取当前用户信息
  const currentUser = useAppSelector(selectCurrentUser)

  // 检查用户是否有审批权限
  const APPROVER_ROLES: UserRole[] = ['MANAGER', 'ADMIN']
  const canApprove = useMemo(() => {
    return currentUser && APPROVER_ROLES.includes(currentUser.role)
  }, [currentUser])

  // Fetch pending approval counts (只在有审批权限时获取)
  const { data: pendingProjects } = useGetPendingProjectsQuery(
    { page: 1, pageSize: 1 },
    { skip: !canApprove }
  )
  const { data: pendingTasks } = useGetPendingTasksQuery(
    undefined,
    { skip: !canApprove }
  )
  const { data: pendingDeleteProjects } = useGetPendingDeleteProjectsQuery(
    { page: 1, pageSize: 1 },
    { skip: !canApprove }
  )
  const { data: pendingDeleteTasks } = useGetPendingDeletionTasksQuery(
    undefined,
    { skip: !canApprove }
  )

  // Calculate total pending approvals
  const pendingProjectCount = pendingProjects?.data?.pagination?.total || 0
  const pendingTaskCount = pendingTasks?.data?.length || 0
  const pendingDeleteProjectCount = pendingDeleteProjects?.data?.pagination?.total || 0
  const pendingDeleteTaskCount = pendingDeleteTasks?.data?.length || 0

  const totalPendingApprovals = pendingProjectCount + pendingTaskCount + pendingDeleteProjectCount + pendingDeleteTaskCount

  // 🔌 WebSocket 实时更新审批通知
  const ws = useWebSocketContext()

  useEffect(() => {
    console.log('🔍 [Sidebar Debug] WebSocket status:', {
      canApprove,
      isConnected: ws.isConnected,
      currentUser: currentUser?.id,
    })

    if (!canApprove || !ws.isConnected) {
      console.warn('⚠️ [Sidebar] WebSocket listeners not registered:', {
        canApprove,
        isConnected: ws.isConnected,
      })
      return
    }

    console.log('✅ [Sidebar] Registering WebSocket event listeners...')

    // 监听任务审批状态变更
    const handleTaskApprovalChange = (data: any) => {
      console.log('📋 [Sidebar] Task approval status changed:', data)
      // 使审批相关的缓存失效，触发重新获取
      dispatch(api.util.invalidateTags(['Tasks']))
    }

    // 监听项目审批状态变更
    const handleProjectApprovalChange = (data: any) => {
      console.log('📁 [Sidebar] Minesite approval status changed:', data)
      dispatch(api.util.invalidateTags(['Projects']))
    }

    // 监听任务删除审批
    const handleTaskDeletionApproval = (data: any) => {
      console.log('🗑️ [Sidebar] Project deletion approved:', data)
      dispatch(api.util.invalidateTags(['Tasks']))
    }

    // 监听项目删除审批
    const handleProjectDeletionApproval = (data: any) => {
      console.log('🗑️ [Sidebar] Minesite deletion approved:', data)
      dispatch(api.util.invalidateTags(['Projects']))
    }

    // 监听新任务创建（可能需要审批）
    const handleTaskCreated = (data: any) => {
      console.log('✨ [Sidebar] New project created:', data)
      if (data.approvalStatus === 'PENDING') {
        dispatch(api.util.invalidateTags(['Tasks']))
      }
    }

    // 监听新项目创建（可能需要审批）
    const handleProjectCreated = (data: any) => {
      console.log('✨ [Sidebar] New Minesite created:', data)
      if (data.approvalStatus === 'PENDING') {
        dispatch(api.util.invalidateTags(['Projects']))
      }
    }

    // 注册事件监听器
    ws.on('task:approval:change', handleTaskApprovalChange)
    ws.on('task:approved', handleTaskApprovalChange)
    ws.on('task:rejected', handleTaskApprovalChange)
    ws.on('task:deletion:approved', handleTaskDeletionApproval)
    ws.on('task:deletion:rejected', handleTaskDeletionApproval)
    ws.on('task:created', handleTaskCreated)

    ws.on('project:approval:change', handleProjectApprovalChange)
    ws.on('project:approved', handleProjectApprovalChange)
    ws.on('project:rejected', handleProjectApprovalChange)
    ws.on('project:deletion:approved', handleProjectDeletionApproval)
    ws.on('project:deletion:rejected', handleProjectDeletionApproval)
    ws.on('project:created', handleProjectCreated)

    console.log('✅ [Sidebar] All WebSocket event listeners registered successfully')

    // 清理函数
    return () => {
      console.log('🧹 [Sidebar] Cleaning up WebSocket event listeners')
      ws.off('task:approval:change', handleTaskApprovalChange)
      ws.off('task:approved', handleTaskApprovalChange)
      ws.off('task:rejected', handleTaskApprovalChange)
      ws.off('task:deletion:approved', handleTaskDeletionApproval)
      ws.off('task:deletion:rejected', handleTaskDeletionApproval)
      ws.off('task:created', handleTaskCreated)

      ws.off('project:approval:change', handleProjectApprovalChange)
      ws.off('project:approved', handleProjectApprovalChange)
      ws.off('project:rejected', handleProjectApprovalChange)
      ws.off('project:deletion:approved', handleProjectDeletionApproval)
      ws.off('project:deletion:rejected', handleProjectDeletionApproval)
      ws.off('project:created', handleProjectCreated)
    }
  }, [canApprove, ws.isConnected, ws, dispatch])

  const sidebarClassNames = `fixed flex flex-col h-[100%] justify-between shadow-xl transition-all duration-300
  h-full z-40 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
  ${isSidebarCollapsed ? 'w-0 md:w-0' : 'w-64'} ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
  `
  console.log(sidebarClassNames)
  console.log(isSidebarCollapsed)

  return (
    <>
      {/* 小屏幕遮罩层 */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => dispatch(setIsSidebarCollapsed(true))}
        />
      )}

      <div className={sidebarClassNames}>
        <div className="flex h-[100%] w-full flex-col justify-start">
          <div className="bg-white mb-1 dark:bg-gray-900 z-50 flex min-h-[56px] w-64 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col  text-gray-900 dark:text-white">
              <span className="text-2xl font-extrabold tracking-tight">
                Ferrox
              </span>
              <span className="text-xs tracking-wide text-gray-600 dark:text-gray-300 -mt-1">
                Powering Projects Management
              </span>
            </div>
            {isSidebarCollapsed ? null : (
              <button
                className="py-3"
                onClick={() => {
                  dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))
                }}
              >
                <X className="text-sidebar-foreground hover:text-emerald-500 h-6 w-6 cursor-pointer transition-colors"></X>
              </button>
            )}
          </div>
          {/* TEAM */}
          <div className="bg-white dark:bg-gray-900 flex items-center gap-5 px-8 py-4">
            <div style={{ position: 'relative', width: "100%", height: 90 }}>
              <Image
                src="/logo.png"
                quality={100}
                alt="Logo"
                fill
                unoptimized
                style={{ objectFit: 'contain' }}
              />
            </div>
            {/* <div>
            <h3 className="text-md text-sidebar-foreground font-bold tracking-wide">LONGI TEAM</h3>
            <div className="mt-1 flex items-start gap-2">
              <LockIcon className="text-sidebar-foreground/60 mt-[0.1rem] h-3 w-3"></LockIcon>
              <p className="text-sidebar-foreground/70 text-xs">Private</p>
            </div>
          </div> */}
          </div>
          {/* NAVBAR LINK */}
          <nav className="z-10 w-full">
            <SidebarLink icon={Home} href="/home" label="Home" />
            <SidebarLink icon={Briefcase} href="/timeline" label="TimeLine" />
            <SidebarLink icon={Search} href="/search" label="Search" />
          </nav>

          {/* Main Navigation */}
          <div className="pt-2">
            <SidebarLink icon={FolderKanban} href="/projects" label="All Minesites" />
            <SidebarLink icon={ListChecks} href="/tasks/list" label="All Projects" />
            <SidebarLink icon={User} href="/my-work" label="My Work" />
          </div>

          {/* APPROVAL Links - 只对有审批权限的用户显示 */}
          {canApprove && (
            <div className="cursor-pointer pt-2">
              <button
                onClick={() => {
                  setShowApprovals((prev) => !prev)
                }}
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex w-full items-center justify-between px-8 py-3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Approvals</span>
                  {totalPendingApprovals > 0 && (
                    <span
                      className={cn(
                        "flex items-center justify-center bg-red-500 text-xs font-semibold text-white",
                        totalPendingApprovals < 10
                          ? "h-5 w-5 rounded-full"
                          : "h-5 min-w-[20px] px-1.5 rounded-full"
                      )}
                    >
                      {totalPendingApprovals > 99 ? "99+" : totalPendingApprovals}
                    </span>
                  )}
                </div>
                {showApprovals ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {showApprovals && (
                <>
                  <SidebarLink
                    icon={FileCheck}
                    href="/approvals/projects"
                    label="Minesite Approvals"
                    badge={pendingProjectCount + pendingDeleteProjectCount}
                  />
                  <SidebarLink
                    icon={ListChecks}
                    href="/approvals/tasks"
                    label="Projects Approvals"
                    badge={pendingTaskCount + pendingDeleteTaskCount}
                  />
                </>
              )}
            </div>
          )}

          {/* PRIORITES  Links */}

          <button
            onClick={() => {
              setShowPriority((prev) => !prev)
            }}
            className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex w-full items-center justify-between px-8 py-3 transition-colors"
          >
            <span className="font-medium">Priority</span>
            {showPriority ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {showPriority && (
            <>
              <SidebarLink icon={AlertCircle} label="Urgent" href="/priority/urgent" />
              <SidebarLink icon={ShieldAlert} label="High" href="/priority/high" />
              <SidebarLink icon={AlertTriangle} label="Medium" href="/priority/medium" />
              <SidebarLink icon={AlertOctagon} label="Low" href="/priority/low" />
              <SidebarLink icon={Layers3} label="Backlog" href="/priority/backlog" />
            </>
          )}
          <SidebarLink icon={Network} href="/knowledge-graph" label="Knowledge Graph" />
          <SidebarLink icon={Settings} href="/settings" label="Settings" />
          {showApprovals && <SidebarLink icon={User} href="/users" label="User" />}
          <SidebarLink icon={Users} href="/teams" label="Teams" />
        </div>
      </div>
    </>
  )
}

interface SidebarLinkProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
  // isCollapsed: boolean
}

const SidebarLink = ({ href, icon: Icon, label, badge }: SidebarLinkProps) => {
  const pathname = usePathname()
  const [isActive, setIsActive] = useState(false)

  // Use effect to check active state on client side
  useEffect(() => {
    // Handle exact match
    if (pathname === href) {
      setIsActive(true)
      return
    }
    if (pathname === '/' && href === '/dashboard') {
      setIsActive(true)
      return
    }

    // Handle links with query parameters
    if (href.includes('?')) {
      const [basePath, queryString] = href.split('?')
      if (pathname === basePath) {
        const currentParams = new URLSearchParams(window.location.search)
        const linkParams = new URLSearchParams(queryString)

        // Check if all link params match current URL params
        let allMatch = true
        linkParams.forEach((value, key) => {
          if (currentParams.get(key) !== value) {
            allMatch = false
          }
        })
        setIsActive(allMatch)
        return
      }
    }

    setIsActive(false)
  }, [pathname, href])

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const dispatch = useAppDispatch()
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed)

  return (
    <Link href={href} className="w-full">
      <div
        className={`group relative flex cursor-pointer items-center justify-between gap-3 px-8 py-3 transition-all duration-200 ease-in-out ${isActive
          ? 'bg-emerald-600 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600'
          }`}
      >
        <div className="flex items-center gap-3">
          <Icon
            className={`h-5 w-5 transition-all duration-200 ${isActive
              ? 'text-white'
              : 'text-gray-500 dark:text-gray-400 group-hover:text-white'
              }`}
          />
          <span
            className={`font-medium whitespace-nowrap transition-all duration-200 ${isActive
              ? 'text-white font-semibold'
              : 'text-gray-700 dark:text-gray-300 group-hover:text-white group-hover:font-semibold'
              }`}
          >
            {label}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
export default Siderbar