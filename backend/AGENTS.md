# AGENTS.md

## 项目概述
- **类型**：FastAPI 微服务，聚焦智能仓储计费能力，遵循 DDD（Presentation → Application → Domain → Infrastructure）分层。
- **核心功能**：统一对接第三方计费接口、封装仓储计费领域模型，输出稳定 API（src/presentation）及用例编排（src/application）。
- **技术栈**：Python 3.12、FastAPI、Pydantic v2、uvicorn、structlog + loguru、uv 包管理器；未来接入 PostgreSQL/Redis 由 `src/intrastructure` 承载。
- **运行特性**：日志由 `src/shared/logger` 统一初始化，RequestContextMiddleware 自动注入 `trace_id` 与请求元信息，所有配置来自 `.env` → `pydantic-settings`。

## 开发命令（必须使用 uv）
- **创建虚拟环境**
  ```bash
  uv venv .venv
  ```
- **安装依赖（含 dev 组）**
  ```bash
  uv sync --all-extras --group dev
  ```
- **复制并填充环境变量**
  ```bash
  cp .env.example .env
  ```
- **本地热重载**（uvicorn）
  ```bash
  uv run uvicorn src.main:app --reload --port 8002
  ```
- **fastapi dev（监控 src/ 变更）**
  ```bash
  uv run --project src fastapi dev src/main.py --port 8002
  ```
- **一次性初始化**
  ```bash
  make init
  ```
- **格式化 + Lint + 类型检查**
  ```bash
  make all
  ```
- **仅格式化**
  ```bash
  make fmt
  ```
- **仅 Lint (Ruff)**
  ```bash
  make lint
  ```
- **类型检查 (mypy)**
  ```bash
  make mypy
  ```
- **测试**
  ```bash
  make test
  ```
- **生产镜像**
  ```bash
  make docker-build && make docker-run
  ```

## 项目结构
```
backend/
├─ AGENTS.md
├─ Makefile                # 封装 uv、mypy、pytest、docker 命令
├─ pyproject.toml          # 项目与 dev 依赖、Ruff/Mypy/FastAPI 配置
├─ uv.lock                 # uv 生成的锁文件
├─ .env(.example)          # Pydantic Settings 读取源
└─ src/
   ├─ main.py              # FastAPI 入口 + lifespan + 中间件注册
   ├─ presentation/        # API Router、依赖注入（对外契约）
   ├─ application/         # 用例/服务层，编排领域对象
   ├─ domain/              # 聚合、实体与领域服务，业务规则收敛处
   ├─ intrastructure/      # 第三方服务、DB、消息队列等适配器
   ├─ middleware/          # 自定义 Starlette/FastAPI 中间件
   └─ shared/
      ├─ config/           # Pydantic Settings、日志配置
      └─ logger/           # structlog + rich/json 渲染、RequestContextMiddleware
```
⚠️ 架构约束：Presentation 禁止直接操作 Infrastructure，所有调用需经 Application 传递，保持领域纯净。

## 配置与约定
- **环境变量**：`.env` 中至少定义 `APP_NAME`, `APP_VERSION`, `APP_DEBUG`, `LOG_FORMAT`, `LOG_LEVEL`，由 `Settings` 自动注入；新增变量需在 `src/shared/config/__init__.py` 显式声明以便被 Pydantic 校验。
- **日志**：`LOG_FORMAT=dev` 使用 Rich 彩色输出；`prod` 切换 JSON，结构化日志会注入 `trace_id`（来自 `RequestContextMiddleware`）。
- **端口/服务**：开发默认 `8002`，对外暴露时同步更新部署脚本。
- **包管理**：统一使用 `uv`（不要混用 pip/poetry），锁文件 `uv.lock` 由 CI 校验；本地命令一律 `uv run <tool>` 形式。
- **中间件扩展**：新增链路追踪/租户逻辑必须放在 `RequestContextMiddleware` 或新建 middleware，避免在业务代码中散落。

## 代码规范
- **Formatter + Linter**：Ruff 负责 `format` + `lint`，规则集覆盖 `B,E,F,N,I,W,C4,UP`，忽略 `E501/B008/...`；运行 `make fmt` 修复。
- **行宽与引号**：`line-length=120`，字符串默认双引号，保持 `ruff.format` 配置一致。
- **命名**：遵循 `pep8-naming`，领域模型用 `PascalCase`，DTO/Schema 以 `*Schema` 结尾，接口/仓储以 `*Repository`、`*Gateway` 命名；禁用匈牙利命名。
- **类型**：公共 API、领域服务必须显式 type hints；mypy 配置 `check_untyped_defs=true`，如需忽略必须添加注释说明原因。
- **提交规范**：使用 Commitizen (`cz commit`) 生成符合约定式提交的 message，CI 会阻断不合规提交。
- **依赖层次**：`application` 仅依赖 `domain` + 接口协议，禁止 `domain` 引用 `FastAPI`，保持可测试性。

## 测试策略
- **框架**：`pytest` + `pytest-asyncio`，异步用例需 `@pytest.mark.asyncio`；HTTP 层使用 `httpx.AsyncClient` 搭配 FastAPI `lifespan_manager`。
- **运行命令**
  ```bash
  uv run pytest tests/ --maxfail=1 --disable-warnings --cov=src --cov-report=term-missing
  ```
- **覆盖率**：保持 `src/` 有效行覆盖率 ≥ 85%，新增模块必须附带单元测试；CI 将读取 `coverage.xml`（可通过 `--cov-report=xml` 生成）。
- **测试金字塔**：
  - Domain：纯函数/聚合测试，mock 外部依赖。
  - Application：聚焦用例流、断言集成边界，必要时 stub 仓储接口。
  - Presentation：使用 FastAPI TestClient 进行路由与中间件回归验证，重点验证 `trace_id`、响应头与错误包装。
- **日志与追踪**：测试中若需断言日志，优先注入 structlog `bound_logger`，不要简单匹配 stdout。

## 运行与部署提示
- **开发**：优先 `make dev`（基于 `fastapi dev`）以便观察热重载；如需多进程性能测试，切换 `uv run uvicorn src.main:app --host 0.0.0.0 --workers 4`。
- **Docker**：`make docker-build` 使用 `yamato-proxy` 标签，生产启动 `make docker-run` 并加载 `.env`；`compose-up` 用于多服务联调。
- **监控**：上线环境需收集 `X-Trace-Id`，后端/前端应回传该 header 以便链路排查。

**关键**：始终通过 Application 层暴露用例，结合 `RequestContextMiddleware` 保证日志可观测性，并使用 uv + Ruff + Mypy + Pytest 维持统一的可重复开发体验。

## 开发文档
- 所有生成的文档按照功能命名
- 文档保存路径 `docs/*`

## 调试日志
- 所有的日志对象不可以从 `structlog.get_logger(__name__)` 直接获取日志对象
- 必须从 `src/shared/logger/factories.py` 取得，如果不是DDD分层的业务默认用 `log` 这个对象用于日志输出