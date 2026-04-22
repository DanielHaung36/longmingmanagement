#!/usr/bin/env ts-node
"use strict";
/**
 * seedMineZones.ts
 *
 * Loads default mine site records from prisma/seedData/mineZone.json
 * and upserts them into the database. Safe to run multiple times.
 *
 * Usage:
 *   npm run seed:mine-zones
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const shouldPrune = process.argv.includes('--prune');
        const seedPath = path.resolve(__dirname, '../../prisma/seedData/mineZone.json');
        const raw = fs.readFileSync(seedPath, 'utf-8');
        const records = JSON.parse(raw);
        if (!Array.isArray(records) || records.length === 0) {
            console.warn('⚠️  No mine zone records found in seed file.');
            return;
        }
        console.log(`🚜 Seeding ${records.length} mine zones...`);
        const codesSeeded = [];
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
    }
    catch (error) {
        console.error('❌ Failed to seed mine zones:', error.message || error);
        process.exitCode = 1;
    }
}
main();
//# sourceMappingURL=seedMineZones.js.map