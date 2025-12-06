# 客户管理开发说明

面向 `docs/customer-management-er.md` 中的客户/公司/分组 ER 结构，本文描述 FastAPI 服务端的分层职责、接口契约与实现要点，供开发与评审参考。本说明依赖《docs/dingtalk-auth-dev.md》中的钉钉认证策略，确保客户 API 能够正确解析 `CurrentUser`、`BusinessDomain` 并写入 `RequestContext`；同时结合《docs/multi-database-dev.md》完成 Postgres（主库）、Redis（缓存/限流）、外部 MySQL（只读）三库接入策略。

## 背景与范围

- 目标：暴露客户档案 CRUD、客户分组维护、外部同步状态查询接口，支撑仓储计费系统的客户主数据管理。
- 覆盖实体：`Customer`、`Company`、`CustomerGroup`、`CustomerGroupMember`、`BusinessDomain`、`ExternalSystemSync`。
- 提供能力：客户主档创建 + 导入同步、客户列表/详情、客户状态更新、客户分组编排、域隔离过滤、外部同步状态查询。

## 钉钉认证与 RequestContext 约束

- 所有客户管理 API 必须复用钉钉认证流程：`AuthorizeRequestService` 校验 `Authorization` JWT，`RequestContextMiddleware` 注入 `CurrentUser`、`trace_id`、`business_domain_codes`。
- Presentation 层新增的路由需声明 `Depends(get_current_user)`，并从 `RequestContext` 获取 `CurrentUser` 用于审计字段（`operator_id/name`）写入。
- Application 层的用例在执行领域逻辑前调用 `BusinessDomainGuard`，使用来自 `CurrentUser.domain_codes` 的集合验证访问范围；若用户缺失目标域，直接返回 `FORBIDDEN` 业务错误。
- 日志与事件中必须绑定 `trace_id` 与钉钉 `ding_user_id`（隐藏 `union_id`），遵循钉钉文档提供的脱敏策略。
- 业务域控制完全复用钉钉角色字段映射：`DingTalkRoleMappingGateway` 根据钉钉返回的角色/职位映射出 `domain_codes`，不存在 IAM 业务接入计划。

## 角色映射策略

- `DingTalkRoleMappingGateway`：根据钉钉返回的 `roles/positions/departments` 映射出 `domain_codes`。
- 映射规则维护在配置表或内置字典，例如 `ROLE_STD_AGENT -> GENERAL_WAREHOUSING`。
- `BusinessDomainGuard` 直接依赖该 Gateway 提供的 `domain_codes`；若角色未匹配，返回最小权限或拒绝。
- 日志中记录角色→域映射链路，方便排查权限问题。

## 分层责任（DDD）

### Presentation（`src/presentation/customer`）

- FastAPI Router 划分 `/customers`、`/companies`、`/customer-groups`、`/external-sync`。
- 统一接入 `RequestContextMiddleware`，记录 `trace_id`、`operator`，所有路由通过 `Depends(get_current_user)` 获取钉钉登录态。
- Pydantic Schemas：
  - `CustomerCreateSchema`、`CustomerUpdateSchema`、`CustomerQuerySchema`
  - `CustomerGroupCreateSchema`、`CustomerGroupMemberSchema`
  - `ExternalSyncQuerySchema`
- 验证层仅做字段校验，调用 Application 用例，禁止直接访问数据库；`CurrentUser` 信息通过依赖传入并写入审计字段。

### Application（`src/application/customer`）

- 用例服务：
  1. `CreateCustomerUseCase`：封装公司 upsert + 客户插入事务，保证来自 `RB` 的导入原子性。
  2. `UpdateCustomerStatusUseCase`：校验枚举、写入操作人信息并触发领域事件。
  3. `QueryCustomerUseCase`：组合 `businessDomain`、`source` 条件，分页返回。
  4. `ManageCustomerGroupUseCase`：维护 `CustomerGroup` 及 `CustomerGroupMember`，处理多对多同步。
  5. `RecordExternalSyncUseCase`：记录同步结果，供外部可观测性。
- 所有用例都需要注入 `BusinessDomainGuard`，根据 `CurrentUser.domain_codes` 做域过滤或拒绝访问，并在成功路径中把 `trace_id` 写入日志；`BusinessDomainGuard` 仅依赖 `DingTalkRoleMappingGateway` 提供域列表。
- 依赖注入 Infra 仓储接口（`CustomerRepository` 等），组合 Domain 实体完成业务编排。

### Domain（`src/domain/customer`）

- 聚合根：
  - `Customer`：包含 `status` 状态机、`assign_to_group()`、`change_domain()` 等方法。
  - `Company`：提供 `validate_source_ref()` 逻辑，保证 `source+sourceRefId` 唯一。
  - `CustomerGroup`：维护 `maxMember`、`businessDomain` 的约束。
- 领域服务：
  - `CustomerImportService`：将外部 payload 规范化为聚合根，供 Application 调度。
  - `BusinessDomainGuard`：校验当前用户可访问域，依赖共享上下文。

### Infrastructure（`src/infrastructure/customer`）

- 仓储接口实现（SQLAlchemy/数据库 ORM）：
  - `CustomerRepository`、`CompanyRepository`、`CustomerGroupRepository`、`CustomerGroupMemberRepository`、`ExternalSyncRepository` 默认连接主库 Postgres，遵循《docs/multi-database-dev.md》中的 `get_postgres_session` 生命周期管理。
