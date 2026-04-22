"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts"
import { filterOrdersByDateRange } from "@/lib/analysis-utils"

interface PriceTrendChartProps {
  orders: any[]
  itemName: string
  dateRange: { start: string; end: string }
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{`Date: ${label}`}</p>
        <p className="text-blue-600">{`Price: $${payload[0].value.toLocaleString()}`}</p>
        <p className="text-sm text-gray-600">{`Order: ${data.orderId}`}</p>
        <p className="text-sm text-gray-600">{`Customer: ${data.customer}`}</p>
      </div>
    )
  }
  return null
}

export function PriceTrendChart({ orders, itemName, dateRange }: PriceTrendChartProps) {
  // Filter orders by date range and item name
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filterOrdersByDateRange(filtered, dateRange.start, dateRange.end)
    }

    // Filter by item name
    filtered = filtered.filter(
      (order) =>
        order.product === itemName ||
        order.items?.some((item) => item.description === itemName || item.partNo === itemName),
    )

    return filtered
  }, [orders, itemName, dateRange])

  // Prepare data for the chart
  const chartData = useMemo(() => {
    // Sort orders by date
    const sortedOrders = [...filteredOrders].sort(
      (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    )

    // Extract price data
    return sortedOrders.map((order, index) => {
      // Find the specific item in the order items if it exists
      const specificItem = order.items?.find((item) => item.description === itemName || item.partNo === itemName)

      return {
        date: order.createdDate,
        unitPrice: specificItem ? specificItem.unitPrice : order.unitPrice,
        orderId: order.id,
        customer: order.companyName,
        status: order.status,
        index: index,
      }
    })
  }, [filteredOrders, itemName])

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, min: 0, max: 0, change: 0 }

    const prices = chartData.map((d) => d.unitPrice).filter((price) => price != null && !isNaN(price))
    if (prices.length === 0) return { avg: 0, min: 0, max: 0, change: 0 }

    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const min = Math.min(...prices)
    const max = Math.max(...prices)

    // Calculate price change percentage (from first to last)
    const first = prices[0]
    const last = prices[prices.length - 1]
    const change = first ? ((last - first) / first) * 100 : 0

    return { avg, min, max, change }
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No price data available for {itemName}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Price Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Across {chartData.length} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.min.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Minimum recorded price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.max.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Maximum recorded price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Price Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.change > 0 ? "text-green-600" : stats.change < 0 ? "text-red-600" : ""}`}
            >
              {stats.change > 0 ? "+" : ""}
              {stats.change.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">From first to last order</p>
          </CardContent>
        </Card>
      </div>

      {/* Price Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Trend Over Time</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 40, left: 80, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  tick={{ fontSize: 12 }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="unitPrice"
                  stroke="#2563eb"
                  name="Unit Price"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Price Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price History Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Order Date</th>
                  <th className="text-left py-2 px-4">Order ID</th>
                  <th className="text-left py-2 px-4">Customer</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-right py-2 px-4">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item, index) => (
                  <tr key={`${item.orderId}-${index}`} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4">{item.date}</td>
                    <td className="py-2 px-4 font-medium">{item.orderId}</td>
                    <td className="py-2 px-4">{item.customer}</td>
                    <td className="py-2 px-4">
                      <Badge variant={item.status === "AU" ? "default" : "secondary"}>
                        {item.status === "AU" ? "Domestic" : "International"}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-right font-medium">${item.unitPrice?.toLocaleString() || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
