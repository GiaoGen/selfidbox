# SelfIDBox — Claude Code 项目指南

## 项目简介

SelfIDBox 是一个 AI 驱动的人格表达与测验发现平台。用户可以创建 AI 生成的性格测验、参与答题、并从结果中构建长期人格画像。平台将测验结果、上传的测试报告和 OCR 解析截图融合为 16 维人格向量，通过雷达图、词云和 Cover Flow 轮播可视化呈现。

**两条产品线**：
- **Explore（探索）** — 发现和参与性格测验与测评站点
- **Quiz Studio（测验工坊）** — 通过 AI 创建个性化测验，完全控制结果、因子、向量和题目

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16.2.6（App Router） |
| 语言 | TypeScript（strict mode） |
| 样式 | Tailwind CSS v4 |
| 动画 | Framer Motion |
| 数据库 | Supabase（PostgreSQL） |
| 认证 | Supabase Auth（基于 cookie 的 SSR） |
| AI | DeepSeek Chat API |
| OCR | 外部 OCR 服务代理 |
| 存储 | Supabase Storage |
| 错误追踪 | Sentry |
| 测试 | Vitest（单元测试）+ Playwright（E2E） |
| 部署 | Vercel |

## 目录结构

```
app/                              # Next.js App Router
├── admin/                        # 管理后台（受认证保护）
├── api/                          # 20 个 API 路由
│   ├── explore/search-cards/     # 探索数据
│   ├── profile/                  # 个人资料（sources, word-cloud, source-detail）
│   ├── quiz-ai/                  # AI 生成（results, factors, vectors, questions）
│   ├── quiz-attempts/            # 答题提交
│   ├── quiz-studio/              # 测验 CRUD（save, edit, sandbox）
│   ├── my-quizzes/               # 我的测验列表/删除
│   ├── screenshot-report/        # 截图 OCR 上传
│   ├── credits/                  # 积分查询
│   ├── test-sites/[id]/click/    # 外站点击追踪
│   └── user/                     # 用户信息
├── create/                       # Quiz Studio 页面（1715 行巨石组件，切勿随意拆分）
├── explore/                      # 探索/发现页面
│   └── _components/              # 探索页子组件（test-card, TrendingCard）
├── profile/                      # 个人资料页（force-dynamic，不可缓存）
├── quiz/[slug]/                  # 可玩测验页面
├── quizzes/[slug]/               # 测验详情页
├── test-sites/[id]/              # 外站测评详情页
├── login/                        # 登录/注册/验证页
├── layout.tsx                    # 根布局（元数据、PWA、字体栈）
├── globals.css                   # 全局样式（CSS 变量、Tailwind 主题）
├── error.tsx                     # 错误边界
├── not-found.tsx                 # 自定义 404
├── robots.ts                     # robots.txt
├── sitemap.ts                    # 动态站点地图
└── page.tsx                      # 首页（SelfIDBox 品牌落地页）

components/                       # 67 个组件
├── admin/                        # AdminDashboard, AdminHeader, AdminSidebar, 表单组件
├── auth/                         # UserMenu
├── explore/                      # ExploreClient, TrendingCard, TrendingCarousel
├── layout/                       # TopNavbar, ExploreTopNavbar, PageTransition
├── navigation/                   # BottomAppNavbar, NavbarLayout, SearchOverlay
├── profile/                      # CoverFlowSources, SourceBlocks, ProfileRadar, ReportDetail, etc.
├── quiz-engine/                  # 测验构建器：ResultCard, FactorList, QuestionEffectsCard, etc.
├── quiz-runtime/                 # 测验播放器：QuizPlayer, QuizResult, OptionButton, etc.
├── quiz-studio/                  # 可复用编辑器原语：InlineEditableInput, EditableSlider, etc.
├── share/                        # 分享卡片：QuizResultShareCard, RotatingCardModal
└── test-sites/                   # ExternalTestButton

lib/                              # 43 个模块
├── ai/                           # AI 使用追踪、模型定价
├── explore/                      # 探索数据获取、映射、排序、类型
├── prompts/                      # AI prompt 模板（quiz-results, quiz-factors, etc.）
├── supabase/                     # SSR 客户端（client.ts, server.ts, service.ts）
├── __tests__/                    # 单元测试（cache, rate-limit, prompt-strategies）
├── cache.ts                      # 内存 TTL 缓存层
├── quizzes-db.ts                 # 测验 CRUD 核心（查询和写入）
├── quiz-runtime.ts               # 运行时类型和评分算法
├── quiz-vector.ts                # 向量距离计算
├── rebuild-user-profile.ts       # 画像融合引擎
├── user-profile-db.ts            # 个人资料读写
├── test-sites-db.ts              # 外站操作
├── admin-db.ts                   # 管理后台查询
├── rate-limit.ts                 # 内存限流（仅 dev 有效）
├── types.ts                      # 共享类型
└── nippon-colors.ts              # 传统日色调色板

supabase/
├── migrations/                   # 15 个数据库迁移文件（按编号顺序执行）
├── rls-policies.sql              # RLS 策略参考指南
└── diagnose-rls.sql              # RLS 诊断脚本
```

