#!/usr/bin/env ts-node
"use strict";
/**
 * 更新用户数据脚本
 *
 * 功能：
 * 1. 更新现有用户的邮箱
 * 2. 添加新用户
 * 3. 禁用不在列表中的用户
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUsersData = updateUsersData;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// 最终用户列表
const finalUsers = [
    { email: 'hill@ljmagnet.com', username: 'hill', realName: 'Hill Wang', role: 'USER' },
    { email: 'Adela@ljmagnet.com', username: 'adela', realName: 'Adela Liang', role: 'USER' },
    { email: 'weijunwang@ljmagnet.com', username: 'weijunwang', realName: 'Weijun Wang', role: 'MANAGER' },
    { email: 'wubiaoweng@ljmagnet.com', username: 'wubiaoweng', realName: 'Wubiao Weng', role: 'MANAGER' },
    { email: 'lucyding@ljmagnet.com', username: 'lucyding', realName: 'Lucy Ding', role: 'USER' },
    { email: 'Daniel.huang@ljmagnet.com.au', username: 'danielhuang', realName: 'Daniel Huang', role: 'USER' },
    { email: 'terrance@ljmagnet.com', username: 'terrance', realName: 'Terrance Zhao', role: 'USER' },
    { email: 'lionellu@ljmagnet.com.au', username: 'lionellu', realName: 'Lionel Lu', role: 'USER' },
    { email: 'LucaLiu@ljmagnet.com.au', username: 'lucaliu', realName: 'Luca Liu', role: 'USER' },
];
/**
 * 更新用户数据的主逻辑
 * @param prisma PrismaClient实例
 * @param silent 静默模式，减少输出
 */
async function updateUsersData(prisma, silent = false) {
    if (!silent) {
        console.log('\n🔧 开始更新用户数据...\n');
    }
    // 获取所有现有用户
    const existingUsers = await prisma.users.findMany();
    if (!silent) {
        console.log(`📊 当前数据库中有 ${existingUsers.length} 个用户\n`);
        console.log('1️⃣ 更新现有用户...');
    }
    // hill@ljmagnet.com (从 hillwang@ljmagnet.com 更新)
    const hillUser = await prisma.users.findFirst({
        where: { OR: [{ email: 'hillwang@ljmagnet.com' }, { username: 'hillwang' }] }
    });
    if (hillUser) {
        await prisma.users.update({
            where: { id: hillUser.id },
            data: {
                email: 'hill@ljmagnet.com',
                username: 'hill',
                realName: 'Hill Wang',
                role: 'USER',
                status: 'ACTIVE'
            }
        });
        if (!silent)
            console.log('   ✅ 更新 hill@ljmagnet.com');
    }
    // Adela@ljmagnet.com (从 adelaliang@ljmagnet.com 更新)
    const adelaUser = await prisma.users.findFirst({
        where: { OR: [{ email: 'adelaliang@ljmagnet.com' }, { username: 'adelaliang' }] }
    });
    if (adelaUser) {
        await prisma.users.update({
            where: { id: adelaUser.id },
            data: {
                email: 'Adela@ljmagnet.com',
                username: 'adela',
                realName: 'Adela Liang',
                role: 'USER',
                status: 'ACTIVE'
            }
        });
        if (!silent)
            console.log('   ✅ 更新 Adela@ljmagnet.com');
    }
    // terrance@ljmagnet.com (从 terrancezhao@ljmagnet.com 更新)
    const terranceUser = await prisma.users.findFirst({
        where: { OR: [{ email: 'terrancezhao@ljmagnet.com' }, { username: 'terrancezhao' }] }
    });
    if (terranceUser) {
        await prisma.users.update({
            where: { id: terranceUser.id },
            data: {
                email: 'terrance@ljmagnet.com',
                username: 'terrance',
                realName: 'Terrance Zhao',
                role: 'USER',
                status: 'ACTIVE'
            }
        });
        if (!silent)
            console.log('   ✅ 更新 terrance@ljmagnet.com');
    }
    // 2. 添加新用户
    if (!silent)
        console.log('\n2️⃣ 添加新用户...');
    const defaultPassword = await bcryptjs_1.default.hash('Longi@123', 10);
    const newUsers = [
        { email: 'lucyding@ljmagnet.com', username: 'lucyding', realName: 'Lucy Ding' },
        { email: 'Daniel.huang@ljmagnet.com.au', username: 'danielhuang', realName: 'Daniel Huang' },
        { email: 'lionellu@ljmagnet.com.au', username: 'lionellu', realName: 'Lionel Lu' },
        { email: 'LucaLiu@ljmagnet.com.au', username: 'lucaliu', realName: 'Luca Liu' },
    ];
    for (const newUser of newUsers) {
        const exists = await prisma.users.findFirst({
            where: { OR: [{ email: newUser.email }, { username: newUser.username }] }
        });
        if (!exists) {
            await prisma.users.create({
                data: {
                    username: newUser.username,
                    email: newUser.email,
                    realName: newUser.realName,
                    password: defaultPassword,
                    status: 'ACTIVE',
                    role: 'USER',
                    cognitoId: `${newUser.username}-cognito-${Date.now()}`,
                }
            });
            if (!silent)
                console.log(`   ✅ 创建新用户: ${newUser.email}`);
        }
        else {
            if (!silent)
                console.log(`   ℹ️  用户已存在: ${newUser.email}`);
        }
    }
    // 3. 禁用不在列表中的用户（除了admin）
    if (!silent)
        console.log('\n3️⃣ 处理不在列表中的用户...');
    const finalEmails = finalUsers.map(u => u.email.toLowerCase());
    const allActiveUsers = await prisma.users.findMany({
        where: {
            AND: [
                { username: { not: 'admin' } },
                { status: 'ACTIVE' }
            ]
        }
    });
    // 手动过滤，不区分大小写
    const usersToDisable = allActiveUsers.filter(user => !finalEmails.includes(user.email.toLowerCase()) &&
        user.email.toLowerCase() !== 'admin@ljmagnet.com' &&
        user.email.toLowerCase() !== 'admin@ljmagnet.com.au');
    for (const user of usersToDisable) {
        await prisma.users.update({
            where: { id: user.id },
            data: { status: 'INACTIVE' }
        });
        if (!silent)
            console.log(`   ⚠️  禁用用户: ${user.email}`);
    }
    // 4. 显示最终用户列表
    if (!silent) {
        console.log('\n4️⃣ 最终用户列表:');
        const allUsers = await prisma.users.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { id: 'asc' }
        });
        allUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.realName}) - ${user.role}`);
        });
    }
    if (!silent) {
        console.log('\n✅ 用户数据更新完成！');
        console.log('\n📝 新用户默认密码: Longi@123\n');
    }
}
/**
 * 独立运行的主函数
 */
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        await updateUsersData(prisma, false);
    }
    catch (error) {
        console.error('\n❌ 错误:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
// 只在直接运行时执行
if (require.main === module) {
    main();
}
//# sourceMappingURL=updateUsers.js.map