/**
 * TaskNumberService - Task编号生成服务
 *
 * 功能：生成任务编号（taskCode）
 * 规则：使用原 projectCode 的生成规则
 * 格式：{jobType}{4位序号}
 * 示例：AT0001, AT0002, AQ0001, AC0001
 *
 * 特点：
 * - 按 jobType 全局递增（不是按 Project 递增）
 * - 与原 projectCode 格式完全相同，只是现在用于 Task
 */
export declare class TaskNumberService {
    /**
     * 生成任务编号
     *
     * @param jobType - 业务类型 (AT/AC/AQ/AS/AP)
     * @returns taskCode - 任务编号字符串 (例如: AT0001)
     */
    static generateTaskCode(jobType: string): Promise<string>;
    /**
     * 验证 taskCode 格式是否正确
     *
     * @param taskCode - 任务编号
     * @returns boolean - 是否符合格式
     */
    static validateTaskCode(taskCode: string): boolean;
    /**
     * 检查 taskCode 是否已存在
     *
     * @param taskCode - 任务编号
     * @returns boolean - 是否已存在
     */
    static taskCodeExists(taskCode: string): Promise<boolean>;
    /**
     * 获取指定 jobType 的下一个可用序号
     *
     * @param jobType - 业务类型
     * @returns number - 下一个序号
     */
    static getNextSequence(jobType: string): Promise<number>;
    /**
     * 从 taskCode 中提取 jobType
     *
     * @param taskCode - 任务编号 (例如: AT0001)
     * @returns jobType - 业务类型 (例如: AT)
     */
    static extractJobType(taskCode: string): string | null;
    /**
     * 从 taskCode 中提取序号
     *
     * @param taskCode - 任务编号 (例如: AT0001)
     * @returns sequence - 序号 (例如: 1)
     */
    static extractSequence(taskCode: string): number | null;
    /**
     * 批量生成多个 taskCode
     *
     * @param jobType - 业务类型
     * @param count - 需要生成的数量
     * @returns string[] - taskCode 数组
     */
    static generateBatchTaskCodes(jobType: string, count: number): Promise<string[]>;
}
//# sourceMappingURL=taskNumberService.d.ts.map