# TASKER STATUS

Last updated: 2026-07-11

---

## Current State

SelfIDBox 处于**上线前收尾阶段**。核心用户流程全链路通。卡片颜色系统已完成全链路统一。Quiz Studio 图片上传（sharp 压缩 + Vercel 部署）已修复。

**探索页排序修复**：站外测评点击权重降为 0.15×，冷启动加成从 2× 降为 1.3×，站内 Quiz 排序权重有效提升约 10×。

**Quiz Studio UX 多项优化**（Step 2-5）：trait 输入回车自动开新框、移除废弃分享文案输入框、深度滑块左侧标签修正、因子名称不可编辑、选项标签自动重新编号。

**PWA 自定义图标**：替换为项目自有 logo。

**资源加载策略分析**：已完成全链路审查，识别 Profile 无 LIMIT 查询 + 图片直连 Supabase 两大风险。

**当前阻塞**：无。test-sites/[id] 顶部卡片 hydration 颜色误差待修复（根因：Framer Motion SSR 与 RelatedTestSites 组件树冲突，暂缓）。

**下一步**：lint 错误清理 → 生产上线。

---

## Uncommitted Changes

所有近期改动已提交并推送至 `v1-release` 分支。

---

## Recent Progress (Last 30 Days)

### 2026-07-09 — Quiz Studio 步骤帮助弹窗重写 + PWA 下载引导弹窗

- **Quiz Studio 帮助弹窗重写**（`bab0292`）：
  - Step 1（QuizMetaCard）新增 `stepDescription` prop 透传，补充帮助图标和弹窗
  - Step 3（影响因子）补充缺失的 `description` → 帮助图标和弹窗
  - QuizStyleControls（题目风格偏好）新增 `description` prop + `CircleHelp` 按钮 + 弹窗，与 StepLabel 风格一致
  - Step 2/4/5 的 `description` 文本全部重写，串联 AI 生成数据依赖链路：
    - Step 1 标题是主题锚点 → Step 2 AI 围绕标题生成结果人格（名称不可为泛化性格标签）
    - Step 2 结果人格 traits + Step 3 因子维度 → Step 4 AI 分配 0-100 结果向量
    - Step 1 标题 + Step 2 结果 + Step 3 因子 + Step 4 向量 + 上方 6 个风格滑块 → Step 5 AI 生成题目
  - 弹窗样式调整：去掉 `rounded-2xl` 圆角 → 直角；文本上下各加一条虚线分割线
  - 改动的 3 个文件：`app/create/page.tsx`、`components/quiz-engine/QuizMetaCard.tsx`、`components/quiz-engine/QuizStyleControls.tsx`

- **PWA 下载引导弹窗**（`2779790`）：
  - 新建 `components/PwaDownloadModal.tsx`（188 行），完全复用小票设计语言（打孔点、虚线分割、直角面板、`surface-soft` 背景）
  - 三个 tab（iOS / Chrome / Edge）切换，与 LegalModal tab 样式一致
  - 每个平台 4 步教程 + 1 个完成提示，使用编号圆圈 + 纯文本
  - 底部导航栏 `BottomAppNavbar.tsx` Profile 菜单："数据来源"下方新增虚线分割 + "下载APP"按钮
  - 入口极简（纯文本按钮，与"数据来源"风格一致），弹窗位于 `z-50` 遮罩层

- 验证：`npm run lint` 零错误，`npm run build` 零错误，`npm run test` 16/16 通过

### 2026-07-11 — 探索页排序权重修复 + Quiz Studio UX 多项优化 + 资源加载策略分析

- **探索页排序权重修复**（`086e2fc`）：
  - 根因：站外点击与站内答题使用同一 `computeHeatScore` 公式，冷启动加成（2×）对新增站外内容过于激进，QUIZ_HEAT_BOOST（1.5×）远不足以反映两种行为之间的用户投入差异
  - 修复 `lib/explore/sort.ts`：冷启动加成斜率 0.5 → 0.15（最大 2× → 1.3×）
  - 修复 `lib/explore/mapper.ts`：站外 `popularity_score` × `TEST_SITE_CLICK_WEIGHT`（0.15）；新增常量注释
  - 效果：相同互动次数下，站内 Quiz 排序权重约为站外的 10×（1/0.15 × 1.5）

