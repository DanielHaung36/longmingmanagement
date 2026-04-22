"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Edit, Trash2, Package } from "lucide-react"

interface ProductCentricTableProps {
  orders: any[]
  selectedProduct: string
  onViewDetails: (order: any) => void
  onEditOrder: (order: any) => void
  onDeleteOrder: (orderId: string) => void
}

export function ProductCentricTable({
  orders,
  selectedProduct,
  onViewDetails,
  onEditOrder,
  onDeleteOrder,
}: ProductCentricTableProps) {
  const totalQuantity = orders.reduce((sum, order) => {
    // Handle different quantity formats
    const qty =
      typeof order.quantity === "string" ? (isNaN(Number(order.quantity)) ? 1 : Number(order.quantity)) : order.quantity
    return sum + qty
  }, 0)

  const totalValue = orders.reduce((sum, order) => sum + order.totalPrice, 0)

  return (
    <div className="space-y-4">
      {/* Product Summary */}
      {selectedProduct !== "all" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Package className="w-5 h-5" />
              Product Analysis: {selectedProduct}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                <p className="text-sm text-blue-700">Total Orders</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalQuantity}</div>
                <p className="text-sm text-blue-700">Total Quantity</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${totalValue.toLocaleString()}</div>
                <p className="text-sm text-blue-700">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product-Centric Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  {selectedProduct === "all"
                    ? "No orders found matching your criteria"
                    : `No orders found for product: ${selectedProduct}`}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell className="font-medium text-blue-600">{order.product}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.companyName}</div>
                      <div className="text-sm text-muted-foreground">{order.attentionTo}</div>
                    </div>
                  </TableCell>
                  <TableCell>{order.project}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.createdDate}</TableCell>
                  <TableCell>${order.unitPrice.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">${order.totalPrice.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "AU" ? "default" : "secondary"}>
                      {order.status === "AU" ? "Domestic" : "International"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => onViewDetails(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onEditOrder(order)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onDeleteOrder(order.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Additional Product Insights */}
      {selectedProduct !== "all" && orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Top Customers</h4>
                <div className="space-y-1">
                  {Object.entries(
                    orders.reduce(
                      (acc, order) => {
                        acc[order.companyName] = (acc[order.companyName] || 0) + order.totalPrice
                        return acc
                      },
                      {} as Record<string, number>,
                    ),
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([company, value]) => (
                      <div key={company} className="flex justify-between text-sm">
                        <span>{company}</span>
                        <span className="font-medium">${value.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Order Distribution</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Domestic Orders</span>
                    <span className="font-medium">{orders.filter((o) => o.status === "AU").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>International Orders</span>
                    <span className="font-medium">{orders.filter((o) => o.status === "INT").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Order Value</span>
                    <span className="font-medium">${Math.round(totalValue / orders.length).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
