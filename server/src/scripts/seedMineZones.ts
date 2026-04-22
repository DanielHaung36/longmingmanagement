#!/usr/bin/env ts-node

/**
 * seedMineZones.ts
 *
 * Loads default mine site records from prisma/seedData/mineZone.json
 * and upserts them into the database. Safe to run multiple times.
 *
 * Usage:
 *   npm run seed:mine-zones
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const prisma = new PrismaClient();

  try {
    const shouldPrune = process.argv.includes('--prune');
    const seedPath = path.resolve(__dirname, '../../prisma/seedData/mineZone.json');
    const raw = fs.readFileSync(seedPath, 'utf-8');
    const records: Array<{
      code: string;
      name: string;
      location?: string;
      description?: string;
      isActive?: boolean;
    }> = JSON.parse(raw);

    if (!Array.isArray(records) || records.length === 0) {
      console.warn('⚠️  No mine zone records found in seed file.');
      return;
    }

    console.log(`🚜 Seeding ${records.length} mine zones...`);

    const codesSeeded: string[] = [];

    for (const zone of records) {
      if (!zone.code || !zone.name) {
        console.warn('   ⊘ Skipping invalid record (missing code or name):', zone);
        continue;
      }

      codesSeeded.push(zone.code);

      await prisma.mine_zones.upsert({
        where: { code: zone.code },
        update: {
          name: zone.name,
          location: zone.location,
          description: zone.description,
          isActive: zone.isActive ?? true,
        },
        create: {
          code: zone.code,
          name: zone.name,
          location: zone.location,
          description: zone.description,
          isActive: zone.isActive ?? true,
        },
      });

      console.log(`   ✓ ${zone.code} - ${zone.name}`);
    }

    if (shouldPrune) {
      const deleted = await prisma.mine_zones.deleteMany({
        where: {
          code: {
            notIn: codesSeeded,
          },
        },
      });

      console.log(`🧹 Pruned ${deleted.count} mine zones not present in seed file.`);
    }

    console.log('✅ Mine zone seeding complete.');
  } catch (error: any) {
    console.error('❌ Failed to seed mine zones:', error.message || error);
    process.exitCode = 1;
  }
}

main();
