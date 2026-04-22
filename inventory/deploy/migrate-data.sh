#!/bin/bash

# ==============================================================================
# 从 Docker Compose 迁移数据到 K8s PostgreSQL
# ==============================================================================

set -e

DOCKER_CONTAINER="longi_postgres"
K8S_NAMESPACE="longi-inventory"
K8S_POD="shared-postgres-0"
BACKUP_DIR="./migration-backups"
DB_USER="postgres"
DB_PASSWORD="superadminpass"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "🚀 PostgreSQL 数据迁移工具"
echo "================================"
echo ""
echo "本脚本将从 Docker Compose 导出数据，然后导入到 K8s"
echo ""

# ==============================================================================
# 步骤 1: 从 Docker 导出数据
# ==============================================================================

export_from_docker() {
    echo "📦 步骤 1/3: 从 Docker 导出数据"
    echo "--------------------------------"
    
    # 检查 Docker 容器是否运行
    if ! docker ps | grep -q $DOCKER_CONTAINER; then
        echo "⚠️  警告: Docker 容器 $DOCKER_CONTAINER 未运行"
        echo "   请先启动: cd inventory/longi/deploy && docker-compose up -d"
        exit 1
    fi
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    
    # 导出 longinventory 数据库
    echo "   导出 longinventory 数据库..."
    docker exec $DOCKER_CONTAINER pg_dump -U $DB_USER longinventory \
        > "$BACKUP_DIR/longinventory-${timestamp}.sql"
    
    echo "   ✅ longinventory 导出完成: $BACKUP_DIR/longinventory-${timestamp}.sql"
    echo "      大小: $(du -h $BACKUP_DIR/longinventory-${timestamp}.sql | cut -f1)"
    
    # 压缩
    gzip "$BACKUP_DIR/longinventory-${timestamp}.sql"
    echo "   ✅ 已压缩: $BACKUP_DIR/longinventory-${timestamp}.sql.gz"
    echo ""
    
    # 保存最新文件名
    echo "longinventory-${timestamp}.sql.gz" > "$BACKUP_DIR/latest-export.txt"
}

# ==============================================================================
# 步骤 2: 等待 K8s PostgreSQL 就绪
# ==============================================================================

wait_k8s_ready() {
    echo "⏳ 步骤 2/3: 等待 K8s PostgreSQL 就绪"
    echo "--------------------------------"
    
    # 检查 Pod 是否存在
    if ! kubectl get pod -n $K8S_NAMESPACE $K8S_POD &>/dev/null; then
        echo "❌ 错误: K8s Pod $K8S_POD 不存在"
        echo "   请先部署: cd inventory/deploy && ./deploy.sh"
        exit 1
    fi
    
    # 等待 Pod Ready
    echo "   等待 Pod 就绪..."
    kubectl wait --for=condition=ready pod/$K8S_POD -n $K8S_NAMESPACE --timeout=120s
    
    echo "   ✅ K8s PostgreSQL 已就绪"
    echo ""
}

# ==============================================================================
# 步骤 3: 导入数据到 K8s
# ==============================================================================

import_to_k8s() {
    echo "📥 步骤 3/3: 导入数据到 K8s"
    echo "--------------------------------"
    
    # 读取最新导出的文件
    local latest_file=$(cat "$BACKUP_DIR/latest-export.txt" 2>/dev/null)
    
    if [ -z "$latest_file" ] || [ ! -f "$BACKUP_DIR/$latest_file" ]; then
        echo "❌ 错误: 找不到导出文件"
        exit 1
    fi
    
    echo "   导入文件: $BACKUP_DIR/$latest_file"
    
    # 确认导入
    echo ""
    echo "⚠️  警告: 此操作将覆盖 K8s 中的 longinventory 数据库"
    read -p "   确定继续? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ 取消导入"
        exit 0
    fi
    
    # 导入数据
    echo ""
    echo "   正在导入..."
    gunzip -c "$BACKUP_DIR/$latest_file" | \
        kubectl exec -i -n $K8S_NAMESPACE $K8S_POD -- \
        psql -U $DB_USER -d longinventory
    
    echo ""
    echo "   ✅ 数据导入完成"
    echo ""
}

# ==============================================================================
# 步骤 4: 验证数据
# ==============================================================================

verify_data() {
    echo "✅ 步骤 4/4: 验证数据"
    echo "--------------------------------"
    
    echo "   查询表数量..."
    local table_count=$(kubectl exec -n $K8S_NAMESPACE $K8S_POD -- \
        psql -U $DB_USER -d longinventory -t -c \
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
    
    echo "   ✅ 公共表数量: $table_count"
    
    echo ""
    echo "   列出前 10 个表:"
    kubectl exec -n $K8S_NAMESPACE $K8S_POD -- \
        psql -U $DB_USER -d longinventory -c \
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 10;"
    
    echo ""
}

# ==============================================================================
# 主流程
# ==============================================================================

main() {
    case "${1:-all}" in
        export)
            export_from_docker
            ;;
        import)
            wait_k8s_ready
            import_to_k8s
            verify_data
            ;;
        all)
            export_from_docker
            wait_k8s_ready
            import_to_k8s
            verify_data
            echo "🎉 迁移完成！"
            echo ""
            echo "下一步："
            echo "1. 测试应用连接: kubectl get svc -n $K8S_NAMESPACE"
            echo "2. 查看日志: kubectl logs -n $K8S_NAMESPACE -l app=inventory-backend"
            echo "3. 访问应用: https://inventory.easytool.page"
            ;;
        *)
            echo "用法: $0 [export|import|all]"
            echo ""
            echo "  export  - 仅从 Docker 导出数据"
            echo "  import  - 仅导入到 K8s（需要先运行 export）"
            echo "  all     - 完整迁移流程（默认）"
            exit 1
            ;;
    esac
}

main "$@"
