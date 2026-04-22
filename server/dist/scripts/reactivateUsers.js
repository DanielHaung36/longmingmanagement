#!/usr/bin/env ts-node
"use strict";
/**
 * 重新激活被禁用的用户
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        console.log('\n🔄 重新激活被禁用的用户...\n');
        const usersToReactivate = [
            'Adela@ljmagnet.com',
            'Daniel.huang@ljmagnet.com.au',
            'LucaLiu@ljmagnet.com.au',
        ];
        for (const email of usersToReactivate) {
            const user = await prisma.users.findFirst({
                where: { email: { equals: email, mode: 'insensitive' } }
            });
            if (user) {
                await prisma.users.update({
                    where: { id: user.id },
                    data: { status: 'ACTIVE' }
                });
                console.log(`✅ 激活用户: ${email}`);
            }
        }
        console.log('\n✅ 用户激活完成！\n');
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
//# sourceMappingURL=reactivateUsers.js.map