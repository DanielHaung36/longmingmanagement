"use client"

import { useState, useMemo } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Upload,
} from "lucide-react"
import { useTranslation } from "react-i18next";
// Product data type
export type ProductRow = {
  id: string
  partNumberCN: string
  partNumberAU: string
  description: string
  descriptionChinese: string
  asset: string
  customer: string
  note: string
  partGroup: string
  partLife: string
  oem: string
  purchasePrice: number
  unitPrice: number
}

// Mock data
const productMockData: ProductRow[] = [
  {
    id: "1",
    partNumberCN: "60904070006",
    partNumberAU: "EQP91001",
    description: "Oil flow relay",
    descriptionChinese: "油流继电器",
    asset: "LGS-3000",
    customer: "FMG",
    note: "YJ1-80/40",
    partGroup: "Sensors",
    partLife: "1 year",
    oem: "FEEJOY",
    purchasePrice: 2500,
    unitPrice: 3000,
  },
  {
    id: "2",
    partNumberCN: "60404070012",
    partNumberAU: "EQP91002",
    description: "Pinch valve",
    descriptionChinese: "胶管阀",
    asset: "LGS-3000",
    customer: "FMG",
    note: "DN125",
    partGroup: "Valves",
    partLife: "1 year",
    oem: "NIBCO",
    purchasePrice: 1800,
    unitPrice: 2000,
  },
  {
    id: "3",
    partNumberCN: "60201020010",
    partNumberAU: "EQP91003",
    description: "Pulley belt, V, singular",
    descriptionChinese: "三角皮带",
    asset: "LGS-3000",
    customer: "FMG",
    note: "5 pc / set",
    partGroup: "PowerTransmission",
    partLife: "1 year",
    oem: "Gates",
    purchasePrice: 50,
    unitPrice: 75,
  },
]

import { PART_GROUPS } from "@/constants/partGroups"
const partGroups = [...PART_GROUPS]
const customers = ["FMG", "BHP", "Rio Tinto", "Fortescue"]
const assets = ["LGS-3000", "LGS-2000", "LGS-4000"]

