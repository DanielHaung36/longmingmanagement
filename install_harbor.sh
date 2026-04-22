#!/bin/bash
# Harbor SSL 证书修复脚本

set -e

echo "==============================================="
echo "Harbor SSL 证书修复"
echo "==============================================="

# 检查原始备份中是否有证书
echo ""
echo "[1] 查找原始证书"

BACKUP=$(ls -dt /data.backup.* 2>/dev/null | head -1)
if [ -z "$BACKUP" ]; then
    echo "❌ 没有备份"
    exit 1
fi

echo "备份位置：$BACKUP"
echo ""

# 检查备份中的证书
if [ -d "$BACKUP/cert" ]; then
    echo "✓ 备份中找到证书目录"
    ls -lah "$BACKUP/cert/"
    
    # 从备份恢复证书
    echo ""
    echo "[2] 从备份恢复证书"
    mkdir -p /data/cert
    cp -av "$BACKUP/cert"/* /data/cert/
    echo "✓ 证书已恢复"
    
elif [ -d "$BACKUP/secret" ] && [ -f "$BACKUP/secret/cert/harbor.longi.local.key" ]; then
    echo "✓ 备份中找到 secret 中的证书"
    mkdir -p /data/cert
    cp -av "$BACKUP/secret/cert"/* /data/cert/
    echo "✓ 证书已恢复"
else
    echo "⚠️  备份中没有找到证书目录"
    echo "需要手动生成自签名证书"
fi

# 验证证书文件
echo ""
echo "[3] 验证证书文件"
if [ -f /data/cert/harbor.longi.local.key ]; then
    echo "✓ 找到 harbor.longi.local.key"
else
    echo "❌ 缺失 harbor.longi.local.key"
    echo "需要生成证书..."
    
    # 生成自签名证书
    echo ""
    echo "[4] 生成自签名证书"
    mkdir -p /data/cert
    
    # 生成私钥
    openssl genrsa -out /data/cert/harbor.longi.local.key 2048
    
    # 生成证书
    openssl req -new -x509 -key /data/cert/harbor.longi.local.key \
        -out /data/cert/harbor.longi.local.crt \
        -days 365 \
        -subj "/CN=harbor.longi.local"
    
    echo "✓ 证书已生成"
fi

# 设置权限
echo ""
echo "[5] 设置证书权限"
chmod 644 /data/cert/*.crt 2>/dev/null || true
chmod 600 /data/cert/*.key 2>/dev/null || true
chown -R 999:999 /data/cert/
ls -lah /data/cert/

# 停止容器
echo ""
echo "[6] 停止 Harbor"
cd /home/longi/script/harbor/harbor
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
sleep 5

# 运行 prepare 脚本
echo ""
echo "[7] 运行 Harbor prepare 脚本"
./prepare

# 启动 Harbor
echo ""
echo "[8] 启动 Harbor"
docker compose up -d 2>/dev/null || docker-compose up -d

# 等待启动
echo "等待启动（30 秒）..."
for i in {1..60}; do
    if curl -s -k https://127.0.0.1/api/v2.0/systeminfo &>/dev/null; then
        echo ""
        echo "✓ Harbor HTTPS 已启动"
        break
    elif curl -s http://127.0.0.1/api/v2.0/systeminfo &>/dev/null; then
        echo ""
        echo "✓ Harbor HTTP 已启动"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "[9] 验证"
docker compose ps 2>/dev/null || docker-compose ps

echo ""
echo "==============================================="
echo "✓ 修复完成！"
echo "==============================================="
echo ""
echo "访问 Harbor："
echo "  https://harbor.longi.local"
echo "  http://127.0.0.1"
echo ""
