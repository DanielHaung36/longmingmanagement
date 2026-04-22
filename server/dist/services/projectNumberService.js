"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectNumberService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ProjectNumberService {
    /**
     * 从矿区名称生成矿区代码
     * 规则：
     * 1. 提取英文单词首字母大写组合
     * 2. 如果没有空格，取前3-4个字母
     * 3. 特殊处理括号内容
     *
     * @param mineSiteName - 矿区名称
     * @returns 矿区代码 (3-4个字母)
     */
    static generateMineSiteCode(mineSiteName) {
        if (!mineSiteName)
            return "UNK"; // Unknown
        // 移除括号及其内容，但保留括号内的关键词
        const cleaned = mineSiteName
            .replace(/\([^)]*\)/g, (match) => {
            // 保留括号内的英文单词
            return match.replace(/[()]/g, " ");
        })
            .trim();
        // 分割单词，只保留字母和数字
        const words = cleaned
            .split(/[\s-]+/)
            .map(word => word.replace(/[^a-zA-Z0-9]/g, '')) // 移除特殊字符
            .filter(Boolean);
        if (words.length === 0) {
            // 如果没有单词，取前3个字母（移除特殊字符）
            const alphanumeric = mineSiteName.replace(/[^a-zA-Z0-9]/g, '');
            return alphanumeric.substring(0, 3).toUpperCase() || "UNK";
        }
        if (words.length === 1) {
            // 单个单词，取前3个字母
            return words[0].substring(0, 3).toUpperCase();
        }
        // 多个单词，取每个单词首字母
        let initials = words
            .map(word => word[0])
            .join('')
            .toUpperCase();
        // 确保至少有 3 个字母
        if (initials.length < 3) {
            // 如果首字母不够 3 个，从第一个单词补充
            const firstWord = words[0].toUpperCase();
            const needed = 3 - initials.length;
            initials += firstWord.substring(1, 1 + needed);
        }
        // 限制在3-4个字母
        return initials.substring(0, 4);
    }
    /**
     * 生成项目编号
     * 新格式: [年份]-[业务类型]-[矿区代码]-[序号]
     * 示例: 2025-AQ-RTV-001
     *
     * @param mineSiteName - 矿区名称
     * @returns 项目编号字符串
     */
    static async generateProjectNumber(mineSiteName) {
        const year = new Date().getFullYear();
        const siteCode = mineSiteName
            ? this.generateMineSiteCode(mineSiteName)
            : "UNK";
        // 查询同年份、同业务类型、同矿区的最大序号
        const prefix = `${year}-${siteCode}-`;
        const projects = await prisma.projects.findMany({
            where: {
                projectCode: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                projectCode: "desc",
            },
            take: 1,
        });
        let sequence = 1;
        if (projects.length > 0) {
            const lastCode = projects[0].projectCode;
            // 从 2025-AQ-RTV-001 中提取 001
            const match = lastCode.match(/-(\d+)$/);
            if (match) {
                sequence = parseInt(match[1]) + 1;
            }
        }
        // 生成3位序号: 001, 002, ...
        const sequenceStr = sequence.toString().padStart(3, "0");
        return `${year}-${siteCode}-${sequenceStr}`;
    }
}
exports.ProjectNumberService = ProjectNumberService;
//# sourceMappingURL=projectNumberService.js.map