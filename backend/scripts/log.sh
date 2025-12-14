#!/bin/bash

# 颜色定义
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export PURPLE='\033[0;35m'
export CYAN='\033[0;36m'
export NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [ "$DEBUG" = "true" ]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# 显示分隔线
log_separator() {
    echo "=============================================="
}

# 记录到日志文件
log_to_file() {
    local message=$1
    local level=${2:-"INFO"}
    local log_file=${3:-"logs/deploy.log"}
    
    ensure_directory "$(dirname "$log_file")"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" >> "$log_file"
}

# 执行命令并记录日志
execute_with_log() {
    local command=$1
    local description=${2:-"执行命令"}
    local log_file=${3:-"logs/deploy.log"}
    
    log_info "$description"
    log_to_file "$description: $command" "INFO" "$log_file"
    
    if eval "$command" 2>&1 | tee -a "$log_file"; then
        log_success "$description 完成"
        log_to_file "$description 完成" "SUCCESS" "$log_file"
        return 0
    else
        log_error "$description 失败"
        log_to_file "$description 失败" "ERROR" "$log_file"
        return 1
    fi
}

# 显示日志
show_logs() {
    local service=${1:-""}
    local follow=${2:-"-f"}
    
    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" logs $follow "$service"
    else
        docker compose -f "$COMPOSE_FILE" logs $follow
    fi
}