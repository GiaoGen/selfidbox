# TASKER STATUS

Last updated: 2026-06-24

---

## Current State

SelfIDBox 处于**静态 MVP 完成、生产加固阶段**。核心用户流程（探索 → 测验详情 → 答题 → 结果 → 画像）全链路通。Quiz Studio（创建 → AI 生成 → 编辑 → 发布）功能完整。数据库 17 张表全部启用 RLS，15 个迁移文件。

**当前阻塞**：3 个安全关键问题待修复（C-S1 测验保存无所有权验证、C-S2 RLS 状态名不匹配、C-S3 密钥泄露）。34 个未提交文件（性能修复 Batch 1–2 + 字体替换 + 文档）等待提交。

**下一步**：修复 3 个安全关键 → 提交性能修复 → 生产上线评估。

---

## Uncommitted Changes (2026-06-24)

### 性能审计修复 Batch 1（9 项零风险修复）

基于 `docs/performance-audit-issues.md`（39 个问题）：

1. **C-1 — 卸载 recharts**：死代码 ~165KB gzipped
2. **H-7 — transition-all 替换**：25 文件 36 处 → 具体过渡属性（仅 TrendingCarousel 保留）
3. **H-11 — 静态资源 Cache-Control**：`/_next/static/(.*)` → `max-age=31536000, immutable`
4. **H-12 — touch-action: manipulation**：消除移动端 300ms 点击延迟
5. **L-1 — 删除模板 SVG**：5 个 Next.js 样板文件
6. **L-2 — optimizePackageImports**：`["lucide-react", "framer-motion"]`
7. **L-4 — 首页替换**：Next.js 样板 → SelfIDBox 品牌落地页
8. **L-5 — robots.txt**：新建，指向 sitemap
9. **L-7 — poweredByHeader: false**

### 性能审计修复 Batch 2（N+1 查询）

1. **C-3 — getQuizBySlug**：`Promise.all(N 次并行查询)` → `.in()` 批量查询 + Map 分组。查询数从 N+4 → 5
2. **C-4 — getQuizForEdit**：`for (串行 N 次查询)` → `.in()` 批量查询 + Map 分组。查询数从 2N+3 → 5

验证：`npm run build` 零错误。

### 字体本地化

- 移除 `next/font/google` → 系统字体栈（`PingFang SC / Noto Sans SC / Microsoft YaHei / ...`）
- 原因：中国大陆无法直连 Google Fonts

### 安全审计

`docs/security-audit-report.md`：24 发现（3 关键 / 8 高 / 7 中 / 6 低）

### 新增文件

- `CLAUDE.md` — 项目指南
- `docs/performance-audit-issues.md` — 39 问题跟踪（已修复 11 项）
- `docs/security-audit-report.md` — 安全审计报告
- `public/robots.txt`

---

## Recent Progress (Last 30 Days)

### 2026-06-22 — 积分系统 + 游客保存 + Sentry + RLS 完成

- **积分系统**：`user_credits` 表 + 3 个 SECURITY DEFINER RPC + CreditPanel。AI 生成消耗积分（Results 3cr / Factors 1cr / Vectors 3cr / Questions 5cr）
- **游客答题保存**：未登录答题 → 登录 → 自动保存（PendingSaveHandler + localStorage）
- **Sentry**：`@sentry/nextjs` v10.58 集成，sourcemaps 生产禁用
- **RLS 完成**：Round 1+2 覆盖全部 17 张表
- **动画优化**：卡片 spring 动画 + 骨架屏清理 + 登录页 Suspense 修复
- Commits: `25f3a57` `5739432` `24fe366` `9db5935` `b17553d` `7865527` `d31af04` `764f010` `28d0f7f` `82036fb`

### 2026-06-21 — 热度分 + 问候语 + 生产加固 + 基础设施

- **统一热度分 + 去重**：`lib/explore/sort.ts`，heat_score 降序 + 去重
- **时间问候语**：`components/Greeting.tsx`，/explore + /profile
- **生产加固**：admin 角色检查（`ADMIN_USER_IDS`）+ 消除静态 anon 客户端 + service_role 隔离
- **基础设施**：限流器（`lib/rate-limit.ts`）、Vitest + Playwright（3 测试文件）、结构化日志（`lib/logger.ts`）
- **文档**：`PRODUCTION_READINESS_AUDIT.md`、`PreLaunchChecklist.md`
- Commits: `5ebed94` `6dc6ab5` `5350fc9` `a4a006d` `db3f9d1` `5b096e3`

### 2026-06-20 — 用户名 + 动态权重

