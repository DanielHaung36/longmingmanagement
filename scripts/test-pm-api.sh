#!/bin/bash
# PM 系统 API 完整测试脚本
# Usage: bash scripts/test-pm-api.sh

BASE_URL="http://localhost:30081"
COOKIES="/tmp/pm_test_cookies.txt"
PASS=0
FAIL=0
SKIP=0
CREATED_PROJECT_ID=""
CREATED_TASK_ID=""
CREATED_COMMENT_ID=""
CREATED_TEAM_ID=""
CREATED_USER_ID=""

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

pass() { echo -e "${GREEN}✅ PASS${RESET} $1"; ((PASS++)); }
fail() { echo -e "${RED}❌ FAIL${RESET} $1\n        响应: $2"; ((FAIL++)); }
skip() { echo -e "${YELLOW}⏭ SKIP${RESET} $1"; ((SKIP++)); }
section() { echo -e "\n${CYAN}══ $1 ══${RESET}"; }

get()   { curl -s -b "$COOKIES" "$BASE_URL$1"; }
post()  { curl -s -b "$COOKIES" -X POST  -H "Content-Type: application/json" -d "$2" "$BASE_URL$1"; }
put()   { curl -s -b "$COOKIES" -X PUT   -H "Content-Type: application/json" -d "$2" "$BASE_URL$1"; }
patch() { curl -s -b "$COOKIES" -X PATCH -H "Content-Type: application/json" -d "$2" "$BASE_URL$1"; }
del()   { curl -s -b "$COOKIES" -X DELETE "$BASE_URL$1"; }

# 检查 success 字段（JSON true/false 不区分大小写）
is_success() {
  echo "$1" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  print('yes' if d.get('success') == True else 'no')
except:
  print('no')
" 2>/dev/null
}

check() {
  local name="$1"
  local resp="$2"
  if [ "$(is_success "$resp")" = "yes" ]; then
    pass "$name"
  else
    fail "$name" "$(echo "$resp" | head -c 300)"
  fi
}

check_http() {
  local name="$1"
  local code="$2"   # HTTP 状态码
  local expect="${3:-200}"
  if [ "$code" = "$expect" ]; then
    pass "$name (HTTP $code)"
  else
    fail "$name" "HTTP $code (期望 $expect)"
  fi
}

# 从 JSON 响应提取字段值
jget() {
  echo "$1" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  v = d
  for k in '$2'.split('.'):
    if isinstance(v, dict): v = v.get(k)
    else: v = None
  print(v if v is not None else '')
except:
  print('')
" 2>/dev/null
}

echo "=================================================="
echo "  Longi PM 系统 API 自动化测试"
echo "  目标: $BASE_URL"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="

# ══════════════════════════════════════════════════════
section "1. 认证 (Auth)"
# ══════════════════════════════════════════════════════

