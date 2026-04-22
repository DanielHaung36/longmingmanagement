#!/usr/bin/env ts-node
"use strict";
/**
 * 重置 Luca Liu 的密码为 Longi@123
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        console.log('\n🔐 开始重置 Luca Liu 的密码...\n');
        const newPassword = await bcryptjs_1.default.hash('Longi@123', 10);
        const user = await prisma.users.findFirst({
            where: { email: { equals: 'LucaLiu@ljmagnet.com.au', mode: 'insensitive' } }
        });
        if (user) {
            await prisma.users.update({
                where: { id: user.id },
                data: { password: newPassword }
            });
            console.log(`✅ 已重置密码: ${user.email} (${user.realName})`);
            console.log(`   新密码: Longi@123`);
        }
        else {
            console.log('❌ 未找到用户: LucaLiu@ljmagnet.com.au');
        }
        console.log('\n✅ 密码重置完成！\n');
    }
    catch (error) {
        console.error('\n❌ 错误:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=resetLucaPassword.js.map