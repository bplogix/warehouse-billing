# uv 默认使用 .venv，适合本地开发
VENV := .venv
UV := uv

.DEFAULT_GOAL := init

.PHONY: help
help: ## 打印常用命令说明
	@echo "可用命令:"; \
	awk 'BEGIN {FS=":.*##"} /^[a-zA-Z0-9_.-]+:.*##/ {gsub(/^ +| $$/, "", $$2); printf "  %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

init: venv install env ## 初始化项目：创建虚拟环境 + 安装依赖 + 生成 .env
	@echo "🎉 项目初始化完成"

## 创建虚拟环境（uv 会自动处理 python 版本）
venv: ## 创建虚拟环境（uv 会自动处理 python 版本）
	$(UV) venv $(VENV)

## 安装依赖（pyproject.toml）
install: ## 安装依赖（pyproject.toml）
	$(UV) sync

## 生成 .env（如果不存在）
env: ## 生成 .env（如果不存在）
ifneq ("$(wildcard .env)", "")
	@echo ".env 已存在，跳过"
else
	@echo "生成默认 .env 文件"
	@echo "APP_ENV=dev" > .env
	@echo "DEBUG=true" >> .env
endif

## 运行程序（根据你的入口修改）
run: ## 本地运行（uvicorn 热重载）
	$(UV) run uvicorn src.main:app --reload --port 8000
	@echo="启动生产模式"

dev: ## fastapi dev（需 uv）
	$(UV) run --project src fastapi dev src/main.py --port 8000
	@echo="web启动完成"

## 清理虚拟环境
clean: ## 清理虚拟环境与缓存
	rm -rf $(VENV)
	$(UV) cache clean
	ruff clean
	@echo "⚡️ 虚拟环境已删除"

## 格式化代码 (使用 ruff)
fmt: ## 代码格式化（ruff）
	$(UV) run ruff format .
	$(UV) run ruff check --fix .
	@echo="💄 代码格式化完成"

## 检查代码 (不修改文件)
lint: ## 代码检查（ruff）
	$(UV) run ruff check .
	$(UV) run ruff format . --check
	@echo="✅ 代码风格检查完成"

## 静态类型检查 (使用 mypy)
mypy: ## 静态类型检查 (mypy)
	$(UV) run mypy src
	@echo="✅ 静态类型检查完成"

all: fmt lint mypy ## 执行所有检查 (格式化+风格+类型)
	@echo "✅ 所有检测通过!"

## 测试
test: ## 测试
	$(UV) run pytest -q

# 构建生产镜像
docker-build: ## docker build -t yamato-proxy .
	docker build -t yamato-proxy .

# 启动（生产）
docker-run: ## docker run -it --rm -p 8000:8000 --env-file .env yamato-proxy
	docker run -it --rm -p 8000:8000 --env-file .env yamato-proxy

# 查看最新 yamato-proxy 容器日志（跟随）
docker-logs: ## docker logs -f (基于 yamato-proxy 镜像的最新容器)
	@cid=$$(docker ps --filter "ancestor=yamato-proxy" --format "{{.ID}}" | head -n1); \
	if [ -z "$$cid" ]; then \
		echo "未找到运行中的 yamato-proxy 容器"; \
		exit 1; \
	fi; \
	echo "跟踪容器 $$cid 日志..."; \
	docker logs -f $$cid

# 使用 docker-compose（开发 + 部署）
compose-up: ## docker-compose up -d --build
	docker-compose up -d --build

compose-down: ## docker-compose down
	docker-compose down

deploy: compose-up ## 构建并启动（compose）
	@echo "🚀 Docker 生产环境已启动"