## 架构要点

### 数据流

1. **测验创建**: Quiz Studio UI → `/api/quiz-ai/*` → DeepSeek API → 验证 JSON → 写入测验相关表
2. **测验答题**: Quiz Player → 用户选项 → 累加向量 → 欧几里得距离匹配 → 结果排名 → `/api/quiz-attempts` → DB
3. **画像构建**: `rebuildUserProfile()` 融合测验记录 + 上传报告 → `core_vector`（8 维）+ `social_vector`（8 维）→ AI 生成摘要
4. **缓存**: `lib/cache.ts` 为频繁读取数据提供内存 TTL 缓存（分类、外站、画像、测验详情）

### 认证模型

- Supabase Auth + cookie SSR（`@supabase/ssr`）
- `middleware.ts` 每次请求刷新 session cookie
- 受保护路由（`/admin`、`/profile`、`/create`）未认证用户重定向到 `/login`
- 数据变更 API 路由需认证
- AI 生成路由需认证
- 服务端使用 `createServiceClient()`（绕过 RLS）仅限已授权操作

### Supabase 客户端三层架构

| 客户端 | 文件 | 用途 | RLS |
|--------|------|------|-----|
| Browser | `lib/supabase/client.ts` | 客户端组件中调用 Supabase | 遵守 RLS |
| SSR | `lib/supabase/server.ts` | 服务端组件/RSC 中调用 | 遵守 RLS（需 cookie） |
| Service | `lib/supabase/service.ts` | API 路由中写入数据 | **绕过 RLS**（仅限已认证+已授权操作） |

### 测验风格参数（AI 生成用）

Quiz Studio 暴露 6 个风格滑块，控制 AI 生成的题目风格：

| 参数 | 范围 | 描述 |
|------|------|------|
| Abstractness | 0（具体）–100（抽象） | 场景框架 |
| Seriousness | 0（随意）–100（正式） | 语气和语言 |
| Goofiness | 0（正常）–100（荒谬） | 内容趣味性 |
| Depth | 0（表面）–100（深层） | 问题深度 |
| Poeticness | 0（朴素）–100（抒情） | 语言质量 |
| Title Relevance | 0（间接）–100（紧密） | 主题绑定强度 |

每个参数使用 5 级策略系统（very_low/low/mid/high/very_high），将数值转换为 AI 的行为指令。

### 评分算法

- 用户答题累加各选项的 `factor_effects` → 用户向量
- 用户向量与每个 `result_vector` 计算欧几里得距离
- 距离通过 softmax（`SCORING_ALPHA = 10`）转换为概率
- 按相似度百分比排名返回结果

## 开发命令

```bash
npm run dev          # 开发服务器 http://localhost:3000
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
npm run test         # Vitest 单元测试
npm run test:watch   # Vitest 监视模式
npm run test:e2e     # Playwright E2E 测试
npm run test:e2e:ui # Playwright 可视模式
```

### 环境变量（`.env.local`）

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # 仅服务端
DEEPSEEK_API_KEY=sk-your-deepseek-key
OCR_API_KEY=your-ocr-key                           # 可选
OCR_API_URL=https://your-ocr-service               # 可选
ADMIN_USER_IDS=uuid1,uuid2                         # 管理员用户 ID 列表
```

## 编码规范

### 通用原则

- **简洁优先** — 最小化改动，不发明新抽象。修复 bug 时不顺手重构
- **只改需要的** — 不修改与任务无关的文件。不"顺便修"格式化问题
- **保持风格一致** — 匹配周围代码的格式、命名、注释密度
- **TypeScript strict** — 所有代码通过 strict 模式类型检查
- **不要删除注释** — 除非明确要求，保留已有注释

### 组件模式

- 使用 `"use client"` 指令标记客户端组件
- 使用 Framer Motion 做动画，**仅使用合成属性**（opacity, transform, scale）— 不要动画 width/height/top/left
- 使用 `transition-colors`、`transition-shadow`、`transition-transform` — 不要 `transition-all`
- 大组件（如 `app/create/page.tsx`）在验证必要之前**不要拆分**
- 弹窗/模态框使用 `AnimatePresence` + `motion.div`

### CSS / Tailwind

- 使用 CSS 变量（`--ink`、`--muted`、`--background` 等）而非硬编码颜色
- 设计系统基于温暖的奶油色调（`#fffaf0`）
- 大圆角（`rounded-full`、`rounded-2xl`、`rounded-[24px]`）
- 移动端优先，使用 `safe-area-inset-*` 适配刘海屏
- 隐藏滚动条使用 `.scrollbar-none` 类
- 全局已设置 `touch-action: manipulation`