- **Quiz Studio UX 多项优化**（之前 session）：
  - Step 2 手动添加结果卡片默认标题从 `"新结果"` 改为空白（`app/create/page.tsx:487`）
  - Step 2 trait 输入：Enter 保持输入框打开供连续输入（`EditableChipList.tsx` — `commit(keepOpen)`)
  - Step 2 移除废弃的分享文案输入框（`ResultCard.tsx` — 删 7 行 UI，数据管线保留）
  - Step 2 深度滑块左侧标签 `"偏好"` → `"浅显"`（`QuizStyleControls.tsx:24`）
  - Step 3 因子名称从 `InlineEditableInput` 改为纯文本（`FactorList.tsx` — 16 维度固定不可编辑）
  - Step 5 添加/删除选项后自动重新编号为 A/B/C...（`QuestionEffectsCard.tsx` — `.map((opt,i) => label(i))`）

- **PWA 图标替换**：`public/icons/` 下 icon-192/icon-512/maskable-512 三个文件替换为项目自定义 logo

- **资源加载策略分析**（纯诊断，无代码改动）：
  - 识别两大风险：Profile 查询无 LIMIT（重度用户 TTFB 线性增长）+ 图片直连 Supabase Storage 无 CDN/压缩
  - 缓存/SWR/Service Worker 策略评价良好；字体零下载；公开路由 middleware 零开销

- 验证：`npm run lint` 零错误，`npm run test` 16/16 通过

### 2026-07-07 — Quiz Studio Step 2 图片上传 Vercel 部署 broken image 修复（三轮定位）

- **初始 Bug**：上传成功后返回 image_url，但 ResultCard 显示 broken-image 占位符。本地正常，Vercel 异常。
- **第一轮（CORS 假设，已回退）**：`<img>` 添加 `crossOrigin="anonymous"` + 调换 update/extractDominantColor 顺序。本地通过，Vercel 仍然 broken。
- **第二轮（Sharp 假设，已回退）**：添加 `serverExternalPackages: ["sharp"]` 防止 WASM 降级。Vercel 仍然 broken。
- **第三轮（诊断定位 — 真根因）**：添加 input/output 日志 + 上传后下载字节比对。发现：上传 30,650 字节 Buffer → Supabase → 下载 55,564 字节 → hex 显示 `0xB2→0xEF 0xBF 0xBD`（UTF-8 替换字符）。**根因**：Vercel Node.js `fetch()` 将 raw Buffer body 当作文本/UTF-8，> 0x7F 字节被替换为 U+FFFD。
- **最终修复**：
  - `app/api/upload-result-image/route.ts`：上传前将 Buffer 转 Blob（`new Blob([new Uint8Array(webpBuffer)])`），触发 Supabase JS client FormData 路径，避免 Buffer→text 编码问题。保留 WebP header 校验 + `resultId` 正则验证。
  - `next.config.ts`：添加 `serverExternalPackages: ["sharp"]`（保留，防止 sharp 原生二进制被 trace 排除）
  - `components/quiz-engine/ResultCard.tsx`：移除 `crossOrigin="anonymous"`（回退，DOM `<img>` 不需要 CORS）；保留 `update` 顺序调整 + `onError` handler
- 验证：`npm run lint && npm run build` 通过，Vercel 部署后上传正常显示

### 2026-07-06 — 清理 profile-summary 遗留代码

- 删除 `components/ProfileSummary.tsx`（死组件，无引用）
- 删除 `lib/prompts/profile-summary.ts`（AI prompt builder + DeepSeek API 调用，结果从未在 UI 展示）
- 清理 `lib/rebuild-user-profile.ts`：移除 `generateProfileLabel()`、两处 `generateAISelfidProfile()` AI 调用、`CORE_CN`/`SOCIAL_CN` 常量字典、DB upsert 中的 `selfid_profile`/`summary` 字段
- 清理 `lib/user-profile-db.ts`：`UserProfileRow` 接口移除 `selfid_profile`/`summary` 字段
- 简化 `app/profile/page.tsx`：`hasProfile` 改用 `hasCore || hasSocial` 判断
- 节省：每次 profile rebuild 不再调用 DeepSeek API
- 验证：`npm run build` 零错误，`npm run lint` 零问题，`npm run test` 16/16 通过

### 2026-07-06 — Safari/WebKit 专项优化（3 项 P0）

**1. 图片预加载优化**
- **问题**：iOS Safari 上 quiz 结束 → share card 自动弹出时，result image 未能及时加载，出现短暂空白（Chromium 正常）。根因：Safari 对 `new Image()` 预加载采用低优先级延迟解码 + 弱引用缓存，答题期间可能被驱逐。
- **新建 `lib/browser-detect.ts`**：UA-based Safari 检测（排除 Chrome/CriOS）。
- **增强 `QuizPlayer.tsx` 预加载**（仅 Safari）：双通道预热 —— `new Image()` + `.decode()` 强制完整解码，`fetch()` 独立预热 HTTP 缓存。
- **守卫 `QuizResult.tsx` auto-open**（仅 Safari）：等待 result image DOM 元素 `load` 事件后再弹出 share card，1.5s 超时兜底。

