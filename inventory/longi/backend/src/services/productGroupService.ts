import prisma from '../utils/prisma'

export class ProductGroupService {
  static async getAll() {
    return prisma.product_group.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { products: true } } },
    })
  }

  static async getById(id: string) {
    return prisma.product_group.findUnique({
      where: { id: BigInt(id) },
      include: { _count: { select: { products: true } } },
    })
  }

  static async create(name: string, description?: string) {
    return prisma.product_group.create({
      data: { name, description, created_at: new Date(), updated_at: new Date() },
    })
  }

  static async update(id: string, data: { name?: string; description?: string }) {
    return prisma.product_group.update({
      where: { id: BigInt(id) },
      data: { ...data, updated_at: new Date() },
    })
  }

  static async delete(id: string) {
    const count = await prisma.product.count({ where: { group_id: BigInt(id) } })
    if (count > 0) {
      throw new Error(`Cannot delete group: ${count} product(s) still reference it`)
    }
    return prisma.product_group.delete({ where: { id: BigInt(id) } })
  }
}
