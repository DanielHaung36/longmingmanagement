import { Request, Response } from 'express'
import prisma from '../utils/prisma'

const MODULE_META: Record<string, { icon: string; description: string }> = {
  inventory: { icon: '📦', description: 'Inventory management permissions' },
  sales:     { icon: '🛒', description: 'Sales order management permissions' },
  quote:     { icon: '📄', description: 'Quote management permissions' },
  finance:   { icon: '💰', description: 'Finance management permissions' },
  user:      { icon: '👥', description: 'User management permissions' },
  system:    { icon: '⚙️',  description: 'System configuration permissions' },
}

export const getPermissions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await prisma.permission.findMany({
      select: { id: true, name: true, label: true, description: true },
      orderBy: { id: 'asc' },
    })
    res.json({ success: true, data: permissions })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch permissions'
    res.status(500).json({ success: false, message: msg })
  }
}

export const getPermissionModules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await prisma.permission.findMany({
      select: { id: true, name: true, label: true, description: true },
      orderBy: { id: 'asc' },
    })

    const grouped: Record<string, typeof permissions> = {}
    for (const p of permissions) {
      const module = p.name.split('.')[0]
      if (!grouped[module]) grouped[module] = []
      grouped[module].push(p)
    }

    const modules = Object.entries(grouped).map(([module, perms]) => ({
      module,
      icon: MODULE_META[module]?.icon ?? '🔒',
      description: MODULE_META[module]?.description ?? `${module} permissions`,
      permissions: perms,
    }))

    res.json({ success: true, data: modules })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch permission modules'
    res.status(500).json({ success: false, message: msg })
  }
}