- **用户名系统**：`users.username` UNIQUE + 设置/修改/重名检测
- **动态画像权重**：Profile 权重按数据来源动态调整 + Nippon 色对齐
- Commits: `68cf8be` `2e4bf77`

### 2026-06-19 — V2 评分 + SourceBlocks + UI 刷新

- **V2 评分算法**：欧几里得距离 + softmax（`SCORING_ALPHA = 10`）
- **SourceBlocks**：数据驱动网格 + 竖排文字 + 卡片弹窗
- **UI 刷新**：奶油色背景（`#fffaf0`）+ 雷达图纯 SVG 重构 + 词云移除 + 尖角卡片
- **颜色管道**：`quiz_results.color` AI 生成 → DB → Profile 全链路持久化
- Commits: `03cd627` `1b64516` `8bc8d41` `1f76b9c`

### 2026-06-17 — 探索页重构 + 小票卡片

- **Explore UI 重构**：筛选区域单行化 + 时间下拉菜单
- **详情页重构**：TestSiteDetail + QuizDetail 小票样式 + 邮票 grid（`StampCard.tsx`）
- **卡片重新设计**：TrendingCard + TestCard 直角 Nippon 纯色 + 虚线三段式 + 锯齿穿孔
- **轮播优化**：极简线型 dots
- Commits: `9e4a00b` `274d69e`

---

## Active Risks & Blockers

### 🔴 上线阻断（安全关键）

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| C-S1 | 测验保存无所有权验证 | `app/api/quiz-studio/save/route.ts` | 任意用户可覆盖任意测验 |
| C-S2 | RLS submitting/submitted 状态名不匹配 | 5 张表的 CHECK 约束 + RLS 策略 | 所有已发布测验公网不可见 |
| C-S3 | 密钥泄露 | `.env.local` | Service role key 需轮换 |

### 🟠 已知异常

- **限流器**：仅内存版，Vercel 多实例不可靠。生产需 Upstash Redis
- **词云组件**：`WordSphereModal.tsx` 保留在代码库但未接入任何页面
- **`animation-demo.html`**：根目录未跟踪，用途不明
- **CSP**：`unsafe-inline` + `unsafe-eval` 实际禁用 XSS 防护

---

## Unfinished Tasks

### 🔴 上线前必须（3 项）

1. C-S1 — 测验保存添加所有权验证（参考 `edit/route.ts` 已有模式）
2. C-S2 — 统一 CHECK 约束和 RLS 策略状态名
3. C-S3 — 轮换密钥 + 清理 `.env.local`

### 🟠 高优先级（5 项）

4. 9 个 API 路由替换 `error.message` → 通用错误消息
5. 截图上传添加 MIME 类型/大小验证
6. 存储桶上传添加按用户文件夹隔离 + DELETE 策略
7. 移除 CSP `unsafe-inline` / `unsafe-eval`
8. 提交 34 个未提交文件变更

### 🟡 中优先级（6 项）

9. 限流器迁移到 Upstash Redis
10. CSRF 保护（Origin/Referer 头验证）
11. 16/20 路由添加限流
12. 生产环境日志脱敏（79 处 console 审计）
13. `ensure_user_credits` RPC search_path 修正
14. 评估 `animation-demo.html` 用途

### 🟢 低优先级（5 项）

15. 删除未使用的 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
16. 添加 `check_username_available` RPC
17. `user_profile` 软删除（GDPR）
18. Vercel Analytics / Speed Insights
19. 首页添加视觉内容（当前纯文字）

---

## Recovery Notes

### 构建失败

1. `grep -r "transition-all" app/ components/` — 仅 TrendingCarousel.tsx:157 应残留
2. `grep -r "recharts" app/ lib/ components/` — 应零结果
3. 回退：`git diff --name-only HEAD` — 34 文件清单

### 字体异常

- `app/globals.css:19` — `--font-sans` 应为系统字体栈（非 Google Fonts）
- `app/layout.tsx` — 确认无 `next/font/google` 导入

### N+1 查询修复回退

- 关键文件：`lib/quizzes-db.ts:79-115`（getQuizBySlug）、`lib/quizzes-db.ts:500-533`（getQuizForEdit）
- 回退：`git diff lib/quizzes-db.ts` 查看改动，`git checkout lib/quizzes-db.ts` 回退

### Supabase 连接异常

- 检查 `.env.local` 中 URL + ANON_KEY
- 免费层 90 天不活跃自动暂停
- RLS 策略参考 `supabase/rls-policies.sql`

### DeepSeek API 失败

- 检查 API key 有效性和余额
- 检查 `api.deepseek.com` 网络可达性
- AI 生成按钮显示 "积分不足" 时检查 `user_credits` 表

---

> 完整历史记录见 [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md)
