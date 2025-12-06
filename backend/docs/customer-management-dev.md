# 客户管理开发说明

面向 `docs/customer-management-er.md` 中的客户/公司/分组 ER 结构，本文描述 FastAPI 服务端的分层职责、接口契约与实现要点，供开发与评审参考。

## 背景与范围

- 目标：暴露客户档案 CRUD、客户分组维护、外部同步状态查询接口，支撑仓储计费系统的客户主数据管理。
- 覆盖实体：`Customer`、`Company`、`CustomerGroup`、`CustomerGroupMember`、`BusinessDomain`、`ExternalSystemSync`。
- 提供能力：客户主档创建 + 导入同步、客户列表/详情、客户状态更新、客户分组编排、域隔离过滤、外部同步状态查询。

## 分层责任（DDD）

### Presentation（`src/presentation/customer`）

- FastAPI Router 划分 `/customers`、`/companies`、`/customer-groups`、`/external-sync`。
- 统一接入 `RequestContextMiddleware`，记录 `trace_id`、`operator`.
- Pydantic Schemas：
  - `CustomerCreateSchema`、`CustomerUpdateSchema`、`CustomerQuerySchema`
  - `CustomerGroupCreateSchema`、`CustomerGroupMemberSchema`
  - `ExternalSyncQuerySchema`
- 验证层仅做字段校验，调用 Application 用例，禁止直接访问数据库。

### Application（`src/application/customer`）

- 用例服务：
  1. `CreateCustomerUseCase`：封装公司 upsert + 客户插入事务，保证来自 `RB` 的导入原子性。
  2. `UpdateCustomerStatusUseCase`：校验枚举、写入操作人信息并触发领域事件。
  3. `QueryCustomerUseCase`：组合 `businessDomain`、`source` 条件，分页返回。
  4. `ManageCustomerGroupUseCase`：维护 `CustomerGroup` 及 `CustomerGroupMember`，处理多对多同步。
  5. `RecordExternalSyncUseCase`：记录同步结果，供外部可观测性。
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
  - `CustomerRepository`、`CompanyRepository`、`CustomerGroupRepository`、`CustomerGroupMemberRepository`、`ExternalSyncRepository`.
- 数据映射严格贴合 ER 文档字段，新增索引与约束由 migration 管理。
- 提供外部系统 Gateway（如 `RBCompanyGateway`）以便未来调用第三方。

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
   - 失败策略：任一步失败整体回滚，返回业务错误码（如 `COMPANY_NOT_FOUND`，`CUSTOMER_DUPLICATED`）。
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
- Application：模拟导入流程事务成功/失败分支；验证跨域访问被拒绝。
- Presentation：API 级别校验字段/错误码，断言 `trace_id` header。
- Infra：可使用 sqlite docker 容器进行仓储实现的集成测试，确保 SQL 与索引正常。

## 风险与待办

- 多来源 `customerCode` 冲突需要在 Application 层引入 `SourcePrefixStrategy`；当前仅规划。
- 若后续引入 PostgreSQL/Redis，需要扩展 Infrastructure 层的配置与连接池管理。
- 钉钉权限尚未接入，`BusinessDomainGuard` 需等待 IAM SDK 接口完成。
