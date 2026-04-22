"use strict";
/**
 * TaskService - Task业务逻辑服务
 *
 * 功能：
 * 1. 创建 Task（生成taskCode，创建文件夹，同步Excel）
 * 2. 更新 Task（更新信息，重命名文件夹，同步Excel）
 * 3. 删除 Task（删除文件夹，从Excel移除）
 * 4. 查询 Task（获取Task列表和详情）
 *
 * 核心流程：
 * - Task 创建 → 生成taskCode → 创建第三层文件夹 → 同步到Excel
 * - Task 是文件和Excel的核心实体，Project只提供前两层文件夹
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const client_1 = require("@prisma/client");
const taskNumberService_1 = require("./taskNumberService");
const taskFolderService_1 = require("./taskFolderService");
const taskExcelSyncService_1 = require("./taskExcelSyncService");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
class TaskService {
    /**
     * 创建 Task（完整流程）
     *
     * 步骤：
     * 1. 验证 Project 是否已审批
     * 2. 生成 taskCode
     * 3. 创建 Task 数据库记录
     * 4. 创建第三层文件夹（复制模板）
     * 5. 同步到 Excel（后续实现）
     */
    static async createTask(input) {
        try {
            logger_1.logger.info('开始创建Task', { input });
            // 1. 验证 Project 是否存在且已审批
            const project = await prisma.projects.findUnique({
                where: { id: input.projectId },
                select: {
                    id: true,
                    name: true,
                    approvalStatus: true,
                    clientCompany: true,
                    mineSiteName: true,
                    mineSiteFolderPath: true,
                },
            });
            if (!project) {
                throw new Error(`Project不存在: ${input.projectId}`);
            }
            if (project.approvalStatus !== 'APPROVED') {
                throw new Error('Project未审批通过，无法创建Task');
            }
            if (!project.mineSiteFolderPath) {
                throw new Error('Project文件夹未创建，请先审批Project');
            }
            // 2. 生成 taskCode (使用 task 的 jobType，而不是 project 的)
            const taskCode = await taskNumberService_1.TaskNumberService.generateTaskCode(input.jobType);
            logger_1.logger.info('taskCode生成成功', { taskCode });
            // 3. 创建 Task 数据库记录（默认为DRAFT状态，需要审批）
            const task = await prisma.tasks.create({
                data: {
                    taskCode,
                    title: input.title,
                    description: input.description,
                    jobType: input.jobType, // 重要：Task 级别的 jobType
                    projectId: input.projectId,
                    authorUserId: input.authorUserId,
                    assignedUserId: input.assignedUserId,
                    priority: input.priority || 'LOW',
                    startDate: input.startDate,
                    dueDate: input.dueDate,
                    estimatedHours: input.estimatedHours,
                    status: 'TODO',
                    approvalStatus: 'DRAFT', // 新建Task默认为草稿状态
                },
            });
            logger_1.logger.info('Task数据库记录创建成功（DRAFT状态，等待审批）', { taskId: task.id, taskCode });
            // 注意：文件夹创建和Excel同步将在审批通过后进行
            // 参考：TaskApprovalService.approveTask()
            // 6. 重新获取完整Task数据
            const fullTask = await prisma.tasks.findUnique({
                where: { id: task.id },
                include: {
                    projects: {
                        select: {
                            id: true,
                            name: true,
                            projectCode: true,
                            // jobType 已删除 - jobType 只在 task 级别定义
                            clientCompany: true,
                            mineSiteName: true,
                        },
                    },
                    users_tasks_authorUserIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                        },
                    },
                    users_tasks_assignedUserIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                        },
                    },
                },
            });
            logger_1.logger.info('Task创建完成（DRAFT状态）', {
                taskId: task.id,
                taskCode,
                approvalStatus: 'DRAFT'
            });
            console.log(`✅ Task创建成功（DRAFT状态）: ${taskCode} ${input.title}`);
            console.log(`   - Task ID: ${task.id}`);
            console.log(`   - 状态: DRAFT，需要审批后才能创建文件夹和同步Excel`);
            return fullTask;
        }
        catch (error) {
            logger_1.logger.error('创建Task失败', {
                input,
                error: error.message,
                stack: error.stack,
            });
            throw new Error(`创建Task失败: ${error.message}`);
        }
    }
    /**
     * 更新 Task
     */
    static async updateTask(taskId, input) {
        try {
            logger_1.logger.info('开始更新Task', { taskId, input });
            const existingTask = await prisma.tasks.findUnique({
                where: { id: taskId },
                select: {
                    id: true,
                    taskCode: true,
                    title: true,
                },
            });
            if (!existingTask) {
                throw new Error(`Task不存在: ${taskId}`);
            }
            // 检查是否需要重命名文件夹
            const shouldRename = input.title && input.title !== existingTask.title;
            // 更新数据库
            const updatedTask = await prisma.tasks.update({
                where: { id: taskId },
                data: input,
                include: {
                    projects: {
                        select: {
                            id: true,
                            name: true,
                            // jobType 已删除 - jobType 只在 task 级别定义
                            clientCompany: true,
                            mineSiteName: true,
                        },
                    },
                    users_tasks_authorUserIdTousers: true,
                    users_tasks_assignedUserIdTousers: true,
                },
            });
            // 如果标题改变，重命名文件夹
            if (shouldRename) {
                logger_1.logger.info('Task标题改变，重命名文件夹', {
                    oldTitle: existingTask.title,
                    newTitle: input.title,
                });
                const renameResult = await taskFolderService_1.TaskFolderService.renameTaskFolder(taskId, existingTask.taskCode, input.title);
                if (!renameResult.success) {
                    logger_1.logger.warn('文件夹重命名失败', { error: renameResult.error });
                }
            }
            // 同步到 Excel（使用行号直接更新）
            if (updatedTask.approvalStatus === 'APPROVED' && updatedTask.excelRowNumber) {
                await taskExcelSyncService_1.TaskExcelSyncService.syncTaskUpdate(taskId);
            }
            logger_1.logger.info('Task更新成功', { taskId });
            return updatedTask;
        }
        catch (error) {
            logger_1.logger.error('更新Task失败', {
                taskId,
                input,
                error: error.message,
            });
            throw new Error(`更新Task失败: ${error.message}`);
        }
    }
    /**
     * 删除 Task
     */
    static async deleteTask(taskId) {
        try {
            logger_1.logger.info('开始删除Task', { taskId });
            const task = await prisma.tasks.findUnique({
                where: { id: taskId },
                select: {
                    id: true,
                    taskCode: true,
                    title: true,
                    excelRowNumber: true,
                },
            });
            if (!task) {
                throw new Error(`Task不存在: ${taskId}`);
            }
            // 1. 删除文件夹
            const deleteResult = await taskFolderService_1.TaskFolderService.deleteTaskFolder(taskId);
            if (!deleteResult.success) {
                logger_1.logger.warn('Task文件夹删除失败', { error: deleteResult.error });
            }
            // 2. 删除数据库记录（级联删除关联的 TaskFile、Comment 等）
            await prisma.tasks.delete({
                where: { id: taskId },
            });
            // 3. 重建整个 Excel（确保数据按业务类型排序）
            if (task.excelRowNumber) {
                logger_1.logger.info('Task已同步到Excel，开始重建Excel', { taskId });
                try {
                    await taskExcelSyncService_1.TaskExcelSyncService.rebuildExcel();
                    logger_1.logger.info('Excel重建完成');
                }
                catch (excelError) {
                    logger_1.logger.warn('Excel重建失败，但Task已删除成功', { taskId, error: excelError.message });
                }
            }
            logger_1.logger.info('Task删除成功', { taskId, taskCode: task.taskCode });
            console.log(`✅ Task删除成功: ${task.taskCode} ${task.title}`);
        }
        catch (error) {
            logger_1.logger.error('删除Task失败', {
                taskId,
                error: error.message,
            });
            throw new Error(`删除Task失败: ${error.message}`);
        }
    }
    /**
     * 获取 Task 详情
     */
    static async getTaskById(taskId) {
        const task = await prisma.tasks.findUnique({
            where: { id: taskId },
            include: {
                projects: {
                    select: {
                        id: true,
                        name: true,
                        projectCode: true,
                        // jobType 已删除 - jobType 只在 task 级别定义
                        clientCompany: true,
                        mineSiteName: true,
                        status: true,
                        priority: true,
                    },
                },
                users_tasks_authorUserIdTousers: {
                    select: {
                        id: true,
                        username: true,
                        realName: true,
                        email: true,
                    },
                },
                users_tasks_assignedUserIdTousers: {
                    select: {
                        id: true,
                        username: true,
                        realName: true,
                        email: true,
                    },
                },
                task_files: {
                    select: {
                        id: true,
                        fileName: true,
                        fileType: true,
                        fileSize: true,
                        uploadedBy: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!task) {
            throw new Error(`Task不存在: ${taskId}`);
        }
        // 映射字段名以符合前端期望
        return {
            ...task,
            assignedUser: task.users_tasks_assignedUserIdTousers,
            authorUser: task.users_tasks_authorUserIdTousers,
        };
    }
    /**
     * 获取 Project 下的所有 Tasks
     */
    static async getTasksByProject(projectId, filters) {
        const where = { projectId };
        if (filters) {
            if (filters.status)
                where.status = filters.status;
            if (filters.priority)
                where.priority = filters.priority;
            if (filters.assignedUserId)
                where.assignedUserId = filters.assignedUserId;
        }
        const tasks = await prisma.tasks.findMany({
            where,
            include: {
                users_tasks_authorUserIdTousers: {
                    select: {
                        id: true,
                        username: true,
                        realName: true,
                    },
                },
                task_files: true,
                users_tasks_assignedUserIdTousers: {
                    select: {
                        id: true,
                        username: true,
                        realName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        // 映射字段名以符合前端期望
        return tasks.map(task => ({
            ...task,
            assignedUser: task.users_tasks_assignedUserIdTousers,
            authorUser: task.users_tasks_authorUserIdTousers,
        }));
    }
    /**
     * 获取所有 Tasks（带搜索、筛选和分页）
     */
    static async getAllTasks(filters, pagination) {
        const where = {};
        console.log('getAllTasks filters:', filters);
        // 基础过滤条件（精确匹配）
        const andConditions = [];
        if (filters) {
            if (filters.status)
                where.status = filters.status;
            if (filters.priority)
                where.priority = filters.priority;
            if (filters.assignedUserId)
                where.assignedUserId = filters.assignedUserId;
            if (filters.projectId)
                where.projectId = filters.projectId;
            if (filters.approvalStatus)
                where.approvalStatus = filters.approvalStatus;
            // Job Type 过滤（直接使用 task.jobType）
            if (filters.jobType) {
                where.jobType = filters.jobType;
            }
            // Mineral 和 Search 条件整合处理
            const hasMineral = filters.mineral && filters.mineral.trim();
            const hasSearch = filters.search && filters.search.trim();
            if (hasMineral && !hasSearch) {
                // 只有 mineral 过滤，没有搜索
                where.mineral = { contains: filters.mineral, mode: 'insensitive' };
            }
            else if (hasSearch) {
                // 有搜索条件，将 mineral 和搜索整合
                const searchTerm = filters.search.trim();
                const searchConditions = [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } },
                    { taskCode: { contains: searchTerm, mode: 'insensitive' } },
                    { mineral: { contains: searchTerm, mode: 'insensitive' } },
                    { tags: { contains: searchTerm, mode: 'insensitive' } },
                    { excelComment: { contains: searchTerm, mode: 'insensitive' } },
                    {
                        projects: {
                            OR: [
                                { name: { contains: searchTerm, mode: 'insensitive' } },
                                { projectCode: { contains: searchTerm, mode: 'insensitive' } },
                                { clientCompany: { contains: searchTerm, mode: 'insensitive' } },
                                { mineSiteName: { contains: searchTerm, mode: 'insensitive' } },
                            ],
                        },
                    },
                    {
                        users_tasks_assignedUserIdTousers: {
                            OR: [
                                { username: { contains: searchTerm, mode: 'insensitive' } },
                                { realName: { contains: searchTerm, mode: 'insensitive' } },
                            ],
                        },
                    },
                ];
                // 如果同时有 mineral 过滤，需要用 AND 组合
                if (hasMineral) {
                    andConditions.push({ mineral: { contains: filters.mineral, mode: 'insensitive' } });
                    andConditions.push({ OR: searchConditions });
                }
                else {
                    where.OR = searchConditions;
                }
            }
            if (filters.dueRange) {
                const now = new Date();
                if (filters.dueRange === 'dueThisWeek') {
                    const end = new Date();
                    end.setDate(end.getDate() + 7);
                    andConditions.push({
                        dueDate: {
                            gte: now,
                            lte: end,
                        },
                    });
                    if (!filters.status) {
                        andConditions.push({
                            status: { not: 'DONE' },
                        });
                    }
                }
                else if (filters.dueRange === 'overdue') {
                    andConditions.push({
                        dueDate: {
                            lt: now,
                        },
                    });
                    if (!filters.status) {
                        andConditions.push({
                            status: { not: 'DONE' },
                        });
                    }
                }
            }
        }
        if (andConditions.length > 0) {
            if (where.AND) {
                if (Array.isArray(where.AND)) {
                    where.AND = [...where.AND, ...andConditions];
                }
                else {
                    where.AND = [where.AND, ...andConditions];
                }
            }
            else {
                where.AND = andConditions;
            }
        }
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 50; // 默认每页50条
        const skip = (page - 1) * limit;
        const [tasks, total] = await Promise.all([
            prisma.tasks.findMany({
                where,
                include: {
                    projects: {
                        select: {
                            id: true,
                            name: true,
                            projectCode: true,
                            // jobType 已删除 - jobType 只在 task 级别定义
                            clientCompany: true,
                            mineSiteName: true,
                        },
                    },
                    task_files: true,
                    users_tasks_authorUserIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                        },
                    },
                    users_tasks_assignedUserIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.tasks.count({ where }),
        ]);
        // 映射字段名以符合前端期望
        const mappedTasks = tasks.map(task => ({
            ...task,
            assignedUser: task.users_tasks_assignedUserIdTousers,
            authorUser: task.users_tasks_authorUserIdTousers,
        }));
        return {
            tasks: mappedTasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * 获取用户的所有 Tasks
     */
    static async getTasksByUser(userId, filters = {}, options = {}) {
        const orFilters = options.includeAuthored
            ? [
                { assignedUserId: userId },
                { authorUserId: userId },
            ]
            : [{ assignedUserId: userId }];
        const where = {
            OR: orFilters,
        };
        if (filters.status)
            where.status = filters.status;
        if (filters.priority)
            where.priority = filters.priority;
        const tasks = await prisma.tasks.findMany({
            where,
            include: {
                projects: {
                    select: {
                        id: true,
                        name: true,
                        // jobType 已删除 - jobType 只在 task 级别定义
                        clientCompany: true,
                        mineSiteName: true,
                    },
                },
                task_files: true,
                users_tasks_authorUserIdTousers: true,
                users_tasks_assignedUserIdTousers: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        // 映射字段名以符合前端期望
        return tasks.map(task => ({
            ...task,
            assignedUser: task.users_tasks_assignedUserIdTousers,
            authorUser: task.users_tasks_authorUserIdTousers,
        }));
    }
    /**
     * 更新 Task 状态
     */
    static async updateTaskStatus(taskId, status) {
        const task = await prisma.tasks.update({
            where: { id: taskId },
            data: {
                status: status,
                completedAt: status === 'DONE' ? new Date() : null,
            },
        });
        // 同步到 Excel
        await taskExcelSyncService_1.TaskExcelSyncService.syncTaskUpdate(taskId);
        logger_1.logger.info('Task状态更新成功', { taskId, status });
        return task;
    }
    /**
     * 批量创建 Tasks
     */
    static async createBatchTasks(projectId, tasks) {
        logger_1.logger.info('开始批量创建Tasks', { projectId, count: tasks.length });
        const createdTasks = [];
        for (const taskInput of tasks) {
            try {
                const task = await this.createTask({
                    ...taskInput,
                    projectId,
                });
                createdTasks.push(task);
            }
            catch (error) {
                logger_1.logger.error('批量创建Task失败', {
                    taskInput,
                    error: error.message,
                });
                // 继续处理其他任务
            }
        }
        logger_1.logger.info('批量创建Tasks完成', {
            total: tasks.length,
            succeeded: createdTasks.length,
            failed: tasks.length - createdTasks.length,
        });
        return createdTasks;
    }
    /**
     * 搜索 Tasks（模糊搜索）
     *
     * 搜索范围：title, description, taskCode, tags, mineral, projectManager
     */
    static async searchTasks(searchTerm, limit = 10) {
        try {
            logger_1.logger.info('开始搜索Tasks', { searchTerm, limit });
            const tasks = await prisma.tasks.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                        { taskCode: { contains: searchTerm, mode: 'insensitive' } },
                        { tags: { contains: searchTerm, mode: 'insensitive' } },
                        { mineral: { contains: searchTerm, mode: 'insensitive' } },
                        { projectManager: { contains: searchTerm, mode: 'insensitive' } },
                        { excelComment: { contains: searchTerm, mode: 'insensitive' } },
                        {
                            projects: {
                                OR: [
                                    { name: { contains: searchTerm, mode: 'insensitive' } },
                                    { projectCode: { contains: searchTerm, mode: 'insensitive' } },
                                    { clientCompany: { contains: searchTerm, mode: 'insensitive' } },
                                    { mineSiteName: { contains: searchTerm, mode: 'insensitive' } },
                                ],
                            },
                        },
                    ],
                },
                include: {
                    projects: {
                        select: {
                            id: true,
                            name: true,
                            projectCode: true,
                            // jobType 已删除 - jobType 只在 task 级别定义
                            clientCompany: true,
                            mineSiteName: true,
                            status: true,
                        },
                    },
                    task_files: true,
                    users_tasks_authorUserIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                        },
                    },
                    users_tasks_assignedUserIdTousers: {
                        select: {
                            id: true,
                            username: true,
                            realName: true,
                        },
                    },
                },
                orderBy: {
                    updatedAt: 'desc',
                },
                take: limit,
            });
            logger_1.logger.info('搜索Tasks完成', { count: tasks.length });
            // 映射字段名以符合前端期望
            return tasks.map(task => ({
                ...task,
                assignedUser: task.users_tasks_assignedUserIdTousers,
                authorUser: task.users_tasks_authorUserIdTousers,
            }));
        }
        catch (error) {
            logger_1.logger.error('搜索Tasks失败', {
                searchTerm,
                error: error.message,
            });
            throw new Error(`搜索Tasks失败: ${error.message}`);
        }
    }
    /**
     * 获取所有唯一的矿物类型
     */
    static async getUniqueMinerals() {
        try {
            const tasks = await prisma.tasks.findMany({
                where: {
                    mineral: {
                        not: null,
                    },
                },
                select: {
                    mineral: true,
                },
                distinct: ['mineral'],
            });
            // 提取矿物名称并排序
            const minerals = tasks
                .map(task => task.mineral)
                .filter(mineral => mineral !== null && mineral.trim() !== '')
                .sort();
            // logger.info('获取唯一矿物类型成功', { count: minerals.length });
            return minerals;
        }
        catch (error) {
            logger_1.logger.error('获取唯一矿物类型失败', {
                error: error.message,
            });
            throw new Error(`获取唯一矿物类型失败: ${error.message}`);
        }
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=taskService.js.map