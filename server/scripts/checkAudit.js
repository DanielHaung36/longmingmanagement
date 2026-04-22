const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const entries = await prisma.audit_logs.findMany({
      orderBy: { id: 'desc' },
      take: 5,
    });
    console.log(entries);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
