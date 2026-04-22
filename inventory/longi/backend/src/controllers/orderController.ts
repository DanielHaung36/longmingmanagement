import { Request, Response } from 'express'
import { OrderService } from '../services/orderService'
import { serialize } from '../utils/bigint'

// ── Field mapping helpers ────────────────────────────────────────────────────

/** Convert Prisma snake_case order to frontend camelCase */
function mapOrder(o: any): any {
  if (!o) return o
  return {
    id: String(o.id),                        // BigInt → string
    orderNumber: o.order_number,
    customerName: o.customer_name,
    orderDate: o.order_date ? new Date(o.order_date).toISOString() : null,
    status: o.status,
    totalAmount: o.total_amount != null ? parseFloat(String(o.total_amount)) : 0,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }
}

/** Convert frontend camelCase request body to Prisma snake_case */
function mapOrderRequest(data: any): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  const set = (dbKey: string, val: unknown) => { if (val !== undefined) mapped[dbKey] = val }
  set('order_number',  data.orderNumber  ?? data.order_number)
  set('customer_name', data.customerName ?? data.customer_name)
  set('order_date',    data.orderDate    ?? data.order_date)
  set('total_amount',  data.totalAmount  ?? data.total_amount)
  set('status',        data.status)
  return mapped
}

// ── Controllers ──────────────────────────────────────────────────────────────

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const status = req.query.status as string | undefined
    const search = (req.query.search as string) || ''

    const { orders, total } = await OrderService.getAll(page, limit, search, status)
    res.json({ success: true, data: orders.map(mapOrder), total, page, limit })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch orders'
    res.status(500).json({ success: false, message: msg })
  }
}

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await OrderService.getById(req.params.id as string)
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' })
      return
    }
    res.json({ success: true, data: mapOrder(order) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch order'
    res.status(500).json({ success: false, message: msg })
  }
}

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = mapOrderRequest(req.body)
    const { order_number, customer_name, total_amount } = db
    if (!order_number || !customer_name || total_amount === undefined) {
      res.status(400).json({ success: false, message: 'orderNumber, customerName, totalAmount required' })
      return
    }

    const order = await OrderService.create(db as any)
    res.status(201).json({ success: true, data: mapOrder(order) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create order'
    res.status(400).json({ success: false, message: msg })
  }
}

export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = mapOrderRequest(req.body)
    const order = await OrderService.update(req.params.id as string, db as any)
    res.json({ success: true, data: mapOrder(order) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update order'
    res.status(400).json({ success: false, message: msg })
  }
}

export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    await OrderService.softDelete(req.params.id as string)
    res.json({ success: true, message: 'Order deleted' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete order'
    res.status(400).json({ success: false, message: msg })
  }
}
