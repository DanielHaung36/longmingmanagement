"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User as UserIcon,
  Calendar,
  Shield,
  Save,
  Edit,
  Lock,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  useGetProfileQuery,
  useUpdateProfileAndAvatarMutation,
} from "@/features/auth/authApi"

export default function ProfilePage() {
  const { t, i18n } = useTranslation("profile")
  const { data, isLoading, isError, refetch } = useGetProfileQuery()
  const user = data?.user

  const [updateProfileAndAvatar, { isLoading: isSaving }] =
    useUpdateProfileAndAvatarMutation()

  const [isEditing, setIsEditing] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [formData, setFormData] = useState<{
    username: string
    full_name: string
    email: string
    avatar?: File
  }>({
    username: "",
    full_name: "",
    email: "",
  })
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        full_name: user.full_name,
        email: user.email,
      })
      setPreview(null)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    }
  }, [user])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language)

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setFormData((fd) => ({ ...fd, avatar: file }))
  }

  const handleSaveAll = async () => {
    if (passwordData.newPassword) {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert(t("passwordMismatch") || "两次密码不一致")
        return
      }
    }
    const payload: any = { ...formData }
    if (passwordData.currentPassword && passwordData.newPassword) {
      payload.old_password = passwordData.currentPassword
      payload.new_password = passwordData.newPassword
    }

    try {
      await updateProfileAndAvatar(payload).unwrap()
      setIsEditing(false)
      refetch()
    } catch {
      alert(t("saveError") || "保存失败")
    }
  }

  if (isLoading)
    return <div className="p-6 text-center">{t("loading") || "加载中..."}</div>
  if (isError || !user)
    return <div className="p-6 text-center text-red-600">{t("loadError") || "加载失败"}</div>
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t("title") || "用户资料"}
          </h1>
          <p className="text-gray-600 mt-2">{t("subtitle") || "管理您的个人信息"}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* 左侧 */}
          <div className="md:col-span-1">
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="relative inline-block group mx-auto">
                  <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                    <AvatarImage
                      src={preview ?? user.avatar_url ?? "/placeholder.svg"}
                      alt={user.full_name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {user.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
                    onChange={onSelectFile}
                    disabled={!isEditing}
                  />
                </div>
                <CardTitle className="mt-4 text-xl">{user.full_name}</CardTitle>
                <CardDescription className="flex flex-col gap-2 items-center">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role.name}
                  </Badge>
                  <Badge variant={user.is_active ? "default" : "destructive"}>
                    {user.is_active
                      ? t("active") || "活跃"
                      : t("disabled") || "已禁用"}
                  </Badge>
                </CardDescription>
              </CardHeader>

              <Separator />

              <CardContent className="text-sm space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("userId") || "用户ID"}</span>
                  <span className="font-mono">{user.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {t("registeredAt") || "注册时间"}
                  </span>
                  <span>{formatDate(user.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧 */}
          <div className="md:col-span-2 space-y-8">
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                    {t("basicInfo") || "基本信息"}
                  </CardTitle>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditing((v) => !v)}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4" /> {t("save") || "保存"}
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" /> {t("edit") || "编辑"}
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  {t("basicInfoDesc") || "更新您的个人信息及头像／密码"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("username") || "用户名"}</Label>
                    <Input
                      value={formData.username}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("fullName") || "姓名"}</Label>
                    <Input
                      value={formData.full_name}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>{t("email") || "邮箱"}</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    {[
                      {
                        id: "current",
                        label: t("currentPassword") || "当前密码",
                        value: passwordData.currentPassword,
                        show: showPasswords.current,
                        onChange: (v: string) =>
                          setPasswordData((pd) => ({
                            ...pd,
                            currentPassword: v,
                          })),
                      },
                      {
                        id: "new",
                        label: t("newPassword") || "新密码",
                        value: passwordData.newPassword,
                        show: showPasswords.new,
                        onChange: (v: string) =>
                          setPasswordData((pd) => ({ ...pd, newPassword: v })),
                      },
                      {
                        id: "confirm",
                        label: t("confirmPassword") || "确认密码",
                        value: passwordData.confirmPassword,
                        show: showPasswords.confirm,
                        onChange: (v: string) =>
                          setPasswordData((pd) => ({
                            ...pd,
                            confirmPassword: v,
                          })),
                      },
                    ].map(({ id, label, value, show, onChange }) => (
                      <div key={id}>
                        <Label htmlFor={id}>{label}</Label>
                        <div className="relative">
                          <Input
                            id={id}
                            type={show ? "text" : "password"}
                            value={value}
                            disabled={!isEditing}
                            onChange={(e) => onChange(e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full"
                            onClick={() =>
                              setShowPasswords((sp) => ({
                                ...sp,
                                [id]: !sp[id as keyof typeof sp],
                              }))
                            }
                          >
                            {show ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-6 border-t">
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          username: user.username,
                          full_name: user.full_name,
                          email: user.email,
                        })
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        })
                        setPreview(null)
                        setIsEditing(false)
                      }}
                      disabled={isSaving}
                    >
                      {t("cancel") || "取消"}
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveAll}
                    disabled={!isEditing || isSaving}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving
                      ? t("saving") || "保存中..."
                      : t("saveAll") || "保存更改"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
