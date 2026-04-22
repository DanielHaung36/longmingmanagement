"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.redisConfig = void 0;
exports.Cache = Cache;
exports.InvalidateCache = InvalidateCache;
// ⚠️ 启用Redis时，取消注释以下两行：
// import { createClient, RedisClientType } from 'redis';
const logger_1 = require("../utils/logger");
exports.redisConfig = {
    enabled: process.env.REDIS_ENABLED === 'true' || false,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'longi_pm:',
    ttl: {
        default: 3600, // 1小时
        projectList: 300, // 5分钟
        userInfo: 1800, // 30分钟
        stats: 600, // 10分钟
    }
};
class RedisService {
    client = null;
    isConnected = false;
    /**
     * 初始化Redis连接
     */
    async connect() {
        if (!exports.redisConfig.enabled) {
            logger_1.logger.info('Redis未启用，跳过连接');
            return;
        }
        try {
            // ⚠️ 启用Redis时取消注释：
            // this.client = createClient({
            //   socket: {
            //     host: redisConfig.host,
            //     port: redisConfig.port,
            //   },
            //   password: redisConfig.password,
            //   database: redisConfig.db,
            // });
            // 临时占位（启用Redis后移除）
            this.client = null;
            // ⚠️ 启用Redis时取消注释：
            // this.client.on('error', (err) => {
            //   logger.error('Redis连接错误', { error: err.message });
            //   this.isConnected = false;
            // });
            // this.client.on('connect', () => {
            //   logger.info('Redis连接成功', { host: redisConfig.host, port: redisConfig.port });
            //   this.isConnected = true;
            // });
            // this.client.on('disconnect', () => {
            //   logger.warn('Redis断开连接');
            //   this.isConnected = false;
            // });
            // await this.client.connect();
        }
        catch (error) {
            logger_1.logger.error('Redis初始化失败', { error: error.message });
            this.client = null;
            this.isConnected = false;
        }
    }
    /**
     * 断开Redis连接
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
            logger_1.logger.info('Redis连接已关闭');
        }
    }
    /**
     * 检查连接状态
     */
    isReady() {
        return this.isConnected && this.client !== null;
    }
    /**
     * 获取缓存
     */
    async get(key) {
        if (!this.isReady())
            return null;
        try {
            const fullKey = exports.redisConfig.keyPrefix + key;
            const value = await this.client.get(fullKey);
            if (!value) {
                logger_1.logger.debug('缓存未命中', { key });
                return null;
            }
            logger_1.logger.debug('缓存命中', { key });
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error('获取缓存失败', { key, error: error.message });
            return null;
        }
    }
    /**
     * 设置缓存
     */
    async set(key, value, ttl) {
        if (!this.isReady())
            return false;
        try {
            const fullKey = exports.redisConfig.keyPrefix + key;
            const serialized = JSON.stringify(value);
            const expireTime = ttl || exports.redisConfig.ttl.default;
            await this.client.setEx(fullKey, expireTime, serialized);
            logger_1.logger.debug('缓存已设置', { key, ttl: expireTime });
            return true;
        }
        catch (error) {
            logger_1.logger.error('设置缓存失败', { key, error: error.message });
            return false;
        }
    }
    /**
     * 删除缓存
     */
    async del(key) {
        if (!this.isReady())
            return false;
        try {
            const fullKey = exports.redisConfig.keyPrefix + key;
            await this.client.del(fullKey);
            logger_1.logger.debug('缓存已删除', { key });
            return true;
        }
        catch (error) {
            logger_1.logger.error('删除缓存失败', { key, error: error.message });
            return false;
        }
    }
    /**
     * 批量删除缓存（支持通配符）
     */
    async delPattern(pattern) {
        if (!this.isReady())
            return 0;
        try {
            const fullPattern = exports.redisConfig.keyPrefix + pattern;
            const keys = await this.client.keys(fullPattern);
            if (keys.length === 0) {
                logger_1.logger.debug('没有匹配的缓存', { pattern });
                return 0;
            }
            await this.client.del(keys);
            logger_1.logger.debug('批量删除缓存', { pattern, count: keys.length });
            return keys.length;
        }
        catch (error) {
            logger_1.logger.error('批量删除缓存失败', { pattern, error: error.message });
            return 0;
        }
    }
    /**
     * 清空所有缓存
     */
    async flushAll() {
        if (!this.isReady())
            return false;
        try {
            await this.client.flushDb();
            logger_1.logger.warn('所有缓存已清空');
            return true;
        }
        catch (error) {
            logger_1.logger.error('清空缓存失败', { error: error.message });
            return false;
        }
    }
    /**
     * 获取缓存统计信息
     */
    async getStats() {
        if (!this.isReady())
            return null;
        try {
            const dbSize = await this.client.dbSize();
            const info = await this.client.info('memory');
            const memoryMatch = info.match(/used_memory_human:(.+)/);
            const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';
            return { keys: dbSize, memory };
        }
        catch (error) {
            logger_1.logger.error('获取缓存统计失败', { error: error.message });
            return null;
        }
    }
}
exports.redis = new RedisService();
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
function Cache(keyPrefix, ttl) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            // 生成缓存key（包含参数）
            const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
            // 尝试从缓存获取
            const cached = await exports.redis.get(cacheKey);
            if (cached !== null) {
                logger_1.logger.debug('使用缓存数据', { method: propertyKey, key: cacheKey });
                return cached;
            }
            // 缓存未命中，执行原方法
            const result = await originalMethod.apply(this, args);
            // 存入缓存
            await exports.redis.set(cacheKey, result, ttl);
            return result;
        };
        return descriptor;
    };
}
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
function InvalidateCache(patterns) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            // 执行原方法
            const result = await originalMethod.apply(this, args);
            // 删除相关缓存
            for (const pattern of patterns) {
                await exports.redis.delPattern(pattern);
                logger_1.logger.debug('缓存已失效', { method: propertyKey, pattern });
            }
            return result;
        };
        return descriptor;
    };
}
//# sourceMappingURL=redis.config.js.map