# 多数据库接入开发说明（PostgreSQL + Redis + 外部 MySQL）

本文聚焦本服务当前确定的数据库拓扑：单实例 PostgreSQL 负责读写业务数据、Redis 作为缓存/限流、外部 MySQL 为只读数据源。目标是在 FastAPI + DDD 架构下统一管理连接、配置、依赖注入与监控。

## 架构概览

- **PostgreSQL（主库）**：存储客户、计费等领域聚合，支持事务写入。
- **Redis（缓存）**：承担热点数据缓存、会话与限流。
- **MySQL（外部只读）**：第三方系统提供的报表/客户画像库，仅查询，不由本项目管理迁移。

```
┌───────────────┐      ┌─────────────┐
│ Presentation  │ ───► │ Application │ ─┐
└───────────────┘      └─────────────┘  │
      ▲                     ▲            │
      │ CurrentUser         │ Use Cases   │
┌─────┴─────┐         ┌─────┴─────┐      │
│ Domain    │◄───────►│ Infra     │◄─────┘
└───────────┘         └───────────┘
                              │
          ┌───────────┬───────┴───────────┐
          │PostgreSQL │ Redis Cache       │
          │(rw)       │ (cache/ratelimit) │
          │           │                   │
          │ MySQL (ro external reporting) │
          └───────────────────────────────┘
```

## 设计原则

1. **单一主库**：所有写操作仅落 PostgreSQL，Application 层不直接感知数据库细节。
2. **只读 MySQL**：通过独立仓储访问外部 MySQL，严格限制为 SELECT；如需更新由外部系统负责。
3. **集中配置**：`shared/config` 中声明 `POSTGRES_DSN`、`REDIS_URL`、`MYSQL_REPORTING_DSN` 等变量。
4. **生命周期管理**：FastAPI `lifespan` 统一初始化/关闭连接池；Redis 客户端与 MySQL 连接均通过上下文管理。
5. **可观测性**：所有数据库调用记录 trace_id、耗时与错误码，方便排查。

## 技术实现

### PostgreSQL（读写主库）

- 依赖：`sqlalchemy[asyncio]`, `asyncpg`.
- 初始化：
  ```python
  engine = create_async_engine(settings.postgres_dsn, pool_size=10, max_overflow=20)
  SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
  ```
- 依赖注入：
  ```python
  async def get_postgres_session() -> AsyncIterator[AsyncSession]:
      async with SessionLocal() as session:
          yield session
  ```
- 仓储示例：`SqlAlchemyCustomerRepository` 收到 `AsyncSession`，执行 CRUD。
- 事务：Application 用例中使用 `async with session.begin()`，保持原子性；跨用例共享 `CurrentUnitOfWork`。
- 迁移：使用 `alembic`，Makefile 中提供 `make migrate`、`make downgrade`。

### Redis（缓存/限流）

- 依赖：`redis.asyncio`.
- 初始化：
  ```python
  redis_client = redis.from_url(settings.redis_url, max_connections=settings.redis_pool_size, encoding="utf-8", decode_responses=True)
  ```
- 使用：
  - Customer 详情缓存：`GET/SETEX customer:{id}`
  - 限流中间件：Lua 脚本或 token bucket。
  - RequestContext 可写入 `trace_id` 对应的日志缓冲。
- Infra 层提供 `RedisCacheGateway` 接口；Application 用例根据需要注入。

### MySQL（外部只读）

- 依赖：`sqlalchemy[asyncio]`, `aiomysql`.
- 用途：读取外部报表/客户画像，如 `ReportingCustomerGateway`。
- 初始化：
  ```python
  reporting_engine = create_async_engine(
      settings.mysql_reporting_dsn,
      pool_recycle=1800,
      connect_args={"charset": "utf8mb4"}
  )
  ReportingSession = async_sessionmaker(reporting_engine)
  ```
- 访问约束：
  - 所有仓储只允许 `SELECT`；可在仓储层封装公共查询方法，禁止 commit。
  - 如果外部库不可访问，需要 graceful fallback（如返回空列表/缓存结果），并记录 warning。
- 数据转换：Infra 层将 MySQL 查询结果映射为领域 DTO，Application 用例再组合到主数据。

## 配置与环境

`.env` 模板：
```
POSTGRES_DSN=postgresql+asyncpg://user:pwd@localhost:5432/warehouse_billing
REDIS_URL=redis://localhost:6379/0
REDIS_POOL_SIZE=20
MYSQL_REPORTING_DSN=mysql+aiomysql://user:pwd@external-host:3306/reporting
```

`shared/config/database.py` 示例：
```python
class PostgresSettings(BaseSettings):
    postgres_dsn: PostgresDsn

class RedisSettings(BaseSettings):
    redis_url: AnyUrl
    redis_pool_size: int = 20

class ReportingMysqlSettings(BaseSettings):
    mysql_reporting_dsn: AnyUrl
```

`make init` 增加：
- 检查 Postgres 可连通并执行 `alembic upgrade head`
- 校验 Redis、MySQL 连接（可选 ping/简单查询）

## FastAPI 生命周期

- `startup`：
  - 初始化 Postgres engine、Redis 客户端、MySQL engine。
  - 注册在 `state` 中或通过依赖注入容器暴露。
- `shutdown`：
  - 调用 `engine.dispose()`、`await redis_client.close()`、`reporting_engine.dispose()`。

## 监控与告警

- 健康检查：
  - `/health/postgres`：执行 `SELECT 1`.
  - `/health/redis`：`PING`.
  - `/health/reporting-mysql`：`SELECT 1`.
- 指标：
  - 查询耗时、错误率、连接池使用情况（可通过 Prometheus exporter 或自定义 metrics）。
  - 对外部 MySQL 加限流与超时，防止卡住主流程。

## 测试策略

- Postgres 仓储：使用 docker-compose + test DB，pytest fixture 保证每次测试回滚。
- Redis 逻辑：`fakeredis` 模拟缓存行为，或基于本地 Redis 运行集成测试。
- MySQL Gateway：使用 `pytest-mock` Stub 或本地/容器化只读库；重点验证失败退化逻辑。
- 端到端：FastAPI TestClient 结合真实 Postgres/Redis，MySQL 可 mock/仿真，确保 RequestContext、UseCase 与缓存协作正确。

## 风险与待办

- 外部 MySQL 连接可能不稳定，需实现重试与降级策略。
- 必须避免把 MySQL 数据混入事务写路径；仅在查询结果中返回。
- 后续若需要读写分离，可在 Postgres 层增加只读副本，但保持当前单实例假设。
