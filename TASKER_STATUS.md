# TASKER STATUS

Last updated: 2026-07-03

---

## Current State

SelfIDBox 处于**上线前收尾阶段**。核心用户流程全链路通。卡片颜色系统已完成全链路统一：/explore、/test-sites/[id]、/quizzes/[slug] 全部通过 mapper 统一取色，支持 DB 自定义颜色覆盖。Quiz Studio 支持图片主色调自动提取（HSL 调优）。quiz 做题过程背景模糊已移除。

**PWA 开屏优化**：骨架屏 + Service Worker + Middleware 公开路由零开销 + SWR 数据缓存 四项全部完成。PWA 启动感知速度和实际加载时间均已显著改善。

**小票风格 UI 统一**：Login 页面 + 全部导航组件（BottomAppNavbar、TopNavbar、UserMenu、SearchOverlay）已统一为小票/收据设计语言——直角矩形、虚线分割、锯齿穿孔条、纸张投影、米色纯色背景。搜索按钮已合并进底部导航条。

**当前阻塞**：无。test-sites/[id] 顶部卡片 hydration 颜色误差待修复（己确认根因：Framer Motion SSR 与 RelatedTestSites 组件树冲突，暂缓）。

**下一步**：lint 错误清理 → 生产上线。剩余可优化项见下方 Unfinished Tasks。

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

### 2026-07-03 — Login 页面 + 导航组件小票风格 UI 统一

- **Login 页面改版**（`app/login/page.tsx`）：
  - 主卡片：`rounded-[32px]` → 直角矩形 + `shadow-[0_4px_20px_rgba(0,0,0,0.20)]` 纸张投影
  - 新增顶部/底部锯齿穿孔条（复用 TrendingCard 的 `radial-gradient` 圆点图案）
  - 品牌标题/表单/模式切换/法律链接之间添加虚线分割 `border-t-2 border-dashed border-[var(--ink)]/15`
  - 输入框：去圆角 + `border-[var(--hairline)]` + `placeholder:text-[var(--muted)]/50`
  - 主按钮：去圆角 + `hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98]`
  - 错误/成功提示、图标容器、验证码输入框、loading 条均去圆角
  - 法律链接上方新增短虚线分割，色彩统一用 CSS 变量
  - 四种模式（login/signup/verify/logged-in）全部改造一致

- **BottomAppNavbar 改版**（`components/navigation/BottomAppNavbar.tsx`）：
  - 主导航条：`rounded-full` → 直角矩形；`bg-white/70 backdrop-blur-xl` → `bg-[var(--surface-card)]/80 backdrop-blur-xl`；加 `shadow-[0_4px_20px_rgba(0,0,0,0.20)]`
  - 搜索按钮合并进主条（从独立圆形按钮改为第 4 个 NavItem）
  - NavItem 之间新增竖向虚线分隔 `border-l-2 border-dashed border-[var(--ink)]/15`
  - NavItem active 去圆角
  - Profile 弹出托盘：直角+穿孔条+虚线分割+纯色米色+投影；操作按钮去圆角；退出按钮加 `active:scale-[0.98]`

- **UserMenu 改版**（`components/auth/UserMenu.tsx`）：
  - 触发按钮去圆角（方形图标按钮）
  - 弹出面板：`rounded-[20px]` → 直角+穿孔条+虚线+`bg-[var(--surface-card)]`+投影
  - 操作按钮、退出按钮去圆角

- **TopNavbar 改版**（`components/layout/TopNavbar.tsx`）：
  - 整条：`rounded-full` → 直角；`bg-[var(--surface-soft)]` → `bg-[var(--surface-card)]`；加投影
  - 品牌链接、NavLink、搜索链接全部去圆角
  - NavLink 之间新增竖向虚线分隔

- **ExploreTopNavbar 改版**（`components/layout/ExploreTopNavbar.tsx`）：
  - 搜索链接去圆角

- **SearchOverlay 改版**（`components/navigation/SearchOverlay.tsx`）：
  - 搜索输入框去圆角 + border 色统一
  - 清除按钮去圆角

- 验证：`npm run build` 零错误、`npm run lint` 零错误

### 2026-07-02 — PWA 开屏加载优化四连 + "最新"排序按钮修复