export default function ProductListPage() {
   const { t } =useTranslation()
  const [products, setProducts] = useState<ProductRow[]>(productMockData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPartGroup, setSelectedPartGroup] = useState<string>("all")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
  const [formData, setFormData] = useState<Partial<ProductRow>>({})
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<keyof ProductRow>("description")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.partNumberCN?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.partNumberAU?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descriptionChinese?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.oem?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPartGroup = selectedPartGroup === "all" || product.partGroup === selectedPartGroup
      const matchesCustomer = selectedCustomer === "all" || product.customer === selectedCustomer
      const matchesPriceRange = product.unitPrice >= priceRange[0] && product.unitPrice <= priceRange[1]

      return matchesSearch && matchesPartGroup && matchesCustomer && matchesPriceRange
    })

    
    // Sort products
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return filtered
  }, [products, searchTerm, selectedPartGroup, selectedCustomer, priceRange, sortField, sortDirection])

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedProducts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = products.length
    const totalValue = products.reduce((sum, product) => sum + parseFloat(String(product.unitPrice || 0)), 0)
    const uniqueCustomers = new Set(products.map((p) => p.customer)).size
    const uniquePartGroups = new Set(products.map((p) => p.partGroup)).size

    return {
      totalProducts,
      totalValue,
      uniqueCustomers,
      uniquePartGroups,
    }
  }, [products])

  const handleCreate = () => {
    setFormData({})
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (product: ProductRow) => {
    setSelectedProduct(product)
    setFormData(product)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (product: ProductRow) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveProduct = () => {
    if (selectedProduct) {
      // Update existing product
      setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? { ...p, ...formData } : p)))
      setIsEditDialogOpen(false)
    } else {
      // Create new product
      const newProduct: ProductRow = {
        ...(formData as ProductRow),
        id: Date.now().toString(),
      }
      setProducts((prev) => [...prev, newProduct])
      setIsCreateDialogOpen(false)
    }
    setFormData({})
    setSelectedProduct(null)
  }

  const handleDeleteConfirm = () => {
    if (selectedProduct) {
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id))
      setIsDeleteDialogOpen(false)
      setSelectedProduct(null)
    }
  }

  const handleViewDetails = (product: ProductRow) => {
    setSelectedProduct(product)
    setIsDetailDialogOpen(true)
  }

  const handleSort = (field: keyof ProductRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

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
              <div className="text-2xl font-bold text-blue-900">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">${(stats.totalValue ?? 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Customers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.uniqueCustomers}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Part Groups</CardTitle>
              <Settings className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.uniquePartGroups}</div>
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)} of{" "}
                  {filteredAndSortedProducts.length} products
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedPartGroup} onValueChange={setSelectedPartGroup}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Part Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {partGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <Label className="text-sm font-medium mb-2 block">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                    className="w-24"
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 10000])}
                    className="w-24"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Items per page</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("partNumberAU")}
                        className="h-auto p-0 font-semibold"
                      >
                        Part Numbers
                        {sortField === "partNumberAU" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("description")}
                        className="h-auto p-0 font-semibold"
                      >
                        Description
                        {sortField === "description" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">Details</TableHead>
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("partGroup")}
                        className="h-auto p-0 font-semibold"
                      >
                        Group
                        {sortField === "partGroup" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("unitPrice")}
                        className="h-auto p-0 font-semibold"
                      >
                        Pricing
                        {sortField === "unitPrice" && (
                          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
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
                          <div>
                            <span className="font-medium">Asset:</span> {product.asset}
                          </div>
                          <div>
                            <span className="font-medium">Customer:</span> {product.customer}
                          </div>
                          <div>
                            <span className="font-medium">OEM:</span> {product.oem}
                          </div>
                          {product.note && <div className="text-slate-500 italic">{product.note}</div>}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={`${getPartGroupColor(product.partGroup)} border`}>{product.partGroup}</Badge>
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
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
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

              {paginatedProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t bg-gradient-to-r from-slate-50 to-slate-100">
                  {/* Pagination Info */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-slate-600 mb-4 sm:mb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Page</span>
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-semibold">
                        {currentPage}
                      </div>
                      <span>of</span>
                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 rounded-md font-semibold">
                        {totalPages}
                      </div>
                    </div>
                    <div className="hidden sm:block text-slate-400">•</div>
                    <div className="text-center sm:text-left">
                      Showing{" "}
                      <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                      <span className="font-semibold text-slate-800">
                        {Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)}
                      </span>{" "}
                      of <span className="font-semibold text-slate-800">{filteredAndSortedProducts.length}</span>{" "}
                      products
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-1">
                    {/* First Page Button - Only show if not on first page and there are many pages */}
                    {currentPage > 1 && totalPages > 5 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                          title="Go to first page"
                        >
                          <span className="hidden sm:inline">First</span>
                          <span className="sm:hidden">1</span>
                        </Button>
                        {currentPage > 3 && <span className="px-2 text-slate-400">...</span>}
                      </>
                    )}

                    {/* Previous Button - Only show if not on first page */}
                    {currentPage > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        title={`Go to page ${currentPage - 1}`}
                      >
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">‹</span>
                      </Button>
                    )}

                    {/* Page Numbers - Smart display logic */}
                    {(() => {
                      const getPageNumbers = () => {
                        const delta = 2 // Number of pages to show on each side of current page
                        const range = []
                        const rangeWithDots = []

                        // Calculate start and end of page range
                        const start = Math.max(1, currentPage - delta)
                        const end = Math.min(totalPages, currentPage + delta)

                        // Generate page numbers
                        for (let i = start; i <= end; i++) {
                          range.push(i)
                        }

                        // Add dots and edge pages if needed
                        if (start > 1) {
                          if (start > 2) {
                            rangeWithDots.push(1)
                            if (start > 3) {
                              rangeWithDots.push("...")
                            }
                          }
                        }

                        rangeWithDots.push(...range)

                        if (end < totalPages) {
                          if (end < totalPages - 1) {
                            if (end < totalPages - 2) {
                              rangeWithDots.push("...")
                            }
                            rangeWithDots.push(totalPages)
                          }
                        }

                        return rangeWithDots
                      }

                      return getPageNumbers().map((pageNum, index) => {
                        if (pageNum === "...") {
                          return (
                            <span key={`dots-${index}`} className="px-2 text-slate-400 font-medium">
                              ...
                            </span>
                          )
                        }

                        const isCurrentPage = pageNum === currentPage
                        return (
                          <Button
                            key={pageNum}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum as number)}
                            className={
                              isCurrentPage
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md transform scale-105"
                                : "hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                            }
                            title={`Go to page ${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        )
                      })
                    })()}

                    {/* Next Button - Only show if not on last page */}
                    {currentPage < totalPages && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        title={`Go to page ${currentPage + 1}`}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">›</span>
                      </Button>
                    )}

                    {/* Last Page Button - Only show if not on last page and there are many pages */}
                    {currentPage < totalPages && totalPages > 5 && (
                      <>
                        {currentPage < totalPages - 2 && <span className="px-2 text-slate-400">...</span>}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                          title="Go to last page"
                        >
                          <span className="hidden sm:inline">Last</span>
                          <span className="sm:hidden">{totalPages}</span>
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Quick Jump - Show for large datasets */}
                  {totalPages > 10 && (
                    <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4">
                      <Label htmlFor="pageJump" className="text-sm text-slate-600 whitespace-nowrap">
                        Jump to:
                      </Label>
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
                        title={`Enter page number (1-${totalPages})`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog
          open={isCreateDialogOpen || isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              setFormData({})
              setSelectedProduct(null)
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct ? "Edit Product" : "Create New Product"}</DialogTitle>
              <DialogDescription>
                {selectedProduct
                  ? "Update the product information below."
                  : "Fill in the details to create a new product."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="partNumberAU">Part Number (AU)</Label>
                  <Input
                    id="partNumberAU"
                    value={formData.partNumberAU || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, partNumberAU: e.target.value }))}
                    placeholder="EQP91001"
                  />
                </div>

                <div>
                  <Label htmlFor="partNumberCN">Part Number (CN)</Label>
                  <Input
                    id="partNumberCN"
                    value={formData.partNumberCN || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, partNumberCN: e.target.value }))}
                    placeholder="60904070006"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Oil flow relay"
                  />
                </div>

                <div>
                  <Label htmlFor="descriptionChinese">Chinese Description</Label>
                  <Input
                    id="descriptionChinese"
                    value={formData.descriptionChinese || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descriptionChinese: e.target.value }))}
                    placeholder="油流继电器"
                  />
                </div>

                <div>
                  <Label htmlFor="asset">Asset</Label>
                  <Select
                    value={formData.asset || ""}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, asset: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset} value={asset}>
                          {asset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select
                    value={formData.customer || ""}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, customer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer} value={customer}>
                          {customer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="partGroup">Part Group</Label>
                  <Select
                    value={formData.partGroup || ""}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, partGroup: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select part group" />
                    </SelectTrigger>
                    <SelectContent>
                      {partGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="partLife">Part Life</Label>
                  <Input
                    id="partLife"
                    value={formData.partLife || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, partLife: e.target.value }))}
                    placeholder="1 year"
                  />
                </div>

                <div>
                  <Label htmlFor="oem">OEM</Label>
                  <Input
                    id="oem"
                    value={formData.oem || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, oem: e.target.value }))}
                    placeholder="FEEJOY"
                  />
                </div>

                <div>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, purchasePrice: Number.parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="2500"
                  />
                </div>

                <div>
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    value={formData.unitPrice || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, unitPrice: Number.parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="3000"
                  />
                </div>

                <div>
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    value={formData.note || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setIsEditDialogOpen(false)
                  setFormData({})
                  setSelectedProduct(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {selectedProduct ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product &quot;
                {selectedProduct?.description}&quot; from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                Delete Product
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
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

                {/* Asset & Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Asset & Customer</CardTitle>
                  </CardHeader>
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

                {/* Technical Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technical Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Part Group</Label>
                      <Badge className={`${getPartGroupColor(selectedProduct.partGroup)} border text-sm`}>
                        {selectedProduct.partGroup}
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

                {/* Pricing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Purchase Price</Label>
                      <p className="text-2xl font-bold text-orange-600">
                        ${(selectedProduct.purchasePrice ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Unit Price</Label>
                      <p className="text-2xl font-bold text-green-600">${(selectedProduct.unitPrice ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Profit Margin</Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {(
                          ((selectedProduct.unitPrice - selectedProduct.purchasePrice) /
                            selectedProduct.purchasePrice) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setIsDetailDialogOpen(false)
                      handleEdit(selectedProduct)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailDialogOpen(false)
                      handleDelete(selectedProduct)
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
