# 系统交接文档

---

## 一、部署方式

三个系统均通过 Docker 镜像构建后推送到内网 Harbor 镜像仓库，再由 Kubernetes 拉取部署。

- 镜像仓库：`harbor.longi.local:30003`
- K8s 命名空间：`longi-prod`
- 各系统均有独立的 Deployment，更新后需手动触发滚动重启

---

## 二、环境变量

生产环境变量统一存储在 K8s Secret（`longi-secrets`）中，包含数据库连接、JWT 密钥、Azure AD 凭据、Cloudflare Token 等。

具体值需从集群中获取，没有集群访问权限无法部署。

---

## 三、当前系统状态

### 正常运行
- 项目管理系统：项目/任务创建、审批流程、本地文件夹管理
- 库存管理系统：库存管理、扫码入出库、发货管理
- Portal：SSO 登录、应用导航

### 已知问题
- **OneDrive 云端同步**：原挂载盘因硬盘故障停用，Graph API 迁移尚未完成，云端文件夹功能暂不可用

---

## 四、基础设施

- **Kubernetes**：内网自建集群，需要 kubeconfig 才能操作
- **数据库**：PostgreSQL，运行在 K8s 集群内部
- **外网访问**：Cloudflare Tunnel
- **身份认证**：Portal 使用 Keycloak SSO，项目管理系统使用 JWT
