import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Image as ImageIcon, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImageMutation,
  type Product,
} from "./productsApi"
import { useGetProductGroupsQuery, useCreateProductGroupMutation } from "../product-groups/productGroupsApi"
import { Plus } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────

export interface ProductCrudDialogProps {
  /** Control dialog visibility from the parent */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass a Product to edit; null/undefined = create mode */
  product?: Product | null
  /** Pre-fill groupId when creating from a group context */
  defaultGroupId?: number
  /** Called after a successful create / update / delete */
  onSaved?: (product: Product) => void
  onDeleted?: (id: string) => void
}

// ── Validation ─────────────────────────────────────────────────────

function validateForm(data: Partial<Product>): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.description?.trim()) errors.description = "Description is required"
  if (data.purchasePrice !== undefined && data.purchasePrice < 0) errors.purchasePrice = "Purchase price cannot be negative"
  if (data.unitPrice !== undefined && data.unitPrice < 0) errors.unitPrice = "Unit price cannot be negative"
  if (data.purchasePrice && data.unitPrice && data.unitPrice < data.purchasePrice) {
    errors.unitPrice = "Warning: Unit price is lower than purchase price"
  }
  return errors
}

// ── Component ──────────────────────────────────────────────────────

export default function ProductCrudDialog({
  open,
  onOpenChange,
  product,
  defaultGroupId,
  onSaved,
  onDeleted,
}: ProductCrudDialogProps) {
  const { toast } = useToast()
  const { data: productGroups = [] } = useGetProductGroupsQuery()
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const [uploadProductImage, { isLoading: isUploading }] = useUploadProductImageMutation()

  const [createGroup] = useCreateProductGroupMutation()
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  const isEdit = !!product

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (open) {
      if (product) {
        setFormData(product)
        if (product.imageUrl) {
          setImagePreview(import.meta.env.VITE_API_URL?.replace('/api', '') + product.imageUrl)
        } else {
          setImagePreview(null)
        }
      } else {
        setFormData(defaultGroupId != null ? { groupId: defaultGroupId } : {})
        setImagePreview(null)
      }
      setFormErrors({})
      setImageFile(null)
    }
  }, [open, product, defaultGroupId])

  // ── Image handling ─────────────────────────────────────────────

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload JPEG, PNG, GIF, or WebP images only", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image size should be less than 5MB", variant: "destructive" })
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  // ── Inline group create ─────────────────────────────────────────

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      const group = await createGroup({ name: newGroupName.trim() }).unwrap()
      setFormData(prev => ({ ...prev, groupId: group.id }))
      toast({ title: "Success", description: `Group "${newGroupName.trim()}" created` })
      setNewGroupName("")
      setAddingGroup(false)
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to create group", variant: "destructive" })
    }
  }

  // ── Save ───────────────────────────────────────────────────────

  const handleSave = async () => {
    const errors = validateForm(formData)
    const blockingErrors = Object.entries(errors).filter(([, msg]) => !msg.startsWith("Warning:"))
    if (blockingErrors.length > 0) {
      setFormErrors(errors)
      toast({ title: "Validation Error", description: "Please fix the errors before saving", variant: "destructive" })
      return
    }
    if (Object.keys(errors).length > 0) setFormErrors(errors)

    try {
      let savedProduct: Product
      let productId: string | null = null

      if (isEdit && product) {
        savedProduct = await updateProduct({ id: product.id, ...formData }).unwrap()
        productId = savedProduct.id
        toast({ title: "Update Successful", description: `Product ${savedProduct.partNumberAU || formData.partNumberCN} has been updated` })
      } else {
        const created = await createProduct(formData as Product).unwrap()
        const auProduct = created.products.find(p => p.partNumberAU?.startsWith('LGA'))
        savedProduct = auProduct || created.products[0]
        productId = savedProduct?.id || null
        toast({ title: "Create Successful", description: "New product has been created" })
      }

      // Upload image if selected
      if (imageFile && productId) {
        try {
          await uploadProductImage({ id: productId, file: imageFile }).unwrap()
          toast({ title: "Image Uploaded", description: "Product image has been uploaded successfully" })
        } catch (imgErr: any) {
          toast({ title: "Image Upload Failed", description: imgErr?.data?.error || "Failed to upload image", variant: "destructive" })
        }
      }

      onSaved?.(savedProduct)
      onOpenChange(false)
    } catch (err: any) {
      const errorMessage = err?.data?.error || err?.message || "Failed to save product. Please try again."
      toast({ title: "Save Failed", description: errorMessage, variant: "destructive" })
    }
  }

  // ── Delete ─────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!product) return
    try {
      await deleteProduct(product.id).unwrap()
      toast({ title: "Deleted", description: `Product ${product.partNumberAU || product.description} deleted` })
      setDeleteDialogOpen(false)
      onDeleted?.(product.id)
      onOpenChange(false)
    } catch (err: any) {
      const status = err?.status
      const msg = status === 403
        ? "Permission denied. Please contact an administrator to delete."
        : err?.data?.message || err?.data?.error || "Failed to delete product"
      toast({ title: "Delete Failed", description: msg, variant: "destructive" })
      setDeleteDialogOpen(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  const isBusy = isCreating || isUpdating

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Product" : "Create New Product"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Update the product information below." : "Fill in the details to create a new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="pd-partNumberAU">Part Number (AU)</Label>
                <Input id="pd-partNumberAU" disabled value={formData.partNumberAU || ""} placeholder="Auto-generated" />
              </div>

              <div>
                <Label htmlFor="pd-partNumberCN">Part Number (CN)</Label>
                <Input
                  id="pd-partNumberCN"
                  value={formData.partNumberCN || ""}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, partNumberCN: e.target.value }))
                    if (formErrors.partNumberCN) setFormErrors(prev => ({ ...prev, partNumberCN: "" }))
                  }}
                  placeholder="60904070006"
                  className={formErrors.partNumberCN ? "border-red-500" : ""}
                />
                {formErrors.partNumberCN && <p className="text-sm text-red-500 mt-1">{formErrors.partNumberCN}</p>}
              </div>

              <div>
                <Label htmlFor="pd-description">Description <span className="text-red-500">*</span></Label>
                <Input
                  id="pd-description"
                  value={formData.description || ""}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                    if (formErrors.description) setFormErrors(prev => ({ ...prev, description: "" }))
                  }}
                  className={formErrors.description ? "border-red-500" : ""}
                />
                {formErrors.description && <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>}
              </div>

              <div>
                <Label htmlFor="pd-descriptionChinese">Chinese Description</Label>
                <Input
                  id="pd-descriptionChinese"
                  value={formData.descriptionChinese || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionChinese: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="pd-compatiblemodels">Compatible Models</Label>
                <Input
                  id="pd-compatiblemodels"
                  value={formData.compatiblemodels || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, compatiblemodels: e.target.value }))}
                  placeholder="e.g. LGS-3000, LGS-2000"
                />
              </div>

              <div>
                <Label htmlFor="pd-asset">Asset</Label>
                <Input
                  id="pd-asset"
                  value={formData.asset || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, asset: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="pd-customer">Customer</Label>
                <Input
                  id="pd-customer"
                  value={formData.customer || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="pd-groupId">Part Group</Label>
                <div className="flex gap-1">
                  <Select
                    value={formData.groupId != null ? String(formData.groupId) : ""}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: Number(value) }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select part group" />
                    </SelectTrigger>
                    <SelectContent>
                      {productGroups.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="New Group"
                    onClick={() => { setNewGroupName(""); setAddingGroup(true) }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="pd-partLife">Part Life</Label>
                <Input
                  id="pd-partLife"
                  value={formData.partLife || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, partLife: e.target.value }))}
                  placeholder="1 year"
                />
              </div>

              <div>
                <Label htmlFor="pd-oem">OEM</Label>
                <Input
                  id="pd-oem"
                  value={formData.oem || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, oem: e.target.value }))}
                  placeholder="FEEJOY"
                />
              </div>

              <div>
                <Label htmlFor="pd-purchasePrice">Purchase Price</Label>
                <Input
                  id="pd-purchasePrice"
                  type="number"
                  value={formData.purchasePrice ?? ""}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))
                    if (formErrors.purchasePrice) setFormErrors(prev => ({ ...prev, purchasePrice: "" }))
                  }}
                  placeholder="2500"
                  className={formErrors.purchasePrice ? "border-red-500" : ""}
                />
                {formErrors.purchasePrice && <p className="text-sm text-red-500 mt-1">{formErrors.purchasePrice}</p>}
              </div>

              <div>
                <Label htmlFor="pd-unitPrice">Unit Price</Label>
                <Input
                  id="pd-unitPrice"
                  type="number"
                  value={formData.unitPrice ?? ""}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))
                    if (formErrors.unitPrice) setFormErrors(prev => ({ ...prev, unitPrice: "" }))
                  }}
                  placeholder="3000"
                  className={formErrors.unitPrice?.startsWith("Warning") ? "border-yellow-500" : formErrors.unitPrice ? "border-red-500" : ""}
                />
                {formErrors.unitPrice && (
                  <p className={`text-sm mt-1 ${formErrors.unitPrice.startsWith("Warning") ? "text-yellow-600" : "text-red-500"}`}>
                    {formErrors.unitPrice}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="pd-note">Note</Label>
                <Textarea
                  id="pd-note"
                  value={formData.note || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Product Image Upload */}
          <div className="mt-4 p-4 border rounded-lg bg-slate-50">
            <Label className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4" />
              Product Image
            </Label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Product preview" className="w-32 h-32 object-cover rounded-lg border" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={clearImage}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-white">
                  <ImageIcon className="h-8 w-8 text-slate-300" />
                </div>
              )}
              <div className="flex-1">
                <Input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange} className="cursor-pointer" />
                <p className="text-xs text-slate-500 mt-1">Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)</p>
                {isUploading && <p className="text-xs text-blue-600 mt-1">Uploading image...</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              {isEdit && (
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isBusy}>
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700" disabled={isBusy}>
                {isBusy ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product &quot;{product?.description}&quot;.
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

      {/* New Group Dialog */}
      <Dialog open={addingGroup} onOpenChange={setAddingGroup}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Product Group</DialogTitle>
          </DialogHeader>
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name, e.g. Sensors"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && newGroupName.trim()) handleCreateGroup() }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingGroup(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="bg-blue-600 hover:bg-blue-700">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
