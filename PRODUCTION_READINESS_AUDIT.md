# SelfIDBox — 上线前准备分析

> 生成日期：2026-06-14  
> 范围：仅覆盖非功能、非 UI 的上线准备工作  
> 不含：功能升级、UI 优化、数据库 schema 变更

---

## 总览

| 领域 | CRITICAL | HIGH | MEDIUM | LOW |
|------|----------|------|--------|-----|
| 环境与配置 | 1 | 0 | 2 | 1 |
| 安全 | 3 | 3 | 1 | 0 |
| 数据库与数据 | 1 | 0 | 2 | 1 |
| 错误处理 | 0 | 2 | 1 | 0 |
| 性能与缓存 | 0 | 1 | 2 | 1 |
| SEO 与元数据 | 0 | 1 | 2 | 1 |
| 可观测性 | 0 | 1 | 2 | 0 |
| API 与基础设施 | 2 | 1 | 0 | 1 |
| 测试 | 1 | 0 | 0 | 1 |
| 文档 | 1 | 0 | 1 | 0 |

---

## 一、环境与配置

### CRITICAL — `.env.local` 含有线上密钥，且无 `.env.example`

**文件：** `.env.local`

- 包含两个 `NEXT_PUBLIC_SUPABASE_URL`（重复配置）
- 包含 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 包含 `DEEPSEEK_API_KEY`（以 `sk-` 开头）
- 包含 `SUPABASE_SERVICE_ROLE_KEY`（最高权限密钥，可绕过 RLS）
- 包含 `OCR_API_KEY=11111111`（占位值）

**不存在** `.env.example` 或 `.env.production` 文件。新开发者无法获知需要哪些环境变量。

**行动：**
- [ ] 创建 `.env.example`，列出所有必需变量及其说明（值留空）
- [ ] 确认 `.env.local` 是否曾被 `git` 追踪；若是，立即轮换所有密钥
- [ ] 删除重复的 `NEXT_PUBLIC_SUPABASE_URL`
- [ ] 将 `SUPABASE_SERVICE_ROLE_KEY` 从 `.env.local` 移除（仅在服务端使用并通过 `process.env` 注入，不要用 `NEXT_PUBLIC_` 前缀）

### MEDIUM — `next.config.ts` 几乎为空

**文件：** `next.config.ts`

缺少：
- `images.remotePatterns`：若使用 `next/image` 加载 Supabase Storage 外部图片，需配置域名白名单
- `output`：未指定构建模式（standalone / export）
- 无压缩、无 headers 配置

**行动：**
- [ ] 添加 Supabase Storage 域名到 `images.remotePatterns`
- [ ] 添加安全响应头（见安全章节）

### MEDIUM — `tailwindcss` 在 `devDependencies`

**文件：** `package.json`

Tailwind v4 + PostCSS 插件位于 `devDependencies`。在 `--omit=dev` 的生产安装中可能导致构建失败。

**行动：**
- [ ] 验证 `npm run build` 在仅安装 `dependencies` 时能否成功
- [ ] 若不成功，将 `@tailwindcss/postcss` 和 `tailwindcss` 移至 `dependencies`

---

## 二、安全

### CRITICAL — 管理后台（`/admin/*`）无任何认证保护

**文件：** `app/admin/page.tsx`、`app/admin/layout.tsx` 及所有 `app/admin/` 子页面

管理后台及所有子页面（测试站点管理、Quiz 管理、分类 CRUD、AI Prompt 编辑、AI 用量日志）均无 `supabase.auth.getUser()` 检查，无重定向到 `/login`，无角色验证。任何人可直接访问 `/admin`。

**行动：**
- [ ] 在 `app/admin/layout.tsx` 中添加认证检查
- [ ] 未登录用户重定向至 `/login`
- [ ] 可选：添加管理员角色检查

### CRITICAL — Debug 页面对公网开放

| 文件 | 暴露内容 |
|------|---------|
| `app/debug-supabase/page.tsx` | 原始 Supabase 查询结果（categories、test_sites） |
| `app/auth-debug/page.tsx` | 已登录用户的 ID 和 email |
| `app/debug-minimal/page.tsx` | HydrationDebug 组件 |

**行动：**
- [ ] 删除 `debug-supabase` 和 `auth-debug` 页面，或添加 `NODE_ENV === "development"` 守卫
- [ ] `debug-minimal` 已有开发环境守卫，确认其有效

### CRITICAL — AI 生成 API 路由无认证

