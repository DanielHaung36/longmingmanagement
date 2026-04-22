"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Plus, Trash2 } from "lucide-react"

interface CreateOrderFormProps {
  onSubmit: (order: any) => void
  onCancel: () => void
}

export function CreateOrderForm({ onSubmit, onCancel }: CreateOrderFormProps) {
  const [formData, setFormData] = useState({
    product: "",
    status: "AU",
    description: "",
    attentionTo: "",
    email: "",
    mobile: "",
    companyName: "",
    project: "",
    quantity: "",
    unitPrice: "",
    totalPrice: "",
  })

  const [items, setItems] = useState([
    {
      description: "",
      partNo: "",
      qty: 1,
      unit: "EA",
      unitPrice: 0,
      total: 0,
    },
  ])

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value }

    // Auto-calculate total price
    if (field === "quantity" || field === "unitPrice") {
      const qty = Number.parseFloat(newFormData.quantity) || 0
      const price = Number.parseFloat(newFormData.unitPrice) || 0
      newFormData.totalPrice = (qty * price).toString()
    }

    setFormData(newFormData)
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-calculate item total
    if (field === "qty" || field === "unitPrice") {
      newItems[index].total = newItems[index].qty * newItems[index].unitPrice
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        partNo: "",
        qty: 1,
        unit: "EA",
        unitPrice: 0,
        total: 0,
      },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const order = {
      ...formData,
      quantity: Number.parseFloat(formData.quantity) || 0,
      unitPrice: Number.parseFloat(formData.unitPrice) || 0,
      totalPrice: Number.parseFloat(formData.totalPrice) || 0,
      items: items.filter((item) => item.description.trim() !== ""),
    }

    onSubmit(order)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Order Information */}
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product">Product</Label>
            <Input
              id="product"
              value={formData.product}
              onChange={(e) => handleInputChange("product", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AU">Domestic (AU)</SelectItem>
                <SelectItem value="INT">International</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="attentionTo">Attention To</Label>
            <Input
              id="attentionTo"
              value={formData.attentionTo}
              onChange={(e) => handleInputChange("attentionTo", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              value={formData.mobile}
              onChange={(e) => handleInputChange("mobile", e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="project">Project</Label>
            <Input
              id="project"
              value={formData.project}
              onChange={(e) => handleInputChange("project", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="unitPrice">Unit Price</Label>
            <Input
              id="unitPrice"
              type="number"
              value={formData.unitPrice}
              onChange={(e) => handleInputChange("unitPrice", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="totalPrice">Total Price</Label>
            <Input id="totalPrice" type="number" value={formData.totalPrice} readOnly className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Order Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Part No.</TableHead>
                <TableHead>QTY</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      placeholder="Item description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.partNo}
                      onChange={(e) => handleItemChange(index, "partNo", e.target.value)}
                      placeholder="Part number"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, "qty", Number.parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={item.unit} onValueChange={(value) => handleItemChange(index, "unit", value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EA">EA</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="SET">SET</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">${item.total.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Order</Button>
      </div>
    </form>
  )
}
