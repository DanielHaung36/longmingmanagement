# Stage 1: Build stage
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件（从 client 目录）
COPY package*.json ./

# 安装依赖
RUN npm ci

# 禁用 Next.js 构建时的 ESLint 检查，避免因 lint 阻塞容器构建
ENV NEXT_DISABLE_ESLINT=1

# 构建参数 - BACKEND_URL
ARG BACKEND_URL=http://localhost:8081
ENV BACKEND_URL=${BACKEND_URL}

# 复制源代码（从 client 目录）
COPY . .

# 构建生产版本（Next.js standalone模式）
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

# 安装必要工具
RUN apk add --no-cache curl tini

# 设置工作目录
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 从 builder 阶段复制构建产物
# standalone模式会生成一个完整的可运行目录
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 使用 tini 作为 init 进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动应用（Next.js自带的生产服务器）
CMD ["node", "server.js"]
