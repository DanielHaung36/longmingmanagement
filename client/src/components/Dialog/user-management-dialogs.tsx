'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  type User,
  type UserRole,
} from '@/state/api'
import { Loader2, AlertCircle, CheckCircle2, User as UserIcon, Mail, Phone, Shield, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { validatePasswordStrength } from '@/lib/passwordValidation'

// User role options
const USER_ROLES: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'USER', label: 'User', description: 'Basic permissions' },
  { value: 'MANAGER', label: 'Manager', description: 'Manage projects and tasks' },
  { value: 'ADMIN', label: 'Admin', description: 'Full system access' },
]

// User status options
const USER_STATUS = [
  { value: 'ACTIVE', label: 'Active', color: 'text-green-600' },
  { value: 'INACTIVE', label: 'Inactive', color: 'text-gray-600' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'text-red-600' },
]

// ==================== Create User Dialog ====================
interface CreateUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateUserDialog({ open, onClose, onSuccess }: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    realName: '',
    phone: '',
    role: 'USER' as UserRole,
    status: 'ACTIVE',
  })

  const [createUser, { isLoading }] = useCreateUserMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.username.trim()) {
      toast.error('Username is required')
      return
    }
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(formData.password)
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message || 'Password does not meet requirements')
      return
    }

    try {
      await createUser(formData).unwrap()
      toast.success('User created successfully')
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        realName: '',
        phone: '',
        role: 'USER',
        status: 'ACTIVE',
      })
    } catch (error: any) {
      console.error('Create user error:', error)
      toast.error(error?.data?.message || 'Failed to create user')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserIcon className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system with appropriate permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Username *
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include uppercase, lowercase, and a number.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Real Name */}
              <div className="space-y-2">
                <Label htmlFor="realName">Real Name</Label>
                <Input
                  id="realName"
                  value={formData.realName}
                  onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{role.label}</span>
                          <span className="text-xs text-gray-500">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status *
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Edit User Dialog ====================
interface EditUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

export function EditUserDialog({ open, onClose, onSuccess, user }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    realName: '',
    phone: '',
    role: 'USER' as UserRole,
    status: 'ACTIVE',
  })

  const [updateUser, { isLoading }] = useUpdateUserMutation()

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        realName: user.realName || '',
        phone: user.phone || '',
        role: user.role || 'USER',
        status: user.status || 'ACTIVE',
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      toast.error('User ID is missing')
      return
    }

    try {
      console.log('Updating user:', user.id, formData)
      const result = await updateUser({ id: user.id, ...formData }).unwrap()
      console.log('Update result:', result)
      toast.success('User updated successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Update user error:', error)
      toast.error(error?.data?.message || 'Failed to update user')
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserIcon className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information and permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Username (readonly) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-500">
                <UserIcon className="h-4 w-4" />
                Username
              </Label>
              <Input value={user.username} disabled className="bg-gray-50" />
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-500">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input value={user.email} disabled className="bg-gray-50" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Real Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-realName">Real Name</Label>
                <Input
                  id="edit-realName"
                  value={formData.realName}
                  onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{role.label}</span>
                          <span className="text-xs text-gray-500">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Delete User Dialog ====================
interface DeleteUserDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

export function DeleteUserDialog({ open, onClose, onSuccess, user }: DeleteUserDialogProps) {
  const [deleteUser, { isLoading }] = useDeleteUserMutation()

  const handleDelete = async () => {
    if (!user?.id) {
      toast.error('User ID is missing')
      return
    }

    try {
      await deleteUser(user.id).unwrap()
      toast.success('User deleted successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Delete user error:', error)
      toast.error(error?.data?.message || 'Failed to delete user')
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
            <AlertCircle className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 space-y-2">
            <p className="font-semibold text-red-900">User to be deleted:</p>
            <div className="space-y-1 text-sm text-red-800">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span className="font-medium">Username:</span>
                <span>{user.username}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              {user.realName && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span className="font-medium">Name:</span>
                  <span>{user.realName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Delete User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
