"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react'

export default function ForbiddenPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardContent className="pt-16 pb-12 px-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            权限不足
          </h1>

          {/* Error Code */}
          <div className="inline-block bg-red-50 px-4 py-1 rounded-full mb-4">
            <span className="text-sm font-mono text-red-600">403 Forbidden</span>
          </div>

          {/* Description */}
          <p className="text-slate-600 mb-8 leading-relaxed">
            您没有权限访问此页面。审批功能仅对以下角色开放：
          </p>

          {/* Allowed Roles */}
          <div className="bg-slate-50 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-slate-700 mb-2">允许的角色：</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {/* <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                团队负责人 (TEAM_LEAD)
              </li> */}
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                项目经理 (MANAGER)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                管理员 (ADMIN)
              </li>
              {/* <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                超级管理员 (SUPER_ADMIN)
              </li> */}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回上一页
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              onClick={() => router.push('/home')}
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-slate-500 mt-8">
            如需申请审批权限，请联系系统管理员
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