- **"最新"排序按钮修复**：
  - Bug：从 quiz 详情页返回 explore 时 `sortByLatest` 状态丢失（未同步到 URL）
  - 根因：`sortByLatest` 是纯内存 state，不像 `tab`/`range`/`internal` 那样走 URL param 持久化
  - 修复：新增 `latest=1` URL 参数，完全遵循 `internal=1` 的同步模式（服务端解析 → prop 传入 → state 初始化 → toggle 时写回 URL）
  - 文案改为"时间排序"，从时间 pills 行移到 Row 2（与"站内精选"同一行），缓解 pills 行拥挤
  - 改动文件：`app/explore/page.tsx`（+3 行）、`components/explore/ExploreClient.tsx`（~15 行）
  - Commit: `8731c37`

- **骨架屏 loading.tsx**：
  - 替换 `app/explore/loading.tsx` 的空 `<main>` 标签为完整骨架布局
  - 包含：问候语占位、TrendingCarousel 占位（3 张宽卡）、筛选 pills 行、9 张卡片网格
  - 使用 `animate-pulse` + `bg-[var(--ink)]/5`，与其他页面 loading 风格一致
  - Commit: `982af46`

- **Service Worker（PWA 专项）**：
  - 新增 `public/sw.js`（~90 行），策略：导航请求 stale-while-revalidate、静态资源 cache-first、API/Admin 路径 bypass
  - `app/layout.tsx` 注入注册脚本，仅生产环境启用（`hostname !== 'localhost'`）
  - 效果：PWA 二次启动秒开（缓存 HTML + 后台更新）、离线/弱网不报错
  - Commit: `a2b824d`

- **Middleware 跳过公开路由 auth 调用**：
  - 之前所有路由（含 /explore、/ 等公开页）都调用 `supabase.auth.getUser()`
  - 改为先判断路由类型：公开路由直接 `NextResponse.next()`，受保护路由才创建 Supabase 客户端并验证
  - 安全：受保护路由（/admin、/profile、/create）认证逻辑完全不变
  - 附带修复了 lint `prefer-const` 错误（第 5 行）
  - Commit: `191d1f0`

- **SWR 数据缓存层**：
  - `lib/cache.ts` 新增 `swrListQuery` 函数：缓存过期后立即返回旧数据 + 后台静默刷新，仅在彻底无缓存时才阻塞
  - `getExploreQuizCards` 和 `getPublishedTestSites` 改用 SWR（60s TTL + 300s SWR 窗口）
  - `getCategories` 保持 10min TTL 不变（不需要 SWR）
  - 已有 16 个测试全部通过，零回归
  - Commit: `a942ab2`

- **Net effect**：PWA 打开 explore 页面时，用户先看到骨架屏（感知提升），中间件零 auth 开销（省 50-200ms），缓存过期也不阻塞（直接给旧数据后台刷新），二次打开 Service Worker 缓存命中秒出

### 2026-07-02 — Hydration mismatch 修复 + 结果图片预加载 + Explore 滚动动画优化

- **Hydration mismatch 三处修复**：
  - `ExploreClient.tsx`：`Date.now()` 在 `filterByRange` 中导致 SSR/hydration 过滤结果不一致 → 加 `now` state，初始 0 时跳过过滤，`useEffect` 后更新
  - `ExploreClient.tsx`：`Math.random()` 在 `pickRandom` 中导致随机卡片顺序不一致 → 改为基于 `card.id + seed` 的 deterministic hash sort
  - `Greeting.tsx`：`useRef(Math.random())` 在 SSR/hydration 间值不同 → 改为 `useState({ type: "time" })` 确定性初始值 + `useEffect` 随机选择
- **结果图片预加载**：`QuizPlayer` 答题阶段 `new Image()` 静默预加载所有 result 的 `image_url`，share card 弹出时图片从缓存瞬间渲染
- **Explore 滚动感知进场动画**：从 [slug] 返回 explore 时不再从卡片 #0 开始 stagger，改为等 scroll 恢复后只对视口附近卡片播放动画（`scroll` 事件 + 300ms 兜底 timer）
- **Commits**: `a9a8fe3`

### 2026-06-30 — 弹窗去色 + 虚线分割 + EditableSlider 移动端触摸修复

