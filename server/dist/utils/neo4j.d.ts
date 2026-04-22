import { Session } from 'neo4j-driver';
/**
 * Neo4j 知识图谱工具类
 * 提供数据库连接、查询执行、节点和关系管理功能
 */
declare class Neo4jService {
    private driver;
    /**
     * 初始化 Neo4j 驱动
     */
    connect(): Promise<void>;
    /**
     * 关闭 Neo4j 连接
     */
    disconnect(): Promise<void>;
    /**
     * 获取会话
     */
    getSession(): Session;
    /**
     * 执行查询
     */
    executeQuery<T = any>(query: string, params?: any): Promise<T[]>;
    /**
     * 清空数据库 (谨慎使用！)
     */
    clearDatabase(): Promise<void>;
    /**
     * 创建索引
     */
    createIndexes(): Promise<void>;
}
export declare const neo4jService: Neo4jService;
export {};
//# sourceMappingURL=neo4j.d.ts.map