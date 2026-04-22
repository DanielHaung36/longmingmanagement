#!/bin/bash
# ==============================================================================
# 从旧系统导出 Inventory 最新数据
# ==============================================================================
# 功能：从旧的 Docker 容器或数据目录导出最新的 inventory 数据
# 使用：./export-from-old.sh [选项]
# ==============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
OLD_CONTAINER_NAME="longi-postgres"
OLD_DB_NAME="longinventory"
OLD_DB_USER="postgres"
OLD_DATA_DIR="$HOME/project/inventory/longi/postgres-data"
BACKUP_DIR="$HOME/inventory-backups"
DATE=$(date +%Y%m%d_%H%M%S)

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

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装"
        return 1
    fi
    return 0
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_success "创建备份目录: $BACKUP_DIR"
    fi
}

# 方式 1: 从运行中的 Docker 容器导出
export_from_docker() {
    print_info "检查 Docker 容器: $OLD_CONTAINER_NAME"

    if ! docker ps -a --format '{{.Names}}' | grep -q "^${OLD_CONTAINER_NAME}$"; then
        print_error "容器 $OLD_CONTAINER_NAME 不存在"
        return 1
    fi

    # 检查容器是否运行
    CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' $OLD_CONTAINER_NAME)

    if [ "$CONTAINER_STATUS" != "running" ]; then
        print_warning "容器未运行，尝试启动..."
        docker start $OLD_CONTAINER_NAME
        sleep 5
    fi

    print_success "容器运行中"

    # 选择导出格式
    echo ""
    echo "选择导出格式："
    echo "  1) Custom Format (.dump) - 推荐，支持选择性恢复"
    echo "  2) Plain SQL (.sql) - 可读性好"
    echo "  3) 压缩 SQL (.sql.gz) - 节省空间"
    read -p "请选择 (1-3): " FORMAT_CHOICE

    case $FORMAT_CHOICE in
        1)
            BACKUP_FILE="$BACKUP_DIR/inventory_${DATE}.dump"
            print_info "导出为 Custom Format..."
            docker exec $OLD_CONTAINER_NAME \
                pg_dump -U $OLD_DB_USER -d $OLD_DB_NAME -F c -f /tmp/backup.dump
            docker cp $OLD_CONTAINER_NAME:/tmp/backup.dump "$BACKUP_FILE"
            docker exec $OLD_CONTAINER_NAME rm /tmp/backup.dump
            ;;
        2)
            BACKUP_FILE="$BACKUP_DIR/inventory_${DATE}.sql"
            print_info "导出为 Plain SQL..."
            docker exec $OLD_CONTAINER_NAME \
                pg_dump -U $OLD_DB_USER -d $OLD_DB_NAME > "$BACKUP_FILE"
            ;;
        3)
            BACKUP_FILE="$BACKUP_DIR/inventory_${DATE}.sql.gz"
            print_info "导出为压缩 SQL..."
            docker exec $OLD_CONTAINER_NAME \
                pg_dump -U $OLD_DB_USER -d $OLD_DB_NAME | gzip > "$BACKUP_FILE"
            ;;
        *)
            print_error "无效选择"
            return 1
            ;;
    esac

    print_success "导出完成: $BACKUP_FILE"
    print_info "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"

    # 验证备份
    echo ""
    print_info "验证备份..."
    if [ "$FORMAT_CHOICE" = "1" ]; then
        pg_restore --list "$BACKUP_FILE" | head -20
    else
        echo "前 20 行:"
        if [ "$FORMAT_CHOICE" = "3" ]; then
            zcat "$BACKUP_FILE" | head -20
        else
            head -20 "$BACKUP_FILE"
        fi
    fi
}

