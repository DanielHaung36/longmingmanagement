import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const backupDir = path.join(__dirname, 'backups');

async function main() {
  console.log('\n📦 开始备份当前数据库数据...\n');

  // 创建备份目录
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `pre-migration-backup-${timestamp}.json`);

  try {
    const backup = {
      timestamp: new Date().toISOString(),
      description: '迁移前备份',
      data: {
        projects: await prisma.projects.findMany(),
        tasks: await prisma.tasks.findMany(),
        taskFiles: await prisma.task_files.findMany(),
        comments: await prisma.comments.findMany(),
        users: await prisma.users.findMany(),
      },
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log('✅ 备份完成！\n');
    console.log(`📄 备份文件: ${backupFile}`);
    console.log(`\n📊 备份内容统计:`);
    console.log(`  • Projects: ${backup.data.projects.length}`);
    console.log(`  • Tasks: ${backup.data.tasks.length}`);
    console.log(`  • Files: ${backup.data.taskFiles.length}`);
    console.log(`  • Comments: ${backup.data.comments.length}`);
    console.log(`  • Users: ${backup.data.users.length}\n`);

  } catch (error) {
    console.error('❌ 备份失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
