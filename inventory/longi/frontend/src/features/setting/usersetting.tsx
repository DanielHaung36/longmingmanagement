"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Users,
  Shield,
  Save,
  RotateCcw,
  Filter,
  CheckCircle,
  Loader2,
  User,
  Clock,
  ChevronRight,
  Star,
  Settings,
  Package,
  DollarSign,
  FileText,
  Cog,
  Grid3X3,
  List,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import type {
  User as UserType,
  PermissionModule,
  PermissionDTO,
} from "./permissionApi"
import {
  getUsers,
  getPermissionModules,
  getUserPermissions,
  updateUserPermissions,
} from "../../../src/lib/user-permission-service"
import { cn } from "@/lib/utils"
import { useListUsersQuery,
  useGetUserPermissionsQuery,
  useUpdateUserPermissionsMutation} from "./userperApi" 

import { useGetPermissionModulesQuery } from "./permissionApi"
import { useTranslation } from "react-i18next"
import { CircularProgress } from "@mui/material"

export default function UserPermissionsPage() {
  const { toast } = useToast()
  const { t } = useTranslation()

  // RTK Query hooks
  const { data: users = [], isLoading: loadingUsers } = useListUsersQuery()
  const { data: modules = [], isLoading: loadingModules } = useGetPermissionModulesQuery()
  const [updatePermissions, { isLoading: saving }] = useUpdateUserPermissionsMutation()

  // Data states
  // const [users, setUsers] = useState<UserType[]>([])
  const [permissionModules, setPermissionModules] = useState<PermissionModule[]>([])
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [userPermissions, setUserPermissions] = useState<number[]>([])
  const [originalPermissions, setOriginalPermissions] = useState<number[]>([])
  // console.log(modules);
  
  // UI states
  const [userSearch, setUserSearch] = useState("")
  const [permissionSearch, setPermissionSearch] = useState("")
  const [selectedModule, setSelectedModule] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"card" | "list">("card") // 添加视图模式状态
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
 // 拉取选中用户权限
  const {
    data: permData,
    isLoading: loadingPerms,
    isError: errorPerms,
  } = useGetUserPermissionsQuery(selectedUser?.id!, {
    skip: !selectedUser,
  })

    // 同步到本地
    useEffect(() => {
      if (permData) {
        // Defensive: ensure we always set an array, never undefined/null
        let perms: number[] = []
        if (Array.isArray(permData)) {
          perms = permData.filter((p) => typeof p === "number")
        } else if (permData.permissions && Array.isArray(permData.permissions)) {
          perms = permData.permissions.filter((p: any) => typeof p === "number")
        }
        setUserPermissions(perms)
        setOriginalPermissions(perms)
      } else {
        setUserPermissions([])
        setOriginalPermissions([])
      }
    }, [permData])

  // Load initial data
  // useEffect(() => {
  //   const loadData = async () => {
  //     setLoading(true)
  //     try {
  //       const [usersData, modulesData] = await Promise.all([getUsers(), getPermissionModules()])
  //       setUsers(usersData)
  //       setPermissionModules(modulesData)
  //     } catch (error) {
  //       toast({
  //         title: t("userPermissionsPage.toast.loadingFailed.title"),
  //         description: t("userPermissionsPage.toast.loadingFailed.description"),
  //         variant: "destructive",
  //       })
  //     } finally {
  //       setLoading(false)
  //     }
  //   }
  //   loadData()
  // }, [toast])

  // Load user permissions when user is selected
  // useEffect(() => {
  //   const loadUserPermissions = async () => {
  //     if (!selectedUser) return

  //     try {
  //       const permissionData = await getUserPermissions(selectedUser.id)
  //       const permissions = permissionData?.permissions || []
  //       setUserPermissions(permissions)
  //       setOriginalPermissions(permissions)
  //     } catch (error) {
  //       toast({
  //         title: t("userPermissionsPage.toast.permissionLoadFailed.title"),
  //         description: t("userPermissionsPage.toast.permissionLoadFailed.description"),
  //         variant: "destructive",
  //       })
  //     }
  //   }
  //   loadUserPermissions()
  // }, [selectedUser, toast])

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (u.fullName ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.username ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.role ?? '').toLowerCase().includes(userSearch.toLowerCase())
    )
  }, [users, userSearch])


  // Filter permission modules
  // const filteredModules = useMemo(() => {
  //   let modules = permissionModules

  //   if (selectedModule !== "all") {
  //     modules = modules.filter((module) => module.module === selectedModule)
  //   }

  //   if (permissionSearch) {
  //     modules = modules
  //       .map((module) => ({
  //         ...module,
  //         permissions: module.permissions.filter(
  //           (perm) =>
  //             perm.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
  //             perm.description?.toLowerCase().includes(permissionSearch.toLowerCase()) ||
  //             perm.name.toLowerCase().includes(permissionSearch.toLowerCase()),
  //         ),
  //       }))
  //       .filter((module) => module.permissions.length > 0)
  //   }

  //   return modules
  // }, [permissionModules, selectedModule, permissionSearch])

   // 过滤模块
  const filteredModules = useMemo(() => {
    let list = modules
    if (selectedModule !== "all") {
      list = list.filter((m) => m.module === selectedModule)
    }
    if (permissionSearch) {
      list = list
        .map((m) => ({
          ...m,
          permissions: m.permissions.filter(
            (p) =>
              p.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
              p.description?.toLowerCase().includes(permissionSearch.toLowerCase()) ||
              p.name.toLowerCase().includes(permissionSearch.toLowerCase())
          ),
        }))
        .filter((m) => m.permissions.length > 0)
    }
    return list
  }, [modules, selectedModule, permissionSearch])

  // Permission operations
  const togglePermission = (permissionId: number) => {
    setUserPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
    )
  }

  // const toggleModulePermissions = (module: PermissionModule) => {
  //   const modulePermissionIds = module.permissions.map((p) => p.id)
  //   const allSelected = modulePermissionIds.every((id) => userPermissions.includes(id))

  //   if (allSelected) {
  //     setUserPermissions((prev) => prev.filter((id) => !modulePermissionIds.includes(id)))
  //   } else {
  //     setUserPermissions((prev) => [...new Set([...prev, ...modulePermissionIds])])
  //   }
  // }

    const toggleModulePermissions = (mod: PermissionModule) => {
    const ids = mod.permissions.map((p) => p.id)
    const all = ids.every((x) => userPermissions.includes(x))
    setUserPermissions((prev) =>
      all ? prev.filter((x) => !ids.includes(x)) : Array.from(new Set([...prev, ...ids]))
    )
  }


  const resetPermissions = () => {
    setUserPermissions(originalPermissions)
  }
  const loading = loadingUsers || loadingModules || loadingPerms
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    )
  }

    const savePermissions = async () => {
    if (!selectedUser) return
    try {
      await updatePermissions({ userId: selectedUser.id, permissions: userPermissions }).unwrap()
      setOriginalPermissions(userPermissions)
      toast({ title: "Saved!", variant: "success" })
    } catch {
      toast({ title: "Save failed", variant: "destructive" })
    }
  }

  const hasChanges =
  JSON.stringify([...userPermissions].sort()) !==
  JSON.stringify([...originalPermissions].sort())

  const getPermissionStats = () => {  
    const totalPermissions = modules.reduce((sum, module) => sum + module.permissions.length, 0)
    const selectedPermissions = userPermissions.length
    const percentage = totalPermissions > 0 ? Math.round((selectedPermissions / totalPermissions) * 100) : 0
    return { total: totalPermissions, selected: selectedPermissions, percentage }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-50 text-red-700 border-red-200"
      case "sales_rep":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "sales_leader":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "purchase_rep":
        return "bg-green-50 text-green-700 border-green-200"
      case "purchase_leader":
        return "bg-green-100 text-green-800 border-green-300"
      case "operations_staff":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "operations_leader":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "finance_staff":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "finance_leader":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "user":
        return "bg-gray-50 text-gray-700 border-gray-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case "Inventory Management":
        return Package
      case "Sales Management":
        return DollarSign
      case "Quote Management":
        return FileText
      case "Finance Management":
        return DollarSign
      case "User Management":
        return Users
      case "System Settings":
        return Cog
      default:
        return Settings
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
            <Shield className="absolute inset-0 m-auto h-6 w-6 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Loading Permission System</p>
            <p className="text-sm text-gray-600">Initializing user and permission data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Light-themed Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50" />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-blue-500 text-white shadow-sm">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">User Permission Management</h1>
                <p className="text-lg text-gray-600 mt-1">Secure access control and permission management system</p>
              </div>
            </div>

            {selectedUser && (
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-blue-100 shadow-sm">
                    <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-blue-500 text-white font-semibold">
                      {selectedUser.fullName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg text-gray-900">{selectedUser.fullName}</p>
                    <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getPermissionStats().selected}</div>
                    <div className="text-xs text-gray-600">Active Permissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{getPermissionStats().percentage}%</div>
                    <div className="text-xs text-gray-600">Coverage</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Enhanced User List with Horizontal Scrolling */}
          <Card
            className={cn(
              "shadow-sm border-gray-200 bg-white h-fit max-h-[calc(100vh-120px)] transition-all duration-300",
              isSidebarExpanded ? "xl:col-span-2" : "xl:col-span-1",
            )}
          >
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200"
                  onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                >
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                      Team Members
                      <ChevronRight
                        className={cn("h-4 w-4 transition-transform duration-200", isSidebarExpanded && "rotate-90")}
                      />
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-600">
                          {filteredUsers.filter((u) => u.isActive).length} active
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                        {filteredUsers.length} total
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <CardDescription className="text-gray-600 mt-2">
                {isSidebarExpanded
                  ? "Click to collapse • Select a user to manage their permissions"
                  : "Click to expand • Select a user to manage their permissions"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-4  w-full">
              {/* Enhanced Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 bg-gray-50 border-gray-200 focus:border-blue-300 focus:ring-blue-100"
                />
              </div>

              {/* Horizontal Scrolling User List */}
              <div className="relative">
                <ScrollArea className="h-[calc(100vh-400px)] min-h-[500px] max-h-[700px] w-full">
                  <div className="space-y-3 pr-5 pb-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          "group p-2 rounded-xl cursor-pointer transition-all duration-200 border-2",
                          selectedUser?.id === user.id
                            ? "bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-100"
                            : "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md",
                        )}
                        onClick={() => setSelectedUser(user)}
                      >
                        {/* 用户卡片内容保持不变 */}
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-blue-500 text-white font-medium">
                                {user.fullName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                                user.isActive ? "bg-green-500" : "bg-red-500",
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm truncate text-gray-900">{user.fullName}</p>
                        
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-2">@{user.username}</p>
                                  {selectedUser?.id === user.id && (
                                <div className="flex items-center gap-0 mb-1">
                                  <ChevronRight className="h-4 w-1 text-blue-600" />
                                  <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">Selected</Badge>
                                </div>
                              )}
                              <div>
                                 <Badge className={cn("text-xs px-2 py-1 font-medium", getRoleColor(user.role))}>
                              {user.role}
                            </Badge>
                              </div>
                           
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {user.lastLogin
                                  ? `Active ${new Date(user.lastLogin).toLocaleDateString()}`
                                  : "Never logged in"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* 改进滚动指示器 */}
                <div className="absolute top-0 right-0 h-full w-6 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-6 h-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Permission Configuration */}
          <div
            className={cn(
              "space-y-6 transition-all duration-300",
              isSidebarExpanded ? "xl:col-span-3" : "xl:col-span-4",
            )}
          >
            {!selectedUser ? (
              <Card className="shadow-sm border-gray-200 bg-white">
                <CardContent className="flex flex-col items-center justify-center h-[600px] text-center">
                  <div className="p-6 rounded-full bg-blue-50 mb-6">
                    <User className="h-16 w-16 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-gray-900">Select a Team Member</h3>
                  <p className="text-gray-600 text-lg max-w-md">
                    Choose a user from the left panel to configure their system permissions and access levels
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Enhanced Permission Controls */}
                <Card className="shadow-sm border-gray-200 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-gray-900">
                          <Settings className="h-5 w-5 text-blue-600" />
                          Permission Configuration
                        </CardTitle>
                        <CardDescription className="text-base text-gray-600">
                          Configure system access permissions for {selectedUser.fullName}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* 添加视图模式切换 - 更明显的 active 状态 */}
                        <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50">
                          <Button
                            variant={viewMode === "card" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("card")}
                            className={cn(
                              "h-8 px-3 transition-all duration-200",
                              viewMode === "card"
                                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                            )}
                          >
                            <Grid3X3 className="h-4 w-4 mr-1" />
                            Card
                          </Button>
                          <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={cn(
                              "h-8 px-3 transition-all duration-200",
                              viewMode === "list"
                                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                            )}
                          >
                            <List className="h-4 w-4 mr-1" />
                            List
                          </Button>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetPermissions}
                          disabled={!hasChanges}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>

                        <Button
                          onClick={savePermissions}
                          disabled={!hasChanges || saving}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 p-6">
                    {/* Enhanced Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search permissions..."
                          value={permissionSearch}
                          onChange={(e) => setPermissionSearch(e.target.value)}
                          className="pl-9 bg-gray-50 border-gray-200 focus:border-blue-300 focus:ring-blue-100"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                          value={selectedModule}
                          onChange={(e) => setSelectedModule(e.target.value)}
                          className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 min-w-[150px]"
                        >
                          <option value="all">All Modules</option>
                          {permissionModules.map((module) => (
                            <option key={module.module} value={module.module}>
                              {module.module}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Enhanced Permission Modules with Card/List View */}
                    <div className="space-y-6">
                      {filteredModules.map((module) => {
                        const modulePermissionIds = module.permissions.map((p) => p.id)
                        const selectedCount = modulePermissionIds.filter((id) => userPermissions.includes(id)).length
                        const allSelected = selectedCount === modulePermissionIds.length
                        const someSelected = selectedCount > 0 && selectedCount < modulePermissionIds.length
                        const ModuleIcon = getModuleIcon(module.module)

                        return (
                          <Card
                            key={module.module}
                            className="border-l-4 border-l-blue-400 shadow-sm bg-white border-gray-200"
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center space-x-3">
                                    <Checkbox
                                      checked={allSelected}
                                      ref={(el) => {
                                        if (el) el.indeterminate = someSelected
                                      }}
                                      onCheckedChange={() => toggleModulePermissions(module)}
                                      className="w-5 h-5"
                                    />
                                    <div className="p-2 rounded-lg bg-blue-50">
                                      <ModuleIcon className="h-6 w-6 text-blue-600" />
                                    </div>
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                                      {module.module}
                                      {allSelected && <Star className="h-4 w-4 text-yellow-500" />}
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1 text-gray-600">
                                      {module.description}
                                    </CardDescription>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant={allSelected ? "default" : someSelected ? "secondary" : "outline"}
                                    className={cn(
                                      "text-sm px-3 py-1",
                                      allSelected && "bg-blue-100 text-blue-700 border-blue-200",
                                      someSelected && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                    )}
                                  >
                                    {selectedCount} / {modulePermissionIds.length}
                                  </Badge>
                                  {someSelected && !allSelected && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                                    >
                                      Partial
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent>
                              {viewMode === "card" ? (
                                // 卡片模式 - 水平滚动
                                <HorizontalScrollContainer
                                  permissions={module.permissions}
                                  userPermissions={userPermissions}
                                  togglePermission={togglePermission}
                                />
                              ) : (
                                // 列表模式 - 垂直列表
                                <div className="grid gap-3">
                                  {module.permissions.map((permission) => (
                                    <div
                                      key={permission.id}
                                      className={cn(
                                        "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                                        userPermissions.includes(permission.id)
                                          ? "border-blue-200 bg-blue-50 shadow-sm"
                                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50",
                                      )}
                                      onClick={() => togglePermission(permission.id)}
                                    >
                                      <div className="flex items-start space-x-3">
                                        <Checkbox
                                          checked={userPermissions.includes(permission.id)}
                                          onCheckedChange={() => togglePermission(permission.id)}
                                          className="mt-1 w-5 h-5"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="font-semibold text-sm text-gray-900">
                                              {permission.label}
                                            </div>
                                            {userPermissions.includes(permission.id) && (
                                              <CheckCircle className="h-4 w-4 text-green-500" />
                                            )}
                                          </div>

                                          {permission.description && (
                                            <p className="text-xs text-gray-600 leading-relaxed mb-2">
                                              {permission.description}
                                            </p>
                                          )}

                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 border-gray-200"
                                            >
                                              {permission.name}
                                            </Badge>
                                            {userPermissions.includes(permission.id) && (
                                              <Badge className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                                                Active
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    {/* No Results State */}
                    {filteredModules.length === 0 && (
                      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                          <Search className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold mb-2 text-gray-900">No Permissions Found</h3>
                          <p className="text-gray-600">Try adjusting your search terms or filter criteria</p>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 水平滚动容器组件
function HorizontalScrollContainer({
  permissions,
  userPermissions,
  togglePermission,
}: { permissions: any[]; userPermissions: number[]; togglePermission: (permissionId: number) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollability()
    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollability)
      return () => scrollElement.removeEventListener("scroll", checkScrollability)
    }
  }, [permissions])

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" })
    }
  }

  return (
    <div className="relative">
      {/* 左滚动按钮 */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-white shadow-md hover:bg-gray-50"
          onClick={scrollLeft}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* 右滚动按钮 */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-white shadow-md hover:bg-gray-50"
          onClick={scrollRight}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}

      {/* 滚动容器 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-thin pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {permissions.map((permission) => (
          <div
            key={permission.id}
            className={cn(
              "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex-shrink-0 w-[320px]",
              userPermissions.includes(permission.id)
                ? "border-blue-200 bg-blue-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50",
            )}
            onClick={() => togglePermission(permission.id)}
          >
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={userPermissions.includes(permission.id)}
                onCheckedChange={() => togglePermission(permission.id)}
                className="mt-1 w-5 h-5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-sm text-gray-900">{permission.label}</div>
                  {userPermissions.includes(permission.id) && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>

                {permission.description && (
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{permission.description}</p>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 border-gray-200">
                    {permission.name}
                  </Badge>
                  {userPermissions.includes(permission.id) && (
                    <Badge className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">Active</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FullScreenLoader({ text = "Loading..." }) {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(255,255,255,0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <CircularProgress size={60} thickness={4} color="primary" />
      <div style={{ marginTop: 24, fontSize: 18, color: "#333" }}>{text}</div>
    </div>
  );
}
