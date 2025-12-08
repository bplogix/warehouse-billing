# AGENTS.md

聚焦可执行、可落地的开发指令，结合本仓库约定，面向新接手的智能代理与开发者。

## 项目概述

- 类型：前端单页应用（Vite + React + TypeScript），面向仓储与计费业务。
- 核心功能：认证、仓库管理、账单与总账、客户管理、仪表盘与演示模块。
- 技术栈：React 19、Vite 7、TypeScript 5、Tailwind CSS 4（基于 `@tailwindcss/vite`）、Radix UI、Zustand 状态管理、React Router 7、axios、date-fns。
- 架构说明：模块化目录（`src/modules/*` 对应业务域），`router` 统一路由，`stores` 管理全局状态，`schemas` 定义表单/接口 schema，`utils/lib` 封装通用能力，`components` 为可复用 UI。根组件在 `src/main.tsx` 挂载，`src/App.tsx` 负责全局路由与通知 (`sonner` toaster)。

## 开发命令（pnpm）

- 安装依赖：`pnpm install`
- 启动开发：`pnpm dev`
- 构建产物：`pnpm build`
- 代码检查（ESLint）：`pnpm lint`
- 代码格式化：`pnpm format`
- 类型检查（严格，不生成产物）：`pnpm check-types`
- 规范化提交（使用 czg）：`pnpm commit`

## 项目结构

```
src/
  App.tsx            # 根组件，挂载路由与全局 Toaster
  main.tsx           # 入口，挂载到 DOM
  router/            # 路由配置
  modules/           # 业务域（auth, warehouse, billing, ledger, customer, dashboard, demo）
  components/        # 可复用 UI 组件
  stores/            # Zustand 状态仓库
  schemas/           # 表单/接口 schema 与类型
  lib/, utils/       # 通用工具与封装
  constants/, types/ # 常量定义与类型
index.html           # Vite HTML 模板
vite.config.ts       # 构建与别名配置
eslint.config.js     # ESLint 规则
```

## 代码规范

- 语言/风格：TypeScript + React Hooks。默认使用函数式组件。
- 命名：
  - 组件与文件使用 PascalCase（例如 `UserCard.tsx`）。
  - hooks 以 `use` 前缀，Zustand store 以 `useXStore` 命名。
  - 常量全大写蛇形 `MAX_SIZE`；工具函数用 camelCase。
- UI/样式：
  - Tailwind 4 原子类优先；通过 `tailwind-merge` 合并 class。
  - 交互组件优先 Radix UI；Icons 使用 `lucide-react`。
- API 调用：统一通过 `axios` 封装；日期处理使用 `date-fns`。
- 路由：集中管理于 `src/router`，避免组件内硬编码路径。
- 提交信息：使用 `pnpm commit`（czg）遵循 Conventional Commits。

## 测试策略

- 当前未集成自动化测试框架。**关键**：新增功能时至少补充单元或集成测试计划。
- 建议：引入 Vitest + @testing-library/react；示例命令：
  - 安装：`pnpm add -D vitest @vitest/ui @testing-library/react jsdom`
  - 运行：`pnpm vitest run`
  - 覆盖率（建议 ≥80%）：`pnpm vitest run --coverage`
- 若暂不添加测试，请在 PR 描述中说明手动验证步骤与覆盖范围。

## ⚠️ 严重警告

- Node 版本需满足 `>=18`；使用 `pnpm@10.24.0`，避免不同包管理器导致的锁文件漂移。
- 运行 `pnpm check-types` 与 `pnpm lint` 均设为阻断（`--max-warnings=0`），请在提交前确保通过。

## 开发文档

- 所有生成的文档按照功能命名
- 文档保存路径 `docs/*`
