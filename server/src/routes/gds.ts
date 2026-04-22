import express from 'express';
import { GDSService } from '../services/gdsService';
import { cookieAuth } from '../middleware/cookieAuth';

const router = express.Router();
router.use(cookieAuth);

/**
 * @route GET /api/gds/status
 * @desc 检查 GDS 插件是否可用
 */
router.get('/status', async (req, res) => {
  try {
    const available = await GDSService.checkGDSAvailability();

    res.json({
      success: true,
      gdsAvailable: available,
      message: available
        ? 'GDS plugin is available'
        : 'GDS plugin is not installed. Please install it from Neo4j Desktop plugins.'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/gds/graph/create
 * @desc 创建图投影
 */
router.post('/graph/create', async (req, res) => {
  try {
    const { graphName } = req.body;
    const result = await GDSService.createGraphProjection(graphName);

    res.json({
      success: true,
      data: result,
      message: 'Graph projection created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/graph/list
 * @desc 列出所有图投影
 */
router.get('/graph/list', async (req, res) => {
  try {
    const graphs = await GDSService.listGraphProjections();

    res.json({
      success: true,
      data: graphs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/gds/graph/:graphName
 * @desc 删除图投影
 */
router.delete('/graph/:graphName', async (req, res) => {
  try {
    const { graphName } = req.params;
    await GDSService.dropGraphProjection(graphName);

    res.json({
      success: true,
      message: `Graph "${graphName}" dropped successfully`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/similar-projects/:projectCode
 * @desc 使用 Node Similarity 算法找相似项目
 */
router.get('/similar-projects/:projectCode', async (req, res) => {
  try {
    const { projectCode } = req.params;
    const { graphName, similarityCutoff } = req.query;

    const similar = await GDSService.findSimilarProjects(
      projectCode,
      graphName as string,
      parseFloat(similarityCutoff as string) || 0.3
    );

    res.json({
      success: true,
      data: similar
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/communities
 * @desc 社群发现 (Louvain)
 */
router.get('/communities', async (req, res) => {
  try {
    const { graphName } = req.query;
    const communities = await GDSService.detectCommunities(graphName as string);

    res.json({
      success: true,
      data: communities
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/communities/analyze
 * @desc 分析社群特征
 */
router.get('/communities/analyze', async (req, res) => {
  try {
    const { graphName } = req.query;
    const analysis = await GDSService.analyzeCommunities(graphName as string);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/pagerank
 * @desc 计算节点重要性 (PageRank)
 */
router.get('/pagerank', async (req, res) => {
  try {
    const { graphName, nodeType } = req.query;
    const ranking = await GDSService.calculatePageRank(
      graphName as string,
      nodeType as string
    );

    res.json({
      success: true,
      data: ranking
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/bridge-nodes
 * @desc 找出桥梁节点 (Betweenness Centrality)
 */
router.get('/bridge-nodes', async (req, res) => {
  try {
    const { graphName } = req.query;
    const bridges = await GDSService.findBridgeNodes(graphName as string);

    res.json({
      success: true,
      data: bridges
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/label-propagation
 * @desc 快速社群发现 (Label Propagation)
 */
router.get('/label-propagation', async (req, res) => {
  try {
    const { graphName } = req.query;
    const communities = await GDSService.labelPropagation(graphName as string);

    res.json({
      success: true,
      data: communities
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/shortest-path
 * @desc 最短路径查询
 */
router.get('/shortest-path', async (req, res) => {
  try {
    const { sourceLabel, sourceName, targetLabel, targetName, graphName } = req.query;

    const path = await GDSService.findShortestPath(
      sourceLabel as string,
      sourceName as string,
      targetLabel as string,
      targetName as string,
      graphName as string
    );

    res.json({
      success: true,
      data: path
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/gds/recommend/:projectCode
 * @desc 综合推荐算法（Similarity + PageRank + Community）
 */
router.get('/recommend/:projectCode', async (req, res) => {
  try {
    const { projectCode } = req.params;
    const recommendations = await GDSService.comprehensiveRecommendation(projectCode);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
