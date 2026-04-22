/**
 * Graph Data Science (GDS) 服务
 * 封装 Neo4j GDS 插件的高级图算法
 */
export declare class GDSService {
    /**
     * 创建图投影到内存
     */
    static createGraphProjection(graphName?: string): Promise<any>;
    /**
     * Node Similarity - 计算节点相似度
     * 找出最相似的项目（基于共享的客户、矿物、项目类型等）
     */
    static findSimilarProjects(projectCode: string, graphName?: string, similarityCutoff?: number): Promise<any>;
    /**
     * Louvain Community Detection - 社群发现
     * 自动将客户、项目、矿物分成不同的社群
     */
    static detectCommunities(graphName?: string): Promise<any>;
    /**
     * 分析社群特征
     * 统计每个社群的组成和特点
     */
    static analyzeCommunities(graphName?: string): Promise<any>;
    /**
     * PageRank - 计算节点重要性
     * 找出最重要的客户、项目、矿物
     */
    static calculatePageRank(graphName?: string, nodeType?: string): Promise<any>;
    /**
     * Betweenness Centrality - 找出桥梁节点
     * 识别连接不同社群的关键节点
     */
    static findBridgeNodes(graphName?: string): Promise<any>;
    /**
     * Label Propagation - 快速社群发现
     * 比 Louvain 更快，适合大规模图
     */
    static labelPropagation(graphName?: string): Promise<any>;
    /**
     * Shortest Path - 最短路径
     * 找两个节点之间的最短路径（例如客户到矿物）
     */
    static findShortestPath(sourceLabel: string, sourceName: string, targetLabel: string, targetName: string, graphName?: string): Promise<any>;
    /**
     * 综合推荐算法
     * 结合 Node Similarity + PageRank + Community
     */
    static comprehensiveRecommendation(projectCode: string): Promise<any>;
    /**
     * 删除图投影
     */
    static dropGraphProjection(graphName: string): Promise<void>;
    /**
     * 列出所有图投影
     */
    static listGraphProjections(): Promise<any>;
    /**
     * 检查 GDS 是否可用
     */
    static checkGDSAvailability(): Promise<boolean>;
}
//# sourceMappingURL=gdsService.d.ts.map