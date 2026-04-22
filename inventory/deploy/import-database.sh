#!/bin/bash

# PostgreSQL数据导入脚本
# 作用：将inventory数据库导入到K8s中的PostgreSQL

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
NAMESPACE="longi-prod"
POSTGRES_POD=$(kubectl get pod -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}')
DB_NAME="longinventory"
DB_USER="postgres"
DUMP_FILE="$1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PostgreSQL 数据库导入${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# 检查参数
if [ -z "$DUMP_FILE" ]; then
    echo -e "${RED}❌ 错误: 请提供SQL dump文件路径${NC}"
    echo -e "${YELLOW}用法: $0 <dump_file.sql>${NC}"
    echo -e "${YELLOW}示例: $0 longinventory_backup.sql${NC}"
    exit 1
fi

# 检查文件是否存在
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}❌ 文件不存在: $DUMP_FILE${NC}"
    exit 1
fi

# 检查Pod是否存在
if [ -z "$POSTGRES_POD" ]; then
    echo -e "${RED}❌ 未找到PostgreSQL Pod${NC}"
    exit 1
fi

echo -e "${BLUE}📊 配置信息:${NC}"
echo -e "  Namespace: ${GREEN}$NAMESPACE${NC}"
echo -e "  Pod: ${GREEN}$POSTGRES_POD${NC}"
echo -e "  Database: ${GREEN}$DB_NAME${NC}"
echo -e "  Dump文件: ${GREEN}$DUMP_FILE${NC}"
echo

# 询问确认
read -p "$(echo -e ${YELLOW}'⚠️  确认要导入数据吗? 这将覆盖现有的longinventory数据库 [y/N]: '${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 已取消${NC}"
    exit 0
fi

# 1. 复制dump文件到Pod
echo
echo -e "${YELLOW}[1/4] 复制dump文件到Pod...${NC}"
kubectl cp "$DUMP_FILE" "$NAMESPACE/$POSTGRES_POD:/tmp/dump.sql"
echo -e "${GREEN}✅ 文件复制成功${NC}"

# 2. 创建数据库（如果不存在）
echo
echo -e "${YELLOW}[2/4] 创建数据库...${NC}"
kubectl exec -n $NAMESPACE $POSTGRES_POD -- \
    psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || \
    echo -e "${BLUE}ℹ️  数据库已存在${NC}"

# 3. 导入数据
echo
echo -e "${YELLOW}[3/4] 导入数据...${NC}"
kubectl exec -n $NAMESPACE $POSTGRES_POD -- \
    psql -U $DB_USER -d $DB_NAME -f /tmp/dump.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据导入成功${NC}"
else
    echo -e "${RED}❌ 数据导入失败${NC}"
    exit 1
fi

# 4. 清理临时文件
echo
echo -e "${YELLOW}[4/4] 清理临时文件...${NC}"
kubectl exec -n $NAMESPACE $POSTGRES_POD -- rm /tmp/dump.sql
echo -e "${GREEN}✅ 清理完成${NC}"

# 验证导入
echo
echo -e "${YELLOW}📊 验证导入结果...${NC}"
kubectl exec -n $NAMESPACE $POSTGRES_POD -- \
    psql -U $DB_USER -d $DB_NAME -c "\dt" | head -20

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 数据库导入完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${YELLOW}💡 下一步操作:${NC}"
echo -e "   1. 检查表和数据:"
echo -e "      ${GREEN}kubectl exec -n $NAMESPACE $POSTGRES_POD -- psql -U $DB_USER -d $DB_NAME -c '\\dt'${NC}"
echo -e "   2. 重启backend以应用新数据:"
echo -e "      ${GREEN}kubectl rollout restart deployment/inventory-backend -n $NAMESPACE${NC}"
echo
