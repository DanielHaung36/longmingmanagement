#!/bin/bash
# ==============================================================================
# Inventory 数据库自动备份脚本
# ==============================================================================
# 功能：定期备份 K8s 中的 inventory 数据库
# 使用：./backup-database.sh [选项]
# ==============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
NAMESPACE="longi-inventory"
DB_NAME="longinventory"
DB_USER="postgres"
DB_PASSWORD="superadminpass"
NODEPORT="30432"
BACKUP_DIR="$HOME/inventory-backups"
KEEP_DAYS=30  # 保留30天的备份
DATE=$(date +%Y%m%d_%H%M%S)
DATE_SIMPLE=$(date +%Y%m%d)

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

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_success "创建备份目录: $BACKUP_DIR"
    fi

    # 创建日期子目录
    DATE_DIR="$BACKUP_DIR/$DATE_SIMPLE"
    if [ ! -d "$DATE_DIR" ]; then
        mkdir -p "$DATE_DIR"
    fi
}

# 检查 PostgreSQL 是否就绪
check_postgres() {
    POD_NAME=$(kubectl get pod -n $NAMESPACE -l app=shared-postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$POD_NAME" ]; then
        print_error "PostgreSQL Pod 未找到！"
        return 1
    fi

    STATUS=$(kubectl get pod $POD_NAME -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    if [ "$STATUS" != "True" ]; then
        print_error "PostgreSQL Pod 未就绪！"
        return 1
    fi

    echo "$POD_NAME"
}

# 方式 1: 通过 Pod 备份
backup_via_pod() {
    local pod_name=$1
    local backup_file=$2

    print_info "通过 Pod 备份..."

    # 在 Pod 中创建备份
    kubectl exec $pod_name -n $NAMESPACE -- \
        pg_dump -U $DB_USER -d $DB_NAME -F c -f /tmp/backup.dump

    # 复制到本地
    kubectl cp $NAMESPACE/$pod_name:/tmp/backup.dump "$backup_file"

    # 清理 Pod 中的临时文件
    kubectl exec $pod_name -n $NAMESPACE -- rm /tmp/backup.dump
}

# 方式 2: 通过 NodePort 备份（需要本地 pg_dump）
backup_via_nodeport() {
    local backup_file=$1

    print_info "通过 NodePort 备份..."

    # 测试连接
    if ! PGPASSWORD=$DB_PASSWORD pg_isready -h localhost -p $NODEPORT -U $DB_USER &>/dev/null; then
        print_error "无法连接到 NodePort"
        return 1
    fi

    # 执行备份
    PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -p $NODEPORT -U $DB_USER -d $DB_NAME -F c -f "$backup_file"
}

# 备份数据库统计信息
backup_stats() {
    local pod_name=$1
    local stats_file=$2

    print_info "备份数据库统计信息..."

    kubectl exec $pod_name -n $NAMESPACE -- \
        psql -U $DB_USER -d $DB_NAME -c "
        SELECT
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
            n_live_tup as row_count
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        " > "$stats_file"
}

# 备份数据库 schema
backup_schema() {
    local pod_name=$1
    local schema_file=$2

    print_info "备份数据库 Schema..."

    kubectl exec $pod_name -n $NAMESPACE -- \
        pg_dump -U $DB_USER -d $DB_NAME --schema-only > "$schema_file"
}

# 验证备份文件
verify_backup() {
    local backup_file=$1

    print_info "验证备份文件..."

    if [ ! -f "$backup_file" ]; then
        print_error "备份文件不存在"
        return 1
    fi

    # 检查文件大小
    FILE_SIZE=$(du -h "$backup_file" | cut -f1)
    if [ "$FILE_SIZE" = "0" ]; then
        print_error "备份文件为空"
        return 1
    fi

    # 列出备份内容
    if command -v pg_restore &>/dev/null; then
        TABLE_COUNT=$(pg_restore --list "$backup_file" 2>/dev/null | grep -c "TABLE DATA" || true)
        print_success "备份包含 $TABLE_COUNT 个表"
    fi

    print_success "验证通过 - 文件大小: $FILE_SIZE"
}

# 清理旧备份
cleanup_old_backups() {
    print_info "清理 ${KEEP_DAYS} 天前的备份..."

    if [ ! -d "$BACKUP_DIR" ]; then
        return
    fi

    # 查找并删除旧文件
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "*.dump" -mtime +$KEEP_DAYS -delete -print | wc -l)
    DELETED_COUNT=$(echo $DELETED_COUNT | xargs)  # 去除空格

    if [ "$DELETED_COUNT" -gt 0 ]; then
        print_success "删除了 $DELETED_COUNT 个旧备份"
    else
        print_info "没有需要清理的旧备份"
    fi

    # 清理空目录
    find "$BACKUP_DIR" -type d -empty -delete 2>/dev/null || true
}

# 生成备份报告
generate_report() {
    local backup_file=$1
    local stats_file=$2
    local report_file="${backup_file%.dump}_report.txt"

    print_info "生成备份报告..."

    cat > "$report_file" <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Inventory 数据库备份报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

备份时间: $(date)
数据库: $DB_NAME
命名空间: $NAMESPACE

文件信息:
  备份文件: $(basename "$backup_file")
  文件大小: $(du -h "$backup_file" | cut -f1)
  MD5: $(md5sum "$backup_file" | cut -d' ' -f1)

数据库统计:
$(cat "$stats_file" 2>/dev/null || echo "统计信息不可用")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

    print_success "报告已生成: $(basename "$report_file")"
}

# 压缩备份（可选）
compress_backup() {
    local backup_file=$1

    read -p "是否压缩备份文件? (y/n): " COMPRESS
    if [ "$COMPRESS" = "y" ]; then
        print_info "压缩备份文件..."
        gzip "$backup_file"
        BACKUP_FILE="${backup_file}.gz"
        print_success "已压缩: $(basename "$BACKUP_FILE")"
    fi
}

# 主备份流程
perform_backup() {
    local backup_type=${1:-full}

    echo "=============================================="
    echo "  Inventory 数据库备份"
    echo "=============================================="
    echo ""

    # 创建备份目录
    create_backup_dir

    # 检查 PostgreSQL
    print_info "检查 PostgreSQL 状态..."
    POD_NAME=$(check_postgres)
    if [ $? -ne 0 ]; then
        exit 1
    fi
    print_success "PostgreSQL 运行正常: $POD_NAME"

    # 设置文件路径
    DATE_DIR="$BACKUP_DIR/$DATE_SIMPLE"
    BACKUP_FILE="$DATE_DIR/inventory_${DATE}.dump"
    STATS_FILE="$DATE_DIR/inventory_${DATE}_stats.txt"
    SCHEMA_FILE="$DATE_DIR/inventory_${DATE}_schema.sql"

    # 执行备份
    print_info "开始备份..."
    START_TIME=$(date +%s)

    # 选择备份方式
    if command -v pg_dump &>/dev/null; then
        if backup_via_nodeport "$BACKUP_FILE"; then
            print_success "使用 NodePort 方式备份成功"
        else
            print_warning "NodePort 备份失败，使用 Pod 方式"
            backup_via_pod "$POD_NAME" "$BACKUP_FILE"
        fi
    else
        backup_via_pod "$POD_NAME" "$BACKUP_FILE"
    fi

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    print_success "备份完成！耗时: ${DURATION}秒"

    # 验证备份
    verify_backup "$BACKUP_FILE"

    # 备份统计和 Schema
    if [ "$backup_type" = "full" ]; then
        backup_stats "$POD_NAME" "$STATS_FILE"
        backup_schema "$POD_NAME" "$SCHEMA_FILE"
        generate_report "$BACKUP_FILE" "$STATS_FILE"
    fi

    # 显示备份信息
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_success "备份已保存到:"
    echo "  数据: $BACKUP_FILE"
    if [ "$backup_type" = "full" ]; then
        echo "  统计: $STATS_FILE"
        echo "  Schema: $SCHEMA_FILE"
        echo "  报告: ${BACKUP_FILE%.dump}_report.txt"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 清理旧备份
    if [ "$backup_type" = "full" ]; then
        cleanup_old_backups
    fi

    # 列出最近的备份
    echo ""
    print_info "最近的5个备份:"
    find "$BACKUP_DIR" -name "*.dump" -printf "%T@ %p\n" | sort -rn | head -5 | while read timestamp file; do
        echo "  $(date -d @${timestamp%.*} '+%Y-%m-%d %H:%M') - $(basename "$file") ($(du -h "$file" | cut -f1))"
    done
    echo ""
}

# 快速备份（无额外信息）
quick_backup() {
    perform_backup "quick"
}

# 完整备份（包含统计、Schema等）
full_backup() {
    perform_backup "full"
}

# 显示帮助
show_help() {
    cat <<EOF
使用方法: $0 [选项]

选项:
  -q, --quick       快速备份（仅数据）
  -f, --full        完整备份（数据+统计+Schema） [默认]
  -c, --cleanup     仅清理旧备份
  -l, --list        列出所有备份
  -h, --help        显示帮助

示例:
  $0                # 完整备份
  $0 --quick        # 快速备份
  $0 --cleanup      # 清理旧备份
  $0 --list         # 列出备份

环境变量:
  BACKUP_DIR        备份目录（默认: ~/inventory-backups）
  KEEP_DAYS         保留天数（默认: 30）
EOF
}

# 列出所有备份
list_backups() {
    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "备份目录不存在: $BACKUP_DIR"
        return
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  所有备份文件"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "*.dump" | wc -l)

    if [ "$BACKUP_COUNT" -eq 0 ]; then
        print_warning "没有找到备份文件"
        return
    fi

    printf "%-20s %-15s %-50s\n" "日期时间" "大小" "文件"
    echo "────────────────────────────────────────────────────────────────────────────"

    find "$BACKUP_DIR" -name "*.dump*" -printf "%T@ %p\n" | sort -rn | while read timestamp file; do
        SIZE=$(du -h "$file" | cut -f1)
        DATE=$(date -d @${timestamp%.*} '+%Y-%m-%d %H:%M')
        NAME=$(basename "$file")
        printf "%-20s %-15s %-50s\n" "$DATE" "$SIZE" "$NAME"
    done

    echo ""
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    print_info "总计: $BACKUP_COUNT 个备份，占用空间: $TOTAL_SIZE"
    echo ""
}

# 主函数
main() {
    case "${1:-}" in
        -q|--quick)
            quick_backup
            ;;
        -f|--full)
            full_backup
            ;;
        -c|--cleanup)
            cleanup_old_backups
            ;;
        -l|--list)
            list_backups
            ;;
        -h|--help)
            show_help
            ;;
        "")
            full_backup
            ;;
        *)
            print_error "未知选项: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
