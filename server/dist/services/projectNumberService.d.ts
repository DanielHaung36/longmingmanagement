export declare class ProjectNumberService {
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
    static generateMineSiteCode(mineSiteName: string): string;
    /**
     * 生成项目编号
     * 新格式: [年份]-[业务类型]-[矿区代码]-[序号]
     * 示例: 2025-AQ-RTV-001
     *
     * @param mineSiteName - 矿区名称
     * @returns 项目编号字符串
     */
    static generateProjectNumber(mineSiteName?: string): Promise<string>;
}
//# sourceMappingURL=projectNumberService.d.ts.map