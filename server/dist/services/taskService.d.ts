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
export interface CreateTaskInput {
    title: string;
    description?: string;
    jobType: 'AC' | 'AP' | 'AQ' | 'AS' | 'AT';
    projectId: number;
    authorUserId: number;
    mineral?: string;
    assignedUserId?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    tags?: string;
    contactCompany?: string;
    excelComment?: string;
    projectManager?: string;
    quotationNumber?: string;
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
}
export interface UpdateTaskInput {
    title?: string;
    description?: string;
    status?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignedUserId?: number;
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    progress?: number;
}
export declare class TaskService {
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
    static createTask(input: CreateTaskInput): Promise<any>;
    /**
     * 更新 Task
     */
    static updateTask(taskId: number, input: UpdateTaskInput): Promise<any>;
    /**
     * 删除 Task
     */
    static deleteTask(taskId: number): Promise<void>;
    /**
     * 获取 Task 详情
     */
    static getTaskById(taskId: number): Promise<any>;
    /**
     * 获取 Project 下的所有 Tasks
     */
    static getTasksByProject(projectId: number, filters?: {
        status?: string;
        priority?: string;
        assignedUserId?: number;
    }): Promise<any[]>;
    /**
     * 获取所有 Tasks（带搜索、筛选和分页）
     */
    static getAllTasks(filters?: {
        search?: string;
        jobType?: string;
        mineral?: string;
        status?: string;
        priority?: string;
        assignedUserId?: number;
        projectId?: number;
        approvalStatus?: string;
        dueRange?: 'dueThisWeek' | 'overdue';
    }, pagination?: {
        page?: number;
        limit?: number;
    }): Promise<any>;
    /**
     * 获取用户的所有 Tasks
     */
    static getTasksByUser(userId: number, filters?: {
        status?: string;
        priority?: string;
    }, options?: {
        includeAuthored?: boolean;
    }): Promise<any[]>;
    /**
     * 更新 Task 状态
     */
    static updateTaskStatus(taskId: number, status: string): Promise<any>;
    /**
     * 批量创建 Tasks
     */
    static createBatchTasks(projectId: number, tasks: Omit<CreateTaskInput, 'projectId'>[]): Promise<any[]>;
    /**
     * 搜索 Tasks（模糊搜索）
     *
     * 搜索范围：title, description, taskCode, tags, mineral, projectManager
     */
    static searchTasks(searchTerm: string, limit?: number): Promise<any[]>;
    /**
     * 获取所有唯一的矿物类型
     */
    static getUniqueMinerals(): Promise<string[]>;
}
//# sourceMappingURL=taskService.d.ts.map