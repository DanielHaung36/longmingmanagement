import prisma from '../utils/prisma'

export class WarehouseService {
  static async getAll() {
    return prisma.warehouses.findMany({ orderBy: { id: 'asc' } })
  }

  static async create(name: string, location?: string) {
    return prisma.warehouses.create({
      data: { name, location, created_at: new Date(), updated_at: new Date() },
    })
  }

  static async update(id: string, data: { name?: string; location?: string }) {
    return prisma.warehouses.update({
      where: { id: BigInt(id) },
      data: { ...data, updated_at: new Date() },
    })
  }

  static async delete(id: string) {
    return prisma.warehouses.delete({ where: { id: BigInt(id) } })
  }
}
