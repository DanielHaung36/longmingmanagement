/**
 * Redis配置文件
 *
 * 用途：
 * - 缓存频繁查询的数据（项目列表、用户信息等）
 * - Session存储（替代JWT或配合JWT使用）
 * - 分布式锁（防止并发问题）
 * - 消息队列（异步任务处理）
 * - 实时数据（WebSocket连接管理、在线用户等）
 *
 * ⚠️ 注意：当前为预留配置，暂未启用
 *
 * 启用步骤：
 * 1. 安装依赖：npm install redis
 * 2. 取消注释下面的 import 语句
 * 3. 启动Redis服务器：docker run -d -p 6379:6379 redis:7-alpine
 * 4. 在.env中设置 REDIS_ENABLED=true
 * 5. 在index.ts中调用 redis.connect()
 *
 * 使用示例：
 * - 缓存装饰器：@Cache('project_list', 300)
 * - 失效装饰器：@InvalidateCache(['project_list*'])
 * - 手动操作：await redis.set('key', value, 600)
 */
export interface RedisConfig {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    ttl: {
        default: number;
        projectList: number;
        userInfo: number;
        stats: number;
    };
}
export declare const redisConfig: RedisConfig;
declare class RedisService {
    private client;
    private isConnected;
    /**
     * 初始化Redis连接
     */
    connect(): Promise<void>;
    /**
     * 断开Redis连接
     */
    disconnect(): Promise<void>;
    /**
     * 检查连接状态
     */
    isReady(): boolean;
    /**
     * 获取缓存
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * 设置缓存
     */
    set(key: string, value: any, ttl?: number): Promise<boolean>;
    /**
     * 删除缓存
     */
    del(key: string): Promise<boolean>;
    /**
     * 批量删除缓存（支持通配符）
     */
    delPattern(pattern: string): Promise<number>;
    /**
     * 清空所有缓存
     */
    flushAll(): Promise<boolean>;
    /**
     * 获取缓存统计信息
     */
    getStats(): Promise<{
        keys: number;
        memory: string;
    } | null>;
}
export declare const redis: RedisService;
/**
 * 缓存装饰器工厂（用于Service方法）
 *
 * 使用示例：
 * @Cache('project_list', 300)
 * async getAllProjects() {
 *   // 查询数据库
 *   return projects;
 * }
 */
export declare function Cache(keyPrefix: string, ttl?: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * 缓存失效装饰器（用于更新/删除方法）
 *
 * 使用示例：
 * @InvalidateCache(['project_list*', 'project_stats'])
 * async updateProject(id: number, data: any) {
 *   // 更新数据库
 *   return project;
 * }
 */
export declare function InvalidateCache(patterns: string[]): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export {};
//# sourceMappingURL=redis.config.d.ts.map