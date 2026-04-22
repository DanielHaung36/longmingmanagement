#!/usr/bin/env ts-node

/**
 * 完整重置脚本 - 生产/开发环境分离版本
 *
 * 核心流程：
 * 1. 备份现有数据库数据
 * 2. 清空数据库
 * 3. 扫描真实 OneDrive 文件结构
 * 4. 读取真实 Excel 数据
 * 5. 创建开发环境文件夹镜像（可选）
 * 6. 验证文件夹结构（可选）
 * 7. 导入数据到数据库
 * 8. 生成完整报告
 *
 * 使用方法:
 *   npm run reset:complete                    # 开发模式
 *   npm run reset:complete:prod               # 生产模式
 *   npm run reset:complete:skip               # 跳过文件操作
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// 预先加载环境变量，优先 server/.env，其次默认路径
const envFilePath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envFilePath });
dotenv.config(); // 再尝试默认位置，避免漏掉其它环境文件
import { PrismaClient } from '@prisma/client';
import { scanOneDrive, generateScanReport } from './scanOneDrive';
import { readExcelData, generateExcelReadReport } from './readExcelData';
import { mirrorFolderStructure, verifyFolderStructure } from './mirrorFolderStructure';
import { importToDatabase, generateImportReport } from './importToDatabase';
import { updateUsersData } from './updateUsers';

// 命令行参数
const args = process.argv.slice(2);
const isProduction = args.includes('--production') || process.env.NODE_ENV === 'production';
const skipFolders = args.includes('--skip-folders');
const skipBackup = args.includes('--skip-backup');

// 环境变量
const env = {
  ONEDRIVE_ROOT: process.env.ONEDRIVE_ROOT || 'C:/Users/longi/OneDrive - Longi Magnet Australia Pty ltd/Documents - Longi Australia/03 Project Management',
  ONEDRIVE_PROJECT_ROOT: process.env.ONEDRIVE_PROJECT_ROOT || 'C:/Users/longi/OneDrive - Longi Magnet Australia Pty ltd/Documents - Longi Australia/09 Project Management Backend Test/Client',
  LOCAL_PROJECT_ROOT: process.env.LOCAL_PROJECT_ROOT || 'C:/Longi/ProjectData/Projects/Client',
  TEMPLATE_ROOT: process.env.TEMPLATE_ROOT || 'C:/Users/longi/OneDrive - Longi Magnet Australia Pty ltd/Documents - Longi Australia/05 Templates/Project Management Template',
  EXCEL_ONEDRIVE_PATH: process.env.EXCEL_ONEDRIVE_PATH || 'C:/Users/longi/OneDrive - Longi Magnet Australia Pty ltd/Documents - Longi Australia/03 Project Management/LJA Job Register Rev3.xlsm',
};

// 备份目录
const backupDir = path.join(__dirname, '../../backups');


/**
 * 创建备份目录
 */
