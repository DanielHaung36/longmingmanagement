# Longi Inventory 系统 Kubernetes 部署指南

## 📋 系统架构

### 服务组成
- **inventory-backend**: Go后端API服务 (端口: 8080)
- **inventory-frontend**: Vite/React前端 + Nginx (端口: 80)  
- **postgres**: 共用现有PostgreSQL数据库 (端口: 5432)
- **共享存储**: inventory-uploads-pvc (10Gi)

### 网络配置
- **Backend**: ClusterIP (集群内部访问)
- **Frontend**: NodePort 30002 (外部访问)
- **数据库**: longinventory (新数据库，共用postgres服务)

### 与现有系统对比

| 项目 | 现有系统 | Inventory系统 |
|------|----------|--------------|
| 命名空间 | longi-prod | longi-prod (共用) |
| Backend端口 | 8081 | 8080 |
| Frontend端口 | 30000 | 30002 |
| 数据库 | projectmanagement | longinventory |
| Harbor镜像 | longi-client/longi-server | inventory-frontend/inventory-backend |

---

## 🚀 快速部署

```bash
# 1. 构建和推送镜像
./build-and-push.sh

# 2. 导入数据库（可选）
./import-database.sh /path/to/dump.sql

# 3. 部署到K8s
./deploy.sh
```

---

## 📝 详细步骤

### 步骤1: 构建镜像
```bash
cd inventory/deploy
./build-and-push.sh
```

### 步骤2: 导入数据库
```bash
# 从Windows导出数据
pg_dump -U postgres -d longinventory > backup.sql

# 导入到K8s
./import-database.sh backup.sql
```

### 步骤3: 部署
```bash
./deploy.sh
```

---

## ⚙️ 环境变量调整

### Backend (.env或代码)
不需要调整，配置已在ConfigMap中：
- DB_HOST=postgres (共用现有PostgreSQL)
- DB_NAME=longinventory (新数据库)
- 其他配置已自动注入

### Frontend (.env)
需要调整API地址：
```bash
VITE_API_URL=/api
```

---

## 🔍 验证部署

```bash
# 查看Pod状态
kubectl get pods -n longi-prod | grep inventory

# 查看服务
kubectl get svc -n longi-prod | grep inventory

# 获取访问地址
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')
echo "访问地址: http://${NODE_IP}:30002"
```

---

## 📂 文件说明

### K8s配置文件 (k8s/)
- `01-namespace.yaml`: 命名空间（使用longi-prod）
- `02-configmap.yaml`: 环境变量配置
- `03-secret.yaml`: 数据库密码
- `04-pvc.yaml`: 存储卷声明
- `05-backend-deployment.yaml`: Backend部署和服务
- `06-frontend-deployment.yaml`: Frontend部署和服务

### 部署脚本
- `build-and-push.sh`: 构建并推送镜像到Harbor
- `deploy.sh`: 一键部署到Kubernetes
- `import-database.sh`: 数据库导入工具

---

## 🛠 常见问题

### 1. 镜像拉取失败
检查harbor-secret是否存在：
```bash
kubectl get secret harbor-secret -n longi-prod
```

### 2. 数据库连接失败
检查PostgreSQL服务：
```bash
kubectl get svc postgres -n longi-prod
kubectl exec -it -n longi-prod <postgres-pod> -- psql -U postgres -l
```

### 3. 端口冲突
修改 `06-frontend-deployment.yaml` 中的 nodePort

---

## 📊 监控和日志

```bash
# 查看Backend日志
kubectl logs -n longi-prod -l app=inventory-backend -f

# 查看Frontend日志  
kubectl logs -n longi-prod -l app=inventory-frontend -f

# 重启服务
kubectl rollout restart deployment/inventory-backend -n longi-prod
kubectl rollout restart deployment/inventory-frontend -n longi-prod
```
