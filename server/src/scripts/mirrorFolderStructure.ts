/**
 * 文件夹结构镜像和验证
 * 创建标准化的文件夹结构和空文件
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { sanitizeFileName } from '../utils/sanitizeFileName';

export interface MirrorStats {
  foldersCreated: number;
  filesCreated: number;
  filesSkipped: number;
  filesSkippedSameHash: number; // 新增：因hash相同而跳过的文件数
  totalSize: number;
  errors: string[];
}

export interface VerifyStats {
  totalFolders: number;
  totalFiles: number;
  missingFolders: string[];
  missingFiles: string[];
  nameMismatches: Array<{ source: string; target: string }>;
  errors: string[];
}

/**
 * 计算文件的 MD5 hash
 */
function calculateFileHash(filePath: string): string {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    return '';
  }
}

/**
 * 检查两个文件是否具有相同的 hash
 */
function filesHaveSameHash(sourcePath: string, targetPath: string): boolean {
  try {
    if (!fs.existsSync(targetPath)) {
      return false;
    }
    const sourceHash = calculateFileHash(sourcePath);
    const targetHash = calculateFileHash(targetPath);
    return sourceHash === targetHash && sourceHash !== '';
  } catch (error) {
    return false;
  }
}

/**
 * 递归创建文件夹结构（开发环境：只创建空文件）
 */
