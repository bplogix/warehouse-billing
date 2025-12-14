#!/bin/bash

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BIN_DIR="$SCRIPT_DIR/.venv/bin"
ALEMBIC_CONFIG="$SCRIPT_DIR/alembic.ini"
LOG_DIR="$SCRIPT_DIR/logs"
TMP_DIR="$SCRIPT_DIR/tmps"

export PATH="$BIN_DIR:$PATH"

# 导入工具函数（日志工具要尽早加载，方便后续脚本使用）
if [ -f "$SCRIPT_DIR/scripts/log.sh" ]; then
  source "$SCRIPT_DIR/scripts/log.sh"
else
  echo "[WARNING] Missing log helper at $SCRIPT_DIR/scripts/log.sh"
fi

# 数据库迁移工具函数
if [ -f "$SCRIPT_DIR/scripts/migration.sh" ]; then
  source "$SCRIPT_DIR/scripts/migration.sh"
else
  log_warning "Missing migration helpers at $SCRIPT_DIR/scripts/migration.sh"
fi

# 加载环境变量（优先使用 backend/.env，其次允许外部覆盖或 fallback 到项目根）
DEFAULT_ENV_FILE="$SCRIPT_DIR/.env"
if [ ! -f "$DEFAULT_ENV_FILE" ] && [ -f "$SCRIPT_DIR/../.env" ]; then
  DEFAULT_ENV_FILE="$SCRIPT_DIR/../.env"
fi
ENV_FILE=${ENV_FILE:-"$DEFAULT_ENV_FILE"}

if [ -f "$ENV_FILE" ]; then
  set -a           # 自动导出
  source "$ENV_FILE"
  set +a
else
  log_warning "未找到环境文件 $ENV_FILE"
fi

mkdir -p "$LOG_DIR" "$TMP_DIR"

# 主迁移函数
run_migrations() {
    if [ "$ENVIRONMENT" != "development" ] || [ "$AUTO_MIGRATE" = "true" ]; then
        echo -e "${BLUE}[INFO]${NC} 开始数据库迁移流程..."

        # 检查alembic配置
        if [ ! -f $ALEMBIC_CONFIG ]; then
            echo -e "${YELLOW}[WARNING]${NC} 未找到alembic配置，跳过迁移"
            generate_migration_report
            return 0
        fi

        # 1. 生成迁移前状态报告
        generate_migration_report

        # 2. 检查迁移状态
        if ! check_migration_status; then
            local check_status=$?
            if [ $check_status -eq 1 ]; then
                # 无需迁移
                echo -e "${GREEN}[INFO]${NC} 数据库迁移流程完成（无需更新）"
                return 0
            elif [ $check_status -eq 2 ]; then
                # 配置错误
                echo -e "${RED}[ERROR]${NC} 迁移配置检查失败"
                return 1
            fi
        fi

        # 3. 迁移前备份
        backup_before_migration

        # 4. 执行迁移
        if execute_migration; then
            echo -e "${GREEN}[SUCCESS]${NC} 数据库迁移流程完成"

            # 5. 生成最终状态报告
            generate_migration_report
        else
            echo -e "${RED}[ERROR]${NC} 数据库迁移失败"

            # 如果启用了自动回滚
            if [ "$MIGRATION_AUTO_ROLLBACK_ON_FAILURE" = "true" ]; then
                echo -e "${YELLOW}[WARNING]${NC} 尝试自动回滚..."
                rollback_migration || echo -e "${RED}[ERROR]${NC} 自动回滚也失败了"
            else
                echo -e "${YELLOW}[INFO]${NC} 如需回滚，请运行: rollback_migration"
                echo -e "${YELLOW}[INFO]${NC} 或设置 MIGRATION_AUTO_ROLLBACK_ON_FAILURE=true 启用自动回滚"
            fi

            # 根据配置决定是否继续启动
            if [ "$MIGRATION_FAIL_STOP" = "true" ]; then
                echo -e "${RED}[ERROR]${NC} 迁移失败，停止应用启动"
                exit 1
            else
                echo -e "${YELLOW}[WARNING]${NC} 迁移失败，但继续启动应用"
            fi
        fi
    else
        echo -e "${BLUE}[INFO]${NC} 跳过数据库迁移 (development环境且AUTO_MIGRATE未启用)"
    fi
}

# 信号处理
cleanup() {
    echo -e "${YELLOW}[INFO]${NC} 接收到停止信号，正在优雅关闭..."
    # 这里可以添加清理逻辑
    exit 0
}

trap cleanup SIGTERM SIGINT

# 主执行流程
main() {
    # wait_for_database
    # setup_permissions
    run_migrations
    # setup_health_check
    # show_startup_info

    echo -e "${GREEN}[SUCCESS]${NC} API服务初始化完成, 启动应用..."
    echo "true" > /tmp/health_ready

    # 执行传入的命令
    exec "$@"
}

# 错误处理
set -o pipefail
trap 'echo -e "${RED}[ERROR]${NC} 启动过程中发生错误"; exit 1' ERR

# 启动主函数
main "$@"