# 方式 2: 从数据目录导出
export_from_data_dir() {
    print_info "从数据目录导出: $OLD_DATA_DIR"

    if [ ! -d "$OLD_DATA_DIR" ]; then
        print_error "数据目录不存在: $OLD_DATA_DIR"
        return 1
    fi

    print_success "找到数据目录"

    # 检查 PostgreSQL 版本
    if [ -f "$OLD_DATA_DIR/PG_VERSION" ]; then
        PG_VERSION=$(cat "$OLD_DATA_DIR/PG_VERSION")
        print_info "PostgreSQL 版本: $PG_VERSION"
    fi

    # 启动临时容器
    TEMP_CONTAINER="temp-pg-export-$$"
    print_info "启动临时 PostgreSQL 容器..."

    docker run -d --name $TEMP_CONTAINER \
        -v "$OLD_DATA_DIR:/var/lib/postgresql/data" \
        -e POSTGRES_PASSWORD=superadminpass \
        postgres:${PG_VERSION:-15} > /dev/null

    # 等待 PostgreSQL 启动
    print_info "等待 PostgreSQL 启动..."
    for i in {1..30}; do
        if docker exec $TEMP_CONTAINER pg_isready &> /dev/null; then
            break
        fi
        sleep 1
    done

    if ! docker exec $TEMP_CONTAINER pg_isready &> /dev/null; then
        print_error "PostgreSQL 启动失败"
        docker rm -f $TEMP_CONTAINER
        return 1
    fi

    print_success "PostgreSQL 启动成功"

    # 列出数据库
    print_info "可用的数据库："
    docker exec $TEMP_CONTAINER psql -U postgres -c "\l" | grep -E "Name|longinventory|projectmanagement"

    # 导出数据
    BACKUP_FILE="$BACKUP_DIR/inventory_from_volume_${DATE}.dump"
    print_info "导出数据..."
    docker exec $TEMP_CONTAINER \
        pg_dump -U postgres -d $OLD_DB_NAME -F c > "$BACKUP_FILE"

    # 停止并删除临时容器
    print_info "清理临时容器..."
    docker stop $TEMP_CONTAINER > /dev/null
    docker rm $TEMP_CONTAINER > /dev/null

    print_success "导出完成: $BACKUP_FILE"
    print_info "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
}

# 方式 3: 从远程 PostgreSQL 导出
export_from_remote() {
    echo ""
    print_info "从远程 PostgreSQL 导出"
    echo ""

    read -p "主机 (localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "端口 (5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}

    read -p "用户 (postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}

    read -sp "密码: " DB_PASSWORD
    echo ""

    read -p "数据库名 (longinventory): " DB_NAME
    DB_NAME=${DB_NAME:-longinventory}

    # 测试连接
    print_info "测试连接..."
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" &> /dev/null; then
        print_error "无法连接到数据库"
        return 1
    fi

    print_success "连接成功"

    # 导出
    BACKUP_FILE="$BACKUP_DIR/inventory_remote_${DATE}.dump"
    print_info "导出数据..."
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_FILE"

    print_success "导出完成: $BACKUP_FILE"
    print_info "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
}

# 列出现有备份
list_backups() {
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        print_warning "没有找到备份文件"
        return
    fi

    echo ""
    print_info "现有备份文件："
    echo ""
    ls -lh "$BACKUP_DIR" | tail -n +2 | awk '{printf "  %s  %s  %s %s %s\n", $5, $6, $7, $8, $9}'
    echo ""
}

# 主菜单
show_menu() {
    echo "=============================================="
    echo "  从旧系统导出 Inventory 数据"
    echo "=============================================="
    echo ""
    echo "选择导出方式："
    echo "  1) 从 Docker 容器导出"
    echo "  2) 从数据目录导出"
    echo "  3) 从远程 PostgreSQL 导出"
    echo "  4) 列出现有备份"
    echo "  5) 退出"
    echo ""
}

main() {
    # 检查依赖
    if ! check_command docker; then
        print_error "需要安装 Docker"
        exit 1
    fi

    # 创建备份目录
    create_backup_dir

    # 显示菜单
    while true; do
        show_menu
        read -p "请选择 (1-5): " choice

        case $choice in
            1)
                export_from_docker
                ;;
            2)
                export_from_data_dir
                ;;
            3)
                if ! check_command psql || ! check_command pg_dump; then
                    print_error "需要安装 PostgreSQL 客户端工具"
                    continue
                fi
                export_from_remote
                ;;
            4)
                list_backups
                continue
                ;;
            5)
                print_info "退出"
                exit 0
                ;;
            *)
                print_error "无效选择"
                continue
                ;;
        esac

        # 显示导入提示
        if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            print_success "备份已保存到: $BACKUP_FILE"
            echo ""
            print_info "下一步 - 导入到 K8s："
            echo "  cd inventory/deploy"
            echo "  ./import-data.sh $BACKUP_FILE"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
        fi

        read -p "继续导出其他数据? (y/n): " CONTINUE
        if [ "$CONTINUE" != "y" ]; then
            break
        fi

        echo ""
    done
}

# 如果有参数，直接执行对应操作
if [ $# -gt 0 ]; then
    create_backup_dir
    case $1 in
        docker)
            export_from_docker
            ;;
        volume)
            export_from_data_dir
            ;;
        remote)
            export_from_remote
            ;;
        list)
            list_backups
            ;;
        *)
            print_error "未知参数: $1"
            echo "使用: $0 [docker|volume|remote|list]"
            exit 1
            ;;
    esac
else
    main
fi
