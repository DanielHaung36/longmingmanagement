/**
 * One-time migration: populate product_group table from existing part_group string values
 * and update product.group_id foreign keys.
 *
 * Usage: npx ts-node src/scripts/migratePartGroups.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Find all unique non-empty part_group values
  const products = await prisma.product.findMany({
    where: { part_group: { not: null } },
    select: { part_group: true },
  })
  const uniqueGroups = [...new Set(products.map(p => p.part_group).filter(Boolean))] as string[]
  console.log('Unique part_group values:', uniqueGroups)

  // 2. Create product_group records (skip if already exists)
  for (const name of uniqueGroups) {
    await prisma.product_group.upsert({
      where: { name },
      update: {},
      create: { name, created_at: new Date(), updated_at: new Date() },
    })
    console.log(`  ✓ product_group "${name}" ensured`)
  }

  // 3. Fetch all product_group records to build name→id map
  const groups = await prisma.product_group.findMany()
  const nameToId = new Map(groups.map(g => [g.name, g.id]))

  // 4. Update products to set group_id based on their part_group
  let updated = 0
  for (const [name, groupId] of nameToId) {
    const result = await prisma.product.updateMany({
      where: { part_group: name, group_id: null },
      data: { group_id: groupId },
    })
    updated += result.count
    console.log(`  ✓ ${result.count} products linked to group "${name}" (id=${groupId})`)
  }

  console.log(`\nDone. ${uniqueGroups.length} groups created/verified, ${updated} products updated.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
