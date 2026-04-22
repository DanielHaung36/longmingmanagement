"use strict";
/**
 * 重新编号任务脚本
 *
 * 功能：
 * 1. 将 9XXX 任务重新编号为连续编号
 * 2. 同时更新文件夹路径
 * 3. 生成文件夹重命名脚本
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const prisma = new client_1.PrismaClient();
async function renumberTasks() {
    try {
        console.log('=== 开始重新编号任务 ===\n');
        const jobTypes = ['AT', 'AQ', 'AP', 'AC', 'AS'];
        const allRenames = [];
        for (const jobType of jobTypes) {
            console.log(`\n处理 ${jobType} 类型...`);
            // 1. 获取正常编号的最大序号
            const normalTasks = await prisma.tasks.findMany({
                where: {
                    taskCode: {
                        startsWith: jobType,
                        not: { startsWith: `${jobType}9` }
                    }
                },
                select: { taskCode: true },
                orderBy: { taskCode: 'desc' }
            });
            let maxNormalSeq = 0;
            if (normalTasks.length > 0) {
                const match = normalTasks[0].taskCode.match(/^[A-Z]{2}(\d+)$/);
                maxNormalSeq = match ? parseInt(match[1]) : 0;
            }
            console.log(`  当前最大编号: ${jobType}${String(maxNormalSeq).padStart(4, '0')}`);
            // 2. 获取 9XXX 任务
            const badTasks = await prisma.tasks.findMany({
                where: { taskCode: { startsWith: `${jobType}9` } },
                select: {
                    id: true,
                    taskCode: true,
                    title: true,
                    oneDriveFolderPath: true,
                    localFolderPath: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'asc' }
            });
            if (badTasks.length === 0) {
                console.log(`  没有 ${jobType}9XXX 任务`);
                continue;
            }
            console.log(`  找到 ${badTasks.length} 个需要重新编号的任务`);
            // 3. 生成重命名操作
            let newSeq = maxNormalSeq + 1;
            for (const task of badTasks) {
                const newCode = `${jobType}${String(newSeq).padStart(4, '0')}`;
                const rename = {
                    taskId: task.id,
                    oldCode: task.taskCode,
                    newCode: newCode,
                    title: task.title || ''
                };
                // 更新 OneDrive 路径
                if (task.oneDriveFolderPath) {
                    rename.oldOneDrivePath = task.oneDriveFolderPath;
                    rename.newOneDrivePath = task.oneDriveFolderPath.replace(task.taskCode, newCode);
                }
                // 更新本地路径
                if (task.localFolderPath) {
                    rename.oldLocalPath = task.localFolderPath;
                    rename.newLocalPath = task.localFolderPath.replace(task.taskCode, newCode);
                }
                allRenames.push(rename);
                newSeq++;
            }
        }
        if (allRenames.length === 0) {
            console.log('\n没有需要重新编号的任务');
            return;
        }
        // 4. 显示将要执行的操作
        console.log('\n=== 即将执行的重新编号操作 ===\n');
        allRenames.forEach((r, i) => {
            console.log(`${i + 1}. ${r.oldCode} → ${r.newCode}`);
            console.log(`   标题: ${r.title}`);
            if (r.oldOneDrivePath) {
                console.log(`   OneDrive: ...${r.oldOneDrivePath.slice(-50)} → ...${r.newOneDrivePath.slice(-50)}`);
            }
        });
        console.log(`\n总计: ${allRenames.length} 个任务需要重新编号`);
        console.log('\n⚠️  即将在 5 秒后开始更新...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        // 5. 执行数据库更新（使用事务）
        console.log('\n开始更新数据库...');
        await prisma.$transaction(allRenames.map(r => prisma.tasks.update({
            where: { id: r.taskId },
            data: {
                taskCode: r.newCode,
                oneDriveFolderPath: r.newOneDrivePath || r.oldOneDrivePath,
                localFolderPath: r.newLocalPath || r.oldLocalPath
            }
        })));
        console.log('✅ 数据库更新完成！');
        // 6. 生成文件夹重命名脚本
        console.log('\n生成文件夹重命名脚本...');
        const bashScript = generateBashScript(allRenames);
        const powershellScript = generatePowerShellScript(allRenames);
        fs.writeFileSync('/tmp/rename-folders.sh', bashScript);
        fs.writeFileSync('/tmp/rename-folders.ps1', powershellScript);
        console.log('✅ 脚本已生成:');
        console.log('   Linux/WSL: /tmp/rename-folders.sh');
        console.log('   Windows:   /tmp/rename-folders.ps1');
        console.log('\n=== 重新编号完成！ ===');
        console.log('\n⚠️  下一步：手动执行文件夹重命名脚本');
    }
    catch (error) {
        console.error('❌ 错误:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
function generateBashScript(renames) {
    let script = `#!/bin/bash
# 文件夹重命名脚本 (Linux/WSL)
# 生成时间: ${new Date().toISOString()}

set -e

echo "=== 开始重命名文件夹 ==="
echo "总计: ${renames.length} 个文件夹"
echo

`;
    renames.forEach((r, i) => {
        if (r.oldOneDrivePath && r.newOneDrivePath) {
            script += `# ${i + 1}. ${r.oldCode} → ${r.newCode}\n`;
            script += `if [ -d "${r.oldOneDrivePath}" ]; then\n`;
            script += `  mv "${r.oldOneDrivePath}" "${r.newOneDrivePath}"\n`;
            script += `  echo "✅ 重命名: ${r.oldCode} → ${r.newCode}"\n`;
            script += `else\n`;
            script += `  echo "⚠️  目录不存在: ${r.oldOneDrivePath}"\n`;
            script += `fi\n\n`;
        }
    });
    script += `echo\necho "=== 完成 ==="\n`;
    return script;
}
function generatePowerShellScript(renames) {
    let script = `# 文件夹重命名脚本 (Windows PowerShell)
# 生成时间: ${new Date().toISOString()}

Write-Host "=== 开始重命名文件夹 ===" -ForegroundColor Green
Write-Host "总计: ${renames.length} 个文件夹"
Write-Host

`;
    renames.forEach((r, i) => {
        if (r.oldOneDrivePath && r.newOneDrivePath) {
            const winOldPath = r.oldOneDrivePath.replace(/\//g, '\\');
            const winNewPath = r.newOneDrivePath.replace(/\//g, '\\');
            script += `# ${i + 1}. ${r.oldCode} → ${r.newCode}\n`;
            script += `if (Test-Path "${winOldPath}") {\n`;
            script += `  Rename-Item "${winOldPath}" -NewName (Split-Path "${winNewPath}" -Leaf)\n`;
            script += `  Write-Host "✅ 重命名: ${r.oldCode} → ${r.newCode}" -ForegroundColor Green\n`;
            script += `} else {\n`;
            script += `  Write-Host "⚠️  目录不存在: ${winOldPath}" -ForegroundColor Yellow\n`;
            script += `}\n\n`;
        }
    });
    script += `Write-Host\nWrite-Host "=== 完成 ===" -ForegroundColor Green\n`;
    return script;
}
// 执行
renumberTasks()
    .catch(console.error)
    .finally(() => process.exit());
//# sourceMappingURL=renumberTasks.js.map