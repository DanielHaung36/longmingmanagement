import { Request, Response } from 'express'
import { ProductGroupService } from '../services/productGroupService'
import { serialize } from '../utils/bigint'
import { logger } from '../utils/logger'

function mapGroup(g: any): any {
  if (!g) return g
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    productCount: g._count?.products ?? 0,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }
}

export const getProductGroups = async (_req: Request, res: Response): Promise<void> => {
  try {
    const groups = await ProductGroupService.getAll()
    res.json({ success: true, data: serialize(groups.map(mapGroup)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch product groups'
    logger.error('getProductGroups failed', { error: msg })
    res.status(500).json({ success: false, message: msg })
  }
}

export const createProductGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'name is required' })
      return
    }
    const group = await ProductGroupService.create(name.trim(), description?.trim())
    res.status(201).json({ success: true, data: serialize(mapGroup(group)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create product group'
    // Prisma unique constraint error
    if ((error as any)?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'A group with this name already exists' })
      return
    }
    logger.error('createProductGroup failed', { error: msg })
    res.status(400).json({ success: false, message: msg })
  }
}

export const updateProductGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body
    const data: { name?: string; description?: string } = {}
    if (name !== undefined) data.name = name.trim()
    if (description !== undefined) data.description = description?.trim() || null
    const group = await ProductGroupService.update(req.params.id as string, data)
    res.json({ success: true, data: serialize(mapGroup(group)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update product group'
    if ((error as any)?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'A group with this name already exists' })
      return
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Product group not found' })
      return
    }
    logger.error('updateProductGroup failed', { error: msg })
    res.status(400).json({ success: false, message: msg })
  }
}

export const deleteProductGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    await ProductGroupService.delete(req.params.id as string)
    res.json({ success: true, message: 'Product group deleted' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete product group'
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Product group not found' })
      return
    }
    logger.error('deleteProductGroup failed', { error: msg })
    res.status(400).json({ success: false, message: msg })
  }
}
