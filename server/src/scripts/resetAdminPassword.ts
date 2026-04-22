import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // 设置新密码
    const newPassword = 'Longi@123'; // 可以修改为你想要的密码

    console.log('🔐 正在重置管理员密码...\n');

    // 加密密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新管理员用户
    const user = await prisma.users.update({
      where: { username: 'admin' },
      data: { password: hashedPassword }
    });

    console.log('✅ 管理员密码重置成功！\n');
    console.log('📋 管理员账号信息：');
    console.log(`   用户名: ${user.username}`);
    console.log(`   邮箱: ${user.email}`);
    console.log(`   密码: ${newPassword}`);
    console.log(`   角色: ${user.role}`);
    console.log(`   状态: ${user.status}\n`);

  } catch (error) {
    console.error('❌ 重置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
