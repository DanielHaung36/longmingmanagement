#!/usr/bin/env ts-node
/**
 * 将所有任务的优先级更新为MEDIUM
 * 仅更新priority为LOW或NULL的任务
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n开始更新任务优先级...\n');

    // 统计需要更新的任务数量
    const tasksToUpdate = await prisma.tasks.count({
      where: {
        priority: 'LOW'
      }
    });

    console.log(`找到 ${tasksToUpdate} 个优先级为 LOW 的任务`);

    if (tasksToUpdate === 0) {
      console.log('没有需要更新的任务');
      return;
    }

    // 更新所有优先级为LOW的任务
    const result = await prisma.tasks.updateMany({
      where: {
        priority: 'LOW'
      },
      data: {
        priority: 'MEDIUM'
      }
    });

    console.log(`✅ 成功更新 ${result.count} 个任务的优先级为 MEDIUM`);

    // 验证更新结果
    const verifyCount = await prisma.tasks.count({
      where: {
        priority: 'MEDIUM'
      }
    });

    console.log(`\n当前数据库中优先级为 MEDIUM 的任务总数: ${verifyCount}`);

  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
