"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.neo4jService = void 0;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const config_1 = require("../config/config");
/**
 * Neo4j 知识图谱工具类
 * 提供数据库连接、查询执行、节点和关系管理功能
 */
class Neo4jService {
    driver = null;
    /**
     * 初始化 Neo4j 驱动
     */
    async connect() {
        if (this.driver) {
            console.log('Neo4j already connected');
            return;
        }
        try {
            this.driver = neo4j_driver_1.default.driver(config_1.config.neo4j.uri, neo4j_driver_1.default.auth.basic(config_1.config.neo4j.username, config_1.config.neo4j.password));
            // 验证连接
            await this.driver.verifyConnectivity();
            console.log('✅ Neo4j connected successfully');
        }
        catch (error) {
            console.error('❌ Failed to connect to Neo4j:', error);
            throw error;
        }
    }
    /**
     * 关闭 Neo4j 连接
     */
    async disconnect() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            console.log('Neo4j disconnected');
        }
    }
    /**
     * 获取会话
     */
    getSession() {
        if (!this.driver) {
            throw new Error('Neo4j driver not initialized. Call connect() first.');
        }
        return this.driver.session({ database: config_1.config.neo4j.database });
    }
    /**
     * 执行查询
     */
    async executeQuery(query, params = {}) {
        const session = this.getSession();
        try {
            const result = await session.run(query, params);
            return result.records.map(record => record.toObject());
        }
        finally {
            await session.close();
        }
    }
    /**
     * 清空数据库 (谨慎使用！)
     */
    async clearDatabase() {
        console.log('⚠️ Clearing Neo4j database...');
        await this.executeQuery('MATCH (n) DETACH DELETE n');
        console.log('✅ Neo4j database cleared');
    }
    /**
     * 创建索引
     */
    async createIndexes() {
        console.log('📊 Creating Neo4j indexes...');
        const indexes = [
            'CREATE INDEX client_name IF NOT EXISTS FOR (c:Client) ON (c.name)',
            'CREATE INDEX minezone_code IF NOT EXISTS FOR (m:MineZone) ON (m.code)',
            'CREATE INDEX project_code IF NOT EXISTS FOR (p:Project) ON (p.code)',
            'CREATE INDEX user_name IF NOT EXISTS FOR (u:User) ON (u.name)',
            'CREATE INDEX mineral_name IF NOT EXISTS FOR (m:Mineral) ON (m.name)',
        ];
        for (const index of indexes) {
            await this.executeQuery(index);
        }
        console.log('✅ Indexes created successfully');
    }
}
// 导出单例
exports.neo4jService = new Neo4jService();
//# sourceMappingURL=neo4j.js.map