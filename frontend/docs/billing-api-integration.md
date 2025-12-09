# 计费配置模块 API 对接规划

适配前端现有计费模板 UI（通用/群组/专属），梳理后端需要提供的接口与字段约束，便于后续落地。

## 业务对象

- 计费模板（Template）：`GLOBAL` 通用、`GROUP` 群组、`CUSTOMER` 专属。
- 计费规则（TemplateRule）：包含收费项、计价方式、阶梯价格。
- 关联维度：客户分组（groupIds）、客户（customerId）。

## 推荐接口列表

| 功能     | 方法   | 路径                             | 请求体/参数                                                                                                                     | 响应                              |
| -------- | ------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 列表模板 | GET    | `/api/v1/billing/templates`      | query：`templateType`（GLOBAL/GROUP/CUSTOMER，必选）、`keyword`（按名称/编码）、`customerId`、`customerGroupId`、`limit/offset` | `items: Template[]`、`total`      |
| 获取详情 | GET    | `/api/v1/billing/templates/{id}` | path：`id`                                                                                                                      | `Template`                        |
| 新增模板 | POST   | `/api/v1/billing/templates`      | `TemplateCreatePayload`                                                                                                         | `Template`（含生成的 id/version） |
| 更新模板 | PUT    | `/api/v1/billing/templates/{id}` | `TemplateUpdatePayload`                                                                                                         | `Template`                        |
| 删除模板 | DELETE | `/api/v1/billing/templates/{id}` | path：`id`                                                                                                                      | 204                               |

> 说明：模板保存即生成报价快照，不再区分草稿/启用状态。如需审核/版本化，可由后端扩展快照审批机制。

## 模型字段建议

### Template（列表/详情）

- `id`: number
- `templateType`: `GLOBAL` \| `GROUP` \| `CUSTOMER`
- `templateCode`: string（唯一）
- `templateName`: string
- `description`: string
- `effectiveDate`: string (ISO)
- `expireDate`: string (ISO \| null，可为空表示长期有效)
- `version`: number
- `rules`: TemplateRule[]
- `customerGroupId?`: number（仅 GROUP）
- `customerId?`: number（仅 CUSTOMER）

### TemplateRule

- `chargeCode`: string（如 STORAGE_FEE）
- `chargeName`: string
- `category`: `STORAGE` \| `INBOUND_OUTBOUND` \| `TRANSPORT` \| `RETURN` \| `MATERIAL` \| `MANUAL`
- `channel`: `AUTO` \| `SCAN` \| `MANUAL`
- `unit`: `PIECE` \| `PALLET` \| `ORDER` \| `CBM_DAY` \| `CBM_MONTH` \| `KG_DAY` \| `KG_MONTH`
- `pricingMode`: `FLAT` \| `TIERED`
- `price?`: number | null（单一价格）
- `tiers?`: { minValue: number; maxValue: number | null; price: number; description?: string }[]（阶梯）
- `description?`: string
- `supportOnly?`: boolean（运输类、人工录入等仅用于标记支持与否）

> 计价约束：仓储类（STORAGE）支持 `FLAT/TIERED` 两种模式；进出库（INBOUND_OUTBOUND）、返品（RETURN）、包材（MATERIAL）仅允许 `FLAT`；运输（TRANSPORT）与人工录入（MANUAL）仅做支持开关，不配置价格，返回时 `supportOnly=true` 且 `price=null`。

### TemplateCreate/Update Payload

与 Template 基本一致，更新时可省略不可变字段（如 templateType / templateCode），由后端决定不可编辑字段的校验。

## 前端对接点

- 列表页：根据路由 tab 请求 `templateType` 对应的列表；支持 `keyword`、客户/分组过滤；显示 total。
- 详情/编辑：点击编辑拉取详情；保存调用 PUT。
- 创建：依据当前 tab 写入 `templateType`，GROUP 要求 `customerGroupId`，CUSTOMER 要求 `customerId`，GLOBAL 固定唯一（可由后端限制只能有 1 条）。
- 截止日期：空值表示长期有效，返回 `null` 即可。
- 运输/人工录入：仅需要告诉前端是否支持该项，`supportOnly=true` 时前端不渲染价格编辑。
- 删除：调用 DELETE。

## 依赖数据

- 客户分组、客户：已对接 `/api/v1/customer-groups`、`/api/v1/customers`，可直接用于选择器。
- 计费项定义：前端有本地 `chargeDefinitions`（`constants/billing`），若后端需配置化，可提供 `/api/v1/billing/charges` 列表，返回收费项元数据（code/name/category/channel/unit/默认描述）。

## 鉴权与约束

- 所有请求带 Authorization（拦截器已处理）。
- 版本与并发：如需乐观锁，可在模板返回 `version`，更新时要求传递 `version` 并校验。
- 唯一性：`templateCode` 后端校验唯一；GLOBAL 类型建议限制单条。

## 后续可选

- 审核流：可针对报价快照新增审批接口或扩展专用状态字段。
- 模板生效期校验：后端阻断过期模板启用。
- 历史版本查询：GET `/api/v1/billing/templates/{id}/versions`。
