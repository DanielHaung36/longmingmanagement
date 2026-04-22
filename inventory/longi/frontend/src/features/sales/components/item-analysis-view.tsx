"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Download, TrendingUp, Package, DollarSign, LineChart, Search } from "lucide-react"
import { aggregateItemData } from "@/lib/analysis-utils"
import { exportItemAnalysis } from "@/lib/export-utils"
import { Input } from "./ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface ItemAnalysisViewProps {
  orders: any[]
  allItems: string[]
  dateRange: { start: string; end: string }
  statusFilter: string
  onShowPriceTrend: (item: string) => void
}

export function ItemAnalysisView({
  orders,
  allItems,
  dateRange,
  statusFilter,
  onShowPriceTrend,
}: ItemAnalysisViewProps) {
  const [selectedAnalysisItem, setSelectedAnalysisItem] = useState("all")
  const [itemSearchTerm, setItemSearchTerm] = useState("")

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!itemSearchTerm) return allItems
    return allItems.filter((item) => item.toLowerCase().includes(itemSearchTerm.toLowerCase()))
  }, [allItems, itemSearchTerm])

  const itemAnalysisData = useMemo(() => {
    if (!selectedAnalysisItem || selectedAnalysisItem === "all") return null
    return aggregateItemData(orders, selectedAnalysisItem)
  }, [orders, selectedAnalysisItem])

  const handleExportAnalysis = () => {
    if (selectedAnalysisItem && selectedAnalysisItem !== "all") {
      exportItemAnalysis(orders, selectedAnalysisItem, dateRange, statusFilter)
    }
  }

  // Aggregate all items data for the comprehensive view
  const allItemsData = useMemo(() => {
    const itemsMap = new Map()

    orders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const key = item.description || item.partNo
          if (!key) return

          if (!itemsMap.has(key)) {
            itemsMap.set(key, {
              name: key,
              totalQuantity: 0,
              totalValue: 0,
              orderCount: 0,
              avgPrice: 0,
              partNo: item.partNo || "N/A",
              unit: item.unit || "EA",
            })
          }

          const itemData = itemsMap.get(key)
          itemData.totalQuantity += item.qty
          itemData.totalValue += item.total
          itemData.orderCount += 1
          itemData.avgPrice = itemData.totalValue / itemData.totalQuantity
        })
      } else if (order.product) {
        // Handle orders without detailed items
        const key = order.product

        if (!itemsMap.has(key)) {
          itemsMap.set(key, {
            name: key,
            totalQuantity: 0,
            totalValue: 0,
            orderCount: 0,
            avgPrice: 0,
            partNo: "N/A",
            unit: "EA",
          })
        }

        const itemData = itemsMap.get(key)
        const qty =
          typeof order.quantity === "string"
            ? isNaN(Number(order.quantity))
              ? 1
              : Number(order.quantity)
            : order.quantity || 1

        itemData.totalQuantity += qty
        itemData.totalValue += order.totalPrice
        itemData.orderCount += 1
        itemData.avgPrice = itemData.totalValue / itemData.totalQuantity
      }
    })

    return Array.from(itemsMap.values())
  }, [orders])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="single">Single Item Analysis</TabsTrigger>
          <TabsTrigger value="all">All Items Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6 mt-6">
          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Item for Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Select value={selectedAnalysisItem} onValueChange={setSelectedAnalysisItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an item to analyze" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        {filteredItems.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedAnalysisItem && selectedAnalysisItem !== "all" && (
                    <>
                      <Button onClick={handleExportAnalysis} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Analysis
                      </Button>
                      <Button onClick={() => onShowPriceTrend(selectedAnalysisItem)} variant="outline">
                        <LineChart className="w-4 h-4 mr-2" />
                        Price Trend
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {itemAnalysisData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Total Quantity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{itemAnalysisData.totalQuantity}</div>
                    <p className="text-xs text-muted-foreground">Units across all orders</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Total Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${itemAnalysisData.totalValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Combined item value</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Average Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${Math.round(itemAnalysisData.totalValue / itemAnalysisData.totalQuantity).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Per unit average</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Orders Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{itemAnalysisData.orderCount}</div>
                    <p className="text-xs text-muted-foreground">Orders containing this item</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Breakdown for: {selectedAnalysisItem}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Item Quantity</TableHead>
                        <TableHead>Item Unit Price</TableHead>
                        <TableHead>Item Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemAnalysisData.orderDetails.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{detail.orderId}</TableCell>
                          <TableCell>{detail.customer}</TableCell>
                          <TableCell>{detail.project}</TableCell>
                          <TableCell>{detail.orderDate}</TableCell>
                          <TableCell>{detail.quantity}</TableCell>
                          <TableCell>${detail.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>${detail.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={detail.status === "AU" ? "default" : "secondary"}>
                              {detail.status === "AU" ? "Domestic" : "International"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => onShowPriceTrend(selectedAnalysisItem)}>
                              <LineChart className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Domestic Orders (AU)</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {itemAnalysisData.orderDetails.filter((d) => d.status === "AU").length}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Quantity:{" "}
                        {itemAnalysisData.orderDetails
                          .filter((d) => d.status === "AU")
                          .reduce((sum, d) => sum + d.quantity, 0)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">International Orders</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {itemAnalysisData.orderDetails.filter((d) => d.status === "INT").length}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Quantity:{" "}
                        {itemAnalysisData.orderDetails
                          .filter((d) => d.status === "INT")
                          .reduce((sum, d) => sum + d.quantity, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6 mt-6">
          {/* All Items Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Items Overview</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Part No.</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Average Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Order Count</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allItemsData
                      .filter(
                        (item) =>
                          !itemSearchTerm ||
                          item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                          item.partNo.toLowerCase().includes(itemSearchTerm.toLowerCase()),
                      )
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.partNo}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.totalQuantity}</TableCell>
                          <TableCell>
                            ${item.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>${item.totalValue.toLocaleString()}</TableCell>
                          <TableCell>{item.orderCount}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedAnalysisItem(item.name)}>
                                <Package className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => onShowPriceTrend(item.name)}>
                                <LineChart className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allItemsData.length}</div>
                <p className="text-xs text-muted-foreground">Unique items in inventory</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allItemsData.reduce((sum, item) => sum + item.totalQuantity, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Units across all items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${allItemsData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Combined value of all items</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
