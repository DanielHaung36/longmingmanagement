import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTemplateProjects() {
  console.log('=== Cleaning template projects from database ===\n');

  try {
    // Find all template projects
    const templates = await prisma.projects.findMany({
      where: {
        OR: [
          { name: { contains: 'template', mode: 'insensitive' } },
          { projectCode: { contains: 'template', mode: 'insensitive' } },
        ]
      },
      include: {
        tasks: {
          select: {
            id: true,
            taskCode: true,
          }
        }
      }
    });

    console.log(`Found ${templates.length} template projects to delete:\n`);

    templates.forEach(t => {
      console.log(`  - ID: ${t.id}, Code: ${t.projectCode}, Name: ${t.name}, Tasks: ${t.tasks.length}`);
    });

    if (templates.length === 0) {
      console.log('\nNo template projects found. Database is clean.');
      await prisma.$disconnect();
      return;
    }

    console.log('\n⚠️  WARNING: This will delete these projects and all related data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Proceeding with deletion...\n');

    // Delete tasks first (due to foreign key constraints)
    for (const project of templates) {
      if (project.tasks.length > 0) {
        const taskIds = project.tasks.map(t => t.id);

        // Delete task files
        await prisma.task_files.deleteMany({
          where: { taskId: { in: taskIds } }
        });
        console.log(`  ✓ Deleted task files for project ${project.projectCode}`);

        // Delete task approvals
        await prisma.task_approvals.deleteMany({
          where: { taskId: { in: taskIds } }
        });
        console.log(`  ✓ Deleted task approvals for project ${project.projectCode}`);

        // Delete comments
        await prisma.comments.deleteMany({
          where: {
            entityType: 'task',
            entityId: { in: taskIds }
          }
        });
        console.log(`  ✓ Deleted comments for project ${project.projectCode}`);

        // Delete tasks
        await prisma.tasks.deleteMany({
          where: { id: { in: taskIds } }
        });
        console.log(`  ✓ Deleted ${taskIds.length} tasks for project ${project.projectCode}`);
      }

      // Delete project comments
      await prisma.comments.deleteMany({
        where: {
          entityType: 'project',
          entityId: project.id
        }
      });

      // Delete project members
      await prisma.project_members.deleteMany({
        where: { projectId: project.id }
      });

      // Delete project
      await prisma.projects.delete({
        where: { id: project.id }
      });
      console.log(`  ✓ Deleted project ${project.projectCode}\n`);
    }

    console.log(`\n✅ Successfully deleted ${templates.length} template projects!`);
    console.log('Database cleanup complete.\n');

  } catch (error) {
    console.error('❌ Error cleaning template projects:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanTemplateProjects().catch(console.error);
