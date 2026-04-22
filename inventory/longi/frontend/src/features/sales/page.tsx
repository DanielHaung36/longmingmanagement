import { useState, useMemo } from "react"
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table"
import { Badge } from "./components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog"
import { Plus, Eye, Edit, Trash2, BarChart3, LineChart, ArrowUpDown, Filter } from "lucide-react"
import { OrderDetailView } from "./components/order-detail-view"
import { CreateOrderForm } from "./components/create-order-form"
import { EditOrderForm } from "./components/edit-order-form"
import { AdvancedFilters } from "./components/advanced-filters"
import { ItemAnalysisView } from "./components/item-analysis-view"
import { AggregationDashboard } from "./components/aggregation-dashboard"
import { PriceTrendChart } from "./components/price-trend-chart"
import { ItemSearchResults } from "./components/item-search-results"
import { mockOrders } from "@/lib/mock-data"
import { Pagination, Select, MenuItem, Box, Typography } from "@mui/material";

import { exportToExcel, exportItemAnalysis, exportAggregatedData } from "@/lib/export-utils"
import {
  filterOrdersByDateRange,
  getItemsFromOrders,
  aggregateItemData,
  searchItemsInOrders,
} from "@/lib/analysis-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"

export default function SalesOrderManagement() {
  const [orders, setOrders] = useState(mockOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDetailView, setShowDetailView] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showItemAnalysis, setShowItemAnalysis] = useState(false)
  const [showAggregationDashboard, setShowAggregationDashboard] = useState(false)
  const [showPriceTrend, setShowPriceTrend] = useState(false)
  const [showItemSearch, setShowItemSearch] = useState(false)
  const [selectedItemForTrend, setSelectedItemForTrend] = useState(null)




  // Advanced filtering state
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [itemSearch, setItemSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState("all")

  // Sorting state
  const [sortField, setSortField] = useState("createdDate")
  const [sortDirection, setSortDirection] = useState("desc")

  // Filter orders based on all criteria
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filterOrdersByDateRange(filtered, dateRange.start, dateRange.end)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Apply search filter (enhanced to include item search)
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.attentionTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
          // Search within order items
          (order.items &&
            order.items.some(
              (item) =>
                item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.partNo.toLowerCase().includes(searchTerm.toLowerCase()),
            )),
      )
    }

    // Apply item filter
    if (selectedItem && selectedItem !== "all") {
      filtered = filtered.filter((order) =>
        order.items?.some(
          (item) =>
            item.description.toLowerCase().includes(selectedItem.toLowerCase()) ||
            item.partNo.toLowerCase().includes(selectedItem.toLowerCase()),
        ),
      )
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      // Handle numeric fields
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      // Handle string fields
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return 0
    })

    return filtered
  }, [orders, dateRange, statusFilter, searchTerm, selectedItem, sortField, sortDirection])

  // Get all unique items for filtering
  const allItems = useMemo(() => {
    return getItemsFromOrders(orders)
  }, [orders])

  // Calculate aggregations
  const aggregatedData = useMemo(() => {
    return {
      totalOrders: filteredOrders.length,
      totalValue: filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      itemAggregation: selectedItem && selectedItem !== "all" ? aggregateItemData(filteredOrders, selectedItem) : null,
    }
  }, [filteredOrders, selectedItem])

  // Item search results
  const itemSearchResults = useMemo(() => {
    if (!searchTerm) return null
    return searchItemsInOrders(filteredOrders, searchTerm, dateRange)
  }, [filteredOrders, searchTerm, dateRange])

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage]     = useState(10);
  // 在组件里：
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, currentPage, rowsPerPage]);


  const handleCreateOrder = (newOrder) => {
    const order = {
      ...newOrder,
      id: `PO${String(orders.length + 1).padStart(4, "0")}`,
      createdDate: new Date().toISOString().split("T")[0],
    }
    setOrders([...orders, order])
    setShowCreateForm(false)
  }

  const handleEditOrder = (updatedOrder) => {
    setOrders(orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
    setShowEditForm(false)
    setEditingOrder(null)
  }

  const handleDeleteOrder = (orderId) => {
    if (confirm("Are you sure you want to delete this order?")) {
      setOrders(orders.filter((order) => order.id !== orderId))
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailView(true)
  }

  const handleEditClick = (order) => {
    setEditingOrder(order)
    setShowEditForm(true)
  }

  const handleExport = () => {
    if (selectedItem && selectedItem !== "all") {
      exportItemAnalysis(filteredOrders, selectedItem, dateRange, statusFilter)
    } else {
      exportToExcel(filteredOrders, "sales-orders-filtered")
    }
  }

  const handleExportAggregated = () => {
    exportAggregatedData(aggregatedData, dateRange, statusFilter, selectedItem)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleShowPriceTrend = (item) => {
    setSelectedItemForTrend(item)
    setShowPriceTrend(true)
  }

  const handleItemSearchClick = () => {
    setShowItemSearch(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Sales Order Management</h1>
          <p className="text-muted-foreground">Comprehensive order analysis with item-level insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAggregationDashboard(true)} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={handleItemSearchClick} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Item Search
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedItem={selectedItem}
        onItemChange={setSelectedItem}
        allItems={allItems}
        onExport={handleExport}
        onExportAggregated={handleExportAggregated}
        onShowItemAnalysis={() => setShowItemAnalysis(true)}
      />

      {/* Item Search Results Banner */}
      {itemSearchResults && itemSearchResults.matchingItems.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800">Item Search Results for "{searchTerm}"</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{itemSearchResults.matchingItems.length}</div>
                <p className="text-sm text-blue-700">Matching Items Found</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{itemSearchResults.totalQuantity}</div>
                <p className="text-sm text-blue-700">Total Quantity</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${itemSearchResults.totalValue.toLocaleString()}</div>
                <p className="text-sm text-blue-700">Total Value</p>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleItemSearchClick} size="sm">
                View Detailed Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aggregation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {aggregatedData.totalOrders === orders.length ? "All orders" : `Filtered from ${orders.length} total`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${aggregatedData.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined order value</p>
          </CardContent>
        </Card>
        {aggregatedData.itemAggregation && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Item Quantity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{aggregatedData.itemAggregation.totalQuantity}</div>
                <p className="text-xs text-muted-foreground">Total units of selected item</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Item Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${aggregatedData.itemAggregation.totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total value of selected item</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* View Tabs */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          {/* Orders Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sales Orders</CardTitle>
                <div className="flex gap-2">
                  {selectedItem && selectedItem !== "all" && (
                    <Badge variant="secondary" className="text-sm">
                      Filtered by item: {selectedItem}
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="outline" className="text-sm">
                      Search: {searchTerm}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                        ID {sortField === "id" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("product")}>
                        Product {sortField === "product" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("project")}>
                        Project {sortField === "project" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("createdDate")}>
                        Created Date {sortField === "createdDate" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("unitPrice")}>
                        Unit Price {sortField === "unitPrice" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("totalPrice")}>
                        Total Price {sortField === "totalPrice" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          No orders found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                        paginatedOrders.map((order) => (
                        <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.product}</TableCell>
                          <TableCell>
                            <Badge variant={order.status === "AU" ? "default" : "secondary"}>
                              {order.status === "AU" ? "Domestic" : "International"}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.description}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.companyName}</div>
                              <div className="text-xs text-muted-foreground">{order.attentionTo}</div>
                            </div>
                          </TableCell>
                          <TableCell>{order.project}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>{order.createdDate}</TableCell>
                          <TableCell>${order.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>${order.totalPrice.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditClick(order)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteOrder(order.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleShowPriceTrend(order.product)}>
                                <LineChart className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pt: 3,
                  }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2">Rows per page:</Typography>
                  <Select
                      size="small"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                  >
                    {[5, 10, 20, 50].map((n) => (
                        <MenuItem key={n} value={n}>
                          {n}
                        </MenuItem>
                    ))}
                  </Select>
                </Box>

                <Pagination
                    sx={{
                      // unselected items
                      // the currently selected page
                      "& .MuiPaginationItem-root.Mui-selected": {
                        bgcolor: "#171717",    // or a different shade if you prefer contrast
                        color: "#ffff",
                        "&:hover": {
                          bgcolor: "white",
                        },
                      },
                    }}
                    count={Math.ceil(filteredOrders.length / rowsPerPage)}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    showFirstButton
                    showLastButton
                />
              </Box>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          {/* Card View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No orders found matching your criteria
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{order.id}</CardTitle>
                      <Badge variant={order.status === "AU" ? "default" : "secondary"}>
                        {order.status === "AU" ? "Domestic" : "International"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.createdDate}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium">{order.product}</h3>
                      <p className="text-sm text-muted-foreground">{order.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer:</p>
                        <p className="font-medium">{order.companyName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Project:</p>
                        <p className="font-medium">{order.project}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity:</p>
                        <p className="font-medium">{order.quantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unit Price:</p>
                        <p className="font-medium">${order.unitPrice.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-lg">${order.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)}>
                        <Eye className="w-4 h-4 mr-1" /> Details
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(order)}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleShowPriceTrend(order.product)}>
                        <LineChart className="w-4 h-4 mr-1" /> Trend
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Order Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Sales Order</DialogTitle>
          </DialogHeader>
          <CreateOrderForm onSubmit={handleCreateOrder} onCancel={() => setShowCreateForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sales Order</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <EditOrderForm order={editingOrder} onSubmit={handleEditOrder} onCancel={() => setShowEditForm(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailView} onOpenChange={setShowDetailView}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderDetailView order={selectedOrder} onUpdateOrder={handleEditOrder} onDeleteOrder={handleDeleteOrder} />
          )}
        </DialogContent>
      </Dialog>

      {/* Item Analysis Dialog */}
      <Dialog open={showItemAnalysis} onOpenChange={setShowItemAnalysis}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Item Analysis</DialogTitle>
          </DialogHeader>
          <ItemAnalysisView
            orders={filteredOrders}
            allItems={allItems}
            dateRange={dateRange}
            statusFilter={statusFilter}
            onShowPriceTrend={handleShowPriceTrend}
          />
        </DialogContent>
      </Dialog>

      {/* Aggregation Dashboard Dialog */}
      <Dialog open={showAggregationDashboard} onOpenChange={setShowAggregationDashboard}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analytics Dashboard</DialogTitle>
          </DialogHeader>
          <AggregationDashboard
            orders={orders}
            filteredOrders={filteredOrders}
            dateRange={dateRange}
            statusFilter={statusFilter}
          />
        </DialogContent>
      </Dialog>

      {/* Price Trend Dialog */}
      <Dialog open={showPriceTrend} onOpenChange={setShowPriceTrend}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto" style={{ zIndex: 99999 }}>
          <DialogHeader>
            <DialogTitle>Price Trend Analysis: {selectedItemForTrend}</DialogTitle>
          </DialogHeader>
          {selectedItemForTrend && (
            <PriceTrendChart orders={orders} itemName={selectedItemForTrend} dateRange={dateRange} />
          )}
        </DialogContent>
      </Dialog>

      {/* Item Search Results Dialog */}
      <Dialog open={showItemSearch} onOpenChange={setShowItemSearch} >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto "  style={{zIndex: 9999,borderRadius:4,}}>
          <DialogHeader>
            <DialogTitle>Item Search Results</DialogTitle>
          </DialogHeader>
          <ItemSearchResults
            orders={filteredOrders}
            searchTerm={searchTerm}
            dateRange={dateRange}
            onShowPriceTrend={handleShowPriceTrend}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