function ensureBackupDir(): void {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

/**
 * 备份数据库数据为 JSON
 */
async function backupDatabaseData(prisma: PrismaClient): Promise<string> {
  console.log('\n📦 正在备份数据库数据...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  try {
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        projects: await prisma.projects.findMany(),
        tasks: await prisma.tasks.findMany(),
        taskFiles: await prisma.task_files.findMany(),
        comments: await prisma.comments.findMany(),
        users: await prisma.users.findMany(),
      },
    };

    // ✨ 修改开始：添加 replacer 函数处理 BigInt ✨
    const jsonString = JSON.stringify(backup, (key, value) => {
      // 如果是 BigInt，转换为字符串
      if (typeof value === 'bigint') {
        return value.toString(); 
      }
      return value;
    }, 2);

    fs.writeFileSync(backupFile, jsonString);
    console.log(`   ✓ 备份文件: ${backupFile}`);
    console.log(`   ✓ Projects: ${backup.data.projects.length}`);
    console.log(`   ✓ Tasks: ${backup.data.tasks.length}`);
    console.log(`   ✓ Files: ${backup.data.taskFiles.length}`);

    return backupFile;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ 备份失败: ${errorMsg}`);
    throw error;
  }
}

/**
 * 清空数据库
 */
async function clearDatabase(prisma: PrismaClient): Promise<void> {
  console.log('\n🗑️  正在清空数据库...');

  try {
    // 按依赖顺序删除
    await prisma.task_files.deleteMany({});
    console.log('   ✓ 清空 task_files');

    await prisma.task_approvals.deleteMany({});
    console.log('   ✓ 清空 task_approvals');

    await prisma.comments.deleteMany({});
    console.log('   ✓ 清空 comments');

    await prisma.tasks.deleteMany({});
    console.log('   ✓ 清空 tasks');

    await prisma.projects.deleteMany({});
    console.log('   ✓ 清空 projects');

    // 清空通知表（引用 users 表）
    await prisma.notifications.deleteMany({});
    console.log('   ✓ 清空 notifications');

    // 清空用户表（从 Excel 重新导入）
    await prisma.users.deleteMany({});
    console.log('   ✓ 清空 users');
    console.log('   ✓ 数据库清空完成\n');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`   ❌ 清空失败: ${errorMsg}`);
    throw error;
  }
}

/**
 * 确保目录存在
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║           矿业项目管理系统 - 完整重置              ║');
    console.log('╚════════════════════════════════════════════════════╝');

    console.log(`\n🌍 环境检测:`);
    console.log(`   • NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
    console.log(`   • --production 参数: ${args.includes('--production') ? '是' : '否'}`);
    console.log(`   • 最终判断: ${isProduction ? '✅ 生产环境' : '⚙️  开发环境'}`);

    console.log(`\n⚙️  配置:`);
    console.log(`   • 模式: ${isProduction ? '生产' : '开发'}`);
    console.log(`   • 跳过文件操作: ${skipFolders ? '是' : '否'}`);
    console.log(`   • 跳过数据备份: ${skipBackup ? '是' : '否'}`);

    // 1. 备份数据库
    ensureBackupDir();
    let backupFile = '';
    if (!skipBackup) {
      backupFile = await backupDatabaseData(prisma);
    } else {
      console.log('\n⊘ 跳过数据备份');
    }

    // 2. 清空数据库
    await clearDatabase(prisma);

    // 3. 扫描 OneDrive
    console.log('\n📁 正在扫描 OneDrive 文件结构...');
    const clientPath = path.join(env.ONEDRIVE_ROOT, 'Client');
    const scanResult = await scanOneDrive(clientPath);
    console.log(generateScanReport(scanResult));

    // 4. 读取 Excel 数据
    console.log('\n📊 正在读取 Excel 数据...');
    const excelResult = await readExcelData(env.EXCEL_ONEDRIVE_PATH, 'Job Data');
    console.log(generateExcelReadReport(excelResult));

    // 5. 创建文件夹镜像
    if (!skipFolders) {
      if (!isProduction) {
        // 开发环境：创建空文件夹和空文件到 LOCAL_PROJECT_ROOT 和 ONEDRIVE_PROJECT_ROOT
        console.log('\n🔄 [开发环境] 正在创建空文件夹镜像...');
        ensureDirectoryExists(env.ONEDRIVE_PROJECT_ROOT);
        ensureDirectoryExists(env.LOCAL_PROJECT_ROOT);

        for (const client of scanResult.clients) {
          const sourceClientPath = path.join(env.ONEDRIVE_ROOT, 'Client', client.name);

          // 复制到 ONEDRIVE_PROJECT_ROOT (空文件)
          const targetOneDrivePath = path.join(env.ONEDRIVE_PROJECT_ROOT, client.name);
          const oneDriveMirrorStats = await mirrorFolderStructure(sourceClientPath, targetOneDrivePath, true);

          // 复制到 LOCAL_PROJECT_ROOT (空文件)
          const targetLocalPath = path.join(env.LOCAL_PROJECT_ROOT, client.name);
          const localMirrorStats = await mirrorFolderStructure(sourceClientPath, targetLocalPath, true);

          if (oneDriveMirrorStats.errors.length > 0 || localMirrorStats.errors.length > 0) {
            console.error(`   ⚠️  Mirror errors for ${client.name}`);
          }
        }
      } else {
        // 生产环境：复制完整文件到 LOCAL_PROJECT_ROOT
        console.log('\n🔄 [生产环境] 正在复制完整文件到本地...');
        ensureDirectoryExists(env.LOCAL_PROJECT_ROOT);

        for (const client of scanResult.clients) {
          const sourceClientPath = path.join(env.ONEDRIVE_ROOT, 'Client', client.name);
          const targetLocalPath = path.join(env.LOCAL_PROJECT_ROOT, client.name);

          // 复制完整文件到本地
          const mirrorStats = await mirrorFolderStructure(sourceClientPath, targetLocalPath, false);

          if (mirrorStats.errors.length > 0) {
            console.error(`   ⚠️  Mirror errors for ${client.name}:`);
            for (const error of mirrorStats.errors) {
              console.error(`      - ${error}`);
            }
          }
        }
        console.log('   ⊘ 生产环境不创建 ONEDRIVE_PROJECT_ROOT 镜像（使用真实OneDrive）');
      }
    } else {
      console.log('\n⊘ 跳过文件夹镜像');
    }

    // 6. 验证文件夹结构（开发模式）
    if (!isProduction && !skipFolders) {
      console.log('\n✅ 正在验证文件夹结构...');

      for (const client of scanResult.clients) {
        const sourceClientPath = path.join(env.ONEDRIVE_ROOT, 'Client', client.name);
        const targetClientPath = path.join(env.ONEDRIVE_PROJECT_ROOT, client.name);

        const verifyStats = await verifyFolderStructure(sourceClientPath, targetClientPath);

        if (verifyStats.errors.length === 0 && verifyStats.missingFolders.length === 0) {
          console.log(`   ✓ ${client.name}: 验证通过`);
        } else {
          console.log(`   ⚠️  ${client.name}: 验证发现问题`);
        }
      }
    }

    // 7. 导入数据到数据库
    console.log('\n💾 正在导入数据到数据库...');

    const importConfig = {
      useProduction: isProduction,
      oneDriveRoot: path.join(env.ONEDRIVE_ROOT, 'Client'),
      oneDriveProjectRoot: env.ONEDRIVE_PROJECT_ROOT,
      localProjectRoot: env.LOCAL_PROJECT_ROOT,
    };

    const importResult = await importToDatabase(
      prisma,
      scanResult,
      excelResult.tasksByCode,
      importConfig
    );

    console.log(generateImportReport(importResult));

    // 8. 更新用户数据
    console.log('\n👥 正在更新用户数据...');
    try {
      await updateUsersData(prisma, true); // 静默模式，减少输出
      console.log('   ✓ 用户数据更新完成');
    } catch (error) {
      console.error('   ⚠️  用户数据更新失败:', error instanceof Error ? error.message : String(error));
    }

    // 9. 最终统计
    console.log('\n📈 最终数据库统计:');
    const projectCount = await prisma.projects.count();
    const taskCount = await prisma.tasks.count();
    const userCount = await prisma.users.count();

    console.log(`   • Projects: ${projectCount}`);
    console.log(`   • Tasks: ${taskCount}`);
    console.log(`   • Users: ${userCount}`);

    // 按业务类型统计 Tasks
    const tasks = await prisma.tasks.findMany({ select: { taskCode: true } });
    const typeStats = new Map<string, number>();
    for (const task of tasks) {
      const type = task.taskCode.substring(0, 2);
      typeStats.set(type, (typeStats.get(type) || 0) + 1);
    }

    console.log('\n   按业务类型分类:');
    for (const [type, count] of Array.from(typeStats.entries()).sort()) {
      console.log(`      • ${type}: ${count}`);
    }

    // 完成
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║                    ✅ 重置完成                    ║');
    if (backupFile) {
      console.log(`║  备份文件: ${path.basename(backupFile).padEnd(41)}║`);
    }
    console.log('╚════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ 错误:', error);
    process.exit(1);
  } finally {
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  }
}

// 运行主函数
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
