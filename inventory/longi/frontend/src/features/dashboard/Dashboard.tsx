"use client"

import { useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts"
import {
  Package,
  ClipboardList,
  MapPin,
  Users,
  AlertCircle,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

// API imports
import { useGetInventoryQuery, useGetTodayStatsQuery } from "../inventory/inventoryApi"
import { useListUsersQuery } from "../setting/userperApi"
import { useGetOrdersQuery } from "../orders/ordersApi"
import type { InventoryRow } from "../inventory/components/InventoryModel"

// Components
import WarehouseDistributionChart from "./components/WarehouseDistributionChart"

// Fallback mock data for when APIs fail
const fallbackInventory = [
  {
    id: 1,
    productID: "1",
    warehouseID: 2,
    warehouseName: "Perth",
    partNumberCN: "PUMP-001",
    partNumberAU: "PUMP-001",
    barcode: "123456789",
    description: "Pump",
    descriptionChinese: "泵",
    warehouse: "Perth",
    siteLocation: "A1",
    asset: "AST-001",
    customer: "Test Customer",
    note: "Test note",
    partGroup: "Pumps",
    partLife: "10 years",
    oem: "Test OEM",
    purchasePrice: 8000.00,
    unitPrice: 8164.80,
    actualQty: 1,
    lockedQty: 1,
    availableQty: 0,
    operator: "system",
    operationTime: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    productID: "3",
    warehouseID: 2,
    warehouseName: "Perth",
    partNumberCN: "VALVE-001",
    partNumberAU: "VALVE-001",
    barcode: "123456790",
    description: "Pinch valve",
    descriptionChinese: "夹管阀",
    warehouse: "Perth",
    siteLocation: "B1",
    asset: "AST-002",
    customer: "Test Customer",
    note: "Test note",
    partGroup: "Valves",
    partLife: "5 years",
    oem: "Test OEM",
    purchasePrice: 2.50,
    unitPrice: 3.00,
    actualQty: 6,
    lockedQty: 6,
    availableQty: 0,
    operator: "system",
    operationTime: "2025-01-01T00:00:00Z",
  },
]

const fallbackUsers = [
  { id: 1, isActive: true, fullName: "Wubiao Weng", role: "finance_leader" },
  { id: 2, isActive: true, fullName: "Weijun Wang", role: "finance_leader" },
  { id: 3, isActive: true, fullName: "Sammie Mao", role: "purchase_leader" },
  { id: 4, isActive: true, fullName: "Lionel Lu", role: "operations_staff" },
]

const fallbackOrders = [
  { id: "101", orderNumber: "ORD-0001", orderDate: "2025-06-30", status: "completed", customerName: "ABC Corp", totalAmount: 16329.6 },
  { id: "102", orderNumber: "PUR-0002", orderDate: "2025-06-29", status: "processing", customerName: "Longi Ltd.", totalAmount: 36.00 },
  { id: "103", orderNumber: "ORD-0003", orderDate: "2025-06-28", status: "completed", customerName: "XYZ Inc.", totalAmount: 89180.20 },
]

const mockSkuStats = {
  topSelling: [
    { sku: "3", name: "夹管阀(Pinch valve)", sold: 12, revenue: 36.00 },
    { sku: "6", name: "拉力圆盘（焊接在横梁上）", sold: 4,  revenue: 89180.20 },
    { sku: "7", name: "拉杆棒（焊接在横梁上）", sold: 4,  revenue: 50931.20 },
    { sku: "1", name: "盘式变压器油泵（Pump）", sold: 2,  revenue: 16329.60 },
  ],
  slowMoving: [
    {
      sku: "1",
      name: "盘式变压器油泵（Pump）",
      moved: 2,
      // 距今 2025-07-02 已经放库存 320 天
      daysStagnant: 320,
    },
    {
      sku: "2",
      name: "变压器油泵(Pump)",
      moved: 2,
      daysStagnant: 320,
    },
  ],
  procurementSales: [
    { date: "6月1日", procured: 28000, sold: 22000 },
    { date: "6月8日", procured: 32000, sold: 28000 },
    { date: "6月15日", procured: 25000, sold: 31000 },
    { date: "6月22日", procured: 35000, sold: 29000 },
    { date: "6月29日", procured: 30000, sold: 33000 },
  ],
}


const mockTrend = [
  { date: "6月1日", shenyang: 45000, perth: 18000, total: 63000 },
  { date: "6月8日", shenyang: 48000, perth: 19500, total: 67500 },
  { date: "6月15日", shenyang: 52000, perth: 21000, total: 73000 },
  { date: "6月22日", shenyang: 49000, perth: 20200, total: 69200 },
  { date: "6月29日", shenyang: 55000, perth: 22800, total: 77800 },
]

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

export default function DashboardPage() {
  const { t } = useTranslation()
  
  // API calls
  const { data: inventory = [], isLoading: inventoryLoading, error: inventoryError } = useGetInventoryQuery()
  const { data: users = [], isLoading: usersLoading, error: usersError } = useListUsersQuery()
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useGetOrdersQuery()
  const { data: todayStats, isLoading: statsLoading, error: statsError } = useGetTodayStatsQuery()
  
  // Use fallback data when APIs fail
  const inventoryData = inventoryError ? fallbackInventory : inventory
  const usersData = usersError ? fallbackUsers : users
  const ordersData = ordersError ? fallbackOrders : orders
  const skuStats = mockSkuStats
  const trend = mockTrend
  
  // Overall loading state
  const isLoading = inventoryLoading || usersLoading || ordersLoading || statsLoading
  const hasErrors = inventoryError || usersError || ordersError || statsError

  // 概览计算
  const totalProducts = inventory.length
  const totalStock = useMemo(() => inventory.reduce((sum, i) => sum + i.actualQty + i.lockedQty, 0), [inventory])
  const totalValue = useMemo(() => inventory.reduce((sum, i) => sum + (i.unitPrice || 0) * (i.actualQty + i.lockedQty), 0), [inventory])
  const warehouseMap = useMemo(() => {
    return inventory.reduce(
      (m, i) => {
        const warehouseName = i.warehouseID === 1 ? "ShenYang" : "Perth"
        if (!m[warehouseName]) {
          m[warehouseName] = { qty: 0, value: 0 }
        }
        m[warehouseName].qty += i.actualQty + i.lockedQty
        m[warehouseName].value += (i.unitPrice || 0) * (i.actualQty + i.lockedQty)
        return m
      },
      {} as Record<string, { qty: number; value: number }>,
    )
  }, [inventory])

  const warehouseCount = Object.keys(warehouseMap).length
  const activeUsers = users.filter((u) => u.isActive).length
  const lowStockItems = inventory.filter((i) => i.actualQty + i.lockedQty < 15)

  const warehouseData = Object.entries(warehouseMap).map(([name, data]) => ({
    name,
    value: data.value,
    qty: data.qty,
  }))

  // 计算增长率
  const inventoryGrowth = 12.5
  const salesGrowth = 8.3
  const userGrowth = 15.2

  const handleExport = () => {
    const data = inventory.map(i => ({
      ProductID: i.productID,
      ProductName: i.description,
      ActualQty: i.actualQty,
      LockedQty: i.lockedQty,
      Value: (i.unitPrice || 0) * (i.actualQty + i.lockedQty),
      Warehouse: i.warehouseID === 1 ? t("dashboard.shenyang") : t("dashboard.perth"),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Inventory")
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "inventory_report.xlsx")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('dashboard.title')}
            </h1>
            <p className="text-gray-600 mt-2">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="text-gray-600 border-gray-300">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('dashboard.refresh')}
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              {t('dashboard.export')}
            </Button>
          </div>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.totalProducts')}</CardTitle>
                    <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+{inventoryGrowth}%</span>
                <span className="text-sm text-gray-500">{t('dashboard.growthMonth')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.totalStock')}</CardTitle>
                    <div className="text-2xl font-bold text-gray-900">{totalStock.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+{salesGrowth}%</span>
                <span className="text-sm text-gray-500">{t('dashboard.growthMonth')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.warehouseCount')}</CardTitle>
                    <div className="text-2xl font-bold text-gray-900">{warehouseCount}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-gray-600">{t('dashboard.totalValue')}: ${totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10"></div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-600">{t('dashboard.activeUsers')}</CardTitle>
                    <div className="text-2xl font-bold text-gray-900">{activeUsers}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">+{userGrowth}%</span>
                <span className="text-sm text-gray-500">{t('dashboard.growthMonth')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 库存趋势 */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                {t('dashboard.inventoryTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64 md:h-80 lg:h-96">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorShenyang" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorPerth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === "shenyang" ? "ShenYang" : name === "perth" ? "Perth" : "Total",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="shenyang"
                    stackId="1"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorShenyang)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="perth"
                    stackId="1"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorPerth)"
                    strokeWidth={2}
                  />
                </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 仓库分布 - 使用新的可切换组件 */}
          <WarehouseDistributionChart 
            warehouseData={warehouseData}
            totalValue={totalValue}
            totalStock={totalStock}
          />
        </div>

        {/* 底部区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 低库存告警 */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200/50 shadow-xl">
            <CardHeader className="border-b border-red-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-red-700">{t('dashboard.lowStockWarning')}</CardTitle>
                <Badge variant="destructive" className="ml-auto">
                  {lowStockItems.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{t('dashboard.allStockSufficient')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.slice(0, 5).map((i) => (
                    <div key={i.id} className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{i.description}</div>
                        <div className="text-sm text-gray-600">{i.productID}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{i.actualQty + i.lockedQty}</div>
                        <div className="text-xs text-gray-500">{t('dashboard.quantity')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 最近订单 */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-gray-800">{t('dashboard.recentOrders')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {ordersData.slice(0, 5).map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">#{o.orderNumber}</span>
                        <Badge variant="default" className="text-xs">
                          {t('dashboard.order')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">{o.customerName}</div>
                      <div className="text-xs text-gray-500">{o.orderDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${(o.totalAmount || 0).toLocaleString()}</div>
                      <Badge
                        variant={
                          o.status === "completed" ? "default" : o.status === "processing" ? "secondary" : "outline"
                        }
                        className="text-xs"
                      >
                        {t('dashboard.' + o.status, o.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 采购 vs 销售 */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <TrendingUp className="w-5 h-5 text-green-500" />
                {t('dashboard.procurementVsSales')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={skuStats.procurementSales}>
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === "procured" ? t('dashboard.procurementAmount') : t('dashboard.salesAmount'),
                    ]}
                  />
                  <Line type="monotone" dataKey="procured" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sold" stroke="#EC4899" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 热销产品排行 */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Package className="w-5 h-5 text-yellow-500" />
              {t('dashboard.topSellingProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skuStats.topSelling} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "sold" ? `${value} ${t('dashboard.quantity')}` : `$${value.toLocaleString()}`,
                    name === "sold" ? t('dashboard.salesVolume') : t('dashboard.salesAmount'),
                  ]}
                />
                <Bar dataKey="sold" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
