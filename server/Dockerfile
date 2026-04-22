# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src

# 安装全部依赖（含dev）
RUN npm ci

# 生成 Prisma client
RUN npx prisma generate

# 构建 TypeScript
RUN npm run build

# Stage 2: Runtime
# Stage 2: Runtime
FROM node:18-alpine AS runtime

WORKDIR /app
RUN apk add --no-cache tini curl

# 复制 package.json 和 prisma schema
COPY package*.json ./ 
COPY --from=builder /app/prisma ./prisma

# 安装 production 依赖
RUN npm ci --omit=dev && npm cache clean --force

# 生成 Prisma client
RUN npx prisma generate

# 验证 Prisma client 生成成功
RUN echo "=== 验证 Prisma Client ===" && \
    ls -la node_modules/.prisma/client/ && \
    test -f node_modules/.prisma/client/index.js || (echo "错误: Prisma client 未正确生成" && exit 1)

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 确保node用户可以访问所有文件
RUN chown -R node:node /app

USER node
EXPOSE 8081

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
