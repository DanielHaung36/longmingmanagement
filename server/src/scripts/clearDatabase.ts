/**
 * 清空数据库
 * 删除所有项目、任务、文件等数据，保留用户和系统配置
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  开始清空数据库...\n');

  try {
    // 按照外键依赖顺序删除
    console.log('   删除 task_files...');
    await prisma.task_files.deleteMany({});

    console.log('   删除 task_dependencies...');
    await prisma.task_dependencies.deleteMany({});

    console.log('   删除 comments...');
    await prisma.comments.deleteMany({});

    console.log('   删除 tasks...');
    await prisma.tasks.deleteMany({});

    console.log('   删除 project_files...');
    await prisma.project_files.deleteMany({});

    console.log('   删除 project_budgets...');
    await prisma.project_budgets.deleteMany({});

    console.log('   删除 project_quotations...');
    await prisma.project_quotations.deleteMany({});

    console.log('   删除 project_mining_info...');
    await prisma.project_mining_info.deleteMany({});

    console.log('   删除 project_members...');
    await prisma.project_members.deleteMany({});

    console.log('   删除 project_teams...');
    await prisma.project_teams.deleteMany({});

    console.log('   删除 testwork_projects...');
    await prisma.testwork_projects.deleteMany({});

    console.log('   删除 sync_logs...');
    await prisma.sync_logs.deleteMany({});

    console.log('   删除 workflow_instances...');
    await prisma.workflow_instances.deleteMany({});

    console.log('   删除 chat_rooms...');
    await prisma.chat_rooms.deleteMany({});

    console.log('   删除 projects...');
    await prisma.projects.deleteMany({});

    console.log('\n✅ 数据库清空完成！\n');

    // 统计
    const stats = await prisma.$transaction([
      prisma.projects.count(),
      prisma.tasks.count(),
      prisma.users.count(),
    ]);

    console.log('📊 当前数据库状态:');
    console.log(`   - Projects: ${stats[0]}`);
    console.log(`   - Tasks: ${stats[1]}`);
    console.log(`   - Users: ${stats[2]}\n`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 清空数据库失败:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

clearDatabase();
