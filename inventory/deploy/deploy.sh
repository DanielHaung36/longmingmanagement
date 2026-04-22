#!/bin/bash

# Inventory系统一键部署脚本
# 使用方法: ./deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE="longi-prod"
K8S_DIR="$(dirname "$0")/k8s"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Longi Inventory 系统部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# 检查kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl未安装${NC}"
    exit 1
fi

# 检查K8s配置目录
if [ ! -d "$K8S_DIR" ]; then
    echo -e "${RED}❌ K8s配置目录不存在: $K8S_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 部署步骤:${NC}"
echo -e "  1. 创建ConfigMaps和Secrets"
echo -e "  2. 创建PersistentVolumeClaims"
echo -e "  3. 部署Backend服务"
echo -e "  4. 部署Frontend服务"
echo

read -p "$(echo -e ${YELLOW}'继续部署? [y/N]: '${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 已取消${NC}"
    exit 0
fi

# 1. 应用ConfigMap和Secret
echo
echo -e "${YELLOW}[1/4] 应用ConfigMaps和Secrets...${NC}"
kubectl apply -f "$K8S_DIR/02-configmap.yaml"
kubectl apply -f "$K8S_DIR/03-secret.yaml"
echo -e "${GREEN}✅ ConfigMaps和Secrets已应用${NC}"

# 2. 应用PVC
echo
echo -e "${YELLOW}[2/4] 创建PersistentVolumeClaims...${NC}"
kubectl apply -f "$K8S_DIR/04-pvc.yaml"
echo -e "${GREEN}✅ PVCs已创建${NC}"

# 等待PVC绑定
echo -e "${BLUE}⏳ 等待PVCs绑定...${NC}"
kubectl wait --for=jsonpath='{.status.phase}'=Bound \
    pvc/inventory-uploads-pvc \
    -n $NAMESPACE \
    --timeout=60s || echo -e "${YELLOW}⚠️  PVC可能需要手动绑定${NC}"

# 3. 部署Backend
echo
echo -e "${YELLOW}[3/4] 部署Backend服务...${NC}"
kubectl apply -f "$K8S_DIR/05-backend-deployment.yaml"
echo -e "${GREEN}✅ Backend已部署${NC}"

# 等待Backend就绪
echo -e "${BLUE}⏳ 等待Backend就绪...${NC}"
kubectl wait --for=condition=available \
    deployment/inventory-backend \
    -n $NAMESPACE \
    --timeout=300s

# 4. 部署Frontend
echo
echo -e "${YELLOW}[4/4] 部署Frontend服务...${NC}"
kubectl apply -f "$K8S_DIR/06-frontend-deployment.yaml"
echo -e "${GREEN}✅ Frontend已部署${NC}"

# 等待Frontend就绪
echo -e "${BLUE}⏳ 等待Frontend就绪...${NC}"
kubectl wait --for=condition=available \
    deployment/inventory-frontend \
    -n $NAMESPACE \
    --timeout=300s

# 显示部署状态
echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🎉 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${BLUE}📊 部署状态:${NC}"
kubectl get pods -n $NAMESPACE | grep inventory
echo
echo -e "${BLUE}📋 服务信息:${NC}"
kubectl get svc -n $NAMESPACE | grep inventory
echo
echo -e "${YELLOW}💡 访问方式:${NC}"
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
FRONTEND_PORT=$(kubectl get svc inventory-frontend -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')
echo -e "  Frontend: ${GREEN}http://${NODE_IP}:${FRONTEND_PORT}${NC}"
echo
echo -e "${YELLOW}📝 查看日志:${NC}"
echo -e "  Backend:  ${GREEN}kubectl logs -n $NAMESPACE -l app=inventory-backend -f${NC}"
echo -e "  Frontend: ${GREEN}kubectl logs -n $NAMESPACE -l app=inventory-frontend -f${NC}"
echo
