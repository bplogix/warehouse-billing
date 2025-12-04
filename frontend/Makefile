# 安装依赖
install:
	pnpm i
	@echo "环境类库安装完成！"

# 运行应用
run:
	pnpm dev
dev: run
	@echo "应用正在运行中..."

# 格式化代码
format:
	pnpm format

# 检查代码风格
lint:
	pnpm lint

# 类型检查
check:
	pnpm check-types

# 全面检查
all: format lint check
	@echo "所有检测通过!"

# 提交前准备 - 格式化并检查代码
pre-commit: all
	@echo "代码格式化和检查完成，可以安全提交"
	@git status --porcelain | head -10

# Commitizen 提交 - 使用脚本处理完整流程
commit:
	@bash ./batchs/commit.sh