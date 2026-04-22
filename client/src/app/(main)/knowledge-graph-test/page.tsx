'use client';

import React from 'react';

export default function KnowledgeGraphTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">知识图谱测试页面</h1>
      <p className="text-gray-600">如果你能看到这个页面，说明路由是正常的。</p>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-lg font-semibold mb-2">测试信息</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>✅ 页面路由正常</li>
          <li>✅ 组件渲染正常</li>
          <li>⏳ 正在准备完整的知识图谱功能...</li>
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">API 测试</h2>
        <div className="space-y-2">
          <button
            onClick={() => {
              fetch('http://localhost:8081/api/knowledge-graph/client/HanRoy')
                .then(res => res.json())
                .then(data => {
                  console.log('客户网络数据:', data);
                  alert('查询成功！请查看浏览器控制台');
                })
                .catch(err => alert('查询失败: ' + err.message));
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            测试客户网络查询 (HanRoy)
          </button>
        </div>
      </div>
    </div>
  );
}
