# ── 构建阶段 ───────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
COPY .env .env  
RUN npm run build   

# ── 运行阶段 ───────────────────────────────────────
FROM nginx:stable-alpine

# ① 切换为 root（默认就是 root，此处明确写更安全）
USER root

# ② 创建 nginx 临时目录并赋权给 nginx 用户（UID=101）
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp 


# ③ 复制 nginx 配置 & 前端文件
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# ④ 切换回 nginx 用户运行（更安全）


EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
