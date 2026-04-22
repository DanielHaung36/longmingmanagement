#!/usr/bin/env ts-node
"use strict";
/**
 * 修复任务优先级脚本
 *
 * 功能：
 * 1. 给所有没有优先级的任务设置默认优先级 MEDIUM
 * 2. 给所有没有优先级的项目设置默认优先级 MEDIUM
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        console.log('\n🔧 开始修复优先级...\n');
        // 1. 修复任务优先级
        console.log('1. 修复任务优先级...');
        const tasksWithoutPriority = await prisma.tasks.findMany({
            where: {
                OR: [
                    { priority: null },
                    { priority: 'LOW' } // 也把LOW改成MEDIUM
                ]
            }
        });
        if (tasksWithoutPriority.length > 0) {
            await prisma.tasks.updateMany({
                where: {
                    OR: [
                        { priority: null },
                        { priority: 'LOW' }
                    ]
                },
                data: {
                    priority: 'MEDIUM'
                }
            });
            console.log(`   ✅ 修复了 ${tasksWithoutPriority.length} 个任务的优先级为 MEDIUM`);
        }
        else {
            console.log('   ℹ️  所有任务优先级已设置');
        }
        // 2. 修复项目优先级
        console.log('\n2. 修复项目优先级...');
        const projectsWithoutPriority = await prisma.projects.findMany({
            where: {
                OR: [
                    { priority: null },
                    { priority: 'LOW' }
                ]
            }
        });
        if (projectsWithoutPriority.length > 0) {
            await prisma.projects.updateMany({
                where: {
                    OR: [
                        { priority: null },
                        { priority: 'LOW' }
                    ]
                },
                data: {
                    priority: 'MEDIUM'
                }
            });
            console.log(`   ✅ 修复了 ${projectsWithoutPriority.length} 个项目的优先级为 MEDIUM`);
        }
        else {
            console.log('   ℹ️  所有项目优先级已设置');
        }
        // 3. 统计信息
        console.log('\n3. 优先级统计:');
        const taskPriorityStats = await prisma.tasks.groupBy({
            by: ['priority'],
            _count: true
        });
        console.log('   任务优先级:');
        for (const stat of taskPriorityStats) {
            console.log(`      • ${stat.priority}: ${stat._count}`);
        }
        const projectPriorityStats = await prisma.projects.groupBy({
            by: ['priority'],
            _count: true
        });
        console.log('\n   项目优先级:');
        for (const stat of projectPriorityStats) {
            console.log(`      • ${stat.priority}: ${stat._count}`);
        }
        console.log('\n✅ 优先级修复完成！\n');
    }
    catch (error) {
        console.error('\n❌ 错误:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=fixTaskPriority.js.map