- **区分度检查 / 因子覆盖检查弹窗**：移除 `accentColors` 自动取色背景和 inline 颜色计算，条目改用 CSS 变量（`var(--ink)` / `var(--muted)`）+ `border-b border-dashed` 虚线分割；覆盖检查 icon 改为语义色（green-500 / red-400）
- **EditableSlider 移动端触摸**：新增 `py-3` 触摸层 wrapper（触摸面积 6px → ~30px），pointer 事件从视觉轨道移到 wrapper，移除冗余 `e.preventDefault()`，新增 `onLostPointerCapture` 防止 capture 意外丢失
- **Commits**: `49551fa`

### 2026-06-30 — Explore 时间下拉布局修复

- **时间下拉菜单**：时间范围 pills 和「站内精选」toggle 从水平单行改为 `flex-col` 垂直两行布局，中间 `border-t` 分割，防止 pills 数量变化时溢出
- **Commits**: `c6cb7a5`

### 2026-06-28 — Explore 测验候选库扩充（quiz-scout agent 采集）

- **quiz-scout agent** 搜索并验证 30 个公开可访问的测验/测试候选
- 输出文档：`docs/explore-quiz-candidates-2026-06-28.md`，含完整 Markdown 表格
- 覆盖 17 个平台、10 个中文来源、6 个日韩来源、14 个国际来源
- 主题覆盖：人格/性格、审美/风格、恋爱/关系、趣味/娱乐、职业/工作、色彩/元素、动物/原型、心理/情感、友情、生活方式
- 全字段已中文化（name / description / long description / tags），描述 ≤15 中文字符
- 已排除需登录/付费/下载应用的候选

### 2026-06-26 — 卡片颜色全链路统一 + 自定义颜色 + 图片主色调提取 + 背景模糊移除

- **颜色链路统一**：`TestSiteDetail`、`QuizDetail` 顶部卡片颜色计算从 Client Component 上提到 Server Page，统一走 `testSiteToExploreCard` / `quizToExploreCard` mapper。`RelatedTestSites` 重写为 mapper + `TestCard` 组件，不再自算颜色。详情页与 /explore 颜色完全同步。
- **DB 自定义颜色**：`test_sites`、`quizzes` 表 `color` 列已接入全链路 —— 类型定义、SELECT 查询、mapper 优先逻辑（`color || nipponColorForSlug()`）。Admin 编辑表单新增颜色字段：hex 输入 + 原生取色器 + ↺恢复按钮 + 实时预览。两种表单（TestSiteForm、QuizEditForm）均已支持。
- **取色优先级（三级）**：① Admin 手动设置颜色 > ② quiz result 图片自带的颜色 > ③ hash 兜底（nipponColorForSlug）。`quizToExploreCard` 新增第 5 参数 `resultColor`，`fetchResultImages` / `getQuizDetail` / `getRelatedQuizzes` 同步取图+取色，保证同 index。
- **图片主色调提取**：新建 `lib/image-color.ts`，Canvas API 纯前端提取，过滤白/黑/灰/透明像素，取主色调后 HSL 调优（饱和度 -30%、明度 -15%）。`ResultCard` 上传图片后自动设置卡片颜色。
- **移除动态背景模糊**：删除 `ResultBackgroundManager` 组件，`QuizPlayer` 移除 `intermediateRanking` useMemo 及关联导入。做题过程不再有背景模糊。
- **Commits**: `6a4e4db` `43cfa9b` `ba0081e` `359ad4e` `a6db968` `fe441c1` `6df6531` `5e1cd8d`

### 2026-06-25 — 站外测试录入梳理 + 封面图修复 + 上线任务收尾

- **站外测试录入系统梳理**：产出 `docs/external-test-site-data-spec.md`，完整记录 test_sites / test_categories 29 个字段的类型、必填、用途、展示影响、数据流。发现 7 个已知问题（1 已修复、6 待处理）。
- **封面图修复**：`lib/explore/mapper.ts` — `testSiteToExploreCard()` 的 `image` 从硬编码 `""` 改为 `site.coverImageUrl ?? ""`，站外测试卡片现在显示封面图。
- **法律页面路由**：`app/privacy/page.tsx`、`app/terms/page.tsx`、`app/disclaimer/page.tsx` 确认已存在，标记完成。
- **Migration 016**：标记已手动执行。
- **Lint 现状**：65 problems（20 errors / 45 warnings），34 文件。Errors 全部来自 React Compiler 插件。待评估修复优先级。

