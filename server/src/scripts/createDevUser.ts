/**
 * 创建开发环境必需的用户
 * 这个脚本会创建 id=84 的系统管理员用户
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDevUser() {
  try {
    console.log('🔧 开始创建开发环境用户...\n');

    // 1. 检查现有用户
    const existingUsers = await prisma.users.findMany({
      select: { id: true, username: true }
    });

    console.log(`📋 当前有 ${existingUsers.length} 个用户\n`);

    // 2. 检查 id=84 是否已存在
    const user84 = await prisma.users.findUnique({ where: { id: 84 } });

    if (user84) {
      console.log('✅ id=84 的用户已存在:', user84.username);
      console.log('   无需重新创建\n');
    } else {
      console.log('📝 创建 id=84 的系统管理员用户...');

      const hashedPassword = await bcrypt.hash('admin123456', 10);

      // 使用原始SQL插入 id=84 的用户
      await prisma.$executeRaw`
        INSERT INTO users (
          id, "cognitoId", username, email, password, "realName",
          phone, position, "employeeId", status,
          "createdAt", "updatedAt"
        ) VALUES (
          84,
          'dev-admin-001',
          'admin',
          'admin@longi.com',
          ${hashedPassword},
          '系统管理员',
          '138****0001',
          '系统管理员',
          'ADMIN001',
          'ACTIVE',
          NOW(),
          NOW()
        )
      `;

      console.log('✅ 系统管理员用户创建成功！\n');
    }

    // 3. 检查普通开发用户是否存在
    const devUser = await prisma.users.findUnique({ where: { username: 'developer' } });

    if (devUser) {
      console.log('✅ 开发用户已存在:', devUser.username);
    } else {
      console.log('📝 创建普通开发用户...');
      const devUserPassword = await bcrypt.hash('dev123', 10);

      await prisma.users.create({
        data: {
          cognitoId: 'dev-user-001',
          username: 'developer',
          email: 'dev@longi.com',
          password: devUserPassword,
          realName: '开发者',
          phone: '138****0002',
          position: '软件工程师',
          employeeId: 'DEV001',
          status: 'ACTIVE'
        }
      });

      console.log('✅ 普通开发用户创建成功！\n');
    }

    // 5. 验证创建结果
    const users = await prisma.users.findMany({
      select: { id: true, username: true, email: true, realName: true },
      orderBy: { id: 'asc' }
    });

    console.log('📋 当前数据库用户列表:\n');
    users.forEach(u => {
      console.log(`  ID: ${u.id.toString().padEnd(4)} | 用户名: ${u.username.padEnd(12)} | 邮箱: ${u.email.padEnd(20)} | 姓名: ${u.realName || 'N/A'}`);
    });

    console.log('\n✅ 开发环境用户创建完成！');
    console.log('\n默认账号密码:');
    console.log('  管理员: admin / admin123456');
    console.log('  开发者: developer / dev123\n');

  } catch (error: any) {
    console.error('❌ 创建失败:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDevUser();
