#!/bin/bash
BASE_URL="http://localhost:8081"

echo "=========================================="
echo "🧪 测试所有 API 接口"
echo "=========================================="
echo ""

# 1. 测试根路径
echo "1️⃣ 测试根路径 GET /"
curl -s "$BASE_URL/" | jq -r '.message, .version' || echo "❌ 根路径测试失败"
echo ""

# 2. 测试用户列表
echo "2️⃣ 测试用户列表 GET /api/users"
USERS=$(curl -s "$BASE_URL/api/users")
USER_COUNT=$(echo "$USERS" | jq -r '.users | length')
echo "✅ 用户数量: $USER_COUNT"
echo ""

# 3. 测试项目列表
echo "3️⃣ 测试项目列表 GET /api/projects"
PROJECTS=$(curl -s "$BASE_URL/api/projects")
PROJECT_COUNT=$(echo "$PROJECTS" | jq -r 'length')
echo "✅ 项目数量: $PROJECT_COUNT"
echo ""

# 4. 测试任务列表
echo "4️⃣ 测试任务列表 GET /api/tasks"
TASKS=$(curl -s "$BASE_URL/api/tasks?page=1&limit=10")
TASK_COUNT=$(echo "$TASKS" | jq -r '.tasks | length')
echo "✅ 任务数量: $TASK_COUNT"
echo ""

# 5. 测试矿区列表
echo "5️⃣ 测试矿区列表 GET /api/mine-zones"
MINEZONES=$(curl -s "$BASE_URL/api/mine-zones")
MINEZONE_COUNT=$(echo "$MINEZONES" | jq -r 'length')
echo "✅ 矿区数量: $MINEZONE_COUNT"
echo ""

# 6. 测试通知列表
echo "6️⃣ 测试通知列表 GET /api/notifications/user/1"
NOTIFICATIONS=$(curl -s "$BASE_URL/api/notifications/user/1")
NOTIF_COUNT=$(echo "$NOTIFICATIONS" | jq -r '.notifications | length')
echo "✅ 通知数量: $NOTIF_COUNT"
echo ""

# 7. 测试评论查询
echo "7️⃣ 测试评论查询 GET /api/comments/task/236"
COMMENTS=$(curl -s "$BASE_URL/api/comments/task/236")
COMMENT_COUNT=$(echo "$COMMENTS" | jq -r '.comments | length')
echo "✅ 评论数量: $COMMENT_COUNT"
echo ""

# 8. 测试文件搜索
echo "8️⃣ 测试文件搜索 GET /api/files/search?query=test"
FILES=$(curl -s "$BASE_URL/api/files/search?query=test")
FILE_COUNT=$(echo "$FILES" | jq -r '.files | length')
echo "✅ 文件数量: $FILE_COUNT"
echo ""

# 9. 测试知识图谱状态
echo "9️⃣ 测试知识图谱状态 GET /api/knowledge-graph/status"
KG_STATUS=$(curl -s "$BASE_URL/api/knowledge-graph/status")
echo "$KG_STATUS" | jq -r '.status, .message'
echo ""

# 10. 测试 API 文档
echo "🔟 测试 API 文档 GET /api-docs"
DOCS=$(curl -s "$BASE_URL/api-docs" | head -5)
if [ -n "$DOCS" ]; then
  echo "✅ API 文档可访问"
else
  echo "❌ API 文档不可访问"
fi
echo ""

echo "=========================================="
echo "✅ 所有主要 API 接口测试完成！"
echo "=========================================="
