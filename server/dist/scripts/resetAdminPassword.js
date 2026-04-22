"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function resetAdminPassword() {
    try {
        // 设置新密码
        const newPassword = 'Longi@123'; // 可以修改为你想要的密码
        console.log('🔐 正在重置管理员密码...\n');
        // 加密密码
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
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
    }
    catch (error) {
        console.error('❌ 重置失败:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
resetAdminPassword();
//# sourceMappingURL=resetAdminPassword.js.map