/**
 * 路径诊断脚本 - 检查所有任务的路径配置
 *
 * 功能:
 * 1. 列出所有任务的路径信息
 * 2. 对比Excel原始路径和数据库路径
 * 3. 检查文件夹是否实际存在
 * 4. 生成详细诊断报告
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs-extra';
import * as path from 'path';

const prisma = new PrismaClient();

interface PathDiagnostic {
  taskId: number;
  taskCode: string;
  title: string;
  projectName: string;
  clientCompany: string;
  mineSiteName: string;

  // 数据库路径
  dbLocalPath: string | null;
  dbOneDrivePath: string | null;
  dbOriginalOneDrivePath: string | null;

  // 文件夹存在性检查
  localFolderExists: boolean;
  oneDriveFolderExists: boolean;
  originalOneDriveFolderExists: boolean;

  // 路径问题标记
  hasPathIssue: boolean;
  issues: string[];
}

async function diagnoseAllTasks() {
  console.log('\n========================================');
  console.log('任务路径诊断报告');
  console.log('========================================\n');

  console.log('📋 环境变量配置:');
  console.log(`   ONEDRIVE_ROOT (只读): ${process.env.ONEDRIVE_ROOT}`);
  console.log(`   ONEDRIVE_PROJECT_ROOT (开发): ${process.env.ONEDRIVE_PROJECT_ROOT}`);
  console.log(`   LOCAL_PROJECT_ROOT: ${process.env.LOCAL_PROJECT_ROOT}`);
  console.log(`   TEMPLATE_ROOT: ${process.env.TEMPLATE_ROOT}\n`);

  // 获取所有任务
  const tasks = await prisma.tasks.findMany({
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          clientCompany: true,
          mineSiteName: true,
          mineSiteFolderPath: true,
        }
      }
    },
    orderBy: {
      taskCode: 'asc'
    }
  });

  console.log(`📊 总任务数: ${tasks.length}\n`);
  console.log('========================================\n');

  const diagnostics: PathDiagnostic[] = [];
  let issueCount = 0;

  for (const task of tasks) {
    const diagnostic: PathDiagnostic = {
      taskId: task.id,
      taskCode: task.taskCode,
      title: task.title,
      projectName: task.projects?.name || 'N/A',
      clientCompany: task.projects?.clientCompany || 'N/A',
      mineSiteName: task.projects?.mineSiteName || 'N/A',

      dbLocalPath: task.localFolderPath,
      dbOneDrivePath: task.oneDriveFolderPath,
      dbOriginalOneDrivePath: task.originalOneDrivePath,

      localFolderExists: false,
      oneDriveFolderExists: false,
      originalOneDriveFolderExists: false,

      hasPathIssue: false,
      issues: []
    };

    // 检查本地文件夹
    if (task.localFolderPath) {
      diagnostic.localFolderExists = await fs.pathExists(task.localFolderPath);
      if (!diagnostic.localFolderExists) {
        diagnostic.issues.push(`本地文件夹不存在: ${task.localFolderPath}`);
        diagnostic.hasPathIssue = true;
      }
    } else {
      diagnostic.issues.push('本地文件夹路径为空');
      diagnostic.hasPathIssue = true;
    }

    // 检查OneDrive文件夹
    if (task.oneDriveFolderPath) {
      diagnostic.oneDriveFolderExists = await fs.pathExists(task.oneDriveFolderPath);
      if (!diagnostic.oneDriveFolderExists) {
        diagnostic.issues.push(`OneDrive文件夹不存在: ${task.oneDriveFolderPath}`);
        diagnostic.hasPathIssue = true;
      }
    } else {
      diagnostic.issues.push('OneDrive文件夹路径为空');
      diagnostic.hasPathIssue = true;
    }

    // 检查原始OneDrive文件夹
    if (task.originalOneDrivePath) {
      diagnostic.originalOneDriveFolderExists = await fs.pathExists(task.originalOneDrivePath);
    }

    diagnostics.push(diagnostic);

    if (diagnostic.hasPathIssue) {
      issueCount++;
    }
  }

  // 打印有问题的任务
  console.log(`\n⚠️  发现 ${issueCount} 个任务存在路径问题:\n`);

  const tasksWithIssues = diagnostics.filter(d => d.hasPathIssue);

  for (const diag of tasksWithIssues.slice(0, 20)) { // 只显示前20个
    console.log(`❌ [${diag.taskCode}] ${diag.title}`);
    console.log(`   项目: ${diag.projectName}`);
    console.log(`   客户: ${diag.clientCompany} / ${diag.mineSiteName}`);
    console.log(`   问题:`);
    diag.issues.forEach(issue => console.log(`      - ${issue}`));
    console.log(`   DB本地路径: ${diag.dbLocalPath || '(空)'}`);
    console.log(`   DB OneDrive路径: ${diag.dbOneDrivePath || '(空)'}`);
    console.log(`   原始OneDrive路径: ${diag.dbOriginalOneDrivePath || '(空)'}`);
    console.log('');
  }

  if (tasksWithIssues.length > 20) {
    console.log(`   ... 还有 ${tasksWithIssues.length - 20} 个任务有问题\n`);
  }

  // 生成详细报告文件
  const reportPath = path.join(__dirname, '../../path_diagnostic_report.json');
  await fs.writeJSON(reportPath, {
    generatedAt: new Date().toISOString(),
    environment: {
      ONEDRIVE_ROOT: process.env.ONEDRIVE_ROOT,
      ONEDRIVE_PROJECT_ROOT: process.env.ONEDRIVE_PROJECT_ROOT,
      LOCAL_PROJECT_ROOT: process.env.LOCAL_PROJECT_ROOT,
      TEMPLATE_ROOT: process.env.TEMPLATE_ROOT,
    },
    summary: {
      totalTasks: tasks.length,
      tasksWithIssues: issueCount,
      tasksOk: tasks.length - issueCount,
    },
    diagnostics: diagnostics
  }, { spaces: 2 });

  console.log(`\n✅ 详细诊断报告已保存到: ${reportPath}`);

  // 统计问题类型
  const issueTypes: Record<string, number> = {};
  tasksWithIssues.forEach(diag => {
    diag.issues.forEach(issue => {
      const issueKey = issue.split(':')[0];
      issueTypes[issueKey] = (issueTypes[issueKey] || 0) + 1;
    });
  });

  console.log('\n📊 问题类型统计:');
  Object.entries(issueTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} 个`);
  });

  console.log('\n========================================\n');
}

// 执行诊断
diagnoseAllTasks()
  .then(() => {
    console.log('✅ 诊断完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 诊断失败:', error);
    process.exit(1);
  });
