import { Request, Response } from 'express'
import { WarehouseService } from '../services/warehouseService'
import { serialize } from '../utils/bigint'

function mapWarehouse(w: any): any {
  if (!w) return w
  return {
    id: w.id,
    name: w.name,
    location: w.location,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  }
}

export const getWarehouses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const warehouses = await WarehouseService.getAll()
    res.json({ success: true, data: serialize(warehouses.map(mapWarehouse)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch warehouses'
    res.status(500).json({ success: false, message: msg })
  }
}

export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location } = req.body
    if (!name) {
      res.status(400).json({ success: false, message: 'name is required' })
      return
    }
    const warehouse = await WarehouseService.create(name, location)
    res.status(201).json({ success: true, data: serialize(mapWarehouse(warehouse)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create warehouse'
    res.status(400).json({ success: false, message: msg })
  }
}

export const updateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location } = req.body
    const warehouse = await WarehouseService.update(req.params.id as string, { name, location })
    res.json({ success: true, data: serialize(mapWarehouse(warehouse)) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update warehouse'
    res.status(400).json({ success: false, message: msg })
  }
}

export const deleteWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    await WarehouseService.delete(req.params.id as string)
    res.json({ success: true, message: 'Warehouse deleted' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete warehouse'
    res.status(400).json({ success: false, message: msg })
  }
}
