const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProject1() {
  const project = await prisma.project.findUnique({
    where: { id: 1 },
    include: { owner: true, mineZone: true }
  });

  console.log(JSON.stringify(project, null, 2));
  await prisma.$disconnect();
}

checkProject1();
