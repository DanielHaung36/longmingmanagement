import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 当前数据库统计:\n');
  
  const projects = await prisma.projects.count();
  const tasks = await prisma.tasks.count();
  const users = await prisma.users.count();
  const comments = await prisma.comments.count();
  const files = await prisma.task_files.count();

  console.log(`  • Projects: ${projects}`);
  console.log(`  • Tasks: ${tasks}`);
  console.log(`  • Users: ${users}`);
  console.log(`  • Comments: ${comments}`);
  console.log(`  • Files: ${files}`);
  
  // 按业务类型统计
  const allTasks = await prisma.tasks.findMany({ select: { taskCode: true } });
  const tasksByType = new Map<string, number>();
  
  for (const task of allTasks) {
    const type = task.taskCode.substring(0, 2);
    tasksByType.set(type, (tasksByType.get(type) || 0) + 1);
  }

  if (tasksByType.size > 0) {
    console.log('\n  按业务类型分类:');
    for (const [type, count] of Array.from(tasksByType.entries()).sort()) {
      console.log(`    • ${type}: ${count}`);
    }
  }

  console.log('\n');
  await prisma.$disconnect();
}

main().catch(console.error);
