# 钉钉扫码登录页面开发文档

## 1. 背景与目标

- 目标：在现有认证模块中新增「钉钉扫码登录」入口，让仓储计费系统支持企业员工通过钉钉免输密码登录。
- 使用场景：桌面端后台系统，用户打开登录页后通过手机钉钉扫描二维码完成授权。
- 成功标准：
  - 二维码 2 分钟有效，可轮询刷新。
  - 扫码 -> 确认 -> 回调登录，全链路耗时 <5 秒（网络正常）。
  - 与已有邮箱/密码登录互不影响，可并行显示。

## 2. 页面与组件结构

```
src/modules/auth/pages/DingTalkQrLogin.tsx
├─ <AuthLayout> 复用现有统一登录布局
├─ Header 区域：标题、副文案、跳转传统登录按钮
├─ QR 区域：
│  ├─ <QrSurface>（卡片背景 + 状态提示）
│  ├─ <canvas> 或 <img> 渲染二维码
│  └─ 状态条（等待/已扫描/已过期）
└─ Tips/Support：FAQ & 客服入口
```

> UI 基于 Tailwind 4 原子类，交互按钮使用 `components/ui/button`；二维码状态条可用 `components/ui/alert` 以 Radix Primitive 实现。

## 3. 交互流程

1. 进入页面，请求后端 `POST /api/v1/auth/dingtalk/qr` 拿到 `authState`、`loginUrl`、`expireAt`。
2. 使用 `qrcode`（或同类库）将 `loginUrl` 转成二维码，并启动倒计时。
3. 每 2 秒轮询 `GET /api/v1/auth/dingtalk/qr/{authState}/status`：
   - `waiting`：继续展示二维码。
   - `scanned`：展示“已扫描，等待确认”提示。
   - `confirmed`：后端返回 `authCode`，立即调用 `POST /api/v1/auth/dingtalk/callback` 兑换 access token，写入 zustand auth store，跳转 `/dashboard`。
   - `expired`：关闭轮询，展示过期状态与「刷新二维码」按钮。
4. 手动刷新：销毁旧轮询，重新走步骤 1。

## 4. 状态管理

- 局部组件状态：`qrImage`, `expireAt`, `status`, `isRefreshing`、`countdown`.
- 轮询控制：使用 `useRef` + `useEffect` 管理 `setInterval`，路由卸载时清理。
- 全局认证：继续复用 `useAuthStore`，在确认成功后存入 user/token。
- 错误处理：所有 API 错误走 `useToast`（sonner）提示，并落日志。

## 5. API 契约（结合后端 OpenAPI 0.1.0）

| 接口                                          | 方法   | 入参                                                      | 响应                                                                                                   | 备注                                                                      |
| --------------------------------------------- | ------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `/api/v1/auth/dingtalk/qr`                    | `POST` | `{ clientType: 'pc' }`（const，默认 pc）                  | `201 { authState: string; loginUrl: string; expireAt: string (ISO); }`                                 | 服务端返回已生成的登录 URL 与状态标识，`expireAt` 为二维码过期时间        |
| `/api/v1/auth/dingtalk/qr/{authState}/status` | `GET`  | `authState` path                                          | `{ status: 'waiting' \| 'scanned' \| 'confirmed' \| 'expired'; authCode?: string; expireAt: string; }` | 轮询用；`authCode` 仅在 `confirmed` 返回                                  |
| `/api/v1/auth/dingtalk/callback`              | `POST` | `{ state: string; status: QRStatus; authCode?: string; }` | `{ [key: string]: boolean }`                                                                           | 扫码确认后由后端/钉钉回调触发，前端可在确认状态拿到 `authCode` 后主动调用 |
| `/api/v1/auth/dingtalk/login`                 | `POST` | `{ authCode: string }`                                    | `{ user: CurrentUser; tokens: TokenPair }`                                                             | 前端拿到 `authCode` 后调用，获取 access/refresh token 与用户信息          |

安全注意：所有请求带上 CSRF header，必要时校验 Referer；回调接口需校验 authCode 一次性。

## 6. UI / 体验要求

- 二维码区域 280px 正方形，卡片宽 360px；状态条背景渐变（品牌蓝）。
- 倒计时展示「二维码将在 XXs 后过期」；<15s 时文字改为警告色。
- 扫码后状态条切换为成功色，提示“请在钉钉上确认登录”；过期后置灰并显示刷新按钮。
- 提供「遇到问题？」链接，跳转到帮助中心文章。
- 二维码由前端生成，建议使用 `qrcode` 库，必要时加 skeleton 防闪烁。
- 可选：使用 `lucide-react` 的 `ScanLine`、`RefreshCw` 图标增强反馈。

## 7. 鉴权与路由

- 在 `src/router/index.tsx` 中为 `/login/dingtalk` 注册路由，归属 `authRoutes`。
- App 初次进入若检测到 `?redirect=` 参数，登录成功后跳转到该地址。
- 已登录用户访问该页面时应直接重定向到 `/dashboard`。

## 8. 验证与回归

手动验证 Checklist：

1. 未登录访问 `/login/dingtalk` 正常展示二维码。
2. 倒计时准确，过期后刷新按钮可重新获取。
3. 扫码 -> 确认能成功登录，并更新全局用户信息。
4. 多次快速刷新不会生成多份轮询（旧的被清理）。
5. 网络错误时 toast 提示，允许重试。
6. 退出登录后再次访问仍可使用钉钉扫码。

测试计划建议：

- 创建 Vitest + Testing Library 测试，mock axios，验证倒计时与轮询逻辑。
- 重点校验组件卸载时是否清理定时器，避免内存泄漏。

## 9. 时间预估

| 事项               | 预估   |
| ------------------ | ------ |
| 页面与状态逻辑开发 | 1.5 天 |
| 接入后端联调       | 0.5 天 |
| QA + 文档          | 0.5 天 |

## 10. 后续迭代方向

- **钉钉容器免登录**：后续若需要在钉钉 H5/微应用内直接登录，可按需引入钉钉官方 JS SDK，检测容器后调用 `dd.runtime.permission.requestAuthCode` 获取 `authCode`，再复用 `/api/v1/auth/dingtalk/login`。本期明确不实现该能力。
- **多平台二维码能力**：后续若接入企业微信、飞书等，可抽象 `useQrLogin` hook 统一轮询与倒计时逻辑，仅替换后端 endpoint 与 UI 标识。
