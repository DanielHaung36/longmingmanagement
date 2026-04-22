"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDSService = void 0;
const neo4j_1 = require("../utils/neo4j");
/**
 * Graph Data Science (GDS) 服务
 * 封装 Neo4j GDS 插件的高级图算法
 */
class GDSService {
    /**
     * 创建图投影到内存
     */
    static async createGraphProjection(graphName = 'projectGraph') {
        // 先检查图是否已存在，如果存在则删除
        try {
            await neo4j_1.neo4jService.executeQuery(`
        CALL gds.graph.drop($graphName)
      `, { graphName });
        }
        catch (error) {
            // 图不存在，忽略错误
        }
        // 创建新的图投影
        const query = `
      CALL gds.graph.project(
        $graphName,
        ['Project', 'Client', 'Mineral', 'JobType', 'User', 'MineZone'],
        {
          BELONGS_TO: { orientation: 'NATURAL' },
          INVOLVES: { orientation: 'NATURAL' },
          HAS_TYPE: { orientation: 'NATURAL' },
          MANAGED_BY: { orientation: 'NATURAL' },
          LOCATED_AT: { orientation: 'NATURAL' },
          OWNS: { orientation: 'NATURAL' },
          PRODUCES: { orientation: 'NATURAL' }
        }
      )
      YIELD graphName, nodeCount, relationshipCount
    `;
        return neo4j_1.neo4jService.executeQuery(query, { graphName });
    }
    /**
     * Node Similarity - 计算节点相似度
     * 找出最相似的项目（基于共享的客户、矿物、项目类型等）
     */
    static async findSimilarProjects(projectCode, graphName = 'projectGraph', similarityCutoff = 0.3) {
        const query = `
      MATCH (p:Project {code: $projectCode})
      CALL gds.nodeSimilarity.stream($graphName, {
        similarityCutoff: $similarityCutoff
      })
      YIELD node1, node2, similarity
      WHERE node1 = id(p) OR node2 = id(p)
      WITH
        CASE WHEN node1 = id(p) THEN node2 ELSE node1 END AS otherId,
        similarity
      WITH gds.util.asNode(otherId) AS other, similarity
      WHERE other:Project AND other.code <> $projectCode
      RETURN
        other.code AS projectCode,
        other.name AS projectName,
        other.clientCompany AS client,
        other.mineralType AS mineral,
        other.jobType AS jobType,
        similarity
      ORDER BY similarity DESC
      LIMIT 10
    `;
        return neo4j_1.neo4jService.executeQuery(query, {
            projectCode,
            graphName,
            similarityCutoff
        });
    }
    /**
     * Louvain Community Detection - 社群发现
     * 自动将客户、项目、矿物分成不同的社群
     */
    static async detectCommunities(graphName = 'projectGraph') {
        const query = `
      CALL gds.louvain.stream($graphName)
      YIELD nodeId, communityId
      WITH gds.util.asNode(nodeId) AS node, communityId
      RETURN
        labels(node)[0] AS nodeType,
        CASE
          WHEN 'Client' IN labels(node) THEN node.name
          WHEN 'Project' IN labels(node) THEN node.code
          WHEN 'Mineral' IN labels(node) THEN node.name
          WHEN 'JobType' IN labels(node) THEN node.name
          WHEN 'User' IN labels(node) THEN node.name
          ELSE 'Unknown'
        END AS nodeName,
        communityId
      ORDER BY communityId, nodeType
    `;
        return neo4j_1.neo4jService.executeQuery(query, { graphName });
    }
    /**
     * 分析社群特征
     * 统计每个社群的组成和特点
     */
    static async analyzeCommunities(graphName = 'projectGraph') {
        // 先运行社群检测并写入属性
        await neo4j_1.neo4jService.executeQuery(`
      CALL gds.louvain.write($graphName, {
        writeProperty: 'communityId'
      })
    `, { graphName });
        // 分析每个社群
        const query = `
      MATCH (n)
      WHERE n.communityId IS NOT NULL
      WITH n.communityId AS community, labels(n)[0] AS nodeType, n
      RETURN
        community,
        nodeType,
        count(n) AS nodeCount,
        collect(
          CASE
            WHEN 'Client' IN labels(n) THEN n.name
            WHEN 'Project' IN labels(n) THEN n.code
            WHEN 'Mineral' IN labels(n) THEN n.name
            WHEN 'JobType' IN labels(n) THEN n.name
            WHEN 'User' IN labels(n) THEN n.name
            ELSE 'Unknown'
          END
        )[..5] AS sampleNodes
      ORDER BY community, nodeType
    `;
        return neo4j_1.neo4jService.executeQuery(query, {});
    }
    /**
     * PageRank - 计算节点重要性
     * 找出最重要的客户、项目、矿物
     */
    static async calculatePageRank(graphName = 'projectGraph', nodeType) {
        const query = `
      CALL gds.pageRank.stream($graphName)
      YIELD nodeId, score
      WITH gds.util.asNode(nodeId) AS node, score
      ${nodeType ? 'WHERE $nodeType IN labels(node)' : ''}
      RETURN
        labels(node)[0] AS nodeType,
        CASE
          WHEN 'Client' IN labels(node) THEN node.name
          WHEN 'Project' IN labels(node) THEN node.code
          WHEN 'Mineral' IN labels(node) THEN node.name
          WHEN 'JobType' IN labels(node) THEN node.name
          WHEN 'User' IN labels(node) THEN node.name
          ELSE 'Unknown'
        END AS nodeName,
        score
      ORDER BY score DESC
      LIMIT 20
    `;
        return neo4j_1.neo4jService.executeQuery(query, { graphName, nodeType });
    }
    /**
     * Betweenness Centrality - 找出桥梁节点
     * 识别连接不同社群的关键节点
     */
    static async findBridgeNodes(graphName = 'projectGraph') {
        const query = `
      CALL gds.betweenness.stream($graphName)
      YIELD nodeId, score
      WITH gds.util.asNode(nodeId) AS node, score
      WHERE score > 0
      RETURN
        labels(node)[0] AS nodeType,
        CASE
          WHEN 'Client' IN labels(node) THEN node.name
          WHEN 'Project' IN labels(node) THEN node.code
          WHEN 'Mineral' IN labels(node) THEN node.name
          WHEN 'User' IN labels(node) THEN node.name
          ELSE 'Unknown'
        END AS nodeName,
        score AS bridgeScore
      ORDER BY score DESC
      LIMIT 20
    `;
        return neo4j_1.neo4jService.executeQuery(query, { graphName });
    }
    /**
     * Label Propagation - 快速社群发现
     * 比 Louvain 更快，适合大规模图
     */
    static async labelPropagation(graphName = 'projectGraph') {
        const query = `
      CALL gds.labelPropagation.stream($graphName)
      YIELD nodeId, communityId
      WITH gds.util.asNode(nodeId) AS node, communityId
      RETURN
        labels(node)[0] AS nodeType,
        CASE
          WHEN 'Client' IN labels(node) THEN node.name
          WHEN 'Project' IN labels(node) THEN node.code
          WHEN 'Mineral' IN labels(node) THEN node.name
          ELSE 'Unknown'
        END AS nodeName,
        communityId
      ORDER BY communityId, nodeType
      LIMIT 100
    `;
        return neo4j_1.neo4jService.executeQuery(query, { graphName });
    }
    /**
     * Shortest Path - 最短路径
     * 找两个节点之间的最短路径（例如客户到矿物）
     */
    static async findShortestPath(sourceLabel, sourceName, targetLabel, targetName, graphName = 'projectGraph') {
        const query = `
      MATCH (source:${sourceLabel} {name: $sourceName})
      MATCH (target:${targetLabel} {name: $targetName})
      CALL gds.shortestPath.dijkstra.stream($graphName, {
        sourceNode: source,
        targetNode: target
      })
      YIELD index, sourceNode, targetNode, totalCost, nodeIds, path
      RETURN path, totalCost
    `;
        return neo4j_1.neo4jService.executeQuery(query, {
            sourceName,
            targetName,
            graphName
        });
    }
    /**
     * 综合推荐算法
     * 结合 Node Similarity + PageRank + Community
     */
    static async comprehensiveRecommendation(projectCode) {
        const graphName = 'recommendationGraph';
        try {
            // 1. 创建图投影
            await this.createGraphProjection(graphName);
            // 2. 运行社群检测
            await neo4j_1.neo4jService.executeQuery(`
        CALL gds.louvain.write($graphName, {
          writeProperty: 'tempCommunityId'
        })
      `, { graphName });
            // 3. 计算 PageRank
            await neo4j_1.neo4jService.executeQuery(`
        CALL gds.pageRank.write($graphName, {
          writeProperty: 'tempPageRank'
        })
      `, { graphName });
            // 4. 综合查询
            const query = `
        MATCH (p:Project {code: $projectCode})
        CALL gds.nodeSimilarity.stream($graphName, {
          similarityCutoff: 0.2
        })
        YIELD node1, node2, similarity
        WHERE node1 = id(p) OR node2 = id(p)
        WITH
          CASE WHEN node1 = id(p) THEN node2 ELSE node1 END AS otherId,
          similarity
        WITH gds.util.asNode(otherId) AS other, similarity
        WHERE other:Project AND other.code <> $projectCode
        RETURN
          other.code AS projectCode,
          other.name AS projectName,
          other.clientCompany AS client,
          other.mineralType AS mineral,
          other.tempCommunityId AS community,
          other.tempPageRank AS importance,
          similarity,
          (similarity * 0.5 + other.tempPageRank * 100 * 0.3 + CASE WHEN other.tempCommunityId = p.tempCommunityId THEN 0.2 ELSE 0 END) AS finalScore
        ORDER BY finalScore DESC
        LIMIT 10
      `;
            const result = await neo4j_1.neo4jService.executeQuery(query, { projectCode, graphName });
            // 5. 清理临时属性
            await neo4j_1.neo4jService.executeQuery(`
        MATCH (n)
        WHERE n.tempCommunityId IS NOT NULL OR n.tempPageRank IS NOT NULL
        REMOVE n.tempCommunityId, n.tempPageRank
      `, {});
            // 6. 删除图投影
            await neo4j_1.neo4jService.executeQuery(`
        CALL gds.graph.drop($graphName)
      `, { graphName });
            return result;
        }
        catch (error) {
            // 确保清理资源
            try {
                await neo4j_1.neo4jService.executeQuery(`CALL gds.graph.drop($graphName)`, { graphName });
            }
            catch (e) {
                // 忽略删除错误
            }
            throw error;
        }
    }
    /**
     * 删除图投影
     */
    static async dropGraphProjection(graphName) {
        try {
            await neo4j_1.neo4jService.executeQuery(`
        CALL gds.graph.drop($graphName)
      `, { graphName });
        }
        catch (error) {
            // 图不存在，忽略错误
        }
    }
    /**
     * 列出所有图投影
     */
    static async listGraphProjections() {
        const query = `
      CALL gds.graph.list()
      YIELD graphName, nodeCount, relationshipCount, creationTime
      RETURN graphName, nodeCount, relationshipCount, creationTime
    `;
        return neo4j_1.neo4jService.executeQuery(query, {});
    }
    /**
     * 检查 GDS 是否可用
     */
    static async checkGDSAvailability() {
        try {
            await neo4j_1.neo4jService.executeQuery(`RETURN gds.version() AS version`, {});
            return true;
        }
        catch (error) {
            console.error('GDS not available:', error);
            return false;
        }
    }
}
exports.GDSService = GDSService;
//# sourceMappingURL=gdsService.js.map