# Longi Mining Project Management - 项目总览

本仓库包含三个独立系统，均部署在内网 Kubernetes 集群（longi-prod 命名空间）。

---

## 1. 项目管理系统 (client + server)

矿业项目与任务的全流程管理系统，供 Longi 团队内部使用。

**后端** (`server/`) — Node.js + Express + TypeScript + Prisma + PostgreSQL
**前端** (`client/`) — Next.js + React + TypeScript + MUI

### 核心功能

- 项目 CRUD：创建、编辑、删除矿业项目，支持审批流程（草稿 → 待审批 → 已审批/拒绝）
- 任务 CRUD：项目下的任务管理，同样带审批流程
- 自动编号：审批通过后自动生成项目编号（如 2025-AT-BXT-001）
- 文件夹自动创建：审批通过后在本地和 OneDrive 自动创建对应文件夹结构
- Excel 同步：任务审批通过后自动同步到 Job Register Excel 表
- 角色权限：User / Manager / Admin 三级权限控制
- OneDrive 集成：通过 Microsoft Graph API 实现云端文件存储

### 部署

- 后端镜像：`harbor.longi.local:30003/longi/longi-server:latest`
- 前端镜像：`harbor.longi.local:30003/longi/longi-client:latest`
- 后端端口：8081
- 前端端口：3000

---

## 2. 库存管理系统 (inventory)

矿区设备和物料的库存管理系统，支持手机端扫码操作。

**后端** (`inventory/longi/backend/`) — Node.js + Express + TypeScript + Prisma + PostgreSQL
**前端** (`inventory/longi/frontend/`) — React + TypeScript + Vite + shadcn/ui

### 核心功能

- 产品管理：设备/物料的增删改查，支持产品分组（product_group）
- 库存概览：实时库存数量统计与展示
- 出入库记录：库存变动流水记录
- 扫码操作：手机端扫描条码进行快速入库/出库
- 发货管理：出货单管理和发货状态跟踪
- 用户权限：基于角色的操作权限控制
- 多语言：支持中英文切换（i18n）

### 部署

- 后端镜像：`harbor.longi.local:30003/longi/inventory-backend:latest`
- 前端镜像：`harbor.longi.local:30003/longi/inventory-frontend:latest`

---

## 3. 统一入口门户 (portal)

内网应用导航页，员工登录后可跳转到各子系统。

**前端** (`portal/`) — React + TypeScript + Vite + Keycloak

### 核心功能

- 单点登录：通过 Keycloak 统一认证，一次登录访问所有系统
- 应用导航：以卡片形式展示所有内部应用入口
- 默认应用：支持设置默认启动应用，登录后自动倒计时跳转
- 个性化问候：根据时间显示早/午/晚问候语

### 部署

- 镜像：`harbor.longi.local:30003/longi/longi-portal:latest`

---

## 技术基础设施

- Kubernetes 集群：内网自建，namespace `longi-prod`
- 镜像仓库：Harbor (`harbor.longi.local:30003`)
- 反向代理：Traefik Ingress
- 身份认证：Keycloak（Portal SSO）+ JWT（项目管理系统）
- 数据库：PostgreSQL（各系统独立实例）
- 外网访问：Cloudflare Tunnel
