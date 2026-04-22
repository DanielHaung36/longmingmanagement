#!/bin/bash
# ==============================================================================
# Inventory 数据导入脚本
# ==============================================================================
# 功能：自动导入备份数据到 K8s PostgreSQL
# 使用：./import-data.sh <backup-file>
# ==============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
NAMESPACE="longi-inventory"
DB_NAME="longinventory"
DB_USER="postgres"
DB_PASSWORD="superadminpass"
NODEPORT="30432"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 检查 PostgreSQL 是否就绪
check_postgres() {
    print_info "检查 PostgreSQL 状态..."

    POD_NAME=$(kubectl get pod -n $NAMESPACE -l app=shared-postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$POD_NAME" ]; then
        print_error "PostgreSQL Pod 未找到！"
        print_warning "请先部署 PostgreSQL: kubectl apply -f 10-postgres.yaml"
        exit 1
    fi

    # 检查 Pod 是否 Ready
    STATUS=$(kubectl get pod $POD_NAME -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    if [ "$STATUS" != "True" ]; then
        print_error "PostgreSQL Pod 未就绪！"
        kubectl get pod $POD_NAME -n $NAMESPACE
        exit 1
    fi

    print_success "PostgreSQL 运行正常: $POD_NAME"
}

# 检测备份文件类型
detect_backup_type() {
    local file=$1

    if [[ $file == *.dump ]]; then
        echo "custom"
    elif [[ $file == *.sql.gz ]]; then
        echo "sql_gz"
    elif [[ $file == *.sql ]]; then
        echo "sql"
    else
        # 检查文件内容
        if file "$file" | grep -q "PostgreSQL custom database dump"; then
            echo "custom"
        elif file "$file" | grep -q "gzip compressed"; then
            echo "sql_gz"
        else
            echo "sql"
        fi
    fi
}

# 导入 Custom Format (.dump)
import_custom_format() {
    local backup_file=$1
    local pod_name=$2

    print_info "使用 pg_restore 导入 Custom Format 备份..."

    # 复制文件到 Pod
    print_info "复制备份文件到 Pod..."
    kubectl cp "$backup_file" $NAMESPACE/$pod_name:/tmp/backup.dump

    # 导入数据
    print_info "开始导入数据（使用 --clean --if-exists）..."
    kubectl exec -it $pod_name -n $NAMESPACE -- \
        pg_restore -U $DB_USER -d $DB_NAME \
        --clean --if-exists --no-owner --no-acl \
        -v /tmp/backup.dump

    # 清理临时文件
    kubectl exec $pod_name -n $NAMESPACE -- rm /tmp/backup.dump
}

# 导入 SQL Format
import_sql_format() {
    local backup_file=$1
    local pod_name=$2
    local is_compressed=$3

    print_info "使用 psql 导入 SQL 备份..."

    if [ "$is_compressed" = "true" ]; then
        # 解压并复制
        print_info "解压备份文件..."
        TEMP_SQL="/tmp/backup_$(date +%s).sql"
        gunzip -c "$backup_file" > "$TEMP_SQL"

        print_info "复制 SQL 文件到 Pod..."
        kubectl cp "$TEMP_SQL" $NAMESPACE/$pod_name:/tmp/backup.sql

        # 清理本地临时文件
        rm "$TEMP_SQL"
    else
        print_info "复制 SQL 文件到 Pod..."
        kubectl cp "$backup_file" $NAMESPACE/$pod_name:/tmp/backup.sql
    fi

    # 导入数据
    print_info "开始导入数据..."
    kubectl exec -it $pod_name -n $NAMESPACE -- \
        psql -U $DB_USER -d $DB_NAME -f /tmp/backup.sql

    # 清理临时文件
    kubectl exec $pod_name -n $NAMESPACE -- rm /tmp/backup.sql
}

# 使用本地 psql 导入（通过 NodePort）
import_via_nodeport() {
    local backup_file=$1
    local backup_type=$2

    print_info "使用本地 psql 通过 NodePort 导入..."

    # 测试连接
    print_info "测试数据库连接..."
    if ! psql "postgresql://$DB_USER:$DB_PASSWORD@localhost:$NODEPORT/$DB_NAME" -c "SELECT version();" &>/dev/null; then
        print_error "无法连接到数据库！"
        print_warning "请确保 NodePort 30432 可访问"
        return 1
    fi

    print_success "数据库连接成功"

    # 根据类型导入
    if [ "$backup_type" = "custom" ]; then
        print_info "使用 pg_restore 导入..."
        pg_restore -h localhost -p $NODEPORT -U $DB_USER -d $DB_NAME \
            --clean --if-exists --no-owner --no-acl \
            -v "$backup_file"
    elif [ "$backup_type" = "sql_gz" ]; then
        print_info "解压并导入 SQL..."
        zcat "$backup_file" | PGPASSWORD=$DB_PASSWORD \
            psql -h localhost -p $NODEPORT -U $DB_USER -d $DB_NAME
    else
        print_info "导入 SQL..."
        PGPASSWORD=$DB_PASSWORD \
            psql -h localhost -p $NODEPORT -U $DB_USER -d $DB_NAME -f "$backup_file"
    fi
}

# 验证导入结果
verify_import() {
    local pod_name=$1

    print_info "验证导入结果..."

    echo ""
    print_info "数据库表列表："
    kubectl exec $pod_name -n $NAMESPACE -- \
        psql -U $DB_USER -d $DB_NAME -c "\dt"

    echo ""
    print_info "主要表记录数："
    kubectl exec $pod_name -n $NAMESPACE -- \
        psql -U $DB_USER -d $DB_NAME -c "
        SELECT 'products' as table_name, count(*) as records FROM products
        UNION ALL
        SELECT 'users', count(*) FROM users
        UNION ALL
        SELECT 'categories', count(*) FROM categories
        ORDER BY table_name;" 2>/dev/null || true

    echo ""
}

# 主函数
main() {
    echo "=============================================="
    echo "  Inventory 数据导入工具"
    echo "=============================================="
    echo ""

    # 检查必要命令
    check_command kubectl

    # 检查参数
    if [ $# -eq 0 ]; then
        print_error "请提供备份文件路径"
        echo ""
        echo "使用方法："
        echo "  $0 <backup-file> [方式]"
        echo ""
        echo "示例："
        echo "  $0 ~/inventory-backup.dump"
        echo "  $0 ~/inventory-backup.dump pod    # 使用 Pod 方式"
        echo "  $0 ~/inventory-backup.dump local  # 使用本地 psql"
        echo ""
        exit 1
    fi

    BACKUP_FILE=$1
    METHOD=${2:-auto}  # auto, pod, local

    # 检查文件是否存在
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "备份文件不存在: $BACKUP_FILE"
        exit 1
    fi

    print_success "找到备份文件: $BACKUP_FILE"
    print_info "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"

    # 检测备份类型
    BACKUP_TYPE=$(detect_backup_type "$BACKUP_FILE")
    print_info "备份类型: $BACKUP_TYPE"

    # 检查 PostgreSQL
    check_postgres

    # 获取 Pod 名称
    POD_NAME=$(kubectl get pod -n $NAMESPACE -l app=shared-postgres -o jsonpath='{.items[0].metadata.name}')

    # 确认导入
    echo ""
    print_warning "即将导入数据到数据库: $DB_NAME"
    print_warning "这将清除现有数据！"
    read -p "确认继续? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        print_info "取消导入"
        exit 0
    fi

    # 执行导入
    echo ""
    print_info "开始导入..."
    START_TIME=$(date +%s)

    if [ "$METHOD" = "local" ]; then
        # 使用本地 psql
        check_command psql
        check_command pg_restore
        import_via_nodeport "$BACKUP_FILE" "$BACKUP_TYPE"
    elif [ "$METHOD" = "pod" ]; then
        # 使用 Pod 方式
        if [ "$BACKUP_TYPE" = "custom" ]; then
            import_custom_format "$BACKUP_FILE" "$POD_NAME"
        else
            IS_COMPRESSED="false"
            [ "$BACKUP_TYPE" = "sql_gz" ] && IS_COMPRESSED="true"
            import_sql_format "$BACKUP_FILE" "$POD_NAME" "$IS_COMPRESSED"
        fi
    else
        # 自动选择：优先使用本地 psql（如果可用）
        if command -v psql &> /dev/null && command -v pg_restore &> /dev/null; then
            print_info "检测到本地 PostgreSQL 工具，使用本地导入..."
            if import_via_nodeport "$BACKUP_FILE" "$BACKUP_TYPE"; then
                METHOD="local"
            else
                print_warning "本地导入失败，切换到 Pod 方式..."
                METHOD="pod"
            fi
        else
            METHOD="pod"
        fi

        # 如果是 Pod 方式
        if [ "$METHOD" = "pod" ]; then
            if [ "$BACKUP_TYPE" = "custom" ]; then
                import_custom_format "$BACKUP_FILE" "$POD_NAME"
            else
                IS_COMPRESSED="false"
                [ "$BACKUP_TYPE" = "sql_gz" ] && IS_COMPRESSED="true"
                import_sql_format "$BACKUP_FILE" "$POD_NAME" "$IS_COMPRESSED"
            fi
        fi
    fi

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    print_success "导入完成！耗时: ${DURATION}秒"

    # 验证
    if [ "$METHOD" = "pod" ]; then
        verify_import "$POD_NAME"
    fi

    echo ""
    print_success "✨ 所有操作完成！"
    echo ""
    print_info "下一步："
    echo "  1. 验证数据: kubectl exec -it $POD_NAME -n $NAMESPACE -- psql -U postgres -d longinventory"
    echo "  2. 部署后端: kubectl apply -f 30-backend.yaml"
    echo "  3. 部署前端: kubectl apply -f 40-frontend.yaml"
    echo ""
}

# 运行主函数
main "$@"
