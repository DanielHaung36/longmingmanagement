"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { useState } from "react"
import { Button } from "./ui/button"

interface OrderDetailViewProps {
  order: any
  onUpdateOrder?: (order: any) => void
  onDeleteOrder?: (orderId: string) => void
  onShowPriceTrend?: (item: string) => void
}

export function OrderDetailView({ order, onUpdateOrder, onDeleteOrder, onShowPriceTrend }: OrderDetailViewProps) {
  // Add state for managing items
  const [items, setItems] = useState(order.items || [])
  const [isEditing, setIsEditing] = useState(false)

  const subtotal = items?.reduce((sum, item) => sum + item.total, 0) || 0
  const fobCost = subtotal * 0.05 // 5% FOB cost
  const ddpCost = subtotal * 0.08 // 8% DDP cost
  const grandTotal = subtotal + fobCost + ddpCost

  // Add functions for item management
  const handleAddItem = () => {
    const newItem = {
      description: "",
      partNo: "",
      qty: 1,
      unit: "EA",
      unitPrice: 0,
      total: 0,
    }
    setItems([...items, newItem])
    setIsEditing(true)
  }

  const handleUpdateItem = (index: number, updatedItem: any) => {
    const newItems = [...items]
    newItems[index] = updatedItem
    setItems(newItems)
  }

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSaveItems = () => {
    if (onUpdateOrder) {
      onUpdateOrder({ ...order, items })
    }
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Order {order.id}</CardTitle>
              <p className="text-muted-foreground">Created on {order.createdDate}</p>
            </div>
            <div className="space-x-2">
              <Badge variant={order.status === "AU" ? "default" : "secondary"}>
                {order.status === "AU" ? "Domestic" : "International"}
              </Badge>
              <Button size="sm" onClick={() => setIsEditing(true)} disabled={isEditing}>
                Edit Order
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDeleteOrder?.(order.id)}>
                Delete Order
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Attention To:</strong> {order.attentionTo}
                </p>
                <p>
                  <strong>Company:</strong> {order.companyName}
                </p>
                <p>
                  <strong>Email:</strong> {order.email}
                </p>
                <p>
                  <strong>Mobile:</strong> {order.mobile}
                </p>
                <p>
                  <strong>Project:</strong> {order.project}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Order Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Product:</strong> {order.product}
                </p>
                <p>
                  <strong>Description:</strong> {order.description}
                </p>
                <p>
                  <strong>Quantity:</strong> {order.quantity}
                </p>
                <p>
                  <strong>Unit Price:</strong> ${order.unitPrice?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>Order Items</CardTitle>
            {isEditing && (
              <Button size="sm" onClick={handleAddItem}>
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <th>Item Description</th>
                <th>Part No.</th>
                <th>QTY</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total</th>
                {isEditing && <th className="w-[50px]">Actions</th>}
              </TableRow>
            </TableHeader>
            <tbody>
              {items?.map((item, index) => (
                <TableRow key={index}>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(index, { ...item, description: e.target.value })}
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      item.description
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.partNo}
                        onChange={(e) => handleUpdateItem(index, { ...item, partNo: e.target.value })}
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      item.partNo
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          handleUpdateItem(index, { ...item, qty: Number.parseInt(e.target.value) || 0 })
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      item.qty
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(index, { ...item, unit: e.target.value })}
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      item.unit
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newUnitPrice = Number.parseFloat(e.target.value)
                          const newTotal = newUnitPrice * item.qty
                          handleUpdateItem(index, { ...item, unitPrice: newUnitPrice, total: newTotal })
                        }}
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      `$${item.unitPrice?.toLocaleString()}`
                    )}
                  </td>
                  <td>
                    {isEditing
                      ? `$${(item.unitPrice * item.qty).toLocaleString()}`
                      : `$${item.total?.toLocaleString()}`}
                  </td>
                  {isEditing && (
                    <td className="flex justify-center">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(index)}>
                        Delete
                      </Button>
                    </td>
                  )}
                </TableRow>
              )) || (
                <TableRow>
                  <td colSpan={isEditing ? 7 : 6} className="text-center text-muted-foreground">
                    No detailed items available
                  </td>
                </TableRow>
              )}
            </tbody>
          </Table>
          {isEditing && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setItems(order.items || [])
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveItems}>Save</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>FOB Cost (5%):</span>
              <span>${fobCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>DDP Cost (8%):</span>
              <span>${ddpCost.toLocaleString()}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total:</span>
              <span>${grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
