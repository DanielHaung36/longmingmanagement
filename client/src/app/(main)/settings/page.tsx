'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/redux'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { User, Lock, Bell, Shield, Mail, Phone, Building, AlertCircle, FolderOpen, HardDrive } from 'lucide-react'
import { message } from '@/lib/message'
import { useChangePasswordMutation, useUpdateUserMutation, useSaveOneDrivePathMutation, useGetOneDrivePathQuery } from '@/state/api'
import { useRole, UserRole } from '@/hooks/use-permission'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { setOneDriveLocalPath, isElectron, PATH_EXAMPLES } from '@/utils/electronBridge'

// Helper function to format date safely
const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'N/A'

  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return 'N/A'
  }
}

const validatePasswordStrength = (password: string) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'New password must be at least 8 characters long' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'New password must include at least one uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'New password must include at least one lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'New password must include at least one number' }
  }

  return { valid: true }
}

export default function SettingsPage() {
  const currentUser = useAppSelector((state) => state.auth.user)
  const userRole = useRole()

  // Profile form state
  const [realName, setRealName] = useState(currentUser?.realName || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [position, setPosition] = useState(currentUser?.position || '')

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // OneDrive path configuration state
  const [oneDrivePath, setOneDrivePath] = useState('')
  const [isElectronApp, setIsElectronApp] = useState(false)

  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()
  const [updateUser, { isLoading: isUpdatingProfile }] = useUpdateUserMutation()
  const [saveOneDrivePath, { isLoading: isSavingPath }] = useSaveOneDrivePathMutation()

  // Load OneDrive path from server
  const { data: oneDrivePathData } = useGetOneDrivePathQuery(currentUser?.id || 0, {
    skip: !currentUser?.id,
  })

  // Check if running in Electron on mount
  useEffect(() => {
    setIsElectronApp(isElectron())
  }, [])

  // Update local state when API data is loaded
  useEffect(() => {
    if (oneDrivePathData?.data?.oneDriveLocalPath) {
      setOneDrivePath(oneDrivePathData.data.oneDriveLocalPath)
      // Also update localStorage for offline use
      setOneDriveLocalPath(oneDrivePathData.data.oneDriveLocalPath)
    }
  }, [oneDrivePathData])

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!currentUser) {
      message.error('User not found')
      return
    }

    try {
      await updateUser({
        id: currentUser.id,
        realName,
        email,
        phone,
        position,
      }).unwrap()

      message.success('Profile updated successfully!')
    } catch (error) {
      const err = error as FetchBaseQueryError | SerializedError | { data?: { message?: string } }
      let errorMessage: string | undefined

      if ('data' in (err as any) && typeof (err as any).data === 'object' && (err as any).data?.message) {
        errorMessage = (err as any).data.message
      } else if ('data' in (err as any) && typeof (err as any).data === 'string') {
        errorMessage = (err as any).data
      } else if ('error' in (err as any) && typeof (err as any).error === 'string') {
        errorMessage = (err as any).error
      } else if ('message' in (err as any) && typeof (err as any).message === 'string') {
        errorMessage = (err as any).message
      }

      message.error(errorMessage || 'Failed to update profile')
    }
  }

  // Handle cancel - reset form to original values
  const handleCancelEdit = () => {
    setRealName(currentUser?.realName || '')
    setEmail(currentUser?.email || '')
    setPhone(currentUser?.phone || '')
    setPosition(currentUser?.position || '')
  }

  // Handle OneDrive path save
  const handleSaveOneDrivePath = async () => {
    if (!currentUser) {
      message.error('User not found')
      return
    }

    if (!oneDrivePath.trim()) {
      message.error('Please enter a valid OneDrive path')
      return
    }

    // Basic path validation for Windows
    if (!oneDrivePath.match(/^[A-Z]:\\/)) {
      message.error('Please enter a valid Windows path (e.g., C:\\Users\\...)')
      return
    }

    try {
      // Save to database via API
      await saveOneDrivePath({
        userId: currentUser.id,
        oneDriveLocalPath: oneDrivePath,
      }).unwrap()

      // Also save to localStorage for offline use
      setOneDriveLocalPath(oneDrivePath)

      message.success('OneDrive path saved successfully!')
    } catch (error) {
      const err = error as FetchBaseQueryError | SerializedError | { data?: { message?: string } }
      let errorMessage: string | undefined

      if ('data' in (err as any) && typeof (err as any).data === 'object' && (err as any).data?.message) {
        errorMessage = (err as any).data.message
      } else if ('data' in (err as any) && typeof (err as any).data === 'string') {
        errorMessage = (err as any).data
      } else if ('error' in (err as any) && typeof (err as any).error === 'string') {
        errorMessage = (err as any).error
      } else if ('message' in (err as any) && typeof (err as any).message === 'string') {
        errorMessage = (err as any).message
      }

      message.error(errorMessage || 'Failed to save OneDrive path')
    }
  }

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Settings] handleChangePassword triggered', { currentPassword: !!currentPassword, newPasswordLength: newPassword.length })

    if (!currentPassword || !newPassword || !confirmPassword) {
      message.error('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      message.error('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      message.error('New password cannot be the same as current password')
      return
    }

    const strength = validatePasswordStrength(newPassword)
    if (!strength.valid) {
      message.error(strength.message || 'New password does not meet requirements')
      return
    }

    try {
      console.log('[Settings] sending changePassword mutation')
      const response = await changePassword({
        currentPassword,
        newPassword,
      }).unwrap()

      console.log('[Settings] changePassword response:', response)

      // 显示成功提示
      message.success({
        content: response?.message || '密码修改成功！请重新登录',
        duration: 5
      })

      // 清空表单
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // 5秒后自动登出并跳转到登录页
      setTimeout(() => {
        window.location.href = '/login?message=密码已修改，请使用新密码登录'
      }, 5000)

    } catch (error) {
      const err = error as FetchBaseQueryError | SerializedError | { data?: { message?: string } }
      let errorMessage: string | undefined

      if ('data' in (err as any) && typeof (err as any).data === 'object' && (err as any).data?.message) {
        errorMessage = (err as any).data.message
      } else if ('data' in (err as any) && typeof (err as any).data === 'string') {
        errorMessage = (err as any).data
      } else if ('error' in (err as any) && typeof (err as any).error === 'string') {
        errorMessage = (err as any).error
      } else if ('message' in (err as any) && typeof (err as any).message === 'string') {
        errorMessage = (err as any).message
      }

      console.error('[Settings] changePassword error:', error)

      // 显示错误提示
      message.error({
        content: errorMessage || '密码修改失败，请重试',
        duration: 5
      })
    }
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Please log in to view settings</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Shield className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info Badge */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-2xl font-semibold text-white">
                  {currentUser.realName ? currentUser.realName.charAt(0).toUpperCase() : currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{currentUser.realName || currentUser.username}</h3>
                  <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                  <Badge
                    className="mt-1"
                    variant={userRole === UserRole.ADMIN ? 'destructive' : userRole === UserRole.PROJECT_MANAGER ? 'default' : 'secondary'}
                  >
                    {userRole === UserRole.ADMIN && 'Administrator'}
                    {userRole === UserRole.PROJECT_MANAGER && 'Project Manager'}
                    {userRole === UserRole.USER && 'User'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={currentUser.username}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@ljmagnet.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="realName">Full Name</Label>
                    <Input
                      id="realName"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+61 400 000 000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="position">
                      <Building className="inline h-4 w-4 mr-1" />
                      Position
                    </Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Project Manager"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdatingProfile}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Status</span>
                <Badge variant={currentUser.status === 'ACTIVE' ? 'default' : 'destructive'}>
                  {currentUser.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono">{currentUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span>{formatDate(currentUser.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(currentUser.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={isChangingPassword}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters and include uppercase, lowercase, and a number.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-amber-800">
                    <p className="font-medium">Password Requirements:</p>
                    <ul className="list-disc list-inside mt-1 text-xs space-y-0.5">
                      <li>At least 8 characters long</li>
                      <li>Include uppercase, lowercase, and numeric characters</li>
                      <li>Use a unique password and keep it private</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {/* OneDrive Path Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>
                <FolderOpen className="inline h-5 w-5 mr-2" />
                OneDrive Local Path Configuration
              </CardTitle>
              <CardDescription>
                Configure your local OneDrive folder path to enable opening files directly in Windows Explorer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isElectronApp && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-blue-800">
                    <p className="font-medium">Desktop App Required</p>
                    <p className="text-xs mt-1">
                      This feature requires the Longi Desktop Application. Please download and install it to enable file opening functionality.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="onedrivePath">
                  <HardDrive className="inline h-4 w-4 mr-1" />
                  OneDrive "03 Project Management" Folder Path
                </Label>
                <Input
                  id="onedrivePath"
                  value={oneDrivePath}
                  onChange={(e) => setOneDrivePath(e.target.value)}
                  placeholder={PATH_EXAMPLES.windows}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {PATH_EXAMPLES.description}
                </p>
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <h4 className="text-sm font-semibold mb-2">How to find your OneDrive path:</h4>
                <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Open Windows File Explorer</li>
                  <li>Navigate to: OneDrive → Documents - Longi Australia → 03 Project Management</li>
                  <li>Click on the address bar and copy the full path</li>
                  <li>Paste it in the field above</li>
                </ol>

                <div className="mt-3 p-2 bg-white rounded border">
                  <p className="text-xs font-semibold mb-1">Example path:</p>
                  <code className="text-xs text-blue-600">
                    C:\Users\YourName\OneDrive\Documents - Longi Australia\03 Project Management
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-amber-800">
                  <p className="font-medium">How it works:</p>
                  <p className="text-xs mt-1">
                    The system will replace <code className="bg-white px-1 rounded">/mnt/onedrive</code> with your local path when you click "Open File" buttons.
                    This allows you to directly open files in Windows Explorer from the web application.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOneDrivePath(oneDrivePathData?.data?.oneDriveLocalPath || '')
                    message.info('Reset to saved value')
                  }}
                  disabled={isSavingPath}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveOneDrivePath}
                  disabled={isSavingPath}
                >
                  {isSavingPath ? 'Saving...' : 'Save Path'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Other Preferences (Future) */}
          <Card>
            <CardHeader>
              <CardTitle>Other Preferences</CardTitle>
              <CardDescription>Additional application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">More preferences coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