async function recursiveCreateFolders(
  sourceDir: string,
  targetDir: string,
  stats: MirrorStats,
  createEmptyFiles: boolean = true
): Promise<void> {
  try {
    // 创建目标文件夹
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      stats.foldersCreated++;
    }

    const items = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const item of items) {
      const sourcePath = path.join(sourceDir, item.name);
      // 规范化文件名
      const sanitizedName = sanitizeFileName(item.name);
      const targetPath = path.join(targetDir, sanitizedName);

      if (item.isDirectory()) {
        // 递归创建子文件夹
        await recursiveCreateFolders(sourcePath, targetPath, stats, createEmptyFiles);
      } else if (item.isFile()) {
        if (createEmptyFiles) {
          // 开发环境：创建 0 字节空文件
          if (!fs.existsSync(targetPath)) {
            fs.writeFileSync(targetPath, '');
            stats.filesCreated++;
          } else {
            stats.filesSkipped++;
          }
        } else {
          // 生产环境：复制完整文件内容
          if (!fs.existsSync(targetPath)) {
            // 目标文件不存在，直接复制
            fs.copyFileSync(sourcePath, targetPath);
            const fileStats = fs.statSync(targetPath);
            stats.totalSize += fileStats.size;
            stats.filesCreated++;
          } else {
            // 目标文件存在，比对hash
            if (filesHaveSameHash(sourcePath, targetPath)) {
              // Hash相同，跳过复制
              stats.filesSkippedSameHash++;
            } else {
              // Hash不同，覆盖复制
              fs.copyFileSync(sourcePath, targetPath);
              const fileStats = fs.statSync(targetPath);
              stats.totalSize += fileStats.size;
              stats.filesCreated++;
            }
          }
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    stats.errors.push(
      `Error mirroring ${sourceDir} to ${targetDir}: ${errorMsg}`
    );
  }
}

/**
 * 递归验证文件夹结构
 */
async function recursiveVerifyStructure(
  sourceDir: string,
  targetDir: string,
  stats: VerifyStats
): Promise<void> {
  try {
    // 检查目标文件夹是否存在
    if (!fs.existsSync(targetDir)) {
      stats.missingFolders.push(targetDir);
      return;
    }

    const sourceItems = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const item of sourceItems) {
      const sourcePath = path.join(sourceDir, item.name);
      const sanitizedName = sanitizeFileName(item.name);
      const targetPath = path.join(targetDir, sanitizedName);

      if (item.isDirectory()) {
        // 检查子文件夹
        stats.totalFolders++;
        if (!fs.existsSync(targetPath)) {
          stats.missingFolders.push(targetPath);
        } else {
          // 递归验证
          await recursiveVerifyStructure(sourcePath, targetPath, stats);
        }
      } else if (item.isFile()) {
        // 检查文件
        stats.totalFiles++;
        if (!fs.existsSync(targetPath)) {
          stats.missingFiles.push(targetPath);
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    stats.errors.push(
      `Error verifying ${sourceDir} to ${targetDir}: ${errorMsg}`
    );
  }
}

/**
 * 主函数：镜像文件夹结构
 * @param sourceDir 源文件夹路径
 * @param targetDir 目标文件夹路径
 * @param createEmptyFiles true: 创建空文件(开发), false: 复制完整文件(生产)
 */
export async function mirrorFolderStructure(
  sourceDir: string,
  targetDir: string,
  createEmptyFiles: boolean = true
): Promise<MirrorStats> {
  const stats: MirrorStats = {
    foldersCreated: 0,
    filesCreated: 0,
    filesSkipped: 0,
    filesSkippedSameHash: 0,
    totalSize: 0,
    errors: [],
  };

  // 检查源文件夹是否存在
  if (!fs.existsSync(sourceDir)) {
    stats.errors.push(`Source directory does not exist: ${sourceDir}`);
    return stats;
  }

  const mode = createEmptyFiles ? '(Empty Files)' : '(Full Copy)';
  console.log(`\n🔄 Mirroring folder structure from ${sourceDir} to ${targetDir} ${mode}`);

  await recursiveCreateFolders(sourceDir, targetDir, stats, createEmptyFiles);

  console.log(`   ✓ Folders created: ${stats.foldersCreated}`);
  console.log(`   ✓ Files created: ${stats.filesCreated}`);
  console.log(`   ⊘ Files skipped: ${stats.filesSkipped}`);
  if (!createEmptyFiles && stats.filesSkippedSameHash > 0) {
    console.log(`   ⚡ Files skipped (same hash): ${stats.filesSkippedSameHash}`);
  }
  if (!createEmptyFiles) {
    console.log(`   📦 Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
  }

  if (stats.errors.length > 0) {
    console.log(`   ⚠️  Errors: ${stats.errors.length}`);
  }

  return stats;
}

/**
 * 主函数：验证文件夹结构
 */
export async function verifyFolderStructure(
  sourceDir: string,
  targetDir: string
): Promise<VerifyStats> {
  const stats: VerifyStats = {
    totalFolders: 0,
    totalFiles: 0,
    missingFolders: [],
    missingFiles: [],
    nameMismatches: [],
    errors: [],
  };

  // 检查源文件夹是否存在
  if (!fs.existsSync(sourceDir)) {
    stats.errors.push(`Source directory does not exist: ${sourceDir}`);
    return stats;
  }

  // 检查目标文件夹是否存在
  if (!fs.existsSync(targetDir)) {
    stats.errors.push(`Target directory does not exist: ${targetDir}`);
    return stats;
  }

  console.log(`\n✅ Verifying folder structure at ${targetDir}`);

  await recursiveVerifyStructure(sourceDir, targetDir, stats);

  console.log(`   • Total folders: ${stats.totalFolders}`);
  console.log(`   • Total files: ${stats.totalFiles}`);
  console.log(`   • Missing folders: ${stats.missingFolders.length}`);
  console.log(`   • Missing files: ${stats.missingFiles.length}`);

  if (stats.missingFolders.length > 0) {
    console.log(`\n   ⚠️  Missing folders (showing first 5):`);
    for (let i = 0; i < Math.min(5, stats.missingFolders.length); i++) {
      console.log(`      - ${stats.missingFolders[i]}`);
    }
    if (stats.missingFolders.length > 5) {
      console.log(`      ... and ${stats.missingFolders.length - 5} more`);
    }
  }

  if (stats.missingFiles.length > 0) {
    console.log(`\n   ⚠️  Missing files (showing first 5):`);
    for (let i = 0; i < Math.min(5, stats.missingFiles.length); i++) {
      console.log(`      - ${stats.missingFiles[i]}`);
    }
    if (stats.missingFiles.length > 5) {
      console.log(`      ... and ${stats.missingFiles.length - 5} more`);
    }
  }

  if (stats.errors.length > 0) {
    console.log(`\n   ⚠️  Verification errors:`);
    for (const error of stats.errors) {
      console.log(`      - ${error}`);
    }
  }

  return stats;
}

/**
 * 生成验证报告
 */
export function generateVerifyReport(stats: VerifyStats): string {
  let report = `\n╔════════════════════════════════════════════════════╗\n`;
  report += `║        文件夹结构验证报告                           ║\n`;
  report += `╚════════════════════════════════════════════════════╝\n\n`;

  report += `📊 验证统计:\n`;
  report += `  • 文件夹总数: ${stats.totalFolders}\n`;
  report += `  • 文件总数: ${stats.totalFiles}\n`;
  report += `  • 缺失文件夹: ${stats.missingFolders.length}\n`;
  report += `  • 缺失文件: ${stats.missingFiles.length}\n`;
  report += `  • 名称不匹配: ${stats.nameMismatches.length}\n\n`;

  if (stats.missingFolders.length > 0) {
    report += `⚠️  缺失文件夹 (显示前 10 个):\n`;
    for (let i = 0; i < Math.min(10, stats.missingFolders.length); i++) {
      report += `   - ${stats.missingFolders[i]}\n`;
    }
    if (stats.missingFolders.length > 10) {
      report += `   ... 还有 ${stats.missingFolders.length - 10} 个\n`;
    }
    report += '\n';
  }

  if (stats.missingFiles.length > 0) {
    report += `⚠️  缺失文件 (显示前 10 个):\n`;
    for (let i = 0; i < Math.min(10, stats.missingFiles.length); i++) {
      report += `   - ${stats.missingFiles[i]}\n`;
    }
    if (stats.missingFiles.length > 10) {
      report += `   ... 还有 ${stats.missingFiles.length - 10} 个\n`;
    }
    report += '\n';
  }

  if (stats.errors.length > 0) {
    report += `❌ 错误:\n`;
    for (const error of stats.errors) {
      report += `   - ${error}\n`;
    }
  }

  const isValid = stats.missingFolders.length === 0 && stats.missingFiles.length === 0;
  report += `\n${isValid ? '✅ 验证通过' : '❌ 验证失败'}\n`;

  return report;
}