### 数据库 / Supabase

- 查询使用参数化构建器，**绝不拼接原始 SQL 字符串**
- 指定列而非 `select('*')`（避免不必要的字段传输）
- 批量查询用 `.in()` 代替逐个 `.eq()` 循环（防止 N+1）
- 服务端组件用 `createSSRClient()`，API 路由写入用 `createServiceClient()`
- Service role 客户端**仅**在已验证认证和授权后使用
- 所有 17 张表启用 RLS — 写迁移时**必须包含 RLS 策略**

### 认证 / 安全

- 服务端认证检查 > 客户端 UI 隐藏
- Admin 路由在 `app/admin/layout.tsx` 服务端验证 + `ADMIN_USER_IDS` 环境变量
- 修改数据的 API 路由必须验证用户所有权（`creator_user_id`）
- 客户端绝不返回原始 `error.message` — 使用通用错误消息
- 上传文件验证 MIME 类型和大小

### 性能

- `transition-all` 已全部替换为具体过渡属性（仅 `TrendingCarousel` 圆点保留，需过渡 `width`）
- `touch-action: manipulation` 已全局设置
- 静态资源已配置 `Cache-Control: immutable`
- 字体使用系统栈（无外部下载，适配中国大陆网络环境）

## Definition of Done

一个任务被视为完成，需满足：

- [ ] `npm run build` 零错误通过
- [ ] `npm run lint` 零新增警告
- [ ] `npm run test` 全部通过（如有相关测试）
- [ ] 修改的文件与任务直接相关（无意外改动）
- [ ] 无 `console.log` 遗留在生产路径中
- [ ] TypeScript 无 `any` 类型（除非与 Supabase 返回值交互）
- [ ] 新组件添加了 `"use client"` 指令（如使用 hooks/事件）
- [ ] 客户端 API 路由返回通用错误消息，不泄露内部细节
- [ ] 涉及数据变更的 API 路由已验证用户授权
- [ ] 新迁移文件按编号顺序命名，包含 RLS 策略
- [ ] **`TASKER_STATUS.md` 已同步更新** — 任务完成/状态变化/阻塞项已反映在文件中

## 任务追踪与状态维护规则

### Source of Truth

**`TASKER_STATUS.md` 是当前项目状态的唯一事实来源。**
任何其他文件（CLAUDE.md、README、Git log、内存记忆）都只是辅助参考——
如果它们与 TASKER_STATUS.md 冲突，以 TASKER_STATUS.md 为准。

**`PROJECT_HISTORY.md` 是历史档案。** 它保存完整的开发记录，但**不作为当前状态的依据**。
已完成的工作移入 PROJECT_HISTORY.md，当前状态留在 TASKER_STATUS.md。

### Session 启动流程

每次开始新的工作 Session 时，必须按顺序执行：

1. 阅读 `CLAUDE.md` — 了解项目架构、编码规范、已知风险
2. 阅读 `TASKER_STATUS.md` — 了解当前状态、进行中的工作、阻塞项、下一步计划
3. 如 TASKER_STATUS.md 所述状态与用户描述不一致 → 主动提醒用户，不要假设某一边正确
4. 根据当前状态决定工作优先级，而非根据记忆

### 必须更新 TASKER_STATUS.md 的触发条件

以下任一情况发生时，**必须**同步更新 TASKER_STATUS.md：

| 触发条件 | 更新内容 |
|----------|----------|
| 完成任务 | 将任务从 Unfinished Tasks 移至 Recent Progress，标注日期 |
| 任务状态变化（开始/暂停/取消） | 更新 Unfinished Tasks 中对应条目状态 |
| 出现新的阻塞项 | 添加到 Active Risks & Blockers |
| 优先级发生变化 | 调整 Unfinished Tasks 中 🔴🟠🟡🟢 顺序 |
| Session 结束前 | 汇总本次 Session 的所有状态变更到 Current State |
| 发现新的风险或已知异常 | 添加到 Active Risks & Blockers |
| 未提交变更积累超过 10 个文件 | 在 Uncommitted Changes 中记录文件清单和内容摘要 |
| 数据库迁移变更 | 记录新迁移文件名和用途 |