### 2026-06-24 — 安全修复 + 法律文档 + 上线准备

- **C-S1 修复**：`app/api/quiz-studio/save/route.ts` 添加所有权验证（复用 sandbox 路由模式）
- **H-S2 修复**：8 个 API 路由 / 11 处 `error.message` 泄露替换为通用错误
- **H-S4 修复**：新增 migration 016，quizzes INSERT RLS 限制 `status = 'draft'`
- **法律文档**：`docs/terms-of-service.md`、`docs/privacy-policy.md`、`docs/content-disclaimer.md`
- **LegalModal**：`components/legal/LegalModal.tsx`，小票风格弹窗，集成到 `/login`
- **SearchOverlay 修复**：搜索框移动端适配 + 结果区滚动 + 空白区点击关闭 + 结果卡片直角纯色
- **robots.txt 清理**：删除 `public/robots.txt`（与 `app/robots.ts` 冲突）
- **TASKER_STATUS 同步**：C-S1/C-S2/C-S3 状态更新

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

### 🟢 已处理（原上线阻断）

| ID | 问题 | 处理 | 日期 |
|----|------|------|------|
| C-S1 | 测验保存无所有权验证 | ✅ 已修复 | 2026-06-24 |
| C-S2 | RLS 状态名不匹配 | 降级为功能 bug（publish 正常） | 2026-06-24 |
| C-S3 | 密钥泄露 | 风险接受 | 2026-06-24 |

### 🟠 已知异常

- **限流器**：仅内存版，Vercel 多实例不可靠。生产需 Upstash Redis
- **CSP**：`unsafe-inline` + `unsafe-eval` 实际禁用 XSS 防护
- **Migration 016**：`harden_quiz_insert_rls.sql` 需在 Supabase SQL Editor 手动执行
- **6 高风险安全问题待修**：H-S1/H-S3/H-S5/H-S6/H-S7/H-S8（详见 `docs/security-audit-report.md`）
- **test-sites/[id] 顶部卡片 hydration 颜色误差**：设置自定义颜色后 SSR/客户端渲染不一致（Framer Motion 与 RelatedTestSites 组件树冲突），待修复

---

## Unfinished Tasks

### 🔴 上线前（1 项）

1. ~~创建 `/privacy` `/terms` `/disclaimer` 法律页面路由~~ ✅ 已完成（2026-06-25）
2. ~~Migration 016 手动执行（Supabase SQL Editor）~~ ✅ 已完成（2026-06-25）
3. Lint 错误清理（65 problems: 20 errors + 45 warnings，34 个文件，含 `create/page.tsx`）

### 🟠 高优先级（4 项）

4. 截图上传添加 MIME 类型/大小验证（H-S3）
5. 存储桶上传添加按用户文件夹隔离 + DELETE 策略（H-S7）
6. 移除 CSP `unsafe-inline` / `unsafe-eval`（H-S8）
7. 提交未提交文件变更

### 🟡 中优先级（5 项）

8. 限流器迁移到 Upstash Redis
9. CSRF 保护（Origin/Referer 头验证）
10. 16/20 路由添加限流
11. 生产环境日志脱敏（79 处 console 审计）
12. `ensure_user_credits` RPC search_path 修正

### 🟢 低优先级（12 项）

13. 删除未使用的 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
14. 添加 `check_username_available` RPC
15. `user_profile` 软删除（GDPR）
16. Vercel Analytics / Speed Insights
17. 首页添加视觉内容（当前纯文字）
18. 评估 `animation-demo.html` 用途
19. **图片懒加载 CLS 修复**：`test-card.tsx` 的 result image 缺 `width`/`height`，加 `aspect-square` 占位消除布局偏移
20. **TrendingCarousel 图片预加载**：首帧图片在 hydration 后才开始加载可能闪白，服务端 `<link rel="preload">` 预加载前 3 张
21. **Supabase 查询去重**：`getExploreQuizCards` 和 `getCategories()` 都查 categories 表，可复用
22. **Greeting 组件请求优化**：mount 后才调 `getUser()` 导致用户名闪一下才显示，可服务端预取传入 prop
23. **部分预渲染（PPR）/ ISR**：explore 页面静态化 + 定时 revalidate（需解决 cookie 依赖问题）
24. **Supabase 连接池 / Edge 部署**：冷启动 + 连接建立延迟优化

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
