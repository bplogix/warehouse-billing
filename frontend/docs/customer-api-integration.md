# 客户/公司/分组 API 对接说明（基于 OpenAPI 127.0.0.1:8000）

## 范围

- 公司：`GET /api/v1/external-companies`（用于检索 RB 公司库）
- 客户：`POST /api/v1/customers`、`GET /api/v1/customers`、`GET /api/v1/customers/{id}`、`PATCH /api/v1/customers/{id}/status`
- 客户分组：`GET /api/v1/customer-groups`、`GET /api/v1/customer-groups/{group_id}`、`POST /api/v1/customer-groups`、`PUT /api/v1/customer-groups/{group_id}/members`

## 现状假设

- 前端已有客户列表/详情/创建/分组 UI，当前使用 mock 或半成品数据。
- axios 封装在 `src/utils/http.ts`，需确认对 SuccessResponse 包裹的解包处理。
- Auth token 存于 `useAuthStore`，需在请求头加 Authorization。

## 当前对接状态（已完成）

- 客户列表/详情/状态：`GET /api/v1/customers`、`GET /api/v1/customers/{id}`、`PATCH /api/v1/customers/{id}/status` 已接入，支持搜索、总数展示、状态切换。
- 客户创建：`POST /api/v1/customers` 已接入，支持 RB 公司选择（`source=RB`、`sourceRefId=companyId`）或内部创建（`source=INTERNAL`），公司联想用 `GET /api/v1/external-companies`。
- 客户分组：`GET /api/v1/customer-groups`、`GET /api/v1/customer-groups/{group_id}`、`POST /api/v1/customer-groups`、`PUT /api/v1/customer-groups/{group_id}/members` 已接入，支持分组列表、创建、成员管理。
- 类型与封装：`modules/customer/api.ts`、`modules/customer/types.ts` 定义列表/详情/分组/公司类型，HTTP 层用泛型 `apiGet/apiPost/...` 解包；拦截器自动附带 Bearer token，401/403 清理登录。

## 后续可选事项

- 若需唯一性或权限校验，按后端返回错误提示，前端不做本地校验。
- 分组分页/筛选、业务域路由隔离，如有需求再迭代。

## 技术要点

- 请求头添加 `Authorization: Bearer <access_token>`；401/403 时清理登录并重定向。
- 处理 SuccessResponse 包裹（`{ success, data, message }`）与少数裸对象的差异，http 封装中解包 data 或在 API 层兼容。
- 统一错误 toast；表单按钮 loading；分页需要 total。

## 优先级建议

1. 客户创建+列表+状态 → 最小可用闭环。
2. 公司搜索填充 → 提升录入效率。
3. 分组创建/成员维护 → 若页面已上线则同批次对接，否则可次优。
4. 自动化测试 → 视时间补充。