### 过期检测（3 天规则）

- 每次 Session 启动时检查 `TASKER_STATUS.md` 的 `Last updated` 日期
- 如果超过 **3 天**未更新：
  - 主动提醒用户：状态文件已过期
  - 建议根据 Git 历史（`git log --since="N days ago"`）和当前代码状态进行刷新
  - 不要默认认为过期状态仍然准确
  - 先刷新状态，再开始新工作

### 归档规则

- 当 TASKER_STATUS.md 超过 **400 行**时，将最旧的 "Recent Progress" 条目迁移到 PROJECT_HISTORY.md
- 迁移时保留完整内容，不做摘要压缩
- 迁移后在 TASKER_STATUS.md 中被迁移的位置留下指向 PROJECT_HISTORY.md 的链接
- **不要**在迁移过程中删除任何信息

### 双文件职责对照

| | TASKER_STATUS.md | PROJECT_HISTORY.md |
|---|---|---|
| 用途 | 当前状态 | 历史档案 |
| 活跃任务 | ✅ | ❌ |
| 阻塞项 | ✅ | ❌ |
| 最近进展（≤30 天） | ✅ 摘要 | ✅ 完整 |
| 历史进展（>30 天） | ❌ | ✅ 完整 |
| Recovery Notes | ✅ | ❌ |
| 已完成的旧任务 | ❌ | ✅ |
| 里程碑 | ❌ | ✅ |
| 作为工作依据 | ✅ Source of Truth | ❌ 仅供参考 |

## 重要文件说明

| 文件 | 说明 | 特别注意事项 |
|------|------|-------------|
| `app/create/page.tsx` | Quiz Studio 主页面（1715 行） | **高风区域** — 切勿随意拆分。包含创建/编辑两种模式，共享同一组件树 |
| `lib/quizzes-db.ts` | 测验 CRUD 核心 | 包含 `getQuizBySlug`（公开读取）、`getQuizForEdit`（需所有权）、`saveQuizSchema`（写入）。N+1 问题已修复，切勿改回逐个查询 |
| `lib/quiz-runtime.ts` | 运行时类型 + 评分算法 | 定义 `QuizRuntimeData`、`QuizQuestionData`、`QuizOptionData` 等核心类型。评分使用欧几里得距离 + softmax |
| `lib/rebuild-user-profile.ts` | 画像融合引擎 | 将测验记录 + 外部报告融合为 16 维人格向量 + AI 摘要 |
| `middleware.ts` | 路由保护 + session 刷新 | 匹配所有非静态路径。受保护路由：`/admin`、`/profile`、`/create` |
| `lib/supabase/service.ts` | Service role 客户端 | **绕过 RLS**，仅限已验证授权的 API 路由使用 |
| `lib/cache.ts` | 内存 TTL 缓存 | 为频繁读取数据提供缓存层，有超时回退机制 |
| `app/globals.css` | 全局样式 + CSS 变量 | 定义颜色、字体、安全区域、触摸行为 |
| `next.config.ts` | Next.js 配置 | 安全头、CSP、缓存头、图片远程模式、Sentry 集成 |
| `supabase/migrations/` | 数据库迁移 | 15 个 SQL 文件，按编号顺序执行。每个文件末尾含 RLS 策略 |
| `docs/performance-audit-issues.md` | 性能审计问题跟踪 | 已修复 11/39 项。剩余问题按风险分级，切勿盲目修复 |
| `docs/security-audit-report.md` | 安全审计报告 | 24 个发现（3 关键/8 高/7 中/6 低）。修复前先评估风险 |
| `TASKER_STATUS.md` | 项目状态唯一事实来源 | 每次 Session 启动必读。记录当前状态、进行中工作、阻塞项、下一步计划 |
| `PROJECT_HISTORY.md` | 完整开发历史归档 | 保存已完成工作（>30 天）。不作为当前状态依据 |

## 已知风险区域

- **`app/create/page.tsx`** — 1715 行巨石组件，拆分会破坏测验编辑器
- **`middleware.ts`** — 路由保护变更可能导致安全漏洞
- **RLS 配置不匹配** — `submitting` vs `submitted` 状态名错误导致已发布测验不可见
- **`force-dynamic`** — `app/profile/page.tsx` 使用，不可轻易移除（用户数据隔离依赖）
- **Service role 客户端** — `lib/supabase/service.ts` 绕过 RLS，使用前必须验证认证和授权
- **`transition-all`** — 全局已完成替换为具体属性。新增代码请勿使用 `transition-all`
- **中国大陆网络** — Google Fonts 不可用，已改用系统字体栈。不要恢复 `next/font/google` 导入
