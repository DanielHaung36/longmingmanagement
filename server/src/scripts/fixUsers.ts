#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('\n🔧 修复用户状态...\n');

    // 激活 Adela
    await prisma.users.updateMany({
      where: { email: 'Adela@ljmagnet.com' },
      data: { status: 'ACTIVE' }
    });
    console.log('✅ 激活 Adela@ljmagnet.com');

    // 激活 Daniel
    await prisma.users.updateMany({
      where: { email: 'Daniel.huang@ljmagnet.com.au' },
      data: { status: 'ACTIVE' }
    });
    console.log('✅ 激活 Daniel.huang@ljmagnet.com.au');

    // 显示最终用户列表
    console.log('\n📋 最终激活用户列表:');
    const activeUsers = await prisma.users.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' }
    });

    activeUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.username}) - ${user.role}`);
    });

    console.log('\n✅ 修复完成！\n');

  } catch (error) {
    console.error('\n❌ 错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
