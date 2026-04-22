# ── Build stage ───────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────
FROM nginx:stable-alpine

RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