**文件：** `app/api/quiz-ai/generate-questions/route.ts`、`generate-factors/route.ts`、`generate-results/route.ts`、`generate-result-vectors/route.ts`

这些 AI 生成路由**不检查用户认证**——不调用 `createClient()` / `getUser()`。`userId` 从请求 body 获取且仅用于追踪。任何人可匿名调用这些接口并消耗 DeepSeek API 费用。

**行动：**
- [ ] 在所有 `quiz-ai/*` 路由中添加 `createClient()` + `supabase.auth.getUser()` 检查
- [ ] 未认证返回 `401`

### HIGH — 中间件仅刷新 session，无路由保护

**文件：** `middleware.ts`

注释明确写道 "no route protection, no redirect"。仅调用 `supabase.auth.getUser()` 刷新 cookie。

**行动：**
- [ ] 在 middleware 中添加 `/admin`、`/profile` 等受保护路由的未登录重定向
- [ ] 或者确保每个受保护页面有独立检查（当前 admin 完全没有）

### HIGH — 无 CSP / 安全响应头

**文件：** `next.config.ts`、`middleware.ts`

未配置 `Content-Security-Policy`、`X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security`、`Referrer-Policy`、`Permissions-Policy`。

**行动：**
- [ ] 在 `next.config.ts` 的 `headers()` 中添加基础安全头
- [ ] 最低要求：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Strict-Transport-Security: max-age=63072000`

### HIGH — 静态 Supabase 客户端被服务端代码使用

**文件：** `lib/supabase.ts`

此文件创建的 singleton 客户端（anon key）被以下服务端文件引用：
`lib/quizzes-db.ts`、`lib/rebuild-user-profile.ts`、`lib/user-profile-db.ts`、`lib/test-sites-db.ts`、`lib/ai/track-ai-usage.ts`、`lib/ai/prompts.ts`、`lib/source-detail-db.ts`、`lib/image-upload.ts`

这些调用无法关联认证用户上下文（RLS 视为匿名请求）。

**行动：**
- [ ] 评估是否需要迁移到 `lib/supabase/server.ts` 的 SSR 客户端
- [ ] 若这些调用必须使用 service_role，确保仅在后端使用且不暴露给客户端

### MEDIUM — 数据库 RLS 策略 ~~未确认~~ ✅ 已完成（2026-06-16）

**全部 14 张表已启用 RLS，分两轮执行：**

| 轮次 | 迁移文件 | 涉及表 |
|:---:|------|------|
| 1 | `010_rls_private_user_data.sql` | user_profile, reports, quiz_attempts, quiz_attempt_answers, ai_usage_logs |
| 2 | `011_rls_public_mixed_tables.sql` | quizzes, quiz_factors, quiz_results, quiz_questions, quiz_options, ai_prompts, test_sites, test_categories, test_site_clicks |

RLS 策略已在 Supabase Dashboard 执行并通过验证（探索页、Quiz、Admin CRUD 均正常）。

---

## 三、数据库与数据

### CRITICAL — `DEV_USER_ID` 仍在生产路径中硬编码

**文件：** `lib/dev-user.ts`、`lib/quizzes-db.ts`

`saveQuizAttempt()` 函数（`lib/quizzes-db.ts:209`）仍使用 `DEV_USER_ID` 写入 `quiz_attempts.user_id`。新的 API 路由 `app/api/quiz-attempts/route.ts` 正确使用 `user.id`，但旧路径仍然存在。

**行动：**
- [ ] 检查 `saveQuizAttempt()` 的所有调用方
- [ ] 将 `user_id` 参数化，从 auth 上下文获取真实用户 ID
- [ ] 确认无其他代码引用 `DEV_USER_ID`

### MEDIUM — `lib/test-supabase.ts` 为死代码

**行动：**
- [ ] 删除或移至 `__tests__/` 目录

### MEDIUM — Supabase 迁移文件为手工管理

**行动：**
- [ ] 整理迁移文件顺序，添加编号前缀
- [ ] 在 README 中记录如何执行迁移

---

## 四、错误处理

### HIGH — 无 `error.tsx`（Error Boundary）

应用中无任何 `error.tsx` 文件。服务端组件抛出异常时，用户将看到 Next.js 默认错误页（可能暴露栈追踪）。

**行动：**
- [ ] 在 `app/` 根目录创建 `error.tsx`
- [ ] 在关键路由（`/profile`、`/admin`、`/quiz/[slug]`）添加独立的 `error.tsx`

### HIGH — 无 `not-found.tsx`（自定义 404）

**行动：**
- [ ] 在 `app/` 根目录创建 `not-found.tsx`

---

## 五、性能与缓存

### HIGH — 大量 `console.log` 将输出到生产环境

代码库中有 100+ 处 `console.log`/`console.warn`/`console.error`，包括 `[ProfileRebuild]`、`[QuizAttempt]`、`[OCR Proxy]`、`[Explore]`、`[Quiz Questions Style Controls]` 等调试日志。

**行动：**
- [ ] 实现生产环境日志开关（如 `process.env.NODE_ENV === "development"` 守卫）
- [ ] 或将调试日志替换为结构化 logger

### MEDIUM — 未使用 `next/font` 优化字体加载

**行动：**
- [ ] 考虑使用 `next/font/google` 加载字体以优化 CLS

### MEDIUM — `next.config.ts` 无 `images.remotePatterns`

若 Supabase Storage 图片通过 `next/image` 渲染，需要在配置中声明域名。

**行动：**
- [ ] 添加 Supabase Storage 域名至 `images.remotePatterns`

---

## 六、SEO 与元数据

### HIGH — 无 `robots.txt`、无 `sitemap.xml`

**行动：**
- [ ] 创建 `app/robots.ts`（Next.js 约定文件）
- [ ] 创建 `app/sitemap.ts`（动态生成）

### MEDIUM — 根布局元数据缺少 OpenGraph / Twitter

**文件：** `app/layout.tsx`

缺少 `openGraph`、`twitter`、`metadataBase`、`keywords`、`robots` 配置。

**行动：**
- [ ] 添加 `metadataBase`（必需，用于 OG 图片绝对 URL）
- [ ] 添加 `openGraph` 和 `twitter` 元数据
- [ ] 添加 `keywords` 和 `authors`

### MEDIUM — 仅 `/quiz/[slug]` 有页面级元数据

其他所有页面依赖根布局元数据（标题和描述相同）。

**行动：**
- [ ] 为 `/explore`、`/profile`、`/create`、`/quizzes/[slug]`、`/test-sites/[id]` 添加 `generateMetadata()`

---

## 七、可观测性

### HIGH — 无集中式日志 / 错误追踪

未集成 Sentry、Logtail、Datadog 或任何可观测平台。所有日志通过 `console.*` 输出。

**行动：**
- [ ] 集成错误追踪服务（如 Sentry）
- [ ] 至少为 API 路由添加结构化错误日志

### MEDIUM — Profile 重建日志极其详细

**文件：** `lib/rebuild-user-profile.ts`

每条维度变化、profile 摘要、token 消耗都输出日志。

**行动：**
- [ ] 将详细日志降级为 `debug` 级别，生产中仅输出 `info`/`error`

### MEDIUM — AI 追踪为 fire-and-forget

`lib/ai/track-ai-usage.ts` 中的 `trackAISuccess`/`trackAIError` 未被 await，失败静默忽略。

**行动：**
- [ ] 至少在生产中 `console.error` 捕获的异常

---

## 八、API 与基础设施

### CRITICAL — 无任何限流

代码中未发现 `rate_limit`、`throttle`、`RATELIMIT`。AI 生成和 OCR 代理路由无调用频率限制。

**行动：**
- [ ] 对 AI 生成路由实施限流（如每个用户每分钟最多 N 次）
- [ ] 对 OCR 路由实施限流
- [ ] 可选用 Upstash Redis + `@upstash/ratelimit` 或 Vercel KV

### CRITICAL — AI 生成路由无认证（同安全 2.3）

见安全章节。

### HIGH — 无显式 CORS 配置

**行动：**
- [ ] 若 API 仅同源使用，确认默认行为满足需求
- [ ] 若需跨域访问，在 `next.config.ts` 或 API 路由中添加 CORS 头

---

## 九、测试

### CRITICAL — 零测试文件

项目中无任何 `*.test.ts`、`*.spec.ts` 文件。无 `vitest`、`jest`、`@testing-library/react`、`@playwright/test` 依赖。`package.json` 无测试脚本。

**行动：**
- [ ] 最低限度：为核心业务逻辑添加单元测试（`lib/quizzes-db.ts`、`lib/rebuild-user-profile.ts`）
- [ ] 为关键 API 路由添加集成测试
- [ ] 为关键用户流程添加 E2E smoke test（登录 → 做 Quiz → 查看 Profile）

---

## 十、文档

### CRITICAL — README 为默认 Next.js 模板

**文件：** `README.md`

无 SelfIDBox 项目信息。

**行动：**
- [ ] 编写包含以下内容的 README：
  - 项目简介
  - 技术栈
  - 本地开发环境搭建
  - 环境变量列表
  - 数据库迁移执行方式
  - 架构简要说明
  - 部署指南

### MEDIUM — 无部署文档

**行动：**
- [ ] 编写部署 checklist
- [ ] 若使用 Vercel，添加 `vercel.json` 配置

---

## 优先级排序（P0 → P2）

> **第一轮：2026-06-14 | 第二轮：2026-06-15**  
> ✅ = 已完成　⬜ = 需手动操作

### P0 — 上线前必须完成

| # | 行动 | 领域 | 状态 |
|---|------|------|------|
| 1 | 轮换所有密钥，创建 `.env.example` | 配置 | ✅ `.env.example` 已创建；⬜ 密钥轮换需手动操作 |
| 2 | Admin 路由添加认证检查 | 安全 | ✅ `app/admin/layout.tsx` 已添加 `createClient()` + `getUser()` + `redirect("/login")` |
| 3 | Debug 页面删除/守卫 | 安全 | ✅ `debug-supabase`、`auth-debug` 已删除 |
| 4 | AI 生成 API 路由添加认证 | 安全 | ✅ 4 个 `quiz-ai/*` 路由已添加 auth check，未认证返回 401 |
| 5 | AI 生成 API 路由添加限流 | API | ✅ `lib/rate-limit.ts` + 4 路由已应用，20 req/min/user |
| 6 | 移除 `DEV_USER_ID` 硬编码 | 数据 | ✅ 死代码 `saveQuizAttempt` 已删除，live route 用 `user.id` |
| 7 | 创建 `error.tsx` + `not-found.tsx` | 错误处理 | ✅ 已创建 |
| 8 | 创建 `robots.ts` + `sitemap.ts` | SEO | ✅ 已创建 |
| 9 | README 重写 | 文档 | ✅ 已重写 |
| 10 | 生产环境禁用调试日志 | 性能 | ✅ `lib/logger.ts` 已创建，`rebuild-user-profile.ts`/`user-profile-db.ts`/`explore/page.tsx` 已迁移 |

### P1 — 上线后尽快完成

| # | 行动 | 领域 | 状态 |
|---|------|------|------|
| 11 | 添加安全响应头（CSP 等） | 安全 | ✅ `next.config.ts` 已添加 CSP/HSTS/X-Content-Type-Options/X-Frame-Options/Referrer-Policy/Permissions-Policy |
| 12 | 中间件路由保护 | 安全 | ✅ `middleware.ts` 已添加 `/admin`、`/profile`、`/create` 保护 |
| 13 | 确认 RLS 策略 | 安全 | ✅ 全部 14 张表 RLS 已启用，两轮 migration 已执行并验证通过 |
| 14 | 根布局 OpenGraph / Twitter 元数据 | SEO | ✅ `app/layout.tsx` 已添加 |
| 15 | 各页面添加 `generateMetadata()` | SEO | ✅ `explore`/`profile`/`quizzes/[slug]`/`test-sites/[id]` 已添加 |
| 16 | 集成错误追踪服务 | 可观测性 | ⬜ 需注册第三方服务 |
| 17 | `images.remotePatterns` 配置 | 性能 | ✅ Supabase Storage 域名已添加 |
| 18 | 添加核心业务逻辑单元测试 | 测试 | ✅ vitest 配置，16 tests passing (cache, rate-limit, strategies) |

### P2 — 持续改进

| # | 行动 | 领域 | 状态 |
|---|------|------|------|
| 19 | 静态 Supabase 客户端迁移评估 | 安全 | ✅ 已评估；`api/profile/sources/delete` 改用 SSR 客户端；`admin/ai-usage` 改用 SSR 客户端；`track-ai-usage.ts` / `prompts.ts` 支持可选 `SupabaseClient` 参数；4 个 AI 路由传递 `client: supabase` 到所有追踪调用；`explore/fetch.ts` 仅读公开数据，静态客户端适用 |
| 20 | 字体加载优化 (`next/font`) | 性能 | ✅ Noto Sans SC, `display: swap` |
| 21 | 迁移文件规范化 | 数据 | ✅ 已添加 001-009 编号前缀，README 已更新 |
| 22 | CORS 显式配置 | API | ✅ `next.config.ts` 已为 `/api/*` 添加 CORS 头（same-origin） |
| 23 | E2E smoke test | 测试 | ✅ Playwright 已配置，`e2e/smoke.spec.ts` 覆盖 6 个公开页面 |
| 24 | 部署文档 | 文档 | ✅ 已包含在 README.md 中 |
