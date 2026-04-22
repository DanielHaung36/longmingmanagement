"use strict";
/**
 * OneDrive 文件夹扫描器
 * 扫描三层结构：客户公司 → 矿区 → Task文件夹
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
exports.scanOneDrive = scanOneDrive;
exports.generateScanReport = generateScanReport;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const taskCodeParser_1 = require("../utils/taskCodeParser");
const sanitizeFileName_1 = require("../utils/sanitizeFileName");
/**
 * 检查文件夹是否应该跳过（通用信息文件夹和模板文件夹）
 */
function shouldSkipFolder(folderName) {
    const skipPatterns = [
        /^01\s+client\s+general\s+info$/i,
        /^01\s+project\s+general\s+info$/i,
        /^01\s+general\s+info$/i,
        /^general\s+info$/i,
        /template/i, // Skip any folder containing "template"
    ];
    return skipPatterns.some((pattern) => pattern.test(folderName));
}
/**
 * 获取文件夹内的所有子项
 */
function getDirectoryContents(dirPath) {
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        const folders = [];
        const files = [];
        for (const item of items) {
            if (item.isDirectory()) {
                folders.push(item.name);
            }
            else if (item.isFile()) {
                files.push(item.name);
            }
        }
        return { folders, files };
    }
    catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return { folders: [], files: [] };
    }
}
/**
 * 扫描 Task 文件夹
 */
function scanTaskFolder(taskFolderPath, taskFolderName, mineSitePath) {
    const errors = [];
    const nameIssueInfo = (0, sanitizeFileName_1.getInvalidCharsInFileName)(taskFolderName);
    // 解析 TaskCode 和 Title
    const parsed = (0, taskCodeParser_1.parseTaskFolderName)(taskFolderName);
    if (!parsed.isValid) {
        errors.push(...parsed.errors);
    }
    // 获取子文件夹和文件
    const { folders, files } = getDirectoryContents(taskFolderPath);
    return {
        taskCode: parsed.taskCode,
        businessType: parsed.businessType,
        sequenceNumber: parsed.sequenceNumber,
        title: parsed.title,
        originalName: taskFolderName,
        fullPath: taskFolderPath,
        parentPath: mineSitePath,
        subFolders: folders,
        files: files,
        hasInvalidName: nameIssueInfo.hasInvalidChars,
        nameIssues: nameIssueInfo.issues,
        isValid: parsed.isValid && !nameIssueInfo.hasInvalidChars,
        errors: [...errors, ...nameIssueInfo.issues],
    };
}
/**
 * 扫描矿区
 */
function scanMineSite(mineSitePath, mineSiteName, clientPath) {
    const { folders } = getDirectoryContents(mineSitePath);
    const taskFolders = [];
    let invalidTaskCount = 0;
    for (const folder of folders) {
        // 跳过通用信息文件夹
        if (shouldSkipFolder(folder)) {
            continue;
        }
        const taskFolderPath = path.join(mineSitePath, folder);
        const taskInfo = scanTaskFolder(taskFolderPath, folder, mineSitePath);
        if (!taskInfo.isValid) {
            invalidTaskCount++;
        }
        taskFolders.push(taskInfo);
    }
    return {
        name: mineSiteName,
        originalName: mineSiteName,
        path: mineSitePath,
        parentPath: clientPath,
        taskFolders,
        totalTasks: taskFolders.length,
        invalidTasks: invalidTaskCount,
    };
}
/**
 * 扫描客户公司
 */
function scanClientCompany(clientPath, clientName) {
    const { folders } = getDirectoryContents(clientPath);
    const mineSites = [];
    let invalidTaskCount = 0;
    for (const folder of folders) {
        // 跳过通用信息文件夹
        if (shouldSkipFolder(folder)) {
            continue;
        }
        const mineSitePath = path.join(clientPath, folder);
        const mineSiteInfo = scanMineSite(mineSitePath, folder, clientPath);
        invalidTaskCount += mineSiteInfo.invalidTasks;
        mineSites.push(mineSiteInfo);
    }
    return {
        name: clientName,
        originalName: clientName,
        path: clientPath,
        mineSites,
        totalTasks: mineSites.reduce((sum, m) => sum + m.totalTasks, 0),
        invalidTasks: invalidTaskCount,
    };
}
/**
 * 主扫描函数：扫描 OneDrive Client 目录
 */
async function scanOneDrive(rootPath) {
    const errors = [];
    // 验证根路径存在
    if (!fs.existsSync(rootPath)) {
        errors.push(`Root path does not exist: ${rootPath}`);
        return {
            rootPath,
            totalClients: 0,
            totalMineSites: 0,
            totalTasks: 0,
            invalidTasks: 0,
            clients: [],
            errors,
        };
    }
    const { folders: clientFolders } = getDirectoryContents(rootPath);
    const clients = [];
    let totalMineSites = 0;
    let totalTasks = 0;
    let invalidTasks = 0;
    for (const clientFolder of clientFolders) {
        const clientPath = path.join(rootPath, clientFolder);
        try {
            const clientInfo = scanClientCompany(clientPath, clientFolder);
            totalMineSites += clientInfo.mineSites.length;
            totalTasks += clientInfo.totalTasks;
            invalidTasks += clientInfo.invalidTasks;
            clients.push(clientInfo);
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Error scanning client ${clientFolder}: ${errorMsg}`);
        }
    }
    return {
        rootPath,
        totalClients: clients.length,
        totalMineSites,
        totalTasks,
        invalidTasks,
        clients,
        errors,
    };
}
/**
 * 生成扫描报告
 */
function generateScanReport(result) {
    let report = `\n╔════════════════════════════════════════════════════╗\n`;
    report += `║        OneDrive 文件夹结构扫描报告                 ║\n`;
    report += `╚════════════════════════════════════════════════════╝\n\n`;
    report += `📁 根路径: ${result.rootPath}\n\n`;
    report += `📊 扫描统计:\n`;
    report += `  • 客户公司数: ${result.totalClients}\n`;
    report += `  • 矿区数: ${result.totalMineSites}\n`;
    report += `  • Task 文件夹总数: ${result.totalTasks}\n`;
    report += `  • 无效 Task 文件夹: ${result.invalidTasks}\n\n`;
    // 详细信息
    for (const client of result.clients) {
        report += `\n📦 客户: ${client.name}\n`;
        report += `   路径: ${client.path}\n`;
        report += `   Task 总数: ${client.totalTasks}\n\n`;
        for (const mineSite of client.mineSites) {
            report += `   🏭 矿区: ${mineSite.name}\n`;
            report += `      路径: ${mineSite.path}\n`;
            report += `      Task 数: ${mineSite.totalTasks}\n`;
            // 显示前 5 个 Task
            for (let i = 0; i < Math.min(5, mineSite.taskFolders.length); i++) {
                const task = mineSite.taskFolders[i];
                const status = task.isValid ? '✓' : '✗';
                report += `      ${status} [${task.taskCode}] ${task.title}\n`;
            }
            if (mineSite.taskFolders.length > 5) {
                report += `      ... 还有 ${mineSite.taskFolders.length - 5} 个 Task\n`;
            }
        }
    }
    // 错误信息
    if (result.errors.length > 0) {
        report += `\n⚠️  扫描错误:\n`;
        for (const error of result.errors) {
            report += `   • ${error}\n`;
        }
    }
    return report;
}
//# sourceMappingURL=scanOneDrive.js.map