resp=$(curl -s -c "$COOKIES" -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Longi@123"}' "$BASE_URL/api/auth/login")
check "POST /api/auth/login" "$resp"
echo "    用户: $(jget "$resp" "user.username") | 角色: $(jget "$resp" "user.role")"

resp=$(get /api/auth/me)
check "GET /api/auth/me" "$resp"
ADMIN_ID=$(jget "$resp" "user.id")
[ -z "$ADMIN_ID" ] && ADMIN_ID=$(jget "$resp" "id") || true
echo "    Admin ID: $ADMIN_ID"

resp=$(get /api/auth/verify)
check "GET /api/auth/verify" "$resp"

# ══════════════════════════════════════════════════════
section "2. 用户管理 (Users)"
# ══════════════════════════════════════════════════════

resp=$(get /api/users)
check "GET /api/users (列表)" "$resp"

resp=$(get /api/users/stats)
check "GET /api/users/stats" "$resp"
echo "    统计: $(jget "$resp" "data.total") 用户, $(jget "$resp" "data.active") 活跃"

resp=$(get "/api/users/search?q=admin")
check "GET /api/users/search?q=admin" "$resp"

resp=$(get "/api/users/email/admin@ljmagnet.com")
check "GET /api/users/email/:email" "$resp"

if [ -n "$ADMIN_ID" ] && [ "$ADMIN_ID" != "None" ]; then
  resp=$(get "/api/users/$ADMIN_ID")
  check "GET /api/users/:id" "$resp"
fi

# ══════════════════════════════════════════════════════
section "3. 权限 (Permissions)"
# ══════════════════════════════════════════════════════

resp=$(get /api/permissions/me)
check "GET /api/permissions/me" "$resp"
PERM_COUNT=$(jget "$resp" "data" | python3 -c "import sys; d=sys.stdin.read().strip(); print(d.count(',') + 1 if d.startswith('[') else 0)" 2>/dev/null)
echo "    权限数量: $PERM_COUNT"

resp=$(get /api/permissions/all)
check "GET /api/permissions/all" "$resp"

resp=$(get /api/permissions/role/ADMIN)
check "GET /api/permissions/role/:role" "$resp"

# ══════════════════════════════════════════════════════
section "4. 项目 (Projects)"
# ══════════════════════════════════════════════════════

resp=$(get /api/projects)
check "GET /api/projects (列表)" "$resp"
echo "    总项目数: $(jget "$resp" "data.projects" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "?")"

resp=$(get /api/projects/client-companies)
check "GET /api/projects/client-companies" "$resp"

resp=$(get "/api/projects/search?q=lab")
check "GET /api/projects/search?q=lab" "$resp"

# 取一个已有项目来测试读取
EXISTING_PROJECT_ID=$(get /api/projects | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  projects = d.get('data', {}).get('projects', [])
  print(projects[0]['id'] if projects else '')
except:
  print('')
" 2>/dev/null)
echo "    使用现有项目 ID: $EXISTING_PROJECT_ID"

if [ -n "$EXISTING_PROJECT_ID" ]; then
  resp=$(get "/api/projects/$EXISTING_PROJECT_ID")
  check "GET /api/projects/:id" "$resp"
  echo "    项目名: $(jget "$resp" "data.name")"
fi

# 创建测试项目（包含必填字段）
TS=$(date +%s)
resp=$(post /api/projects "{
  \"name\":\"[API-TEST] 测试项目 $TS\",
  \"description\":\"自动化测试创建，可删除\",
  \"clientCompany\":\"APITestCo-$TS\",
  \"mineSiteName\":\"APITestSite-$TS\",
  \"projectType\":\"AT\",
  \"status\":\"PLANNING\"
}")
CREATED_PROJECT_ID=$(jget "$resp" "data.id")
check "POST /api/projects (创建)" "$resp"
echo "    新项目 ID: $CREATED_PROJECT_ID"

if [ -n "$CREATED_PROJECT_ID" ] && [ "$CREATED_PROJECT_ID" != "None" ]; then
  resp=$(put "/api/projects/$CREATED_PROJECT_ID" '{"description":"已由API测试更新"}')
  check "PUT /api/projects/:id (更新)" "$resp"
fi

# ══════════════════════════════════════════════════════
section "5. 任务 (Tasks)"
# ══════════════════════════════════════════════════════

resp=$(get /api/tasks)
check "GET /api/tasks (列表)" "$resp"

resp=$(get /api/tasks/my)
check "GET /api/tasks/my" "$resp"

resp=$(get "/api/tasks/search?q=mag")
check "GET /api/tasks/search?q=mag" "$resp"

resp=$(get /api/tasks/pending)
check "GET /api/tasks/pending" "$resp"

# 取现有任务
EXISTING_TASK_ID=$(get /api/tasks | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  tasks = d.get('data', [])
  print(tasks[0]['id'] if tasks else '')
except:
  print('')
" 2>/dev/null)
echo "    使用现有任务 ID: $EXISTING_TASK_ID"

if [ -n "$EXISTING_TASK_ID" ]; then
  resp=$(get "/api/tasks/$EXISTING_TASK_ID")
  check "GET /api/tasks/:id" "$resp"
  echo "    任务: $(jget "$resp" "data.taskCode") - $(jget "$resp" "data.title" | head -c 40)"
fi

# 按项目查任务
if [ -n "$EXISTING_PROJECT_ID" ]; then
  resp=$(get "/api/tasks/project/$EXISTING_PROJECT_ID")
  check "GET /api/tasks/project/:projectId" "$resp"
fi

# 创建测试任务：用已有文件夹路径的已审批项目
# (创建Task需要 project.mineSiteFolderPath 不为空)
APPROVED_PROJECT_ID=$(get "/api/projects/search?q=Cemix" | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  projs = d.get('data', [])
  if projs: print(projs[0]['id'])
except: pass
" 2>/dev/null)
# 回退：取第一个 APPROVED 项目
[ -z "$APPROVED_PROJECT_ID" ] && APPROVED_PROJECT_ID=$(get /api/projects | python3 -c "
import sys, json
try:
  d = json.load(sys.stdin)
  for p in d.get('data', {}).get('projects', []):
    if p.get('approvalStatus') == 'APPROVED':
      print(p['id']); break
except: pass
" 2>/dev/null)
echo "    使用已审批项目 ID: $APPROVED_PROJECT_ID"

if [ -n "$APPROVED_PROJECT_ID" ] && [ "$APPROVED_PROJECT_ID" != "None" ]; then
  resp=$(post /api/tasks "{
    \"title\":\"[API-TEST] 测试任务 $TS\",
    \"description\":\"自动化测试创建的任务（可删除）\",
    \"status\":\"TODO\",
    \"priority\":\"MEDIUM\",
    \"projectId\":$APPROVED_PROJECT_ID,
    \"jobType\":\"AT\"
  }")
  CREATED_TASK_ID=$(jget "$resp" "data.id")
  check "POST /api/tasks (创建)" "$resp"
  echo "    新任务 ID: $CREATED_TASK_ID"

  if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "None" ]; then
    resp=$(patch "/api/tasks/$CREATED_TASK_ID/status" '{"status":"IN_PROGRESS"}')
    check "PATCH /api/tasks/:id/status" "$resp"
  fi
else
  skip "POST /api/tasks (无已审批项目)"
fi

# ══════════════════════════════════════════════════════
section "6. 文件夹 (Folders)"
# ══════════════════════════════════════════════════════

resp=$(get /api/folders/config)
check "GET /api/folders/config" "$resp"

if [ -n "$EXISTING_TASK_ID" ]; then
  resp=$(get "/api/folders/task/$EXISTING_TASK_ID")
  check "GET /api/folders/task/:taskId" "$resp"
  # 检查 local 或 onedrive 字段
  HAS_LOCAL=$(jget "$resp" "data.local" | head -c 5)
  HAS_OD=$(jget "$resp" "data.onedrive" | head -c 5)
  echo "    local: ${HAS_LOCAL:-null} | onedrive: ${HAS_OD:-null}"
else
  skip "GET /api/folders/task/:taskId"
fi

if [ -n "$EXISTING_PROJECT_ID" ]; then
  resp=$(get "/api/folders/project/$EXISTING_PROJECT_ID")
  check "GET /api/folders/project/:projectId" "$resp"
fi

# ══════════════════════════════════════════════════════
section "7. 文件 (Files)"
# ══════════════════════════════════════════════════════

if [ -n "$EXISTING_TASK_ID" ]; then
  resp=$(get "/api/files/task/$EXISTING_TASK_ID")
  check "GET /api/files/task/:taskId" "$resp"
else
  skip "GET /api/files/task/:taskId"
fi

resp=$(get "/api/files/search?q=pdf")
check "GET /api/files/search?q=pdf" "$resp"

# ══════════════════════════════════════════════════════
section "8. 评论 (Comments)"
# ══════════════════════════════════════════════════════

COMMENT_TASK_ID="${CREATED_TASK_ID:-$EXISTING_TASK_ID}"
if [ -n "$COMMENT_TASK_ID" ] && [ "$COMMENT_TASK_ID" != "None" ]; then
  resp=$(post /api/comments "{\"entityType\":\"task\",\"entityId\":$COMMENT_TASK_ID,\"content\":\"API自动化测试评论 $TS\"}")
  CREATED_COMMENT_ID=$(jget "$resp" "data.id")
  check "POST /api/comments" "$resp"

  resp=$(get "/api/comments/task/$COMMENT_TASK_ID")
  check "GET /api/comments/task/:id" "$resp"

  if [ -n "$CREATED_COMMENT_ID" ] && [ "$CREATED_COMMENT_ID" != "None" ]; then
    resp=$(patch "/api/comments/$CREATED_COMMENT_ID" '{"content":"已更新的评论"}')
    check "PATCH /api/comments/:id" "$resp"

    resp=$(del "/api/comments/$CREATED_COMMENT_ID")
    check "DELETE /api/comments/:id" "$resp"
  fi
else
  skip "Comments 测试 (无任务ID)"
fi

# ══════════════════════════════════════════════════════
section "9. 统计 (Stats)"
# ══════════════════════════════════════════════════════

resp=$(get /api/stats/dashboard)
check "GET /api/stats/dashboard" "$resp"
echo "    总项目: $(jget "$resp" "data.overview.totalProjects") | 总任务: $(jget "$resp" "data.overview.totalTasks")"

resp=$(get /api/stats/tasks)
check "GET /api/stats/tasks" "$resp"

resp=$(get /api/stats/projects)
check "GET /api/stats/projects" "$resp"

# ══════════════════════════════════════════════════════
section "10. 活动记录 (Activities)"
# ══════════════════════════════════════════════════════

resp=$(get /api/activities/recent)
check "GET /api/activities/recent" "$resp"

if [ -n "$ADMIN_ID" ] && [ "$ADMIN_ID" != "None" ]; then
  resp=$(get "/api/activities/user/$ADMIN_ID")
  check "GET /api/activities/user/:userId" "$resp"
fi

# ══════════════════════════════════════════════════════
section "11. 通知 (Notifications)"
# ══════════════════════════════════════════════════════

if [ -n "$ADMIN_ID" ] && [ "$ADMIN_ID" != "None" ]; then
  resp=$(get "/api/notifications/user/$ADMIN_ID")
  check "GET /api/notifications/user/:userId" "$resp"

  resp=$(get "/api/notifications/user/$ADMIN_ID/unread-count")
  check "GET /api/notifications/user/:userId/unread-count" "$resp"
  echo "    未读: $(jget "$resp" "data.count")"

  resp=$(get "/api/notifications/user/$ADMIN_ID/stats")
  check "GET /api/notifications/user/:userId/stats" "$resp"
else
  skip "通知测试 (无 admin ID)"
fi

# ══════════════════════════════════════════════════════
section "12. 团队 (Teams)"
# ══════════════════════════════════════════════════════

resp=$(get /api/teams)
check "GET /api/teams" "$resp"

resp=$(post /api/teams "{\"name\":\"API测试团队 $TS\",\"description\":\"自动化测试，可删除\"}")
CREATED_TEAM_ID=$(jget "$resp" "data.id")
check "POST /api/teams (创建)" "$resp"

if [ -n "$CREATED_TEAM_ID" ] && [ "$CREATED_TEAM_ID" != "None" ]; then
  resp=$(get "/api/teams/$CREATED_TEAM_ID")
  check "GET /api/teams/:id" "$resp"

  resp=$(put "/api/teams/$CREATED_TEAM_ID" '{"description":"已更新"}')
  check "PUT /api/teams/:id" "$resp"

  resp=$(del "/api/teams/$CREATED_TEAM_ID")
  check "DELETE /api/teams/:id" "$resp"
fi

# ══════════════════════════════════════════════════════
section "13. 矿物/矿区 (Minerals & Mine Zones)"
# ══════════════════════════════════════════════════════

resp=$(get /api/minerals)
check "GET /api/minerals" "$resp"
echo "    矿物种类: $(jget "$resp" "data" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else '?')" 2>/dev/null)"

resp=$(get /api/minerals/stats)
check "GET /api/minerals/stats" "$resp"

resp=$(get /api/mine-zones)
check "GET /api/mine-zones" "$resp"
echo "    矿区数量: $(jget "$resp" "data" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else '?')" 2>/dev/null)"

# ══════════════════════════════════════════════════════
section "14. 报价单 (Quotations)"
# ══════════════════════════════════════════════════════

if [ -n "$EXISTING_PROJECT_ID" ]; then
  # 先创建报价单，再查询
  put "/api/projects/$EXISTING_PROJECT_ID/quotations" "{\"amount\":100000,\"currency\":\"AUD\",\"notes\":\"API测试报价\"}" > /dev/null 2>&1
  resp=$(get "/api/projects/$EXISTING_PROJECT_ID/quotations")
  check "GET /api/projects/:id/quotations" "$resp"
  # 清理测试报价单
  del "/api/projects/$EXISTING_PROJECT_ID/quotations" > /dev/null 2>&1
else
  skip "GET quotations (无项目ID)"
fi

# ══════════════════════════════════════════════════════
section "15. 审计日志 (Audit)"
# ══════════════════════════════════════════════════════

resp=$(get /api/audit/logs)
check "GET /api/audit/logs" "$resp"

resp=$(get /api/audit/recent)
check "GET /api/audit/recent" "$resp"
echo "    最近操作: $(jget "$resp" "data" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['action'] if isinstance(d,list) and d else 'none')" 2>/dev/null)"

if [ -n "$ADMIN_ID" ] && [ "$ADMIN_ID" != "None" ]; then
  resp=$(get "/api/audit/user-history/$ADMIN_ID")
  check "GET /api/audit/user-history/:userId" "$resp"
fi

# ══════════════════════════════════════════════════════
section "16. 清理测试数据"
# ══════════════════════════════════════════════════════

if [ -n "$CREATED_TASK_ID" ] && [ "$CREATED_TASK_ID" != "None" ]; then
  # DRAFT 状态可直接删除
  resp=$(del "/api/tasks/$CREATED_TASK_ID")
  check "DELETE /api/tasks/:id (清理测试任务)" "$resp"
fi

if [ -n "$CREATED_PROJECT_ID" ] && [ "$CREATED_PROJECT_ID" != "None" ]; then
  # 项目删除走审批流：先提交删除请求，再审批
  post "/api/projects/$CREATED_PROJECT_ID/request-deletion" '{"reason":"API测试清理"}' > /dev/null 2>&1
  resp=$(post "/api/projects/$CREATED_PROJECT_ID/approve-delete" '{"reason":"API测试清理"}')
  check "DELETE /api/projects/:id (清理测试项目)" "$resp"
fi

# ══════════════════════════════════════════════════════
section "17. 退出登录"
# ══════════════════════════════════════════════════════

resp=$(curl -s -b "$COOKIES" -X POST "$BASE_URL/api/auth/logout")
check "POST /api/auth/logout" "$resp"

# ══════════════════════════════════════════════════════
echo ""
echo "=================================================="
echo "  测试结果汇总"
echo "=================================================="
echo -e "  ${GREEN}通过: $PASS${RESET}"
echo -e "  ${RED}失败: $FAIL${RESET}"
echo -e "  ${YELLOW}跳过: $SKIP${RESET}"
TOTAL=$((PASS + FAIL))
if [ $TOTAL -gt 0 ]; then
  RATE=$((PASS * 100 / TOTAL))
  echo "  通过率: $RATE%"
fi
echo "=================================================="

rm -f "$COOKIES"
[ $FAIL -eq 0 ] && exit 0 || exit 1
