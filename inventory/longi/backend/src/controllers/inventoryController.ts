import { Request, Response } from 'express'
import { InventoryService } from '../services/inventoryService'
import { serialize } from '../utils/bigint'
import { logger } from '../utils/logger'

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawLimit = parseInt(req.query.limit as string)
    // limit=0 means "return all"; otherwise default 20, max 500
    const limit = rawLimit === 0 ? 0 : Math.min(500, Math.max(1, rawLimit || 20))
    const page = limit === 0 ? 1 : Math.max(1, parseInt(req.query.page as string) || 1)
    const search = (req.query.search as string) || ''
    const warehouseId = req.query.warehouse_id as string | undefined

    const { items, total } = await InventoryService.getAll(page, limit, search, warehouseId)
    res.json({ success: true, data: serialize(items), total, page, limit })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch inventory'
    logger.error('getInventory failed', { error: msg })
    res.status(500).json({ success: false, message: msg })
  }
}

export const stockIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventory_id, quantity, note } = req.body
    if (!inventory_id || !quantity || quantity <= 0) {
      res.status(400).json({ success: false, message: 'inventory_id and positive quantity required' })
      return
    }

    const operator = req.user?.username || 'system'
    const result = await InventoryService.stockIn(String(inventory_id), quantity, operator, note)
    res.json({ success: true, data: serialize(result) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Stock in failed'
    res.status(400).json({ success: false, message: msg })
  }
}

export const stockOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inventory_id, quantity, note } = req.body
    if (!inventory_id || !quantity || quantity <= 0) {
      res.status(400).json({ success: false, message: 'inventory_id and positive quantity required' })
      return
    }

    const operator = req.user?.username || 'system'
    const result = await InventoryService.stockOut(String(inventory_id), quantity, operator, note)
    res.json({ success: true, data: serialize(result) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Stock out failed'
    res.status(400).json({ success: false, message: msg })
  }
}

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const transactions = await InventoryService.getTransactions(req.params.id as string)
    res.json({ success: true, data: serialize(transactions) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch transactions'
    res.status(500).json({ success: false, message: msg })
  }
}

export const getInventoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await InventoryService.getById(req.params.id as string)
    if (!item) {
      res.status(404).json({ success: false, message: 'Inventory record not found' })
      return
    }
    res.json({ success: true, data: serialize(item) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch inventory'
    res.status(500).json({ success: false, message: msg })
  }
}

export const updateInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productID, warehouseID, siteLocation, actualQty, lockedQty, operator, operationTime } = req.body
    const updateData: Record<string, unknown> = {}
    if (productID !== undefined) updateData.productID = productID
    if (warehouseID !== undefined) updateData.warehouseID = warehouseID
    if (siteLocation !== undefined) updateData.siteLocation = siteLocation
    if (actualQty !== undefined) updateData.actualQty = actualQty
    if (lockedQty !== undefined) updateData.lockedQty = lockedQty
    if (operator !== undefined) updateData.operator = operator
    if (operationTime !== undefined) updateData.operationTime = operationTime
    const item = await InventoryService.update(req.params.id as string, updateData)
    res.json({ success: true, data: serialize(item) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update inventory'
    logger.error('updateInventory failed', { error: msg })
    res.status(400).json({ success: false, message: msg })
  }
}

export const getTodayStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await InventoryService.getTodayStats()
    res.json({ success: true, data: stats })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch today stats'
    logger.error('getTodayStats failed', { error: msg })
    res.status(500).json({ success: false, message: msg })
  }
}
