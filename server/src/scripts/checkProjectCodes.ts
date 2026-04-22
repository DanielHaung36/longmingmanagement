import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkProjectCodes() {
  try {
    console.log("\n🔍 检查新的 ProjectCode 格式...\n");

    // 获取前10个项目
    const projects = await prisma.projects.findMany({
      take: 15,
      orderBy: { id: "asc" },
      select: {
        id: true,
        projectCode: true,
        name: true,
        clientCompany: true,
        mineSiteName: true,
        status: true,
      },
    });

    console.log("📊 项目样本 (前15个):\n");
    projects.forEach((p) => {
      console.log(`ID: ${p.id} | projectCode: ${p.projectCode}`);
      console.log(`  name: ${p.name}`);
      console.log(`  status: ${p.status}`);
      console.log(`  clientCompany: ${p.clientCompany || "N/A"}`);
      console.log(`  mineSiteName: ${p.mineSiteName || "N/A"}`);
      console.log("");
    });

    // 统计总数和projectCode格式
    const totalCount = await prisma.projects.count();
    console.log(`\n📈 统计信息:`);
    console.log(`  总项目数: ${totalCount}`);

    // 检查projectCode格式
    const codeFormats = new Map<string, number>();
    const allProjects = await prisma.projects.findMany({
      select: { projectCode: true },
    });

    allProjects.forEach((p) => {
      // 修改正则表达式：矿区代码可以包含数字，长度为 2-4 个字符
      const match = p.projectCode.match(/^(\d{4})-([A-Z]{2})-([A-Z0-9]{2,4})-(\d{3})$/);
      if (match) {
        codeFormats.set("新格式 (YYYY-JT-SITE-NNN)", (codeFormats.get("新格式 (YYYY-JT-SITE-NNN)") || 0) + 1);
      } else {
        codeFormats.set("其他格式", (codeFormats.get("其他格式") || 0) + 1);
      }
    });

    console.log(`\n📊 ProjectCode 格式分布:`);
    codeFormats.forEach((count, format) => {
      console.log(`  ${format}: ${count} 个`);
    });

    console.log("\n✅ 检查完成！\n");
  } catch (error) {
    console.error("❌ 错误:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectCodes();
