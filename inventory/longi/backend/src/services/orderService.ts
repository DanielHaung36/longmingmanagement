import prisma from '../utils/prisma'

export class OrderService {
  static async getAll(page: number, limit: number, search: string, status?: string) {
    const where: Record<string, unknown> = { deleted_at: null }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { order_number: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      prisma.orders.count({ where }),
    ])

    return { orders, total }
  }

  static async getById(id: string) {
    return prisma.orders.findFirst({
      where: { id: BigInt(id), deleted_at: null },
    })
  }

  static async create(data: {
    order_number: string
    customer_name: string
    order_date?: string
    total_amount: number | string
    status?: string
  }) {
    return prisma.orders.create({
      data: {
        order_number: data.order_number,
        customer_name: data.customer_name,
        order_date: data.order_date ? new Date(data.order_date) : new Date(),
        total_amount: data.total_amount,
        status: data.status || '待处理',
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
  }

  static async update(id: string, data: Record<string, unknown>) {
    const { id: _id, created_at: _ca, deleted_at: _da, ...rest } = data as any
    return prisma.orders.update({
      where: { id: BigInt(id) },
      data: { ...rest, updated_at: new Date() },
    })
  }

  static async softDelete(id: string) {
    return prisma.orders.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date(), updated_at: new Date() },
    })
  }
}
