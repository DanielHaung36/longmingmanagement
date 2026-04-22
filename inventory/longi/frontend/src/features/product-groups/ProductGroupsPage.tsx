import { useState, useMemo, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, Search, FolderTree, Package, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useGetProductGroupsQuery,
  useCreateProductGroupMutation,
  useUpdateProductGroupMutation,
  useDeleteProductGroupMutation,
  type ProductGroup,
} from './productGroupsApi'
import { useGetProductsQuery, type Product } from '../products/productsApi'
import ProductCrudDialog from '../products/ProductCrudDialog'

export default function ProductGroupsPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { data: groups = [], isLoading, refetch } = useGetProductGroupsQuery()
  const [createGroup, { isLoading: isCreating }] = useCreateProductGroupMutation()
  const [updateGroup, { isLoading: isUpdating }] = useUpdateProductGroupMutation()
  const [deleteGroup] = useDeleteProductGroupMutation()

  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<ProductGroup | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null)

  // Product CRUD dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productDialogGroupId, setProductDialogGroupId] = useState<number | undefined>(undefined)

  // Fetch products for the expanded group
  const { data: groupProductsData, isFetching: isLoadingProducts } = useGetProductsQuery(
    expandedGroupId != null ? { groupId: expandedGroupId, pageSize: 100 } : undefined!,
    { skip: expandedGroupId == null }
  )
  const groupProducts = groupProductsData?.data ?? []

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups
    const lower = searchTerm.toLowerCase()
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(lower) ||
        (g.description && g.description.toLowerCase().includes(lower))
    )
  }, [groups, searchTerm])

  const totalProducts = useMemo(
    () => groups.reduce((sum, g) => sum + (g.productCount || 0), 0),
    [groups]
  )

  const handleOpenCreate = () => {
    setEditingGroup(null)
    setFormName('')
    setFormDescription('')
    setDialogOpen(true)
  }

  const handleOpenEdit = (group: ProductGroup) => {
    setEditingGroup(group)
    setFormName(group.name)
    setFormDescription(group.description || '')
    setDialogOpen(true)
  }

  const handleOpenDelete = (group: ProductGroup) => {
    setDeletingGroup(group)
    setDeleteDialogOpen(true)
  }

  const handleToggleExpand = (groupId: number) => {
    setExpandedGroupId(prev => prev === groupId ? null : groupId)
  }

  const handleCreateProduct = (groupId: number) => {
    setEditingProduct(null)
    setProductDialogGroupId(groupId)
    setProductDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductDialogGroupId(undefined)
    setProductDialogOpen(true)
  }

  const handleProductSaved = () => {
    refetch()
  }

  const handleProductDeleted = () => {
    refetch()
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' })
      return
    }
    try {
      if (editingGroup) {
        await updateGroup({
          id: editingGroup.id,
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        }).unwrap()
        toast({ title: 'Success', description: 'Group updated successfully' })
      } else {
        await createGroup({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        }).unwrap()
        toast({ title: 'Success', description: 'Group created successfully' })
      }
      setDialogOpen(false)
      refetch()
    } catch (err: any) {
      const msg = err?.data?.message || 'Operation failed'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deletingGroup) return
    try {
      await deleteGroup(deletingGroup.id).unwrap()
      toast({ title: 'Success', description: 'Group deleted successfully' })
      setDeleteDialogOpen(false)
      setDeletingGroup(null)
      refetch()
    } catch (err: any) {
      const status = err?.status
      const msg = status === 403
        ? 'Permission denied. Please contact an administrator to delete.'
        : err?.data?.message || 'Failed to delete group'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Groups</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories and classifications</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Groups</p>
                <p className="text-3xl font-bold text-blue-900">{groups.length}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-lg">
                <FolderTree className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-emerald-600">Total Products</p>
                <p className="text-3xl font-bold text-emerald-900">{totalProducts}</p>
              </div>
              <div className="bg-emerald-600 p-3 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Groups</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No groups match your search' : 'No groups yet. Create one to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-32 text-center">Products</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <Fragment key={group.id}>
                    <TableRow
                      key={group.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleToggleExpand(group.id)}
                    >
                      <TableCell className="px-2">
                        {expandedGroupId === group.id
                          ? <ChevronDown className="h-4 w-4 text-gray-500" />
                          : <ChevronRight className="h-4 w-4 text-gray-500" />
                        }
                      </TableCell>
                      <TableCell className="text-gray-500">{group.id}</TableCell>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="text-gray-600">{group.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {group.productCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(group)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(group)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            disabled={group.productCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded products row */}
                    {expandedGroupId === group.id && (
                      <TableRow key={`${group.id}-products`}>
                        <TableCell colSpan={6} className="bg-gray-50 p-0">
                          <div className="px-6 py-4 overflow-x-auto">
                            <div className="flex justify-end mb-2">
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCreateProduct(group.id)
                                }}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Product
                              </Button>
                            </div>
                            {isLoadingProducts ? (
                              <p className="text-sm text-gray-500 py-2">Loading products...</p>
                            ) : groupProducts.length === 0 ? (
                              <p className="text-sm text-gray-500 py-2">No products in this group</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-100">
                                    <TableHead className="text-xs">Code</TableHead>
                                    <TableHead className="text-xs">Part Number (AU)</TableHead>
                                    <TableHead className="text-xs">Description</TableHead>
                                    <TableHead className="text-xs">Customer</TableHead>
                                    <TableHead className="text-xs">OEM</TableHead>
                                    <TableHead className="text-xs text-right">Unit Price</TableHead>
                                    <TableHead className="text-xs w-10"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {groupProducts.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-white">
                                      <TableCell className="text-sm">
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {product.code}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm font-medium whitespace-nowrap">{product.partNumberAU || '-'}</TableCell>
                                      <TableCell className="text-sm max-w-[300px]" title={product.description || undefined}>
                                        <span className="block truncate">{product.description || '-'}</span>
                                      </TableCell>
                                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{product.customer || '-'}</TableCell>
                                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{product.oem || '-'}</TableCell>
                                      <TableCell className="text-sm text-right font-medium text-green-700">
                                        {product.unitPrice != null ? `$${product.unitPrice.toLocaleString()}` : '-'}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditProduct(product)
                                            }}
                                            title="Edit"
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              navigate(`/products/${product.id}`)
                                            }}
                                            title="View Details"
                                          >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Name *</Label>
              <Input
                id="group-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Sensors, Valves, Pumps"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-desc">Description</Label>
              <Input
                id="group-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreating || isUpdating ? 'Saving...' : editingGroup ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingGroup?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Create/Edit Dialog */}
      <ProductCrudDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        defaultGroupId={productDialogGroupId}
        onSaved={handleProductSaved}
        onDeleted={handleProductDeleted}
      />
    </div>
  )
}
