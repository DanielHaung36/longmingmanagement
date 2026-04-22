import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkOldFormatProjects() {
  try {
    console.log("\n🔍 检查不符合新格式的项目...\n");

    const allProjects = await prisma.projects.findMany({
      select: {
        id: true,
        projectCode: true,
        name: true,
        clientCompany: true,
        mineSiteName: true,
      },
      orderBy: { id: "asc" },
    });

    const oldFormatProjects: any[] = [];
    const newFormatProjects: any[] = [];

    allProjects.forEach((p) => {
      // 修改正则表达式：矿区代码可以包含数字，长度为 2-4 个字符
      const match = p.projectCode.match(/^(\d{4})-([A-Z]{2})-([A-Z0-9]{2,4})-(\d{3})$/);
      if (match) {
        newFormatProjects.push(p);
      } else {
        oldFormatProjects.push(p);
      }
    });

    console.log(`📊 统计:`);
    console.log(`  新格式: ${newFormatProjects.length} 个`);
    console.log(`  旧格式: ${oldFormatProjects.length} 个`);
    console.log(`  总数: ${allProjects.length} 个\n`);

    if (oldFormatProjects.length > 0) {
      console.log(`🔴 不符合新格式的项目 (前20个):\n`);
      oldFormatProjects.slice(0, 20).forEach((p) => {
        console.log(`ID: ${p.id} | projectCode: ${p.projectCode}`);
        console.log(`  name: ${p.name}`);
        console.log(`  clientCompany: ${p.clientCompany || "N/A"}`);
        console.log(`  mineSiteName: ${p.mineSiteName || "N/A"}`);
        console.log("");
      });
    }

    console.log("\n✅ 检查完成！\n");
  } catch (error) {
    console.error("❌ 错误:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOldFormatProjects();
