#!/bin/bash

# ==============================================================================
# PostgreSQL 备份和恢复脚本
# ==============================================================================
# 支持 K8s 和 Docker Compose 两种环境
# ==============================================================================

set -e

BACKUP_DIR="./backups"
NAMESPACE="longi-inventory"
POD_NAME="shared-postgres-0"
DB_USER="postgres"
DB_PASSWORD="superadminpass"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# ==============================================================================
# 函数定义
# ==============================================================================

# 显示使用说明
usage() {
    cat << USAGE
数据库备份和恢复工具

用法:
    $0 <命令> [选项]

命令:
    backup-k8s <数据库名>           从 K8s 备份数据库
    restore-k8s <数据库名> <文件>   恢复到 K8s
    backup-docker <数据库名>        从 Docker 备份数据库
    restore-docker <数据库名> <文件> 恢复到 Docker
    list                            列出所有备份

示例:
    # K8s 环境
    $0 backup-k8s longinventory
    $0 backup-k8s projectmanagement
    $0 restore-k8s longinventory backups/longinventory-2024-11-04.sql
    
    # Docker 环境
    $0 backup-docker longinventory
    $0 restore-docker longinventory backups/longinventory-2024-11-04.sql
    
    # 列出备份
    $0 list

USAGE
    exit 1
}

# K8s 备份
backup_k8s() {
    local db_name=$1
    if [ -z "$db_name" ]; then
        echo "❌ 错误: 请指定数据库名"
        usage
    fi
    
    local timestamp=$(date +%Y-%m-%d-%H%M%S)
    local backup_file="$BACKUP_DIR/${db_name}-${timestamp}.sql"
    
    echo "📦 开始备份 K8s 数据库: $db_name"
    echo "   命名空间: $NAMESPACE"
    echo "   Pod: $POD_NAME"
    echo "   保存到: $backup_file"
    
    kubectl exec -n $NAMESPACE $POD_NAME -- \
        pg_dump -U $DB_USER $db_name > "$backup_file"
    
    # 压缩备份
    gzip "$backup_file"
    
    echo "✅ 备份完成: ${backup_file}.gz"
    echo "   文件大小: $(du -h ${backup_file}.gz | cut -f1)"
}

# K8s 恢复
restore_k8s() {
    local db_name=$1
    local backup_file=$2
    
    if [ -z "$db_name" ] || [ -z "$backup_file" ]; then
        echo "❌ 错误: 请指定数据库名和备份文件"
        usage
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ 错误: 备份文件不存在: $backup_file"
        exit 1
    fi
    
    echo "⚠️  警告: 即将恢复数据库 $db_name"
    echo "   这将覆盖现有数据！"
    read -p "   确定继续? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ 取消恢复"
        exit 0
    fi
    
    echo "🔄 开始恢复数据库: $db_name"
    
    # 解压（如果是 .gz 文件）
    if [[ "$backup_file" == *.gz ]]; then
        echo "   解压备份文件..."
        gunzip -c "$backup_file" | kubectl exec -i -n $NAMESPACE $POD_NAME -- \
            psql -U $DB_USER -d $db_name
    else
        cat "$backup_file" | kubectl exec -i -n $NAMESPACE $POD_NAME -- \
            psql -U $DB_USER -d $db_name
    fi
    
    echo "✅ 恢复完成"
}

# Docker 备份
backup_docker() {
    local db_name=$1
    if [ -z "$db_name" ]; then
        echo "❌ 错误: 请指定数据库名"
        usage
    fi
    
    local timestamp=$(date +%Y-%m-%d-%H%M%S)
    local backup_file="$BACKUP_DIR/${db_name}-${timestamp}.sql"
    
    echo "📦 开始备份 Docker 数据库: $db_name"
    echo "   容器: longi_postgres"
    echo "   保存到: $backup_file"
    
    docker exec longi_postgres pg_dump -U $DB_USER $db_name > "$backup_file"
    
    # 压缩备份
    gzip "$backup_file"
    
    echo "✅ 备份完成: ${backup_file}.gz"
    echo "   文件大小: $(du -h ${backup_file}.gz | cut -f1)"
}

# Docker 恢复
restore_docker() {
    local db_name=$1
    local backup_file=$2
    
    if [ -z "$db_name" ] || [ -z "$backup_file" ]; then
        echo "❌ 错误: 请指定数据库名和备份文件"
        usage
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ 错误: 备份文件不存在: $backup_file"
        exit 1
    fi
    
    echo "⚠️  警告: 即将恢复数据库 $db_name"
    echo "   这将覆盖现有数据！"
    read -p "   确定继续? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ 取消恢复"
        exit 0
    fi
    
    echo "🔄 开始恢复数据库: $db_name"
    
    # 解压（如果是 .gz 文件）
    if [[ "$backup_file" == *.gz ]]; then
        echo "   解压备份文件..."
        gunzip -c "$backup_file" | docker exec -i longi_postgres \
            psql -U $DB_USER -d $db_name
    else
        cat "$backup_file" | docker exec -i longi_postgres \
            psql -U $DB_USER -d $db_name
    fi
    
    echo "✅ 恢复完成"
}

# 列出所有备份
list_backups() {
    echo "📋 备份文件列表："
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        echo "   (无备份文件)"
        return
    fi
    
    ls -lh "$BACKUP_DIR" | grep -v "^总计" | awk '{
        if (NR > 1) {
            size = $5
            date = $6 " " $7 " " $8
            file = $9
            printf "   %-50s  %8s  %s\n", file, size, date
        }
    }'
}

# ==============================================================================
# 主程序
# ==============================================================================

case "${1:-}" in
    backup-k8s)
        backup_k8s "$2"
        ;;
    restore-k8s)
        restore_k8s "$2" "$3"
        ;;
    backup-docker)
        backup_docker "$2"
        ;;
    restore-docker)
        restore_docker "$2" "$3"
        ;;
    list)
        list_backups
        ;;
    *)
        usage
        ;;
esac
