"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { TrendingUp, TrendingDown, Package, Users, Globe } from "lucide-react"

interface AggregationDashboardProps {
  orders: any[]
  filteredOrders: any[]
  dateRange: { start: string; end: string }
  statusFilter: string
}

export function AggregationDashboard({ orders, filteredOrders, dateRange, statusFilter }: AggregationDashboardProps) {
  const analytics = useMemo(() => {
    const totalOrders = orders.length
    const filteredCount = filteredOrders.length
    const totalValue = orders.reduce((sum, order) => sum + order.totalPrice, 0)
    const filteredValue = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0)

    // Product analysis
    const productStats = orders.reduce(
      (acc, order) => {
        acc[order.product] = (acc[order.product] || 0) + order.totalPrice
        return acc
      },
      {} as Record<string, number>,
    )

    const topProducts = Object.entries(productStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    // Customer analysis
    const customerStats = orders.reduce(
      (acc, order) => {
        acc[order.companyName] = (acc[order.companyName] || 0) + order.totalPrice
        return acc
      },
      {} as Record<string, number>,
    )

    const topCustomers = Object.entries(customerStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    // Geographic distribution
    const domesticOrders = orders.filter((o) => o.status === "AU")
    const internationalOrders = orders.filter((o) => o.status === "INT")

    // Monthly trends (simplified)
    const monthlyData = orders.reduce(
      (acc, order) => {
        const month = order.createdDate.substring(0, 7) // YYYY-MM
        acc[month] = (acc[month] || 0) + order.totalPrice
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalOrders,
      filteredCount,
      totalValue,
      filteredValue,
      topProducts,
      topCustomers,
      domesticOrders: domesticOrders.length,
      internationalOrders: internationalOrders.length,
      domesticValue: domesticOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      internationalValue: internationalOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      monthlyData: Object.entries(monthlyData).sort(),
    }
  }, [orders, filteredOrders])

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{analytics.filteredCount} currently filtered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">${analytics.filteredValue.toLocaleString()} filtered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Unique Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(orders.map((o) => o.companyName)).size}</div>
            <p className="text-xs text-muted-foreground">Active customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Average Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(analytics.totalValue / analytics.totalOrders).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Per order value</p>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Domestic (AU)</span>
                <Badge variant="default">{analytics.domesticOrders} orders</Badge>
              </div>
              <Progress value={(analytics.domesticOrders / analytics.totalOrders) * 100} className="h-2" />
              <div className="text-sm text-muted-foreground">
                ${analytics.domesticValue.toLocaleString()} total value
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">International</span>
                <Badge variant="secondary">{analytics.internationalOrders} orders</Badge>
              </div>
              <Progress value={(analytics.internationalOrders / analytics.totalOrders) * 100} className="h-2" />
              <div className="text-sm text-muted-foreground">
                ${analytics.internationalValue.toLocaleString()} total value
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products and Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topProducts.map(([product, revenue]) => (
                  <TableRow key={product}>
                    <TableCell className="font-medium">{product}</TableCell>
                    <TableCell>${revenue.toLocaleString()}</TableCell>
                    <TableCell>{((revenue / analytics.totalValue) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topCustomers.map(([customer, revenue]) => (
                  <TableRow key={customer}>
                    <TableCell className="font-medium">{customer}</TableCell>
                    <TableCell>${revenue.toLocaleString()}</TableCell>
                    <TableCell>{((revenue / analytics.totalValue) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.monthlyData.map(([month, revenue], index) => {
                const prevRevenue = index > 0 ? analytics.monthlyData[index - 1][1] : revenue
                const trend = revenue > prevRevenue ? "up" : revenue < prevRevenue ? "down" : "stable"

                return (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{month}</TableCell>
                    <TableCell>${revenue.toLocaleString()}</TableCell>
                    <TableCell>
                      {trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {trend === "stable" && <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
