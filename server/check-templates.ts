import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplates() {
  console.log('=== Checking for template projects ===\n');

  // Check for projects with "template" in name or code
  const templates = await prisma.projects.findMany({
    where: {
      OR: [
        { name: { contains: 'template', mode: 'insensitive' } },
        { projectCode: { contains: 'template', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true,
      name: true,
      projectCode: true,
      jobType: true,
      clientCompany: true,
      mineSiteName: true,
      status: true,
    },
    take: 20
  });

  console.log(`Found ${templates.length} template projects:`);
  templates.forEach(t => {
    console.log(`ID: ${t.id}, Code: ${t.projectCode}, Name: ${t.name}, Type: ${t.jobType}, Status: ${t.status}`);
  });

  // Check total projects
  const total = await prisma.projects.count();
  console.log(`\nTotal projects in database: ${total}`);
  console.log(`Template projects: ${templates.length}`);
  console.log(`Regular projects: ${total - templates.length}`);

  await prisma.$disconnect();
}

checkTemplates().catch(console.error);
