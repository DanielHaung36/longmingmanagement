"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkUsers() {
    const users = await prisma.users.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true
        },
        orderBy: { id: 'asc' }
    });
    console.log('\n📋 数据库中的所有用户：\n');
    users.forEach((user) => {
        console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}, Status: ${user.status}`);
    });
    await prisma.$disconnect();
}
checkUsers().catch(console.error);
//# sourceMappingURL=checkUsers.js.map