"use strict";
/**
 * PostgreSQL 备份上传到 OneDrive
 *
 * 扫描 /backups/ 目录下当天的 .sql.gz 文件，上传到 OneDrive。
 * 用于 K8s CronJob，在每天凌晨本地备份完成后执行。
 *
 * OneDrive 目标路径:
 *   03 Project Management/Database Backups/YYYYMMDD/*.sql.gz
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const oneDriveApiService_1 = require("../services/oneDriveApiService");
const BACKUP_DIR = process.env.BACKUP_DIR || '/backups';
const ONEDRIVE_BACKUP_BASE = '03 Project Management/Database Backups';
const ONEDRIVE_RETENTION_DAYS = parseInt(process.env.ONEDRIVE_RETENTION_DAYS || '30', 10);
function getTodayDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}
function findTodayBackups(backupDir, dateStr) {
    const dayDir = path_1.default.join(backupDir, dateStr);
    if (!fs_1.default.existsSync(dayDir)) {
        console.log(`备份目录不存在: ${dayDir}`);
        // Fallback: 扫描根目录下包含今天日期的文件
        if (!fs_1.default.existsSync(backupDir)) {
            return [];
        }
        return fs_1.default.readdirSync(backupDir)
            .filter(f => f.endsWith('.sql.gz') && f.includes(dateStr))
            .map(f => path_1.default.join(backupDir, f));
    }
    return fs_1.default.readdirSync(dayDir)
        .filter(f => f.endsWith('.sql.gz'))
        .map(f => path_1.default.join(dayDir, f));
}
/**
 * 清理 OneDrive 上过期的备份文件夹
 * 文件夹名格式为 YYYYMMDD，比较日期判断是否过期
 */
async function cleanupOldBackups() {
    const children = await oneDriveApiService_1.OneDriveApiService.listChildren(ONEDRIVE_BACKUP_BASE);
    const folders = children.filter(c => c.type === 'folder' && /^\d{8}$/.test(c.name));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ONEDRIVE_RETENTION_DAYS);
    const cutoffStr = cutoffDate.getFullYear()
        + String(cutoffDate.getMonth() + 1).padStart(2, '0')
        + String(cutoffDate.getDate()).padStart(2, '0');
    const expired = folders.filter(f => f.name < cutoffStr);
    if (expired.length === 0) {
        console.log('无过期备份需要清理');
        return;
    }
    console.log(`发现 ${expired.length} 个过期备份文件夹:`);
    for (const folder of expired) {
        const folderPath = `${ONEDRIVE_BACKUP_BASE}/${folder.name}`;
        console.log(`  删除: ${folder.name}`);
        const result = await oneDriveApiService_1.OneDriveApiService.deleteItem(folderPath);
        if (result.success) {
            console.log(`  ✓ 已删除: ${folder.name}`);
        }
        else {
            console.error(`  ✗ 删除失败: ${folder.name} - ${result.error}`);
        }
    }
}
async function main() {
    console.log('=========================================');
    console.log('PostgreSQL 备份上传到 OneDrive');
    console.log(`时间: ${new Date().toISOString()}`);
    console.log('=========================================');
    // 1. 检查 OneDrive API 可用性
    const available = await oneDriveApiService_1.OneDriveApiService.isAvailable();
    if (!available) {
        console.error('OneDrive API 不可用，请检查环境变量配置');
        process.exit(1);
    }
    console.log('OneDrive API 初始化成功');
    // 2. 查找当天的备份文件
    const dateStr = getTodayDate();
    const backupFiles = findTodayBackups(BACKUP_DIR, dateStr);
    if (backupFiles.length === 0) {
        console.error(`未找到当天(${dateStr})的备份文件`);
        process.exit(1);
    }
    console.log(`找到 ${backupFiles.length} 个备份文件:`);
    backupFiles.forEach(f => console.log(`  - ${path_1.default.basename(f)}`));
    // 3. 确保 OneDrive 目标文件夹存在
    const targetFolder = `${ONEDRIVE_BACKUP_BASE}/${dateStr}`;
    console.log(`\n创建 OneDrive 目标文件夹: ${targetFolder}`);
    const folderResult = await oneDriveApiService_1.OneDriveApiService.ensureFolder(targetFolder);
    if (!folderResult.success) {
        console.error(`创建文件夹失败: ${folderResult.error}`);
        process.exit(1);
    }
    // 4. 逐个上传备份文件
    let successCount = 0;
    let failCount = 0;
    for (const filePath of backupFiles) {
        const fileName = path_1.default.basename(filePath);
        const targetPath = `${targetFolder}/${fileName}`;
        const fileSize = fs_1.default.statSync(filePath).size;
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        console.log(`\n上传: ${fileName} (${fileSizeMB} MB)`);
        const content = fs_1.default.readFileSync(filePath);
        const result = await oneDriveApiService_1.OneDriveApiService.uploadFile(targetPath, content);
        if (result.success) {
            console.log(`✓ 上传成功: ${fileName}`);
            successCount++;
        }
        else {
            console.error(`✗ 上传失败: ${fileName} - ${result.error}`);
            failCount++;
        }
    }
    // 5. 清理 OneDrive 上过期的备份文件夹
    console.log(`\n清理 OneDrive 上 ${ONEDRIVE_RETENTION_DAYS} 天前的备份...`);
    await cleanupOldBackups();
    // 6. 输出汇总
    console.log('\n=========================================');
    console.log(`上传完成: 成功 ${successCount}, 失败 ${failCount}`);
    console.log('=========================================');
    if (failCount > 0) {
        process.exit(1);
    }
}
main().catch(err => {
    console.error('备份上传脚本异常:', err);
    process.exit(1);
});
//# sourceMappingURL=backupToOneDrive.js.map