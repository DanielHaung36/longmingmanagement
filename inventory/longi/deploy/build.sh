#!/bin/bash

# Docker 镜像构建脚本
# 用于构建 longi-backend 和 longi-frontend 镜像

set -e  # 遇到错误时退出

echo "🚀 开始构建 Docker 镜像..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

echo -e "${BLUE}📦 构建后端镜像 (longi-backend:latest)...${NC}"
docker buildx build -f backend/Dockerfile -t longi-backend:latest backend/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 后端镜像构建成功${NC}"
else
    echo -e "${RED}❌ 后端镜像构建失败${NC}"
    exit 1
fi

echo -e "${BLUE}📦 构建前端镜像 (longi-frontend:latest)...${NC}"
docker buildx build -f frontend/Dockerfile -t longi-frontend:latest frontend/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 前端镜像构建成功${NC}"
else
    echo -e "${RED}❌ 前端镜像构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 所有镜像构建完成！${NC}"
echo -e "${YELLOW}📋 构建的镜像列表：${NC}"
docker images | grep -E "(longi-backend|longi-frontend)" | head -2

echo -e "${BLUE}💡 接下来可以运行：${NC}"
echo -e "   ${YELLOW}docker-compose up -d${NC}  # 启动所有服务"
echo -e "   ${YELLOW}docker-compose logs -f${NC}  # 查看日志"