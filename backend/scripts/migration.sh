#!/bin/bash



# 生成迁移状态报告
generate_migration_report() {
    local report_file="$LOG_DIR/migration_status_$(date +%Y%m%d_%H%M%S).json"

    echo -e "${BLUE}[INFO]${NC} 生成迁移状态报告..."

    if [ -f "alembic.ini" ]; then
        local current_revision=$(alembic current 2>/dev/null | grep -o '[a-f0-9]\{12\}' | head -1)
        local head_revision=$(alembic heads 2>/dev/null | grep -o '[a-f0-9]\{12\}' | head -1)

        # 生成JSON格式的报告
        cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "database": {
    "host": "$DB_HOST",
    "port": "$DB_PORT",
    "name": "$DB_NAME",
    "user": "$DB_USER"
  },
  "migration": {
    "current_revision": "${current_revision:-null}",
    "head_revision": "${head_revision:-null}",
    "is_up_to_date": $([ "$current_revision" = "$head_revision" ] && echo "true" || echo "false"),
    "backup_file": "${MIGRATION_BACKUP_FILE:-null}",
    "auto_migrate": "${AUTO_MIGRATE:-false}",
    "backup_enabled": "${MIGRATION_BACKUP:-true}"
  },
  "alembic_config": {
    "config_exists": true,
    "config_path": "./alembic.ini"
  }
}
EOF
    else
        cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "error": "alembic.ini not found",
  "alembic_config": {
    "config_exists": false,
    "config_path": "./alembic.ini"
  }
}
EOF
    fi

    echo -e "${GREEN}[SUCCESS]${NC} 迁移状态报告: $report_file"

    # 也输出到控制台
    echo -e "${BLUE}[INFO]${NC} 当前迁移状态:"
    cat "$report_file" | grep -E '"(current_revision|head_revision|is_up_to_date)"' | sed 's/^  /  /'
}

# 检查迁移版本
check_migration_status() {
    echo -e "${BLUE}[INFO]${NC} 检查当前迁移状态..."

    if [ -f $ALEMBIC_CONFIG ]; then
        # 获取当前数据库版本
        local current_revision=$(alembic current 2>/dev/null | grep -o '[a-f0-9]\{12\}' | head -1)
        local head_revision=$(alembic heads 2>/dev/null | grep -o '[a-f0-9]\{12\}' | head -1)

        echo "当前数据库版本: ${current_revision:-'未初始化'}"
        echo "目标版本: ${head_revision:-'未知'}"

        if [ "$current_revision" = "$head_revision" ] && [ -n "$current_revision" ]; then
            echo -e "${GREEN}[INFO]${NC} 数据库已是最新版本，无需迁移"
            return 1  # 无需迁移
        elif [ -z "$current_revision" ]; then
            echo -e "${YELLOW}[INFO]${NC} 数据库未初始化，将执行完整迁移"
        else
            echo -e "${BLUE}[INFO]${NC} 发现新的迁移文件，需要更新"
        fi

        # 显示待执行的迁移
        echo -e "${BLUE}[INFO]${NC} 待执行的迁移:"
        alembic history --verbose 2>/dev/null | head -10 || echo "无法获取迁移历史"

        return 0  # 需要迁移
    else
        echo -e "${RED}[ERROR]${NC} 未找到alembic.ini配置文件"
        return 2  # 配置错误
    fi
}


# 创建迁移备份
backup_before_migration() {
    local backup_enabled=${MIGRATION_BACKUP:-true}

    if [ "$backup_enabled" = "true" ] && [ "$ENVIRONMENT" != "development" ]; then
        echo -e "${BLUE}[INFO]${NC} 迁移前备份数据库..."

        local timestamp=$(date +%Y%m%d_%H%M%S)
        local backup_file="$TMP_DIR/migration_backup_${timestamp}.sql"

        # 尝试创建备份
        if command -v pg_dump &> /dev/null; then
            pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file" 2>/dev/null && {
                echo -e "${GREEN}[SUCCESS]${NC} 数据库备份完成: $backup_file"
                export MIGRATION_BACKUP_FILE="$backup_file"
            } || {
                echo -e "${YELLOW}[WARNING]${NC} 数据库备份失败，继续迁移"
            }
        else
            echo -e "${YELLOW}[WARNING]${NC} pg_dump不可用，跳过备份"
        fi
    else
        echo -e "${BLUE}[INFO]${NC} 跳过迁移前备份 (disabled或development环境)"
    fi
}

# 执行数据库迁移
execute_migration() {
    echo -e "${BLUE}[INFO]${NC} 开始执行数据库迁移..."

    local migration_start_time=$(date +%s)
    local migration_log="$LOG_DIR/migration_$(date +%Y%m%d_%H%M%S).log"

    # 执行迁移并记录日志
    {
        echo "=== 迁移开始时间: $(date) ==="
        echo "环境: $APP_ENV"
        echo "数据库: $DB_HOST:$DB_PORT/$DB_NAME"
        echo "用户: $DB_USERNAME"
        echo ""

        # 执行迁移
        alembic upgrade head 2>&1
        local migration_status=$?

        echo ""
        echo "=== 迁移结束时间: $(date) ==="
        echo "状态码: $migration_status"

        return $migration_status
    } | tee "$migration_log"

    local migration_status=${PIPESTATUS[0]}
    local migration_end_time=$(date +%s)
    local duration=$((migration_end_time - migration_start_time))

    if [ $migration_status -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS]${NC} 数据库迁移成功完成 (耗时: ${duration}秒)"
        echo -e "${GREEN}[SUCCESS]${NC} 迁移日志: $migration_log"

        # 验证迁移结果
        verify_migration
        return 0
    else
        echo -e "${RED}[ERROR]${NC} 数据库迁移失败 (耗时: ${duration}秒)"
        echo -e "${RED}[ERROR]${NC} 详细日志: $migration_log"
        return $migration_status
    fi
}

# 迁移回滚机制
rollback_migration() {
    local backup_file=${1:-$MIGRATION_BACKUP_FILE}

    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        echo -e "${RED}[ERROR]${NC} 没有找到备份文件，无法回滚"
        return 1
    fi

    echo -e "${YELLOW}[WARNING]${NC} 开始回滚数据库到迁移前状态..."
    echo -e "${YELLOW}[WARNING]${NC} 使用备份文件: $backup_file"

    # 确认回滚（在非交互环境中跳过）
    if [ "$MIGRATION_AUTO_ROLLBACK" != "true" ]; then
        echo -e "${RED}[CONFIRM]${NC} 这将覆盖当前数据库，是否继续? (设置MIGRATION_AUTO_ROLLBACK=true跳过确认)"
        return 1
    fi

    # 执行回滚
    if command -v psql &> /dev/null; then
        # 删除当前数据库并重新创建
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

        # 恢复备份
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$backup_file" && {
            echo -e "${GREEN}[SUCCESS]${NC} 数据库回滚完成"
            return 0
        } || {
            echo -e "${RED}[ERROR]${NC} 数据库回滚失败"
            return 1
        }
    else
        echo -e "${RED}[ERROR]${NC} psql不可用，无法执行回滚"
        return 1
    fi
}