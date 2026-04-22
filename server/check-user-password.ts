import { PrismaClient } from './generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkUserPassword() {
  try {
    const email = 'jasin.smith.h@gmail.com';

    const user = await prisma.users.findFirst({
      where: { username: email }
    });

    if (!user) {
      console.log(`❌ 用户不存在: ${email}`);
      return;
    }

    console.log('\n=== 用户信息 ===');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Real Name: ${user.realName}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    console.log(`Password Hash (前20字符): ${user.password?.substring(0, 20)}...`);
    console.log(`Password Hash 长度: ${user.password?.length}`);

    // 测试常见密码
    const testPasswords = [
      ' ',
      'longi@123',
      'admin',
      'password',
      '123456'
    ];

    console.log('\n=== 密码测试 ===');
    for (const pwd of testPasswords) {
      try {
        const match = await bcrypt.compare(pwd, user.password || '');
        console.log(`${pwd}: ${match ? '✅ 匹配' : '❌ 不匹配'}`);
      } catch (error) {
        console.log(`${pwd}: ❌ 验证出错`);
      }
    }

    // 生成新的密码hash用于重置
    console.log('\n=== 生成新密码 Hash ===');
    const newPassword = 'Longi@123';
    const newHash = await bcrypt.hash(newPassword, 10);
    console.log(`新密码: ${newPassword}`);
    console.log(`新Hash: ${newHash}`);

    console.log('\n💡 如果需要重置密码，运行：');
    console.log(`   npx ts-node reset-user-password.ts`);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPassword();
