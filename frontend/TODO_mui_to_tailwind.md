# MUI -> Tailwind + shadcnUI 迁移待办

- [x] 盘点 MUI 使用范围：入口 ThemeProvider/CssBaseline，全局字体 roboto，模块内 Container/Stack/Card/Table/Button 等。
- [x] 简单页面示例迁移：`src/views/NotFound.tsx` 改为 Tailwind + shadcn Button/Layout。
- [ ] 基础样式/Token 对齐：检查 `src/index.css` 与 shadcn 组件 tokens 是否一致，补充需要的阴影/圆角/动画变量。
- [x] 按模块批量迁移：
  - 布局（优先）：`src/components/layouts/Desktop.tsx`（导航抽屉/顶部栏/布局容器）。➡️ 已迁移
  - 表单：`CustomerForm`, `TemplateForm`，用 `components/UI/form` + `input/select`。➡️ 已迁移
  - 认证：`modules/auth/Dev`（模拟登录）。➡️ 已迁移
  - 表格/列表：账单/仓库/账本模块中的 Card/Table/Grid。➡️ 已迁移
- [ ] 样式基线待确认：阴影 token（card/sheet/drawer）、容器宽度/断点、间距尺度、动画（drawer/dialog/tabs/accordion）与 `tailwindcss-animate` 配置。
- [x] 清理：移除残留 MUI 依赖与 provider，引入统一字体与全局样式。（已删除 MUI 依赖、ThemeProvider/CssBaseline/Roboto）

说明：待办将随迁移进度更新，可按页面/模块逐步勾选。
