import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'jasin.smith.h@gmail.com';
    const newPassword = 'Longi@123';

    console.log('\n🔄 正在重置密码...');
    console.log(`用户: ${email}`);
    console.log(`新密码: ${newPassword}`);

    // 生成新密码hash
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 更新数据库
    const user = await prisma.users.update({
      where: { username: email },
      data: { password: passwordHash }
    });

    console.log('\n✅ 密码重置成功！');
    console.log(`用户ID: ${user.id}`);
    console.log(`用户名: ${user.username}`);
    console.log(`邮箱: ${user.email}`);
    console.log(`\n现在可以使用以下信息登录：`);
    console.log(`   邮箱/用户名: ${email}`);
    console.log(`   密码: ${newPassword}`);

  } catch (error: any) {
    console.error('❌ 重置密码失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