**2. iOS Safari `100vh` 修复**
- **问题**：iOS Safari 将地址栏高度计入 `100vh`，导致 28 处 `min-h-screen` 页面底部被地址栏遮挡。
- **CSS 层**：`@supports (-webkit-touch-callout: none)` 覆盖 `.min-h-screen` → `min-height: 100dvh`。
- **JS 层**：`QuizResult` 内联 `minHeight: "100vh"` → Safari 时用 `100dvh`。

**3. 模态框 body scroll lock**
- **问题**：iOS Safari 橡皮筋弹性滚动穿透 `position:fixed` 遮罩，share card / RotatingCardModal 弹出时 body 仍可滚动。
- **新建 `lib/use-safari-scroll-lock.ts`**：`position:fixed` + `top:-${scrollY}` 冻结 body（唯一可靠的 iOS Safari body lock 方式），解锁时恢复 scrollTop。
- **接入点**：`QuizResult` share modal + `RotatingCardModal`（覆盖 profile data source / OCR 卡片等所有模态框）。
- 性能审计 H-8 已修复。

**4. CoverFlow 滚动流畅度优化（仅 Safari）**
- **问题**：iOS Safari 上 CoverFlow 滑动有顿挫感。根因：(1) `updateStyles()` 中每帧对每张卡片调用 `getBoundingClientRect()` 造成布局颠簸；(2) `willChange: transform,opacity` 在每张卡片上创建独立 GPU 层，Safari GPU 内存预算不足。
- **`updateStyles()` 数学化**（仅 Safari）：用 `scrollLeft + clientWidth + 已知 cardWidth/sidePad` 计算卡片位置，替代所有 `getBoundingClientRect()` 调用，消除布局颠簸。
- **`willChange` 移除**（仅 Safari）：卡片 `style` 中 `willChange` 仅在非 Safari 时设置，减少 GPU 层数。

- 验证：`npm run build` 零错误，`npm run lint` 零问题，`npm run test` 16/16 通过。
- 设计文档：`docs/superpowers/specs/2026-07-06-safari-image-preload-optimization.md`

### 2026-07-03 — Login 页面忘记密码验证码化 + 底部导航条动画

- **验证码验证**：`verifyOtp({ email, token, type: "recovery" })` 验证 recovery 验证码
- **原地改密**：验证码通过后 `updateUser({ password })` 直接改密，无需邮件链接跳转
- **重发校验码**：`handleResendRecoveryCode` 再次调用 `resetPasswordForEmail`（Supabase `resend()` 不支持 `type:"recovery"`）
- **向后兼容**：保留 `reset` 模式 + `isRecovery` URL hash 检测，旧 magic link 邮件仍可使用
- **防邮箱枚举**：无论邮箱是否存在，始终显示相同成功消息
- **UI 约束**：新增 Phase 1（邮箱输入）/ Phase 2（验证码 + 新密码 + 确认密码），全部复用现有小票设计原语（验证码输入框、密码输入框、按钮、虚线分割、锯齿穿孔条），零 CSS 新增

- **底部导航条 icon 白色化**（`components/navigation/BottomAppNavbar.tsx`）：
  - NavItem 未激活：`text-[var(--muted)]` → `text-white/70 hover:text-white`
  - 搜索按钮：`text-[var(--muted)]` → `text-white/70 hover:text-white`
  - Navbar 背景保持 `bg-[var(--surface-card)]/10` 不变

- **Profile 菜单托盘出入场动画**：
  - 入场：从 navbar 上沿下方 `y: "100%"` → `y: 0`（spring: damping 26, stiffness 250），自下而上滑出
  - 出场：`y: 0` → `y: "150%"` 滑出屏幕外
  - 遮罩：`opacity: 0 ↔ 1`（duration 0.2s）
  - z-index 栈：遮罩 z-20 / 菜单 z-20（低于 navbar z-30，navbar 自然裁剪滑出部分）
  - 引入 `AnimatePresence` + `motion.div` / `motion.button`（项目已有 framer-motion 依赖，无新增库）

- 验证：`npm run build` 零错误

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

> 更早记录见 [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md)（2026-06-22 及更早）

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
