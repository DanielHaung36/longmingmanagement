#!/bin/bash

# Inventory 项目 Docker 镜像构建和推送脚本
# 使用方法: ./build-and-push.sh [版本标签]

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Harbor 仓库配置
HARBOR_REGISTRY="harbor.longi.local:30003"
HARBOR_PROJECT="longi"

# 镜像标签
VERSION=${1:-latest}
BACKEND_IMAGE="${HARBOR_REGISTRY}/${HARBOR_PROJECT}/inventory-backend:${VERSION}"
FRONTEND_IMAGE="${HARBOR_REGISTRY}/${HARBOR_PROJECT}/inventory-frontend:${VERSION}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Inventory 项目镜像构建和推送${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Harbor: ${HARBOR_REGISTRY}"
echo -e "Project: ${HARBOR_PROJECT}"
echo -e "Version: ${VERSION}"
echo

# 进入项目根目录
cd "$(dirname "$0")/../longi"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker未运行${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/4] 构建后端镜像...${NC}"
if docker buildx build -f backend/Dockerfile -t ${BACKEND_IMAGE} ./backend; then
    echo -e "${GREEN}✅ 后端镜像构建完成${NC}"
else
    echo -e "${RED}❌ 后端镜像构建失败${NC}"
    exit 1
fi

echo
echo -e "${YELLOW}[2/4] 构建前端镜像...${NC}"
if docker buildx build -f frontend/Dockerfile -t ${FRONTEND_IMAGE} ./frontend; then
    echo -e "${GREEN}✅ 前端镜像构建完成${NC}"
else
    echo -e "${RED}❌ 前端镜像构建失败${NC}"
    exit 1
fi

echo
echo -e "${YELLOW}[3/4] 推送后端镜像到 Harbor...${NC}"
if docker push ${BACKEND_IMAGE}; then
    echo -e "${GREEN}✅ 后端镜像推送完成${NC}"
else
    echo -e "${RED}❌ 后端镜像推送失败${NC}"
    echo -e "${YELLOW}💡 提示: 请先登录Harbor: docker login ${HARBOR_REGISTRY}${NC}"
    exit 1
fi

echo
echo -e "${YELLOW}[4/4] 推送前端镜像到 Harbor...${NC}"
if docker push ${FRONTEND_IMAGE}; then
    echo -e "${GREEN}✅ 前端镜像推送完成${NC}"
else
    echo -e "${RED}❌ 前端镜像推送失败${NC}"
    exit 1
fi

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 镜像构建和推送完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "后端镜像: ${BACKEND_IMAGE}"
echo -e "前端镜像: ${FRONTEND_IMAGE}"
echo
echo -e "${YELLOW}💡 下一步:${NC}"
echo -e "  1. 导入数据库: ${GREEN}./import-database.sh <dump_file.sql>${NC}"
echo -e "  2. 部署到K8s: ${GREEN}./deploy.sh${NC}"
echo
