"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductCustomersQuery,
  useGetProductStatsQuery,
} from './productsApi'
import type { Product } from "./productsApi"
import ProductCrudDialog from "./ProductCrudDialog"
import { useGetProductGroupsQuery, useCreateProductGroupMutation } from "../product-groups/productGroupsApi"
import { Box, CircularProgress } from '@mui/material'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  Users,
  Settings,
  Filter,
  Download,
  MapPin,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"

export type ProductRow = Product

export default function ProductListPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  // ── Filter / pagination state ──
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedPartGroup, setSelectedPartGroup] = useState<string>("all")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortField, setSortField] = useState<string>("updatedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedPartGroup, selectedCustomer, selectedRegion, itemsPerPage])

  // ── Server-side query ──
  const queryParams = useMemo(() => ({
    page: currentPage,
    pageSize: itemsPerPage,
    search: debouncedSearch || undefined,
    groupId: selectedPartGroup !== 'all' ? Number(selectedPartGroup) : undefined,
    customer: selectedCustomer !== 'all' ? selectedCustomer : undefined,
    region: (selectedRegion !== 'all' ? selectedRegion : undefined) as 'australia' | 'china' | undefined,
    sortField: sortField || undefined,
    sortDir: sortDirection,
  }), [currentPage, itemsPerPage, debouncedSearch, selectedPartGroup, selectedCustomer, selectedRegion, sortField, sortDirection])

  const { data: productsResponse, isLoading, isFetching, isError } = useGetProductsQuery(queryParams)
  const products = productsResponse?.data || []
  const totalCount = productsResponse?.total || 0
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  // ── Separate queries for dropdowns & stats ──
  const { data: customers = [] } = useGetProductCustomersQuery()
  const { data: stats } = useGetProductStatsQuery()
  const { data: productGroups = [] } = useGetProductGroupsQuery()
  const [createGroup] = useCreateProductGroupMutation()

  // ── Export: lazy query to fetch ALL matching products ──
  const [triggerExport, { isFetching: isExporting }] = useLazyGetProductsQuery()

  // ── Dialog state ──
  const [isCrudDialogOpen, setIsCrudDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  const partGroups = useMemo(() =>
    productGroups.map(g => ({ id: g.id, name: g.name })),
    [productGroups]
  )

  // ── Handlers ──
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      await createGroup({ name: newGroupName.trim() }).unwrap()
      toast({ title: "Success", description: `Group "${newGroupName.trim()}" created` })
      setNewGroupName("")
      setNewGroupDialogOpen(false)
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to create group", variant: "destructive" })
    }
  }

  const handleCreate = () => {
    setSelectedProduct(null)
    setIsCrudDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsCrudDialogOpen(true)
  }

  const handleDelete = (product: Product) => {
    setSelectedProduct(product)
    setIsCrudDialogOpen(true)
  }

  const handleProductSaved = () => {
    setSelectedProduct(null)
    // RTK Query cache invalidation handles the refetch
  }

  const handleProductDeleted = () => {
    setSelectedProduct(null)
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailDialogOpen(true)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Excel export — fetches ALL matching products from server
  const handleExport = useCallback(async () => {
    try {
      const result = await triggerExport({
        pageSize: 0, // all
        search: debouncedSearch || undefined,
        groupId: selectedPartGroup !== 'all' ? Number(selectedPartGroup) : undefined,
        customer: selectedCustomer !== 'all' ? selectedCustomer : undefined,
        region: (selectedRegion !== 'all' ? selectedRegion : undefined) as 'australia' | 'china' | undefined,
      }).unwrap()

      const dataToExport = (result.data || []).map((product) => ({
        "Part Number (AU)": product.partNumberAU || "",
        "Part Number (CN)": product.partNumberCN || "",
        "Description": product.description || "",
        "Description (Chinese)": product.descriptionChinese || "",
        "Asset": product.asset || "",
        "Customer": product.customer || "",
        "Part Group": product.groupName || product.partGroup || "",
        "Part Life": product.partLife || "",
        "OEM": product.oem || "",
        "Purchase Price": product.purchasePrice || 0,
        "Unit Price": product.unitPrice || 0,
        "Compatible Models": product.compatiblemodels || "",
        "Note": product.note || "",
      }))

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      worksheet["!cols"] = [
        { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 25 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products")

      const regionLabel = selectedRegion === "all" ? "All" : selectedRegion === "australia" ? "Australia" : "China"
      const groupLabel = selectedPartGroup === "all" ? "AllGroups" : (partGroups.find(g => String(g.id) === selectedPartGroup)?.name ?? selectedPartGroup)
      const timestamp = new Date().toISOString().slice(0, 10)
      const fileName = `Products_${regionLabel}_${groupLabel}_${timestamp}.xlsx`

      XLSX.writeFile(workbook, fileName)
      toast({ title: "Export Successful", description: `Exported ${dataToExport.length} products to ${fileName}` })
    } catch {
      toast({ title: "Export Failed", description: "Failed to export products", variant: "destructive" })
    }
  }, [triggerExport, debouncedSearch, selectedPartGroup, selectedCustomer, selectedRegion, partGroups, toast])

  const getPartGroupColor = (partGroup: string) => {
    const colors: Record<string, string> = {
      Sensors: "bg-blue-100 text-blue-800 border-blue-200",
      Valves: "bg-green-100 text-green-800 border-green-200",
      PowerTransmission: "bg-purple-100 text-purple-800 border-purple-200",
      Electronics: "bg-orange-100 text-orange-800 border-orange-200",
      Mechanical: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[partGroup] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (isLoading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 4 }}>
      <CircularProgress />
    </Box>
  )
  if (isError) return <div>Error loading products</div>

  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const showingTo = Math.min(currentPage * itemsPerPage, totalCount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Product Management
          </h1>
          <p className="text-slate-600 text-lg">Manage your warehouse inventory with ease</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Products</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats?.totalProducts ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">${(stats?.totalValue ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Customers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats?.uniqueCustomers ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Part Groups</CardTitle>
              <Settings className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{productGroups.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl">Product Inventory</CardTitle>
                <CardDescription>
                  {totalCount > 0
                    ? `Showing ${showingFrom} to ${showingTo} of ${totalCount} products`
                    : 'No products found'}
                  {isFetching && !isLoading && <span className="ml-2 text-blue-500">Loading...</span>}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Excel'}
                </Button>
                <Button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products, part numbers, or descriptions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-1">
                <Select value={selectedPartGroup} onValueChange={setSelectedPartGroup}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Part Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {partGroups.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  title="New Group"
                  onClick={() => setNewGroupDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer} value={customer}>
                      {customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="australia">Australia (LGA)</SelectItem>
                  <SelectItem value="china">China (LGC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items per page */}
            <div className="flex flex-1 flex-col items-end p-4 bg-slate-50 rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Items per page</Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">
                      <Button variant="ghost" onClick={() => handleSort("partNumberAU")} className="h-auto p-0 font-semibold">
                        Part Numbers
                        {sortField === "partNumberAU" && <span className="ml-1">{sortDirection === "asc" ? "\u2191" : "\u2193"}</span>}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button variant="ghost" onClick={() => handleSort("description")} className="h-auto p-0 font-semibold">
                        Description
                        {sortField === "description" && <span className="ml-1">{sortDirection === "asc" ? "\u2191" : "\u2193"}</span>}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">Details</TableHead>
                    <TableHead className="font-semibold">
                      <Button variant="ghost" onClick={() => handleSort("customer")} className="h-auto p-0 font-semibold">
                        Group
                        {sortField === "customer" && <span className="ml-1">{sortDirection === "asc" ? "\u2191" : "\u2193"}</span>}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button variant="ghost" onClick={() => handleSort("unitPrice")} className="h-auto p-0 font-semibold">
                        Pricing
                        {sortField === "unitPrice" && <span className="ml-1">{sortDirection === "asc" ? "\u2191" : "\u2193"}</span>}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900">{product.partNumberAU}</div>
                          <div className="text-sm text-slate-500">{product.partNumberCN}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-slate-900">{product.description}</div>
                          <div className="text-sm text-slate-500">{product.descriptionChinese}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div><span className="font-medium">Asset:</span> {product.asset}</div>
                          <div><span className="font-medium">Customer:</span> {product.customer}</div>
                          <div><span className="font-medium">OEM:</span> {product.oem}</div>
                          {product.note && <div className="text-slate-500 italic">{product.note}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPartGroupColor(product.groupName || product.partGroup || '')} border`}>
                          {product.groupName || product.partGroup}
                        </Badge>
                        <div className="text-xs text-slate-500 mt-1">Life: {product.partLife}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-green-700">${(product.unitPrice ?? 0).toLocaleString()}</div>
                          <div className="text-sm text-slate-500">Cost: ${(product.purchasePrice ?? 0).toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t("productColumns.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("productColumns.detail")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(product)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("productColumns.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {products.length === 0 && !isFetching && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t bg-gradient-to-r from-slate-50 to-slate-100">
                  <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-slate-600 mb-4 sm:mb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Page</span>
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-semibold">
                        {currentPage}
                      </div>
                      <span>of</span>
                      <div className="px-2 py-1 bg-slate-200 text-slate-700 rounded-md font-semibold">
                        {totalPages}
                      </div>
                    </div>
                    <div className="hidden sm:block text-slate-400">&bull;</div>
                    <div className="text-center sm:text-left">
                      Showing{" "}
                      <span className="font-semibold text-slate-800">{showingFrom}</span> to{" "}
                      <span className="font-semibold text-slate-800">{showingTo}</span>{" "}
                      of <span className="font-semibold text-slate-800">{totalCount}</span> products
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-1">
                    {currentPage > 1 && totalPages > 5 && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} title="Go to first page"
                          className="hover:bg-blue-50 hover:border-blue-200 transition-colors">
                          <span className="hidden sm:inline">First</span>
                          <span className="sm:hidden">1</span>
                        </Button>
                        {currentPage > 3 && <span className="px-2 text-slate-400">...</span>}
                      </>
                    )}

                    {currentPage > 1 && (
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)}
                        className="hover:bg-blue-50 hover:border-blue-200 transition-colors">
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">&lsaquo;</span>
                      </Button>
                    )}

                    {(() => {
                      const delta = 2
                      const start = Math.max(1, currentPage - delta)
                      const end = Math.min(totalPages, currentPage + delta)
                      const pages: (number | string)[] = []

                      if (start > 1) {
                        pages.push(1)
                        if (start > 2) pages.push("...")
                      }
                      for (let i = start; i <= end; i++) pages.push(i)
                      if (end < totalPages) {
                        if (end < totalPages - 1) pages.push("...")
                        pages.push(totalPages)
                      }

                      return pages.map((p, idx) =>
                        p === "..." ? (
                          <span key={`dots-${idx}`} className="px-2 text-slate-400 font-medium">...</span>
                        ) : (
                          <Button
                            key={p}
                            variant={p === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(p as number)}
                            className={p === currentPage
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md transform scale-105"
                              : "hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                            }
                          >
                            {p}
                          </Button>
                        )
                      )
                    })()}

                    {currentPage < totalPages && (
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)}
                        className="hover:bg-blue-50 hover:border-blue-200 transition-colors">
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">&rsaquo;</span>
                      </Button>
                    )}

                    {currentPage < totalPages && totalPages > 5 && (
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}
                        className="hover:bg-blue-50 hover:border-blue-200 transition-colors" title="Go to last page">
                        <span className="hidden sm:inline">Last</span>
                        <span className="sm:hidden">{totalPages}</span>
                      </Button>
                    )}
                  </div>

                  {/* Quick Jump */}
                  {totalPages > 10 && (
                    <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4">
                      <Label htmlFor="pageJump" className="text-sm text-slate-600 whitespace-nowrap">Jump to:</Label>
                      <Input
                        id="pageJump"
                        type="number"
                        min="1"
                        max={totalPages}
                        placeholder={currentPage.toString()}
                        className="w-16 h-8 text-center text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = Number.parseInt((e.target as HTMLInputElement).value)
                            if (value >= 1 && value <= totalPages) {
                              setCurrentPage(value)
                              ;(e.target as HTMLInputElement).value = ""
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Product Dialog */}
        <ProductCrudDialog
          open={isCrudDialogOpen}
          onOpenChange={setIsCrudDialogOpen}
          product={selectedProduct}
          onSaved={handleProductSaved}
          onDeleted={handleProductDeleted}
        />

        {/* New Group Dialog */}
        <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>New Product Group</DialogTitle>
            </DialogHeader>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name, e.g. Sensors"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateGroup() }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewGroupDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="bg-blue-600 hover:bg-blue-700">Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </DialogTitle>
              <DialogDescription>Complete information for {selectedProduct?.description}</DialogDescription>
            </DialogHeader>

            {selectedProduct && (
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Part Number (AU)</Label>
                      <p className="text-lg font-semibold">{selectedProduct.partNumberAU}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Part Number (CN)</Label>
                      <p className="text-lg font-semibold">{selectedProduct.partNumberCN}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-slate-600">Description</Label>
                      <p className="text-lg">{selectedProduct.description}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-slate-600">Chinese Description</Label>
                      <p className="text-lg">{selectedProduct.descriptionChinese}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Asset & Customer</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Asset</Label>
                      <p className="text-lg font-semibold text-blue-600">{selectedProduct.asset}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Customer</Label>
                      <p className="text-lg font-semibold text-green-600">{selectedProduct.customer}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">OEM</Label>
                      <p className="text-lg">{selectedProduct.oem}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Technical Information</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Part Group</Label>
                      <Badge className={`${getPartGroupColor(selectedProduct.groupName || selectedProduct.partGroup || '')} border text-sm`}>
                        {selectedProduct.groupName || selectedProduct.partGroup}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Part Life</Label>
                      <p className="text-lg">{selectedProduct.partLife}</p>
                    </div>
                    {selectedProduct.note && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-slate-600">Notes</Label>
                        <p className="text-lg bg-slate-50 p-3 rounded-lg">{selectedProduct.note}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Pricing Information</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Purchase Price</Label>
                      <p className="text-2xl font-bold text-orange-600">${(selectedProduct.purchasePrice ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Unit Price</Label>
                      <p className="text-2xl font-bold text-green-600">${(selectedProduct.unitPrice ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Profit Margin</Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedProduct.purchasePrice
                          ? (((selectedProduct.unitPrice || 0) - selectedProduct.purchasePrice) / selectedProduct.purchasePrice * 100).toFixed(1)
                          : '—'}%
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => { setIsDetailDialogOpen(false); handleEdit(selectedProduct) }}
                    className="bg-blue-600 hover:bg-blue-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </Button>
                  <Button variant="outline" onClick={() => { setIsDetailDialogOpen(false); handleDelete(selectedProduct) }}
                    className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
