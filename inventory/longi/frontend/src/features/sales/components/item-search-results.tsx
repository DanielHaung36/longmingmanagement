"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { LineChart, Download, Search, Package, DollarSign, TrendingUp } from "lucide-react"
import { searchItemsInOrders } from "../../../lib/analysis-utils"
import { exportItemSearchResults } from "../../../lib/export-utils"

interface ItemSearchResultsProps {
  orders: any[]
  searchTerm: string
  dateRange: { start: string; end: string }
  onShowPriceTrend: (item: string) => void
}

export function ItemSearchResults({
  orders,
  searchTerm: initialSearchTerm,
  dateRange,
  onShowPriceTrend,
}: ItemSearchResultsProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(initialSearchTerm || "")

  const searchResults = useMemo(() => {
    if (!localSearchTerm) return null
    return searchItemsInOrders(orders, localSearchTerm, dateRange)
  }, [orders, localSearchTerm, dateRange])

  const handleExport = () => {
    if (searchResults) {
      exportItemSearchResults(searchResults, localSearchTerm, dateRange)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle>Search Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="itemSearch">Item Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="itemSearch"
                  placeholder="Search for items (e.g., 'Filter', 'Pump', 'Valve')..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {searchResults && (
              <Button onClick={handleExport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && searchResults.matchingItems.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Items Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchResults.matchingItems.length}</div>
                <p className="text-xs text-muted-foreground">Matching "{localSearchTerm}"</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Quantity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchResults.totalQuantity}</div>
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
                <div className="text-2xl font-bold">${searchResults.totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Combined value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{searchResults.orderCount}</div>
                <p className="text-xs text-muted-foreground">Orders containing items</p>
              </CardContent>
            </Card>
          </div>

          {/* Matching Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Matching Items Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Description</TableHead>
                      <TableHead>Part No.</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Average Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Orders Count</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.matchingItems.map((item, index) => (
                      <TableRow className="text-center" key={index}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell>{item.partNo}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.totalQuantity}</TableCell>
                        <TableCell>
                          ${item.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>${item.totalValue.toLocaleString()}</TableCell>
                        <TableCell>{item.orderCount}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => onShowPriceTrend(item.description)}>
                            <LineChart className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Order Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Item Description</TableHead>
                      <TableHead>Part No.</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.orderDetails.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{detail.orderId}</TableCell>
                        <TableCell>{detail.orderDate}</TableCell>
                        <TableCell>{detail.customer}</TableCell>
                        <TableCell>{detail.project}</TableCell>
                        <TableCell className="font-medium">{detail.itemDescription}</TableCell>
                        <TableCell>{detail.partNo}</TableCell>
                        <TableCell>{detail.quantity}</TableCell>
                        <TableCell>${detail.unitPrice.toLocaleString()}</TableCell>
                        <TableCell>${detail.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={detail.status === "AU" ? "default" : "secondary"}>
                            {detail.status === "AU" ? "Domestic" : "International"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

              </div>
            </CardContent>
          </Card>

          {/* Price Analysis by Item */}
          <Card>
            <CardHeader>
              <CardTitle>Price Analysis by Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.matchingItems.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{item.description}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Part No:</span>
                        <span className="font-medium">{item.partNo}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Qty:</span>
                        <span className="font-medium">
                          {item.totalQuantity} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Price:</span>
                        <span className="font-medium">
                          ${item.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Value:</span>
                        <span className="font-medium">${item.totalValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Orders:</span>
                        <span className="font-medium">{item.orderCount}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        variant="outline"
                        onClick={() => onShowPriceTrend(item.description)}
                      >
                        <LineChart className="w-4 h-4 mr-2" />
                        View Price Trend
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Results */}
      {localSearchTerm && (!searchResults || searchResults.matchingItems.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No items found matching "{localSearchTerm}"</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try searching for different keywords like "Filter", "Pump", "Valve", or part numbers.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search Instructions */}
      {!localSearchTerm && (
        <Card>
          <CardHeader>
            <CardTitle>How to Search Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Use the search box above to find specific items across all orders. You can search by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>
                  <strong>Item Description:</strong> e.g., "Filter", "Pump", "Heat exchanger"
                </li>
                <li>
                  <strong>Part Number:</strong> e.g., "CF-IND-001", "UV-STR-002"
                </li>
                <li>
                  <strong>Partial matches:</strong> e.g., "Carbon" will find "Carbon Filter - Industrial"
                </li>
              </ul>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Example Search Results:</h4>
                <p className="text-sm text-blue-700">
                  Searching for "Filter" would show items like "Carbon Filter - Industrial" and "Filter Housing -
                  Stainless Steel" with their total quantities, prices, and price trends across all orders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
