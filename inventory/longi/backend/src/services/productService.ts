import prisma from '../utils/prisma'
import crypto from 'crypto'

export class ProductService {
  // Allowed sort fields: frontend camelCase → DB column
  private static readonly SORT_MAP: Record<string, string> = {
    partNumberAU: 'part_number_au',
    partNumberCN: 'part_number_cn',
    description: 'description',
    customer: 'customer',
    unitPrice: 'unit_price',
    purchasePrice: 'purchase_price',
    updatedAt: 'updated_at',
    code: 'code',
  }

  static async getAll(
    page: number,
    limit: number,
    search: string,
    groupId?: string,
    customer?: string,
    region?: string,
    sortField?: string,
    sortDir?: string,
  ) {
    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { description_chinese: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { part_number_au: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (groupId) where.group_id = BigInt(groupId)
    if (customer) where.customer = customer
    if (region === 'australia') where.code = { startsWith: 'LGA' }
    if (region === 'china') where.code = { startsWith: 'LGC' }

    // Dynamic sort
    const dbCol = ProductService.SORT_MAP[sortField ?? ''] ?? 'code_seq'
    const dir = sortDir === 'asc' ? 'asc' : 'desc'
    const orderBy = { [dbCol]: dir }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { group: true },
        ...(limit > 0 ? { skip: (page - 1) * limit, take: limit } : {}),
        orderBy,
      }),
      prisma.product.count({ where }),
    ])

    return { products, total }
  }

  static async getDistinctCustomers(): Promise<string[]> {
    const result = await prisma.product.findMany({
      where: { customer: { not: '' } },
      select: { customer: true },
      distinct: ['customer'],
      orderBy: { customer: 'asc' },
    })
    return result.map(r => r.customer!).filter(Boolean)
  }

  static async getStats() {
    const [totalProducts, totalValueResult, customers] = await Promise.all([
      prisma.product.count(),
      prisma.product.aggregate({ _sum: { unit_price: true } }),
      prisma.product.findMany({
        where: { customer: { not: '' } },
        select: { customer: true },
        distinct: ['customer'],
      }),
    ])
    return {
      totalProducts,
      totalValue: parseFloat(String(totalValueResult._sum.unit_price || 0)),
      uniqueCustomers: customers.length,
    }
  }

  static async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { group: true, inventory: { include: { warehouse: true } } },
    })
  }

  /**
   * Create a product pair: LGC (China) + LGA (Australia),
   * each with an inventory record in its respective warehouse.
   * Returns both products.
   */
  static async create(data: Record<string, unknown>) {
    const now = new Date()
    const shared = {
      part_number_cn: (data.part_number_cn as string | undefined) || undefined,
      barcode: data.barcode as string | undefined,
      compatiblemodels: data.compatiblemodels as string | undefined,
      description: data.description as string | undefined,
      description_chinese: data.description_chinese as string | undefined,
      asset: data.asset as string | undefined,
      customer: data.customer as string | undefined,
      note: data.note as string | undefined,
      group_id: data.group_id != null ? BigInt(data.group_id as number) : undefined,
      part_life: data.part_life as string | undefined,
      oem: data.oem as string | undefined,
      purchase_price: data.purchase_price as number | undefined,
      unit_price: data.unit_price as number | undefined,
      created_at: now,
      updated_at: now,
    }

    // 1. Create two products with temporary codes to get code_seq
    const lgcId = crypto.randomUUID()
    const lgaId = crypto.randomUUID()
    const [lgcRaw, lgaRaw] = await prisma.$transaction([
      prisma.product.create({ data: { id: lgcId, code: '__pending__', ...shared } }),
      prisma.product.create({ data: { id: lgaId, code: '__pending__', ...shared } }),
    ])

    // 2. Generate codes from autoincrement code_seq
    const lgcCode = `LGC${String(lgcRaw.code_seq).padStart(7, '0')}`
    const lgaCode = `LGA${String(lgaRaw.code_seq).padStart(7, '0')}`
    const partNumberCn = shared.part_number_cn || lgcCode

    // 3. Update codes + create inventory records in one transaction
    // China warehouse = 1, Australia warehouse = 2
    const [lgcProduct, lgaProduct] = await prisma.$transaction([
      prisma.product.update({
        where: { id: lgcId },
        data: { code: lgcCode, part_number_cn: partNumberCn, part_number_au: lgcCode },
        include: { group: true },
      }),
      prisma.product.update({
        where: { id: lgaId },
        data: { code: lgaCode, part_number_cn: partNumberCn, part_number_au: lgaCode },
        include: { group: true },
      }),
      prisma.inventory.create({
        data: {
          product_id: lgcId, warehouse_id: BigInt(1),
          actual_qty: BigInt(0), locked_qty: BigInt(0),
          operator: 'system', operation_time: now, created_at: now, updated_at: now,
        },
      }),
      prisma.inventory.create({
        data: {
          product_id: lgaId, warehouse_id: BigInt(2),
          actual_qty: BigInt(0), locked_qty: BigInt(0),
          operator: 'system', operation_time: now, created_at: now, updated_at: now,
        },
      }),
    ])

    return [lgcProduct, lgaProduct]
  }

  static async update(id: string, data: Record<string, unknown>) {
    // Strip immutable fields
    const { id: _id, code_seq: _seq, created_at: _ca, ...updateData } = data
    return prisma.product.update({
      where: { id },
      data: { ...updateData, updated_at: new Date() },
      include: { group: true },
    })
  }

  static async delete(id: string) {
    // Block deletion if any warehouse has non-zero stock
    const nonZero = await prisma.inventory.findFirst({
      where: { product_id: id, actual_qty: { gt: 0 } },
    })
    if (nonZero) {
      throw new Error('该产品仍有库存，无法删除。请先清零库存后再删除。')
    }

    // Delete related inventory_transactions and inventory records first
    const inventoryRecords = await prisma.inventory.findMany({
      where: { product_id: id },
      select: { id: true },
    })
    if (inventoryRecords.length > 0) {
      const inventoryIds = inventoryRecords.map(r => r.id)
      await prisma.inventory_transaction.deleteMany({
        where: { inventory_id: { in: inventoryIds } },
      })
      await prisma.inventory.deleteMany({
        where: { product_id: id },
      })
    }
    return prisma.product.delete({ where: { id } })
  }
}
