'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGetUsersQuery } from '@/state/api'
import {
  Search, UserPlus, Users as UsersIcon, Edit, Trash2, Mail, Phone,
  Shield, Crown, Briefcase, User as UserIcon, Filter, Grid, List,
  TrendingUp, UserCheck
} from 'lucide-react'
import { CreateUserDialog, EditUserDialog, DeleteUserDialog } from '@/components/Dialog/user-management-dialogs'
import { RoleChangeDialog } from '@/components/Dialog/role-change-dialog'
import { useRequireRoles } from '@/hooks/useRoleCheck'
import type { User, UserRole } from '@/state/api'

const USER_MANAGEMENT_ALLOWED_ROLES: UserRole[] = ['MANAGER', 'ADMIN']

const ROLE_CONFIG: Record<UserRole, { label: string, color: string, bgColor: string, icon: any, description: string }> = {
  USER: {
    label: 'User',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100 border-gray-300',
    icon: UserIcon,
    description: 'Basic permissions, can view and manage own tasks'
  },
  MANAGER: {
    label: 'Manager',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-300',
    icon: Briefcase,
    description: 'Manage projects and teams, can create and assign tasks'
  },
  ADMIN: {
    label: 'Admin',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-300',
    icon: Shield,
    description: 'System administrator with full management permissions'
  },
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const pageSize = 20

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const hasAccess = useRequireRoles(USER_MANAGEMENT_ALLOWED_ROLES)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1))
  }, [debouncedSearch, roleFilter])

  const queryArgs = useMemo(
    () => ({
      page,
      pageSize,
      search: debouncedSearch || undefined,
    }),
    [page, pageSize, debouncedSearch]
  )

  const { data: usersData, isLoading, isFetching, refetch } = useGetUsersQuery(queryArgs, {
    skip: !hasAccess,
  })

  const allUsers: User[] = usersData?.data?.data || []
  console.log(allUsers);
  // Frontend role filtering
  const users = useMemo(() => {
    if (roleFilter === 'ALL') return allUsers
    return allUsers.filter(user => user.role === roleFilter)
  }, [allUsers, roleFilter])

  const pagination = usersData?.data?.pagination
  const total = pagination?.total || 0
  const totalPages = pagination?.totalPages || Math.ceil(total / pageSize)
  const isLoadingUsers = isLoading || isFetching

  // 统计数据
  const stats = useMemo(() => {
    const roleCounts = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<UserRole, number>)

    return {
      total: allUsers.length,
      active: allUsers.filter(u => u.status === 'ACTIVE').length,
      ...roleCounts
    }
  }, [allUsers])

  const handleCreateUser = () => {
    setSelectedUser(null)
    setCreateDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleChangeRole = (user: User) => {
    setSelectedUser(user)
    setRoleChangeDialogOpen(true)
  }

  const handleCloseCreate = () => {
    setCreateDialogOpen(false)
  }

  const handleCloseEdit = () => {
    setEditDialogOpen(false)
    setSelectedUser(null)
  }

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false)
    setSelectedUser(null)
  }

  const handleDialogSuccess = () => {
    refetch()
    setSelectedUser(null)
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-900 mb-2">权限验证中</h3>
            <p className="text-amber-700">正在检查您的访问权限...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 sm:p-3 rounded-xl">
              <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            User Management
          </h1>
          <p className="text-gray-600 mt-2 ml-0 sm:ml-16 text-sm sm:text-base">Manage team members and permissions</p>
        </div>
        <Button
          onClick={handleCreateUser}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setRoleFilter('ALL')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Users</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total || 0}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-lg">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Users</p>
                <p className="text-3xl font-bold text-green-900">{stats.active || 0}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setRoleFilter('MANAGER')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Managers</p>
                <p className="text-3xl font-bold text-purple-900">{stats.MANAGER || 0}</p>
              </div>
              <div className="bg-purple-600 p-3 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setRoleFilter('ADMIN')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Admins</p>
                <p className="text-3xl font-bold text-orange-900">{(stats.ADMIN || 0) + (stats.SUPER_ADMIN || 0)}</p>
              </div>
              <div className="bg-orange-600 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setRoleFilter('USER')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User</p>
                <p className="text-3xl font-bold text-gray-900">{stats.USER || 0}</p>
              </div>
              <div className="bg-gray-600 p-3 rounded-lg">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by username, name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Roles</option>
                {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                  <option key={role} value={role}>{config.label}</option>
                ))}
              </select>

              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Display */}
      {isLoadingUsers ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading User ...</p>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <UsersIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users</h3>
            <p className="text-gray-500 mb-6">
              {debouncedSearch ? 'No matching users found' : 'Click the button above to add your first user'}
            </p>
            {!debouncedSearch && (
              <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => {
              // Fallback for users with old role values
              const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG['USER']
              const RoleIcon = roleConfig.icon

              return (
                <Card
                  key={user.id}
                  className="hover:shadow-xl transition-all duration-300 border-l-4 hover:scale-[1.02]"
                  style={{ borderLeftColor: roleConfig.bgColor.includes('blue') ? '#3b82f6' : roleConfig.bgColor.includes('purple') ? '#a855f7' : roleConfig.bgColor.includes('orange') ? '#f97316' : roleConfig.bgColor.includes('gray') ? '#6b7280' : '#8b5cf6' }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-lg`}>
                          {user.realName ? user.realName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900">
                            {user.realName || user.username}
                          </CardTitle>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${roleConfig.bgColor}`}>
                      <RoleIcon className={`h-4 w-4 ${roleConfig.color}`} />
                      <span className={`text-sm font-medium ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                    </div>

                    {user.email && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}

                    {user.phone && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t">
                      <Badge
                        variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={user.status === 'ACTIVE' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'}
                      >
                        {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeRole(user)}
                          className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 flex-1 sm:flex-none"
                          title="edit role"
                        >
                          <Shield className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Role</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 flex-1 sm:flex-none"
                        >
                          <Edit className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user)}
                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    // Fallback for users with old role values
                    const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG['USER']
                    const RoleIcon = roleConfig.icon

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                              {user.realName ? user.realName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.realName || user.username}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${roleConfig.bgColor}`}>
                            <RoleIcon className={`h-3 w-3 ${roleConfig.color}`} />
                            <span className={`text-xs font-medium ${roleConfig.color}`}>
                              {roleConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {user.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</div>}
                            {user.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}
                          >
                            {user.status === 'ACTIVE' ? '活跃' : '停用'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChangeRole(user)}
                              className="hover:bg-purple-50"
                              title="edit role"
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="hover:bg-blue-50"
          >
            Prev
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  onClick={() => setPage(pageNum)}
                  className={page === pageNum ? 'bg-blue-600' : 'hover:bg-gray-50'}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="hover:bg-blue-50"
          >
            Next
          </Button>
        </div>
      )}

      {/* Dialog Components */}
      <CreateUserDialog
        open={createDialogOpen}
        onClose={handleCloseCreate}
        onSuccess={handleDialogSuccess}
      />
      <EditUserDialog
        open={editDialogOpen}
        onClose={handleCloseEdit}
        onSuccess={handleDialogSuccess}
        user={selectedUser}
      />
      <DeleteUserDialog
        open={deleteDialogOpen}
        onClose={handleCloseDelete}
        onSuccess={handleDialogSuccess}
        user={selectedUser}
      />
      {selectedUser && (
        <RoleChangeDialog
          open={roleChangeDialogOpen}
          onOpenChange={setRoleChangeDialogOpen}
          user={selectedUser}
          onSuccess={() => {
            refetch()
            setRoleChangeDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}
