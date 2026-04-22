#!/usr/bin/env ts-node
"use strict";
/**
 * 密码重置脚本
 *
 * 使用方法:
 * npx tsx src/scripts/resetPassword.ts <用户名或邮箱>
 * 或者: node dist/scripts/resetPassword.js <用户名或邮箱>
 *
 * 示例:
 * npx tsx src/scripts/resetPassword.ts weijunwang
 * npx tsx src/scripts/resetPassword.ts weijunwang@ljmagnet.com
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DEFAULT_PASSWORD = 'Longi@123';
async function resetPassword(identifier) {
    const prisma = new client_1.PrismaClient();
    try {
        console.log(`\n🔐 正在重置密码...\n`);
        // 查找用户（通过用户名或邮箱）
        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier },
                ]
            }
        });
        if (!user) {
            console.error(`❌ 错误: 找不到用户 "${identifier}"`);
            console.log('\n💡 提示: 请检查用户名或邮箱是否正确');
            process.exit(1);
        }
        // 加密新密码
        const hashedPassword = await bcryptjs_1.default.hash(DEFAULT_PASSWORD, 10);
        // 更新密码
        await prisma.users.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                status: 'ACTIVE' // 确保用户是激活状态
            }
        });
        console.log(`✅ 密码重置成功！\n`);
        console.log(`📋 用户信息:`);
        console.log(`   • ID: ${user.id}`);
        console.log(`   • 用户名: ${user.username}`);
        console.log(`   • 邮箱: ${user.email}`);
        console.log(`   • 真实姓名: ${user.realName || 'N/A'}`);
        console.log(`   • 角色: ${user.role}`);
        console.log(`   • 状态: ACTIVE`);
        console.log(`\n🔑 新密码: ${DEFAULT_PASSWORD}`);
        console.log(`\n💡 用户现在可以使用此密码登录了！\n`);
    }
    catch (error) {
        console.error('\n❌ 重置密码失败:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
// 获取命令行参数
const identifier = process.argv[2];
if (!identifier) {
    console.error('\n❌ 错误: 请提供用户名或邮箱\n');
    console.log('使用方法:');
    console.log('  npx tsx src/scripts/resetPassword.ts <用户名或邮箱>');
    console.log('  node dist/scripts/resetPassword.js <用户名或邮箱>\n');
    console.log('示例:');
    console.log('  npx tsx src/scripts/resetPassword.ts weijunwang');
    console.log('  npx tsx src/scripts/resetPassword.ts weijunwang@ljmagnet.com\n');
    process.exit(1);
}
resetPassword(identifier);
//# sourceMappingURL=resetPassword.js.map