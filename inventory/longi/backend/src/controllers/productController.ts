import { Request, Response } from 'express'
import { ProductService } from '../services/productService'
import { serialize } from '../utils/bigint'
import { logger } from '../utils/logger'

// ── Field mapping helpers ────────────────────────────────────────────────────

/** Convert Prisma snake_case product to frontend camelCase */
function mapProduct(p: any): any {
  if (!p) return p
  return {
    id: p.id,
    code: p.code,
    codeSeq: p.code_seq,
    partNumberCN: p.part_number_cn,
    partNumberAU: p.part_number_au,
    barcode: p.barcode,
    compatiblemodels: p.compatiblemodels,
    description: p.description,
    descriptionChinese: p.description_chinese,
    asset: p.asset,
    customer: p.customer,
    note: p.note,
    partGroup: p.group?.name ?? p.part_group,
    groupId: p.group_id != null ? Number(p.group_id) : undefined,
    groupName: p.group?.name ?? undefined,
    partLife: p.part_life,
    oem: p.oem,
    // Convert Prisma Decimal to JS number (avoid serialize() turning it into a string)
    purchasePrice: p.purchase_price != null ? parseFloat(String(p.purchase_price)) : undefined,
    unitPrice: p.unit_price != null ? parseFloat(String(p.unit_price)) : undefined,
    imageUrl: p.image_url,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    // include related inventory if present (getById)
    inventory: p.inventory,
  }
}

/** Convert frontend camelCase request body to Prisma snake_case */
function mapRequestToDb(data: any): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  const set = (dbKey: string, val: unknown) => {
    if (val !== undefined) mapped[dbKey] = val
  }
  set('code', data.code)
  set('part_number_cn', data.partNumberCN ?? data.part_number_cn)
  set('part_number_au', data.partNumberAU ?? data.part_number_au)
  set('barcode', data.barcode)
  set('compatiblemodels', data.compatiblemodels)
  set('description', data.description)
  set('description_chinese', data.descriptionChinese ?? data.description_chinese)
  set('asset', data.asset)
  set('customer', data.customer)
  set('note', data.note)
  if (data.groupId != null) mapped['group_id'] = BigInt(data.groupId)
  set('part_life', data.partLife ?? data.part_life)
  set('oem', data.oem)
  set('purchase_price', data.purchasePrice ?? data.purchase_price)
  set('unit_price', data.unitPrice ?? data.unit_price)
  return mapped
}

// ── Controllers ──────────────────────────────────────────────────────────────

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawLimit = parseInt((req.query.limit ?? req.query.pageSize) as string)
    // limit=0 means "return all"; otherwise default 20, max 500
    const limit = rawLimit === 0 ? 0 : Math.min(500, Math.max(1, rawLimit || 20))
    const page = limit === 0 ? 1 : Math.max(1, parseInt(req.query.page as string) || 1)
    const search = (req.query.search as string) || ''
    const groupId = (req.query.groupId ?? req.query.group_id) as string | undefined
    const customer = req.query.customer as string | undefined
    const region = req.query.region as string | undefined
    const sortField = req.query.sortField as string | undefined
    const sortDir = req.query.sortDir as string | undefined

    const { products, total } = await ProductService.getAll(page, limit, search, groupId, customer, region, sortField, sortDir)
    res.json({ success: true, data: serialize(products.map(mapProduct)), total, page, limit })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch products'
    logger.error('getProducts failed', { error: msg })
    res.status(500).json({ success: false, message: msg })
  }
}

export const getProductCustomers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const customers = await ProductService.getDistinctCustomers()
    res.json({ success: true, data: customers })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch customers'
    res.status(500).json({ success: false, message: msg })
  }
}

export const getProductStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await ProductService.getStats()
    res.json({ success: true, data: stats })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch stats'
    res.status(500).json({ success: false, message: msg })
  }
}

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductService.getById(req.params.id as string)
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' })
      return
    }
    res.json({ success: true, data: serialize(mapProduct(product)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch product'
    res.status(500).json({ success: false, message: msg })
  }
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const dbData = mapRequestToDb(req.body)
    const products = await ProductService.create(dbData)
    res.status(201).json({ success: true, data: serialize(products.map(mapProduct)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create product'
    res.status(400).json({ success: false, message: msg })
  }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const dbData = mapRequestToDb(req.body)
    const product = await ProductService.update(req.params.id as string, dbData)
    res.json({ success: true, data: serialize(mapProduct(product)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update product'
    res.status(400).json({ success: false, message: msg })
  }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    await ProductService.delete(req.params.id as string)
    res.json({ success: true, message: 'Product deleted' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete product'
    res.status(400).json({ success: false, message: msg })
  }
}
