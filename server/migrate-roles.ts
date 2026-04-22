import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateRoles() {
  console.log('🔄 Starting role migration...')

  try {
    // First, let's see what roles we currently have
    const currentRoles = await prisma.$queryRaw<Array<{ role: string, count: bigint }>>`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `

    console.log('📊 Current role distribution:')
    currentRoles.forEach(({ role, count }) => {
      console.log(`  ${role}: ${count}`)
    })

    // Update TEAM_LEAD -> MANAGER
    const teamLeadCount = await prisma.$executeRaw`
      UPDATE users
      SET role = 'MANAGER'
      WHERE role = 'TEAM_LEAD'
    `
    console.log(`✅ Updated ${teamLeadCount} TEAM_LEAD users to MANAGER`)

    // Update PROJECT_MANAGER -> MANAGER
    const projectManagerCount = await prisma.$executeRaw`
      UPDATE users
      SET role = 'MANAGER'
      WHERE role = 'PROJECT_MANAGER'
    `
    console.log(`✅ Updated ${projectManagerCount} PROJECT_MANAGER users to MANAGER`)

    // Update SUPER_ADMIN -> ADMIN
    const superAdminCount = await prisma.$executeRaw`
      UPDATE users
      SET role = 'ADMIN'
      WHERE role = 'SUPER_ADMIN'
    `
    console.log(`✅ Updated ${superAdminCount} SUPER_ADMIN users to ADMIN`)

    // Verify the migration
    const newRoles = await prisma.$queryRaw<Array<{ role: string, count: bigint }>>`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `

    console.log('\n📊 New role distribution:')
    newRoles.forEach(({ role, count }) => {
      console.log(`  ${role}: ${count}`)
    })

    console.log('\n✨ Role migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateRoles()
