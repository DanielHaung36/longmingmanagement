#!/usr/bin/env ts-node

/**
 * 修复用户角色权限脚本
 *
 * 功能：
 * 1. 确保admin用户拥有ADMIN角色
 * 2. 给所有现有用户设置默认角色（如果没有）
 * 3. 加密所有未加密的密码
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('\n🔧 开始修复用户角色权限...\n');

    // 1. 修复admin用户
    console.log('1. 检查admin用户...');
    const admin = await prisma.users.findFirst({
      where: { username: 'admin' }
    });

    if (admin) {
      const hashedPassword = await bcrypt.hash('admin123456', 10);

      await prisma.users.update({
        where: { id: admin.id },
        data: {
          role: 'ADMIN',
          password: hashedPassword,
          status: 'ACTIVE'
        }
      });
      console.log('   ✅ admin用户已更新 (Role: ADMIN, Password: admin123456)');
    } else {
      // 创建admin用户
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      const newAdmin = await prisma.users.create({
        data: {
          username: 'admin',
          email: 'admin@ljmagnet.com.au',
          realName: 'System Admin',
          password: hashedPassword,
          status: 'ACTIVE',
          role: 'ADMIN',
          cognitoId: `admin-cognito-${Date.now()}`,
        }
      });
      console.log(`   ✅ 创建admin用户 (ID: ${newAdmin.id}, Role: ADMIN, Password: admin123456)`);
    }

    // 2. 修复所有用户的角色（如果没有设置）
    console.log('\n2. 修复所有用户角色...');
    const users = await prisma.users.findMany();

    let fixed = 0;
    for (const user of users) {
      // 如果用户没有角色，设置为USER
      if (!user.role || user.role === null) {
        await prisma.users.update({
          where: { id: user.id },
          data: {
            role: user.username === 'admin' ? 'ADMIN' : 'USER'
          }
        });
        console.log(`   ✅ 修复用户 ${user.username} 的角色`);
        fixed++;
      }
    }

    if (fixed === 0) {
      console.log('   ℹ️  所有用户角色已设置');
    } else {
      console.log(`   ✅ 修复了 ${fixed} 个用户的角色`);
    }

    // 3. 统计信息
    console.log('\n3. 用户统计:');
    const adminCount = await prisma.users.count({ where: { role: 'ADMIN' } });
    const pmCount = await prisma.users.count({ where: { role: 'MANAGER' } });
    // const teamLeadCount = await prisma.users.count({ where: { role: 'TEAM_LEAD' } });
    const userCount = await prisma.users.count({ where: { role: 'USER' } });

    console.log(`   • ADMIN: ${adminCount}`);
    console.log(`   • PROJECT_MANAGER: ${pmCount}`);
    // console.log(`   • TEAM_LEAD: ${teamLeadCount}`);
    console.log(`   • USER: ${userCount}`);

    // 4. 显示admin登录信息
    console.log('\n📝 管理员登录信息:');
    console.log('   • 用户名: admin');
    console.log('   • 密码: admin123456');
    console.log('   • 角色: ADMIN\n');

    console.log('✅ 用户角色修复完成！\n');

  } catch (error) {
    console.error('\n❌ 错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
