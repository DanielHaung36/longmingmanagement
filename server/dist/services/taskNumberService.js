"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskNumberService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class TaskNumberService {
    /**
     * 生成任务编号
     *
     * @param jobType - 业务类型 (AT/AC/AQ/AS/AP)
     * @returns taskCode - 任务编号字符串 (例如: AT0001)
     */
    static async generateTaskCode(jobType) {
        try {
            logger_1.logger.info("开始生成TaskCode", { jobType });
            // 查询该业务类型的所有任务编号（需要获取全部以便正确排序）
            // 注意：不能直接用数据库排序，因为 taskCode 是字符串
            const tasks = await prisma.tasks.findMany({
                where: {
                    taskCode: {
                        startsWith: jobType,
                    },
                },
                select: {
                    taskCode: true,
                },
            });
            let sequence = 1;
            if (tasks.length > 0) {
                // 提取所有有效的序号
                const sequences = tasks
                    .map(task => {
                    const match = task.taskCode.match(/^[A-Z]{2}(\d+)$/);
                    return match ? parseInt(match[1]) : 0;
                })
                    .filter(num => num > 0);
                if (sequences.length > 0) {
                    // 找到最大的序号
                    const maxSequence = Math.max(...sequences);
                    sequence = maxSequence + 1;
                    logger_1.logger.info("找到最大序号", { maxSequence, nextSequence: sequence });
                }
            }
            // 生成4位序号: 0001, 0002, ...
            const sequenceStr = sequence.toString().padStart(4, "0");
            const taskCode = `${jobType}${sequenceStr}`;
            logger_1.logger.info("TaskCode生成成功", { taskCode, sequence });
            return taskCode;
        }
        catch (error) {
            logger_1.logger.error("生成TaskCode失败", { jobType, error: error.message });
            throw new Error(`生成TaskCode失败: ${error.message}`);
        }
    }
    /**
     * 验证 taskCode 格式是否正确
     *
     * @param taskCode - 任务编号
     * @returns boolean - 是否符合格式
     */
    static validateTaskCode(taskCode) {
        // 格式: AT0001, AQ0023 等
        const pattern = /^[A-Z]{2}\d{4}$/;
        return pattern.test(taskCode);
    }
    /**
     * 检查 taskCode 是否已存在
     *
     * @param taskCode - 任务编号
     * @returns boolean - 是否已存在
     */
    static async taskCodeExists(taskCode) {
        const count = await prisma.tasks.count({
            where: { taskCode },
        });
        return count > 0;
    }
    /**
     * 获取指定 jobType 的下一个可用序号
     *
     * @param jobType - 业务类型
     * @returns number - 下一个序号
     */
    static async getNextSequence(jobType) {
        const tasks = await prisma.tasks.findMany({
            where: {
                taskCode: {
                    startsWith: jobType,
                },
            },
            select: {
                taskCode: true,
            },
        });
        if (tasks.length === 0) {
            return 1;
        }
        // 提取所有有效的序号并找到最大值
        const sequences = tasks
            .map(task => {
            const match = task.taskCode.match(/^[A-Z]{2}(\d+)$/);
            return match ? parseInt(match[1]) : 0;
        })
            .filter(num => num > 0);
        if (sequences.length === 0) {
            return 1;
        }
        return Math.max(...sequences) + 1;
    }
    /**
     * 从 taskCode 中提取 jobType
     *
     * @param taskCode - 任务编号 (例如: AT0001)
     * @returns jobType - 业务类型 (例如: AT)
     */
    static extractJobType(taskCode) {
        const match = taskCode.match(/^([A-Z]{2})\d{4}$/);
        return match ? match[1] : null;
    }
    /**
     * 从 taskCode 中提取序号
     *
     * @param taskCode - 任务编号 (例如: AT0001)
     * @returns sequence - 序号 (例如: 1)
     */
    static extractSequence(taskCode) {
        const match = taskCode.match(/^[A-Z]{2}(\d{4})$/);
        return match ? parseInt(match[1]) : null;
    }
    /**
     * 批量生成多个 taskCode
     *
     * @param jobType - 业务类型
     * @param count - 需要生成的数量
     * @returns string[] - taskCode 数组
     */
    static async generateBatchTaskCodes(jobType, count) {
        const startSequence = await this.getNextSequence(jobType);
        const codes = [];
        for (let i = 0; i < count; i++) {
            const sequence = startSequence + i;
            const sequenceStr = sequence.toString().padStart(4, "0");
            codes.push(`${jobType}${sequenceStr}`);
        }
        return codes;
    }
}
exports.TaskNumberService = TaskNumberService;
//# sourceMappingURL=taskNumberService.js.map