'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Network, Users, Mountain, Gem, FolderKanban, Briefcase } from 'lucide-react';

// 节点颜色配置
const NODE_COLORS = {
  Client: '#3b82f6',      // 蓝色 - 客户
  MineZone: '#10b981',    // 绿色 - 矿区
  Project: '#f59e0b',     // 橙色 - 项目
  User: '#8b5cf6',        // 紫色 - 用户/项目经理
  Mineral: '#ec4899',     // 粉色 - 矿物
  JobType: '#06b6d4',     // 青色 - 项目类型
};

// 节点图标配置
const NODE_ICONS = {
  Client: Users,
  MineZone: Mountain,
  Project: FolderKanban,
  User: Users,
  Mineral: Gem,
  JobType: Briefcase,
};

interface KnowledgeGraphData {
  nodes: any[];
  edges: any[];
}

export default function KnowledgeGraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'client' | 'mineral' | 'manager' | 'similar'>('client');
  const [searchValue, setSearchValue] = useState('');
  const [clients, setClients] = useState<string[]>([]);
  const [minerals, setMinerals] = useState<string[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // 获取客户列表
  useEffect(() => {
    fetchClients();
    fetchMinerals();
    fetchManagers();
    fetchProjects();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/projects/all');
      const data = await response.json();
      if (data.success) {
        const uniqueClients = [...new Set(data.data.map((p: any) => p.clientCompany).filter(Boolean))];
        setClients(uniqueClients as string[]);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  const fetchMinerals = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/projects/all');
      const data = await response.json();
      if (data.success) {
        const uniqueMinerals = [...new Set(data.data.map((p: any) => p.mineralType).filter(Boolean))];
        setMinerals(uniqueMinerals as string[]);
      }
    } catch (error) {
      console.error('获取矿物列表失败:', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/users');
      const data = await response.json();
      if (data.success) {
        setManagers(data.data);
      }
    } catch (error) {
      console.error('获取项目经理列表失败:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/projects/all');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  };

  // 转换知识图谱数据为ReactFlow格式
  const convertToReactFlowData = (data: any, centerNodeId: string): { nodes: Node[], edges: Edge[] } => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const nodeMap = new Map<string, any>();
    const centerX = 800;
    const centerY = 500;
    const centerNodes = new Set<string>(); // 记录中心节点

    console.log('Converting data, total records:', data.length);
    console.log('Center node identifier:', centerNodeId);

    // 第一步：收集所有节点，识别中心节点
    const allNodes = new Map<string, { data: any, label: string, isCenter: boolean }>();

    data.forEach((record: any) => {
      if (record.path && record.path.segments) {
        record.path.segments.forEach((segment: any) => {
          // 检查起始节点
          const startLabel = segment.start.labels[0];
          const startName = segment.start.properties?.name || segment.start.properties?.code;
          const startId = `${startLabel}-${segment.start.properties?.id || segment.start.properties?.code || segment.start.properties?.name}`;

          // 如果节点名称匹配搜索值，标记为中心节点
          const isStartCenter = startName === centerNodeId;
          if (isStartCenter) centerNodes.add(startId);

          if (!allNodes.has(startId)) {
            allNodes.set(startId, { data: segment.start, label: startLabel, isCenter: isStartCenter });
          }

          // 检查结束节点
          const endLabel = segment.end.labels[0];
          const endName = segment.end.properties?.name || segment.end.properties?.code;
          const endId = `${endLabel}-${segment.end.properties?.id || segment.end.properties?.code || segment.end.properties?.name}`;

          const isEndCenter = endName === centerNodeId;
          if (isEndCenter) centerNodes.add(endId);

          if (!allNodes.has(endId)) {
            allNodes.set(endId, { data: segment.end, label: endLabel, isCenter: isEndCenter });
          }
        });
      }
    });

    console.log('Total unique nodes:', allNodes.size);
    console.log('Center nodes:', Array.from(centerNodes));

    // 第二步：计算节点位置
    const surroundingNodes = Array.from(allNodes.entries()).filter(([id]) => !centerNodes.has(id));
    const totalSurrounding = surroundingNodes.length;

    // 辅助函数：添加节点
    const addNode = (nodeData: any, label: string, isCenter: boolean = false, index: number = 0) => {
      if (!nodeData) return null;

      const nodeId = `${label}-${nodeData.properties?.id || nodeData.properties?.code || nodeData.properties?.name || Math.random()}`;

      if (nodeMap.has(nodeId)) return nodeId;

      const Icon = NODE_ICONS[label as keyof typeof NODE_ICONS] || Network;
      const nodeName = nodeData.properties?.name || nodeData.properties?.code || 'Unknown';

      // 计算节点位置
      let position;
      if (isCenter) {
        position = { x: centerX, y: centerY };
      } else {
        // 周围节点：均匀圆形分布
        const angle = (index * 2 * Math.PI) / Math.max(totalSurrounding, 1);
        const radius = 500;
        position = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      }

      const node = {
        id: nodeId,
        type: 'default',
        position,
        data: {
          label: (
            <div className="flex flex-col items-center justify-center text-center">
              <Icon className={`${isCenter ? 'w-8 h-8' : 'w-6 h-6'} mb-1`} />
              <div className={`font-semibold ${isCenter ? 'text-base' : 'text-sm'}`}>
                {nodeName}
              </div>
              <div className="text-xs opacity-75">{label}</div>
            </div>
          )
        },
        style: {
          background: NODE_COLORS[label as keyof typeof NODE_COLORS] || '#6b7280',
          color: 'white',
          border: isCenter ? '4px solid #FFD700' : '3px solid white',
          borderRadius: '50%', // 完全圆形
          padding: isCenter ? '30px' : '20px',
          width: isCenter ? 180 : 140,
          height: isCenter ? 180 : 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isCenter
            ? '0 8px 16px rgba(0,0,0,0.3)'
            : '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: isCenter ? 10 : 1
        }
      };

      flowNodes.push(node);
      nodeMap.set(nodeId, node);
      return nodeId;
    };

    // 第三步：创建所有节点（先创建中心节点，再创建周围节点）
    let surroundingIndex = 0;

    allNodes.forEach(({ data, label, isCenter }, nodeId) => {
      const index = isCenter ? 0 : surroundingIndex++;
      addNode(data, label, isCenter, index);
    });

    // 第四步：创建所有边
    data.forEach((record: any) => {
      if (record.path && record.path.segments) {
        record.path.segments.forEach((segment: any) => {
          const startLabel = segment.start.labels[0];
          const startId = `${startLabel}-${segment.start.properties?.id || segment.start.properties?.code || segment.start.properties?.name}`;

          const endLabel = segment.end.labels[0];
          const endId = `${endLabel}-${segment.end.properties?.id || segment.end.properties?.code || segment.end.properties?.name}`;

          if (startId && endId && nodeMap.has(startId) && nodeMap.has(endId)) {
            const edgeId = `${startId}-${endId}`;
            const reverseEdgeId = `${endId}-${startId}`;

            // 避免重复边
            const edgeExists = flowEdges.some(e => e.id === edgeId || e.id === reverseEdgeId);

            if (!edgeExists) {
              flowEdges.push({
                id: edgeId,
                source: startId,
                target: endId,
                label: segment.relationship.type,
                type: 'smoothstep',
                animated: true,
                style: {
                  stroke: '#94a3b8',
                  strokeWidth: 3
                },
                labelStyle: {
                  fill: '#475569',
                  fontWeight: 600,
                  fontSize: 12
                },
                labelBgStyle: {
                  fill: '#f1f5f9',
                  fillOpacity: 0.9
                }
              });
            }
          }
        });
      }
    });

    console.log(`Converted: ${flowNodes.length} nodes, ${flowEdges.length} edges`);
    return { nodes: flowNodes, edges: flowEdges };
  };

  // 查询知识图谱
  const fetchKnowledgeGraph = async () => {
    if (!searchValue) return;

    setLoading(true);
    try {
      let url = '';

      switch (searchType) {
        case 'client':
          url = `http://localhost:8081/api/knowledge-graph/client/${searchValue}`;
          break;
        case 'mineral':
          url = `http://localhost:8081/api/knowledge-graph/mineral/${searchValue}`;
          break;
        case 'manager':
          url = `http://localhost:8081/api/knowledge-graph/project-manager/${searchValue}`;
          break;
        case 'similar':
          url = `http://localhost:8081/api/knowledge-graph/similar-projects/${searchValue}`;
          break;
      }

      const response = await fetch(url);
      const result = await response.json();

      console.log('API Response:', result);
      console.log('Data length:', result.data?.length);

      if (!result.success) {
        alert('查询失败: ' + result.error);
        setLoading(false);
        return;
      }

      if (result.success && result.data && result.data.length > 0) {
        // 提取实际的路径数据
        const pathData = result.data.map((item: any) => item.result || item).filter(Boolean);

        console.log('Extracted path data:', pathData.length);

        if (pathData.length === 0) {
          alert('没有找到相关数据');
          setLoading(false);
          return;
        }

        const { nodes: flowNodes, edges: flowEdges } = convertToReactFlowData(
          pathData,
          searchValue
        );
        console.log('Converted nodes:', flowNodes.length);
        console.log('Converted edges:', flowEdges.length);

        if (flowNodes.length === 0) {
          alert('没有找到相关数据');
        }

        setNodes(flowNodes);
        setEdges(flowEdges);
      } else {
        alert('没有找到相关数据');
      }
    } catch (error: any) {
      console.error('查询知识图谱失败:', error);
      alert('查询失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部搜索栏 */}
      <Card className="m-4 p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">查询类型</label>
            <Select value={searchType} onValueChange={(value: any) => {
              setSearchType(value);
              setSearchValue('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">客户网络</SelectItem>
                <SelectItem value="mineral">矿物网络</SelectItem>
                <SelectItem value="manager">项目经理</SelectItem>
                <SelectItem value="similar">相似项目推荐</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              {searchType === 'client' && '选择客户'}
              {searchType === 'mineral' && '选择矿物'}
              {searchType === 'manager' && '选择项目经理'}
              {searchType === 'similar' && '选择项目（查找相似项目）'}
            </label>
            {searchType === 'client' && (
              <Select value={searchValue} onValueChange={setSearchValue}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {searchType === 'mineral' && (
              <Select value={searchValue} onValueChange={setSearchValue}>
                <SelectTrigger>
                  <SelectValue placeholder="选择矿物" />
                </SelectTrigger>
                <SelectContent>
                  {minerals.map(mineral => (
                    <SelectItem key={mineral} value={mineral}>{mineral}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {searchType === 'manager' && (
              <Select value={searchValue} onValueChange={setSearchValue}>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目经理" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map(manager => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.realName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {searchType === 'similar' && (
              <Select value={searchValue} onValueChange={setSearchValue}>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.projectCode}>
                      {project.projectCode} - {project.notes || project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            onClick={fetchKnowledgeGraph}
            disabled={loading || !searchValue}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                查询中...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                查询
              </>
            )}
          </Button>
        </div>

        {/* 图例 */}
        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: NODE_COLORS.Client }} />
            <span className="text-sm">客户</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: NODE_COLORS.MineZone }} />
            <span className="text-sm">矿区</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: NODE_COLORS.Project }} />
            <span className="text-sm">项目</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: NODE_COLORS.User }} />
            <span className="text-sm">项目经理</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: NODE_COLORS.Mineral }} />
            <span className="text-sm">矿物</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: NODE_COLORS.JobType }} />
            <span className="text-sm">项目类型</span>
          </div>
        </div>
      </Card>

      {/* 知识图谱画布 */}
      <div className="flex-1 mx-4 mb-4">
        <Card className="h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => node.style?.background as string || '#6b7280'}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            <Panel position="top-right" className="bg-white p-2 rounded shadow">
              <div className="text-sm text-gray-600">
                节点数: {nodes.length} | 关系数: {edges.length}
              </div>
            </Panel>
          </ReactFlow>
        </Card>
      </div>
    </div>
  );
}
