import prisma from '../utils/prisma'

export class InventoryService {
  static async getAll(page: number, limit: number, search: string, warehouseId?: string) {
    const where: Record<string, unknown> = {}
    if (warehouseId) where.warehouse_id = BigInt(warehouseId)
    if (search) {
      where.product = {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: { product: true, warehouse: true },
        ...(limit > 0 ? { skip: (page - 1) * limit, take: limit } : {}),
        orderBy: { id: 'desc' },
      }),
      prisma.inventory.count({ where }),
    ])

    return { items, total }
  }

  static async stockIn(inventoryId: string, quantity: number, operator: string, note?: string) {
    return prisma.$transaction(async (tx) => {
      const txRecord = await tx.inventory_transaction.create({
        data: {
          inventory_id: BigInt(inventoryId),
          tx_type: 'IN',
          quantity: BigInt(quantity),
          operator,
          created_at: new Date(),
          note: note || null,
        },
      })

      const inv = await tx.inventory.update({
        where: { id: BigInt(inventoryId) },
        data: {
          actual_qty: { increment: BigInt(quantity) },
          operator,
          operation_time: new Date(),
          updated_at: new Date(),
        },
        include: { product: true, warehouse: true },
      })

      return { transaction: txRecord, inventory: inv }
    })
  }

  static async stockOut(inventoryId: string, quantity: number, operator: string, note?: string) {
    return prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findUnique({ where: { id: BigInt(inventoryId) } })
      if (!inv) throw new Error('Inventory record not found')

      const available = (inv.actual_qty || BigInt(0)) - (inv.locked_qty || BigInt(0))
      if (available < BigInt(quantity)) {
        throw new Error(`Insufficient stock. Available: ${available}, requested: ${quantity}`)
      }

      const txRecord = await tx.inventory_transaction.create({
        data: {
          inventory_id: BigInt(inventoryId),
          tx_type: 'OUT',
          quantity: BigInt(quantity),
          operator,
          created_at: new Date(),
          note: note || null,
        },
      })

      const updated = await tx.inventory.update({
        where: { id: BigInt(inventoryId) },
        data: {
          actual_qty: { decrement: BigInt(quantity) },
          operator,
          operation_time: new Date(),
          updated_at: new Date(),
        },
        include: { product: true, warehouse: true },
      })

      return { transaction: txRecord, inventory: updated }
    })
  }

  static async getTransactions(inventoryId: string) {
    return prisma.inventory_transaction.findMany({
      where: { inventory_id: BigInt(inventoryId) },
      orderBy: { created_at: 'desc' },
    })
  }

  static async getById(id: string) {
    return prisma.inventory.findUnique({
      where: { id: BigInt(id) },
      include: { product: true, warehouse: true },
    })
  }

  static async update(id: string, data: {
    productID?: string
    warehouseID?: number | string
    siteLocation?: string
    actualQty?: number | string
    lockedQty?: number | string
    operator?: string
    operationTime?: string
  }) {
    return prisma.inventory.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.productID   && { product_id: data.productID }),
        ...(data.warehouseID != null && { warehouse_id: BigInt(data.warehouseID) }),
        ...(data.siteLocation !== undefined && { site_location: data.siteLocation }),
        ...(data.actualQty   != null && { actual_qty: BigInt(Number(data.actualQty)) }),
        ...(data.lockedQty   != null && { locked_qty: BigInt(Number(data.lockedQty)) }),
        ...(data.operator    && { operator: data.operator }),
        ...(data.operationTime && { operation_time: new Date(data.operationTime) }),
        updated_at: new Date(),
      },
      include: { product: true, warehouse: true },
    })
  }

  static async getTodayStats() {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [inbound, outbound] = await Promise.all([
      prisma.inventory_transaction.count({
        where: {
          tx_type: 'IN',
          created_at: { gte: todayStart },
        },
      }),
      prisma.inventory_transaction.count({
        where: {
          tx_type: { in: ['OUT', 'SALE'] },
          created_at: { gte: todayStart },
        },
      }),
    ])

    return { inbound, outbound }
  }
}
