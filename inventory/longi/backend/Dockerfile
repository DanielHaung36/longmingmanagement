# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

RUN npm ci
RUN npx prisma generate
RUN npx tsc

# Stage 2: Runtime
FROM node:20-alpine AS runtime

WORKDIR /app
RUN apk add --no-cache tini curl

COPY package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app

USER node
EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
