@echo off
REM Longi 项目管理系统 - Windows 开发环境启动脚本

echo 🚀 启动 Longi 项目管理系统开发环境...
echo.

REM 检查 Docker Desktop 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Desktop 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

echo 1️⃣  启动 Docker 服务...
docker-compose up -d

echo.
echo 2️⃣  等待服务启动...
timeout /t 10 /nobreak >nul

echo.
echo 3️⃣  检查服务状态...
docker-compose ps

echo.
echo 4️⃣  等待 PostgreSQL 准备就绪...
:wait_postgres
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo    等待 PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo    ✅ PostgreSQL 已就绪

echo.
echo 5️⃣  执行数据库迁移...
cd server
call npx prisma migrate deploy
if errorlevel 1 (
    echo ⚠️  迁移失败，可能需要手动执行
)
cd ..

echo.
echo 6️⃣  生成 Prisma Client...
cd server
call npx prisma generate
cd ..

echo.
echo ✅ 开发环境启动完成！
echo.
echo 📊 服务访问地址：
echo   • PostgreSQL:     localhost:5432
echo   • Redis:          localhost:6379
echo   • Neo4j (HTTP):   http://localhost:7474 (neo4j/longi2024)
echo   • Neo4j (Bolt):   bolt://localhost:7687
echo   • MinIO API:      http://localhost:9000 (minioadmin/minioadmin123)
echo   • MinIO Console:  http://localhost:9001
echo   • Elasticsearch:  http://localhost:9200
echo   • RabbitMQ AMQP:  localhost:5672
echo   • RabbitMQ UI:    http://localhost:15672 (admin/admin123)
echo   • InfluxDB:       http://localhost:8086 (admin/admin123456)
echo   • MailHog Web:    http://localhost:8025
echo.
echo 📝 后续步骤：
echo   1. cd server ^&^& npm run dev     # 启动后端服务
echo   2. cd client ^&^& npm run dev     # 启动前端服务
echo.
echo 🛑 停止服务：docker-compose down
echo 🗑️  清理数据：docker-compose down -v
echo.
pause
