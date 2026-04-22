"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Package, PackageOpen, BarChart3, Users, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useGetTodayStatsQuery } from '@/features/inventory/inventoryApi'
export default function MobileMenu() {
  const router = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const { t } = useTranslation()
  const { data, isLoading, isError } = useGetTodayStatsQuery()
  
  const handleScanIn = () => {
    setIsScanning(true)
    // Simulate QR scanning - in real app, integrate with camera API
    setTimeout(() => {
      setIsScanning(false)
      router("/inventory/scan-in")
    }, 2000)
  }

  const handleScanOut = () => {
    setIsScanning(true)
    // Simulate QR scanning - in real app, integrate with camera API
    setTimeout(() => {
      setIsScanning(false)
      router("/inventory/scan-out")
    }, 2000)
  }

  const menuItems = [
    {
      title: t("mobile.scanIn"),
      description: t("mobile.scanInDesc"),
      icon: Package,
      action: handleScanIn,
      color: "bg-green-500",
    },
    {
      title: t("mobile.scanOut"),
      description: t("mobile.scanOutDesc"),
      icon: PackageOpen,
      action: handleScanOut,
      color: "bg-blue-500",
    },
    {
      title: t("mobile.inventoryView"),
      description: t("mobile.inventoryViewDesc"),
      icon: BarChart3,
      action: () => router("/inventory/overview"),
      color: "bg-purple-500",
    },
    {
      title: t("mobile.teamManagement"),
      description: t("mobile.teamManagementDesc"),
      icon: Users,
      action: () => router("/team"),
      color: "bg-orange-500",
    },
  ]

  if (isScanning) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <QrCode className="w-24 h-24 mx-auto mb-4 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("mobile.scanning")}</h3>
            <p className="text-gray-600">{t("mobile.scanningDesc")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("mobile.title")}</h1>
            <p className="text-gray-600">{t("mobile.subtitle")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => router("/login")} className="text-gray-600">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Actions */}
        <div className="grid gap-4 mb-6">
          {menuItems.slice(0, 2).map((item, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6" onClick={item.action}>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${item.color}`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.slice(2).map((item, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center" onClick={item.action}>
                <div className={`p-3 rounded-full ${item.color} mx-auto mb-3 w-fit`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-sm">{item.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("mobile.todayStats")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{data?.inbound ?? 0}</p>
                <p className="text-sm text-gray-600">{t("mobile.inbound")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{data?.outbound ?? 0}</p>
                <p className="text-sm text-gray-600">{t("mobile.outbound")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