- Redis：
  - 使用 `RedisCacheGateway` 缓存客户详情/分组列表；热点数据遵从统一 `customer:{id}`、`customer-group:{id}` Key 规范，并由 UseCase 控制失效。
- 外部 MySQL：
  - `ExternalCustomerGateway` 读取第三方客户数据，依赖第三方同步，完全只读；业务域控制不访问该库。
- 数据映射严格贴合 ER 文档字段，新增索引与约束由 migration 管理。
- 提供外部系统 Gateway（如 `RBCompanyGateway`）以便未来调用第三方；业务域控制仅依赖钉钉角色映射。

## API 契约草案

| Method | Path | 用例 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/customers` | `CreateCustomerUseCase` | 请求包含 `customer` + `company` 数据，服务端完成 upsert + insert |
| `GET` | `/customers` | `QueryCustomerUseCase` | 支持条件：`keyword`,`businessDomain`,`status`,`source`，分页 |
| `GET` | `/customers/{id}` | `QueryCustomerUseCase` | 返回客户详情（含公司、分组信息） |
| `PATCH` | `/customers/{id}/status` | `UpdateCustomerStatusUseCase` | 更新 `status`、`operationName/Uid` |
| `POST` | `/customer-groups` | `ManageCustomerGroupUseCase` | 创建分组并返回 `id` |
| `PUT` | `/customer-groups/{id}/members` | `ManageCustomerGroupUseCase` | 批量替换分组成员 |
| `GET` | `/external-sync` | `RecordExternalSyncUseCase`（查询） | 根据 `entityType`、`entityId` 或 `remoteId` 查询同步记录 |

响应示例应包含 `trace_id` header，与 `shared/logger` 统一格式对齐。

## 数据与事务约束

1. `CreateCustomerUseCase`：
   - 事务步骤：Upsert `Company`（依据 `companyCode` 或 `sourceRefId`）→ Insert `Customer` → 写 `ExternalSystemSync`（可选）。
   - 失败策略：任一步失败整体回滚，返回业务错误码（如 `COMPANY_NOT_FOUND`，`CUSTOMER_DUPLICATED`）；若 `BusinessDomainGuard` 拒绝访问，返回 `403` 并在日志中绑定 `ding_user_id`。
   - 缓存同步：成功后异步删除 Redis 中 `customer:{id}` 以触发重新加载。
   - `customerCode` 生成：采用 `SourcePrefixStrategy`，即 `来源前缀 + 统一编码`，或将 `source + externalCode` 组合成唯一键，保证多来源导入不会冲突。
2. `ManageCustomerGroupUseCase`：
   - 维护 `CustomerGroupMember` 表，写入前根据 `Customer.businessDomain` 校验一致性。
   - 执行批量替换时使用 `DELETE + INSERT`，并在 SQL 层添加 `idx_group_member_customer`。
3. 查询接口一律强制 `businessDomain` 过滤，避免跨域泄露。

## 同步与审计

- `ExternalSystemSync` 作为审计记录：
  - 插入点：导入成功/失败时写入，`syncStatus` 取 `SUCCESS/FAILED`。
  - 查询：提供 `remoteId + source` 去重，避免重复触发导入。
- 操作日志：使用 structlog `bind` 注入 `customerId`、`companyId`、`groupId`，便于排查。

## 开发步骤建议

1. **Schema 与迁移**：根据 ER 创建/更新 migration，确保约束与索引 (包含 `customerName+customerCode` 唯一)。
2. **Domain 实体**：实现聚合根 + 领域服务，补充单元测试（`src/domain/tests`）。
3. **Application 用例**：实现上述用例，mock 仓储测试领域编排。
4. **Presentation Router**：新增 FastAPI 路由及 DTO，接入依赖注入容器。
5. **集成测试**：使用 `httpx.AsyncClient` 覆盖客户 CRUD、分组维护流程，断言 `trace_id`。
6. **文档与监控**: 更新 API 文档与 DataDog/Grafana 监控告警（同步失败率等指标）。

## 测试要点

- Domain：覆盖 `Customer` 状态变迁、`CustomerGroup` 成员限制、`Company` `sourceRefId` 校验。
- Application：模拟导入流程事务成功/失败分支；验证跨域访问被拒绝；覆盖 Postgres+Redis 双写路径以及钉钉角色映射缺失/异常时的失败处理。
- Presentation：API 级别校验字段/错误码，断言 `trace_id` header，并验证钉钉 JWT 缺失/无效时返回 Authentication 错误。
- Infra：Postgres 仓储集成测试依赖 docker 容器；Redis 使用 fakeredis 或真实实例；MySQL 相关 Gateway mock 或连接测试库，确保只读约束不会被破坏。

## 风险与待办
- 多库运维：需监控 Postgres/Redis/MySQL 三端连接池指标，避免客户查询互相影响；`make init` 会自动调用 `scripts/check_connections.py` 检验三端连通性，也可单独运行 `make check-connections`。
- 钉钉权限尚需完善，`BusinessDomainGuard` 依赖 `DingTalkRoleMappingGateway`，需确保角色配置与域映射保持最新；若后续业务需要 IAM，再单独规划。
