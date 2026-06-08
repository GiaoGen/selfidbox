# TASKER STATUS

Last updated: 2026-06-08

---

## Recent — 2026-06-08

### 词云接入真实数据 + 前端缓存

1. **API 新增**：`app/api/profile/word-cloud/route.ts` — GET，server supabase auth，查询 `quiz_attempts.final_result_name`，聚合计数后返回 `{ words: { label, count }[] }`。
2. **前端缓存**：`components/profile/useWordCloud.ts` — `useRef` 内存缓存（TTL 5min），再次点击直接打开，不重新请求。
3. **数据填充**：真实词 < 24 个时循环重复到 28 个，保持球体完整。重复项使用原始 count。
4. **空状态**：无 quiz_attempts 时显示 "完成几个 Quiz 后，这里会长出你的人格星球。"。
5. **不改**：旋转、光晕、drag、z-sort、Cover Flow、雷达图、数据库结构。

新增文件：
- `app/api/profile/word-cloud/route.ts` — 词云数据 API
- `components/profile/useWordCloud.ts` — 前端 fetch + 缓存 hook

修改文件：
- `components/profile/WordSphereModal.tsx` — 移除 mock 数据，接受 `words` prop，pad 逻辑，空状态
- `components/profile/ProfileInteractions.tsx` — 集成 useWordCloud，onClick → fetchWords + open modal

---

### 3D 词云球体：词语大小按 count 映射 + 加深光晕

1. **Mock 数据结构**：从 `string[]` 改为 `{ label, count }[]`，count 范围 2–9。
2. **字体大小映射**：线性映射 count → fontSize (13px–28px)，在 animate 循环中通过 `el.style.fontSize` 逐帧更新。
3. **加深光晕**：三层 text-shadow — 内层 6px rgba(255,255,255,0.85) + 中层 14px rgba(255,255,255,0.65) + 外层 28px rgba(180,220,255,0.45)。
4. **不改**：旋转、z-sort depth 效果、drag、弹窗交互、Profile 其他模块。

修改文件：
- `components/profile/WordSphereModal.tsx` — mock 数据、fontSize 计算、textShadow、animate 中 fontSize 更新

---

### 3D 词云球体弹窗（点击一句话摘要触发）

1. **入口**：点击 Profile 页面 `selfid_profile` 一句话摘要 → 全屏暗色 modal。
2. **Mock 数据**：23 个词（INFP、猫猫党、海王星…），使用 Fibonacci 球面均匀分布。
3. **3D 渲染**：自写球体投影（rotateX/rotateY → 2D 投影），按 z 深度排序 scale/opacity/zIndex。无 three.js，纯 CSS transform + RAF。
4. **交互**：默认慢速自转，pointer drag 跟随手势旋转，松手惯性衰减后恢复自转。`touchAction: none` 防止页面滚动。
5. **关闭**：点击暗色背景（rgba(0,0,0,0.85)）关闭，无关闭按钮。
6. **尺寸**：球体 `min(80vw, 360px)`，移动端居中，不撑满。
7. **样式**：白色文字 + `text-shadow: 0 0 8px rgba(255,255,255,0.55)`，暗色背景。
8. **性能**：RAF 动画在 modal 关闭时 cancel，DOM 直接操作不触发 React re-render。
9. **不改**：Cover Flow、雷达图、数据来源、数据库、Profile 聚合。

新增文件：
- `components/profile/WordSphereModal.tsx` — 3D 词云球体 modal

修改文件：
- `components/profile/ProfileInteractions.tsx` — 添加 `useState` + onClick → WordSphereModal

---

### 移除 Profile Summary 大卡片 → 一句话人格摘要

1. **删除**：`ProfileSummary` 大型渐变大卡片（含 SelfID Profile 标题、描述、数据来源按钮）。
2. **新增**：分割线 + 一句话人格摘要，直接作为页面内容，无卡片/背景/圆角容器。
3. **内容来源**：`user_profile.selfid_profile`（原先的大标题），不含数字分数。
4. **样式**：`text-center text-lg font-medium sm:text-xl`，`text-[var(--ink)]/80`，极简分割线 `border-[var(--ink)]/8`。
5. **空状态**：`selfid_profile` 为空时隐藏整个模块。
6. **不改范围**：Cover Flow、人格图谱、数据来源、页面其他部分。

修改文件：
- `components/profile/ProfileInteractions.tsx` — 替换 ProfileSummary + DataSourceModal 为 divider + 一句话文本

---

### Cover Flow 上下边界渐隐遮罩

1. **顶部/底部 fade overlay**：在 carousel wrapper 内添加两个 `absolute` overlay，高度 `h-8` (32px)，`pointer-events-none`。
2. **渐隐颜色**：使用 `var(--canvas)` (#fffaf0) → `transparent` 渐变，与 Profile 页面背景一致。
   - 顶部：`linear-gradient(to bottom, var(--canvas), transparent)`
   - 底部：`linear-gradient(to top, var(--canvas), transparent)`
3. **z-index 栈**：wrapper `relative z-0`（创建 stacking context），overlays `z-[1]`，卡片 z-index 由 `zAt()` 动态设置（1–10），仅在 Cover Flow 模块内部生效。
4. **不改范围**：核心布局参数（CARD_WIDTH, CARD_MAX_W, PREVIEW_SCALE, INNER_W, GAP）、scroll 逻辑、卡片尺寸、transformOrigin、overflow 行为、zAt 函数。

修改文件：
- `components/profile/CoverFlowSources.tsx` — 添加 wrapper `z-0` + overlay `z-[1] h-8`

---

### Cover Flow 卡片缩小 + 中心缩放/深度层级

### Cover Flow 卡片缩小 + 中心缩放/深度层级

1. **卡片缩小**：`CARD_WIDTH_VW=56` + `CARD_MAX_W=240`，预览卡片不再 1:1 原始大小。文件顶部 `CARD_WIDTH_VW` / `CARD_MAX_W` / `CARD_GAP` 三个常量可直接调大小。
2. **中心最大、两侧缩小**：scroll 事件监听 → rAF throttle → 计算每张卡片中心距 viewport 中心的归一化距离 `n`（0~2）→ `scale(1 - n*0.15)`。中心 `n=0 → scale=1`，第一侧 `n≈1 → scale=0.85`，更远 `n=2 → scale=0.7`。
3. **深度层级**：`opacity = 1 - n*0.175`（中心 1→侧 0.825→远 0.65），`translateY = n*10`（中心 0→侧 10px→远 20px），`zIndex = 100 - n*100`（中心最高）。
4. **性能**：rAF throttle 的 scroll handler 通过 ref 直接操作 DOM `style.transform/opacity/zIndex`，不触发 React re-render。`willChange: transform, opacity`。resize 监听同步重算。
5. **初始居中**：`paddingLeft/Right = calc(50vw - min(28vw, 120px))` 使首卡自然居中，结合 `scroll-snap-align: center`。
6. **不改范围**：弹窗（RotatingCardModal 全尺寸）、QuizResultShareCard 样式、数据过滤、空状态隐藏。

修改文件：
- `components/profile/CoverFlowSources.tsx` — 重写：缩小 + scroll-driven 层级

---

### Cover Flow 重做：原生 scroll-snap + 全屏宽度

1. **移除复杂逻辑**：删除 framer-motion drag physics、active index 计算、多层 transform 叠加、useMotionValue/animate、所有 Cover Flow scale/opacity 动画。代码从 ~250 行精简到 ~135 行。
2. **原生 scroll-snap**：`scroll-snap-type: x mandatory` + `scroll-snap-align: center`，浏览器原生吸附，无自定义 drag 逻辑。`scroll-smooth` + `WebkitOverflowScrolling: touch` 保证平滑滚动。
3. **全屏宽度**：`marginLeft/Right: calc(50% - 50vw)` 突破 Profile 主容器 `max-w-[960px] + px-4` 边界。卡片宽 `75vw`，左右露出相邻卡片提示可滑动。
4. **去掉外层容器**：不再有圆角矩形背景/边框/padding 包裹。卡片直贴屏幕边缘。
5. **分享卡片直出**：`QuizResultShareCard` 直接渲染在 75vw 容器中（无 scale 缩小、无 overflow-hidden、无圆角），保持原始比例和边缘。
6. **滚动条隐藏**：`app/globals.css` 新增 `.scrollbar-none` 工具类（`scrollbar-width: none` + `::-webkit-scrollbar display:none`）。
7. **不改范围**：数据过滤（quiz + image_url）、点击弹窗（RotatingCardModal）、空状态隐藏逻辑均保留。

修改文件：
- `components/profile/CoverFlowSources.tsx` — 完全重写（简化）
- `app/globals.css` — 新增 `.scrollbar-none`

---

### Profile 页面 Cover Flow 数据来源卡片展示

1. **CoverFlowSources 组件**：`components/profile/CoverFlowSources.tsx` — Apple Cover Flow 风格横向卡片轮播。中间卡片 scale(1)，两侧 scale(0.85)/scale(0.7)，opacity 递减。纯黑背景，无渐变无玻璃拟态。
2. **拖拽滑动**：framer-motion `drag="x"` + `useMotionValue` 实现拖拽滚动，松手自动 snap 到最近卡片。spring 动画过渡。
3. **卡片缩略**：Quiz source 使用 `QuizResultShareCard` + CSS `scale(0.4)` 缩小到 150×200 展示区；Report source 显示截图缩略图（object-contain）或"未保存原始截图"占位。底部渐变 fade 隐藏溢出文字。
4. **点击行为**：点击居中卡片 → 打开对应 modal（Quiz Share Card / OCR Screenshot，与数据来源列表行为一致）。点击两侧卡片 → snap 到该卡片。
5. **提取共享 hook**：`components/profile/useSourceCardOpen.ts` — 三层取数逻辑（source entry → detailCache Map → detail API）抽成可复用 hook。`DataSourceModal` 和 `CoverFlowSources` 共用，避免重复代码。
6. **集成**：`ProfileInteractions` 中 ProfileSummary 下方插入 `CoverFlowSources`，雷达图上方显示。
7. **空状态**：无数据来源时整个模块隐藏，不显示空状态文案。
8. **性能**：每侧最多渲染 ±3 张卡片（共 ≤7 张），超出范围 opacity=0。

修改文件：
- `components/profile/CoverFlowSources.tsx` — 新建：Cover Flow 轮播 + 卡片弹窗
- `components/profile/useSourceCardOpen.ts` — 新建：共享卡片打开 hook
- `components/DataSourceModal.tsx` — 改用共享 hook
- `components/profile/ProfileInteractions.tsx` — 插入 CoverFlowSources

---

## Recent — 2026-06-08

### Cover Flow UI 修正：背景/圆角/过滤

1. **模块背景**：`bg-black` → `bg-[var(--surface-card)]`，与雷达图卡片背景统一（`#f5f0e0`）。
2. **模块圆角**：添加 `rounded-[32px] shadow-[0_18px_50px_rgba(10,10,10,0.07)]`，与项目其他卡片统一。
3. **卡片缩略**：移除 `rounded-xl`（不再强制圆角），保留 `overflow-hidden`（scale 裁剪所需）。底部 fade 渐变从 `black` 改为 `#f5f0e0`（与背景融合）。
4. **数据过滤**：`filteredSources` 只保留 `source_type === "quiz" && image_url` 存在的条目。OCR source 不显示。无图片 Quiz 不显示。
5. **空状态**：`filteredSources.length === 0` 时隐藏整个模块。
6. **清理**：移除 `renderReportThumb`、`renderReportModal`、report RotatingCardModal，未使用的 `ReportDetailData` import。

修改文件：
- `components/profile/CoverFlowSources.tsx` — 背景/圆角/过滤/清理

---

## Recent — 2026-06-07

### Profile 数据来源弹卡片：预加载 + 缓存优化（秒开）

1. **`getProfileSources` 返回完整卡片数据**：`ProfileSourceEntry` 新增 `image_url`、`subtitle`、`description`、`traits`、`share_text` 可选字段。report 查询增加 `image_url` 列；quiz 查询增加 `quiz_results` 批量联表（一次 `.in("quiz_id", quizIds)` 取回所有 result 的 subtitle/description/image_url/traits/share_text），按 `quiz_id:key` 建 lookup map。
2. **三层取数（source → cache → API）**：点击 source item 时优先判断 source entry 是否已有卡片字段（`"traits" in entry` / `"image_url" in entry`），有则直接 normalize 打开（无 loading）；其次查 `detailCache` Map；两次命中都不发请求。只有 cache miss 才走 `/api/profile/source-detail`。
3. **前端缓存 Map**：`detailCache = useRef(new Map())`，key 为 `${source_type}:${id}`。同一条 source 第二次点击直接从 Map 取出，零请求。
4. **图片预加载**：数据来源弹窗打开后遍历 `sources`，`new Image().src = url` 非阻塞预加载所有 `image_url`。
5. **不改范围**：user_profile 聚合、删除逻辑、OCR 上传、Quiz Runtime、Quiz Studio、Supabase schema 均未修改。

修改文件：
- `lib/user-profile-db.ts` — ProfileSourceEntry 扩展 + reports 加 image_url + quiz_results 批量联表
- `components/DataSourceModal.tsx` — detailCache Map + 三层取数 + 图片预加载

---

### Profile 数据来源点击改为弹出视觉卡片

1. **复用分享卡片动画**：新建 `components/share/RotatingCardModal.tsx`，抽取 Quiz Runtime 中的 rotateY 翻转入场动效（perspective + rotateY(-720→0) + scale(0.9→1)），退出仅 fade out。用于 Quiz Share Card 和 OCR Screenshot Card。
2. **Quiz 数据来源点击**：`source_type = "quiz"` 时直接弹出 `QuizResultShareCard`（复用 `components/share/QuizResultShareCard.tsx`），卡片使用该 quiz_attempt 对应 result 数据。
3. **OCR 数据来源点击**：`source_type = "report"` 时弹出截图卡片，优先使用 `report.image_url`（object-contain，不裁切不变形），无 image_url 时显示"未保存原始截图"。
4. **补充 share_text 字段**：`lib/source-detail-db.ts` 中 `QuizDetailData` 新增 `result_share_text`，查询 `quiz_results` 时增加 `share_text` 列。
5. **删除旧入口**：`DataSourceModal` 不再触发 `SourceDetailModal`（组件文件保留未删），source item 点击改为 fetch detail → 弹出对应视觉卡片。
6. **不改范围**：user_profile 聚合、数据来源列表查询、删除逻辑、OCR 上传、Quiz Runtime、Quiz Studio、Supabase schema 均未修改。

修改文件：
- `components/share/RotatingCardModal.tsx` — 新建：可复用旋转卡片弹窗
- `components/DataSourceModal.tsx` — 替换 SourceDetailModal 为 RotatingCardModal + QuizResultShareCard / OCR Screenshot Card
- `lib/source-detail-db.ts` — QuizDetailData 新增 result_share_text，查询增加 share_text

---

## Recent — 2026-06-06

### Explore 轮播优化 + 分类/时间筛选紧凑化

1. **删除 dot 指示器**：`TrendingCarousel` 移除所有分页圆点。
2. **无限向前循环轮播**：最后一张→克隆→无缝跳回第一张，始终向前滚动，无回滚效果。实现方式：渲染 `[0..N-1, clone_of_0]`，滑到 clone 后 `scrollTo(0, instant)` 跳回。
3. **单卡显示**：外层 `section overflow-hidden` 裁剪 peek，每张卡片用 `w-full snap-center` 包裹，一次只显示一张。`TrendingCard` 移除 `snap-start`/`shrink-0`/`w-[85vw]`，改为 `w-full max-w-[420px]`。
4. **Categories chips 缩小**：`px-5 py-2.5 text-sm` → `px-3.5 py-1.5 text-[13px]`，gap `2` → `1.5`。
5. **时间筛选缩小**：`px-4 py-2` → `px-3 py-1.5`，"时间" 标签 `text-xs` → `text-[11px]`，gap `2` → `1.5`。

修改文件：
- `components/explore/TrendingCarousel.tsx` — 重写：无限循环 + 单卡显示 + 去掉 dots
- `components/explore/TrendingCard.tsx` — 移除 snap/shrink 类，w-full max-w-[420px]
- `components/explore/ExploreClient.tsx` — 缩小 Categories + 时间筛选

---

### TestCard 移除图片背景：普通卡片回归纯色 Nippon

1. **TestCard 移除 `backgroundImage`**：删除了 `hasImage`、`backgroundImage: url(${card.image})`、`backgroundSize`、`backgroundPosition`。普通列表卡片仅使用 Nippon 纯色 `bgColor`。
2. **图片背景仅限 TrendingCard**：`blur(16px)` 逻辑只存在于 `components/explore/TrendingCard.tsx`，所有其他卡片（热门列表/分类/搜索/quizzes/test_sites）不渲染任何图片背景。
3. **不改动范围**：数据查询、分类、搜索、Admin、Quiz Runtime、Quiz Studio 全部未变。

修改文件：
- `app/explore/_components/test-card.tsx` — 移除 hasImage + backgroundImage 逻辑

---

### TrendingCard 轮播背景修复：模糊图片不透出底层纯色

1. **Card root 背景条件化**：当 `hasImage` 时 `backgroundColor: "transparent"`，无图片时退回 Nippon `bgColor`。解决模糊图片边缘透出底层 Nippon 纯色的问题。
2. **Scale 增大**：`scale(1.08)` → `scale(1.12)`，确保模糊边缘不产生透明间隙。
3. **无遮罩**：图片层不加任何 overlay/gradient。
4. **不改动范围**：TestCard、分类筛选、搜索、Admin、Quiz Runtime、Quiz Studio 保持不变。

修改文件：
- `components/explore/TrendingCard.tsx` — 条件化 backgroundColor + scale 1.12

---

### Explore 色彩系统：稳定 Nippon Colors 接入

1. **稳定 hash 映射**：`lib/nippon-colors.ts` — 新增 `nipponColorForSlug(slug)` 和 `textColorForNipponBg(bg)`。同一个 slug 永远获得同一个 Nippon 颜色（`hash(slug) % NIPPON_COLORS.length`），不使用 `Math.random()`。
2. **ExploreCard 扩展**：`lib/explore/types.ts` — 新增 `bg_color`（hex）和 `text_color`（#1C1C1C / #FCFAF2）字段。
3. **Mapper 统一计算**：`lib/explore/mapper.ts` — `testSiteToExploreCard` 和 `quizToExploreCard` 各自调用 `nipponColorForSlug` + `textColorForNipponBg` 生成稳定颜色。
4. **TestCard 使用 Nippon 背景**：`app/explore/_components/test-card.tsx` — 移除 accent 硬编码类，改用 `card.bg_color` 作为 `backgroundColor`，文字/标签/芯片全部根据 `isDark` 自适应。
5. **TrendingCard 纯色背景**：`components/explore/TrendingCard.tsx` — 移除 5 种 gradient palette，改用 `card.bg_color` 纯色背景；内发光、标签、文字全部根据深浅自适应。

修改文件：
- `lib/nippon-colors.ts` — 新增 `nipponColorForSlug`、`textColorForNipponBg`
- `lib/explore/types.ts` — ExploreCard 新增 `bg_color` + `text_color`
- `lib/explore/mapper.ts` — 两个 mapper 计算颜色
- `app/explore/_components/test-card.tsx` — Nippon 背景 + 自适应标签
- `components/explore/TrendingCard.tsx` — 纯色 Nippon 背景替代渐变

---

### Explore 页面 UI 优化：carousel 修复 + source tag + estimated_time

1. **Carousel 自动切换不再滚动页面**：`TrendingCarousel.tsx` — `scrollIntoView()` 替换为 `scrollTo({ left })`，避免浏览器将 slide 滚动到视口时连带触发页面垂直滚动。
2. **Source tag 文案**：quizzes → "SelfIDBox"，test_sites → "站外"（TrendingCard + TestCard 同步修改）。
3. **Source tag 样式**：去掉背景色，纯文字，颜色根据卡片背景自适应（深色卡 `text-white/60`，浅色卡 `text-[#0a0a0a]/50`，图片卡统一 white）。
4. **Estimated time 位置**：TestCard 中 estimated_time 移至左上角，仅 test_sites（站外）显示；quizzes 不显示。
5. **卡片最终布局**：左上 = estimated_time（仅站外），右上 = 站外/SelfIDBox 标签，底部 = category + tags。

修改文件：
- `components/explore/TrendingCarousel.tsx`
- `components/explore/TrendingCard.tsx`
- `app/explore/_components/test-card.tsx`

---

### Fix Explore 分类筛选不显示 quizzes

**Root cause**: `ExploreCard.category_id` 类型不一致导致 `filterByTab` 匹配失败。
- `filterByTab` 用 category **slug**（如 "personality"）与 `card.category_id` 做比较
- `testSiteToExploreCard` 设置 `category_id: null` → 永远不匹配
- `quizToExploreCard` 设置 `category_id: quiz.category_id`（UUID）→ 永远不匹配 slug
- 结果：主 Explore 页的分类 tab 过滤对 test_sites 和 quizzes 都不生效（只有 "热门" tab 能显示）

**Fix**: 统一 `ExploreCard.category_id` 为 category slug，与 tab ID 对齐。
1. `lib/explore/mapper.ts` — `testSiteToExploreCard`: `category_id` 从 `null` 改为 `site.category`（slug）；`quizToExploreCard`: 新增 `categorySlug` 参数，`category_id` 使用 slug 而非 UUID
2. `lib/explore/fetch.ts` — `getExploreQuizCards` 和 `getExploreQuizCardsByCategory` 都从 catMap 提取 slug 传给 `quizToExploreCard`
3. `components/explore/ExploreClient.tsx` — `filterByTab` 改用 `String()` 比较防止类型差异，添加 debug console.log
4. `app/explore/page.tsx` — 添加服务端 merge 日志
5. `app/explore/_components/category-page.tsx` — 添加服务端 merge 日志

修改文件：
- `lib/explore/mapper.ts`
- `lib/explore/fetch.ts`
- `components/explore/ExploreClient.tsx`
- `app/explore/page.tsx`
- `app/explore/_components/category-page.tsx`

---

### Fix Explore → UGC Quiz 跳转：新增 Quizzes 详情页

1. **Explore Card href 修正**：`lib/explore/mapper.ts` — `quizToExploreCard` 的 href 从 `/quiz/[slug]` 改为 `/quizzes/[slug]`，不再直接跳答题页。
2. **Quiz Detail 数据查询**：`lib/quizzes-db.ts` — 新增 `getQuizDetail(slug)` 查询已发布 quiz + category join；新增 `getRelatedQuizzes(categoryId, excludeSlug)` 取同类已发布 quiz 最多 3 条。
3. **QuizDetail 组件**：`components/QuizDetail.tsx` — 复用 TestSiteDetail 布局结构（nav / hero / pills / description / related）。Hero 使用 accentFromId 派生背景色。Badge 显示「社区 Quiz」+ 分类 + 类型。主按钮「去做这个测试」链接到 `/quiz/[slug]` 答题页。Pills 显示 attempt_count 和发布时间。Related 区域展示同类其他 quiz。
4. **路由页面**：`app/quizzes/[slug]/page.tsx` — server component，调用 `getQuizDetail` + `getRelatedQuizzes`，notFound 处理非 published quiz。
5. **Loading 骨架**：`app/quizzes/[slug]/loading.tsx` — 与 test_sites 一致的 loading 占位。

用户路径修正为：Explore → `/quizzes/[slug]` 详情页 →「去做这个测试」→ `/quiz/[slug]` 答题页。

新增文件：
- `components/QuizDetail.tsx`
- `app/quizzes/[slug]/page.tsx`
- `app/quizzes/[slug]/loading.tsx`

修改文件：
- `lib/explore/mapper.ts` — quiz href 改为 `/quizzes/[slug]`
- `lib/explore/types.ts` — ExploreCard.href 注释同步更新
- `lib/quizzes-db.ts` — 新增 `getQuizDetail`、`getRelatedQuizzes`、`QuizDetailRow`、`QuizDetailRelatedRow`

---

### Explore 接入已发布 Quizzes

### Explore 接入已发布 Quizzes

1. **Unified ExploreCard Model**：`lib/explore/types.ts` — 统一卡片类型，字段：`id`、`source_type`（official/community）、`href`、`title`、`description`、`image`（cover_image_url）、`category_id`、`categoryLabel`、`featured`、`popularity_score`、`created_at`、`tags`、`estimatedMinutes`、`accent`。
2. **Mapper**：`lib/explore/mapper.ts` — `testSiteToExploreCard()` 映射 test_sites（source_type=official），`quizToExploreCard()` 映射 quizzes（source_type=community）。Quiz accent 由 id hash 确定性生成。
3. **Unified Fetch**：`lib/explore/fetch.ts` — `getExploreQuizCards()` 并行查 published quizzes + categories，内存 join 标签；`getExploreQuizCardsByCategory(slug)` 按分类过滤。使用 `listQuery` 缓存 60s。
4. **Explore 主页**：`app/explore/page.tsx` — test_sites + quizzes 合并为 `ExploreCard[]`，统一排序（featured → popularity_score → created_at），trending 区也混合显示。
5. **分类页**：`app/explore/_components/category-page.tsx` — 同步引入 `getExploreQuizCardsByCategory`，test_sites 和 quizzes 混合在同一分类下，统一排序。
6. **TestCard**：支持 `ExploreCard` prop。显示 source badge（"官方" 紫色 / "社区" 绿色）。有 `image` 时使用 cover image 背景 + 暗色叠加层；无 image 时使用 accent 纯色背景。Quiz 无 `estimatedMinutes`/`tags` 时优雅降级。
7. **TrendingCard**：支持 `ExploreCard` prop。显示 source badge。Quiz 无 `popularity_score` 时不显示 🔥。
8. **ExploreClient**：全部 `TestSite` 类型替换为 `ExploreCard`。搜索覆盖 title + description + tags + categoryLabel。`filterByTab` 按 `category_id` 过滤（quiz 和 test_site 使用同一 `test_categories`）。导航：test_sites → `/test-sites/[id]`，quizzes → `/quiz/[slug]`。

新增文件：
- `lib/explore/types.ts` — ExploreCard 类型 + accent 工具
- `lib/explore/mapper.ts` — TestSite/Quiz → ExploreCard 映射
- `lib/explore/fetch.ts` — 统一查询 + 缓存

修改文件：
- `app/explore/page.tsx` — 合并 quizzes，统一排序
- `app/explore/_components/test-card.tsx` — ExploreCard prop，source badge，cover image 背景
- `app/explore/_components/category-page.tsx` — 合并 quizzes 到分类
- `components/explore/ExploreClient.tsx` — ExploreCard 替代 TestSite
- `components/explore/TrendingCard.tsx` — ExploreCard prop，source badge

未改动：Quiz Runtime、Quiz Studio、Profile、OCR、Auth、Admin。

### Admin → Quizzes 管理模块

1. **DB Migration**：`supabase/migrations/add_quiz_metadata_fields.sql` — quizzes 表新增 `description`、`cover_image_url`、`category_id`（FK → test_categories）、`featured` 四个字段。
2. **Admin Quiz 列表页**：`app/admin/quizzes/page.tsx` — 支持 title 模糊搜索、状态筛选（All/Draft/Sandbox/Submitted/Published/Archived tabs）、默认 created_at desc 排序。表格列：Title、Status、Attempts、Category、Featured、Created、Edit/Delete 操作。
3. **Admin Quiz 编辑页**：`app/admin/quizzes/[id]/edit/page.tsx` + `form.tsx` — 编辑 title、description、cover_image_url（含预览）、category_id（下拉选择）、featured、status。不碰 questions/results/factors（由 Quiz Studio 管理）。
4. **数据层**：`lib/admin-db.ts` 新增 `AdminQuizRow` 类型、`getAdminQuizzes()`、`getAdminQuizById()`、`updateQuizMetadata()`、`deleteQuiz()`、`getAdminQuizStats()`。
5. **Sidebar**：AdminSidebar "内容管理" 分组下新增 "Quizzes" 入口。
6. **Dashboard**：新增 Quizzes 统计行（Quizzes/Published/Sandbox/Submitted）+ QuickLink "管理 Quizzes"。
7. **StatusBadge**：新增 `sandbox`（紫，`#b8a4ed`）和 `submitted`（青，`#81C7D4`）状态色。
8. **Quiz Studio**：`QuizMetaCard` 新增 description（textarea）和 cover_image_url（input）可编辑字段。`QuizMeta` type 新增 `description?`、`cover_image_url?`、`category_id?`、`featured?`。`saveQuizSchema` / `updateQuizSchema` 写入新字段。

新增文件：
- `supabase/migrations/add_quiz_metadata_fields.sql`
- `app/admin/quizzes/page.tsx`
- `app/admin/quizzes/[id]/edit/page.tsx`
- `app/admin/quizzes/[id]/edit/form.tsx`

修改文件：
- `lib/admin-db.ts` — 新增 Quiz admin 查询函数 + 类型
- `lib/quizzes-db.ts` — save/update 写入新 metadata 字段
- `lib/mock-quiz-engine.ts` — QuizMeta 新增 4 个可选字段
- `components/admin/StatusBadge.tsx` — 新增 sandbox/submitted
- `components/admin/AdminSidebar.tsx` — 新增 Quizzes 导航
- `app/admin/page.tsx` — Dashboard 新增 Quiz stats + quick link
- `components/quiz-engine/QuizMetaCard.tsx` — 新增 description + cover_image_url 编辑

未改动：Explore、Quiz Runtime、OCR、Auth、Profile。

### Quiz Runtime UI 简化 — Top1 单图背景 + 去掉标题纯色 + 选项轻量化

1. **背景改为 Top1 单图**：`ResultBackgroundManager` 从多图叠加（Top4/Top3/Top2 递减）简化为始终只显示当前排名第一的 result 图片。一张 `fixed` 模糊图（`blur(40px) scale(1.15) opacity(0.4)`）+ `rgba(255,255,255,0.75)` 遮罩。Top1 变化时通过 `AnimatePresence` key 切换做 600ms crossfade。无图片时返回 null。
2. **去掉标题纯色背景**：QuizPlayer 标题区域从 `rounded-[28px]` 随机 Nippon 纯色卡片改回干净的文本布局（`text-[var(--muted)]` + `text-[var(--ink)]` + `text-[var(--body)]`），恢复原始简洁风格。
3. **选项选中态轻量化**：`OptionButton` 选中态从 accent color 纯色填充改为 `bg-[var(--ink)]/6 text-[var(--ink)] shadow-md`（6% 淡灰底 + 阴影），badge 从 `rgba(255,255,255,0.2)` 改为 `bg-[var(--ink)]/12`。移除 `accentColor`/`accentText` props（OptionButton、QuestionCard、QuizPlayer 三层全部清理）。

保留：选项无描边、Result 页面 blur 背景、Share Card 逻辑、答题流程。

修改文件：
- `components/quiz-runtime/ResultBackgroundManager.tsx` — 简化为单图 crossfade，移除多图/权重/递减逻辑
- `components/quiz-runtime/QuizPlayer.tsx` — 标题区去纯色背景、停止传 accent 给 QuestionCard
- `components/quiz-runtime/QuestionCard.tsx` — 移除 accentColor/accentText props
- `components/quiz-runtime/OptionButton.tsx` — 移除 accent props，选中态改为淡灰底+阴影

### 动态人格显影背景（Result Reveal Background）

1. **`ResultBackgroundManager`**：新增组件，在答题过程中根据中间排名动态渲染模糊结果图片作为页面背景。`fixed inset-0 z-0 pointer-events-none`。
2. **中间排名计算**：`QuizPlayer` 新增 `useMemo` 计算中间排名——每答一题后从 `answers.slice(0, currentIndex)` 计算当前 user vector → 排名。初始（0 题）使用默认 all-50s vector。
3. **渐进收敛**：根据剩余题数逐步减少背景图数量：剩余 ≥3 → Top4，剩余 =2 → Top3，剩余 =1 → Top2。完成后进入 Result 页面，背景由 QuizResult 接管。
4. **加权透明度**：Top1=0.45, Top2=0.30, Top3=0.17, Top4=0.08。不是平均分布。
5. **性能限制**：最多同时渲染 4 张 `<img>`，通过 `AnimatePresence` 按 `result.id` key 管理挂载/卸载，fadeIn/fadeOut 各 800ms easeInOut。相同图片只改变 opacity，不重新加载。
6. **可读性遮罩**：所有背景图上方统一 `rgba(255,255,255,0.75)` 遮罩，保证题目/选项/进度条永远可读。
7. **无图片降级**：跳过没有 `image_url` 的 Result，使用下一张有图片的。如果 Top4 都没有图片，返回 null，保持当前页面背景。

新增文件：
- `components/quiz-runtime/ResultBackgroundManager.tsx` — 动态背景管理器

修改文件：
- `components/quiz-runtime/QuizPlayer.tsx` — 引入 `useMemo`，计算 `intermediateRanking`，渲染 `ResultBackgroundManager`，内容区加 `relative z-10` 确保在背景之上

未改动：答题逻辑、结果计算、Result 页面、Share Card、数据库、AI。

### Quiz Result 页面背景优化 — 图片模糊背景 + 主图完整显示 + Share 遮罩加深

1. **Result 页面图片模糊背景**：当 `finalResult.image_url` 存在时，页面底层叠加 `fixed inset-0` 的图片高斯模糊层（`blur(48px) scale(1.15)`）+ 轻微暗色遮罩 `bg-black/25` 保证氛围感。无图片时保持原样。
2. **Result 主图修复**：去掉 `rounded-3xl` 圆角容器、`border`、`shadow`；去掉 `aspect-[4/3] object-cover` 强制裁切 → 改为 `object-fit: contain max-height: 360px`，保持原始比例完整显示。
3. **内容可读性**：文字区域（similarity badge → sync）包裹在 `bg-white/70 rounded-[24px] p-5` 半透明遮罩内，轻量不厚重，文字 `var(--ink)` 深色在模糊背景上清晰可读。无图片时无遮罩。
4. **Share Modal 遮罩加深**：从 `bg-black/60` → `bg-black/80`，更明显区分 Result 页面和 Share Card，避免两层模糊背景视觉重叠。

修改文件：
- `components/quiz-runtime/QuizResult.tsx` — 新增模糊背景层 + 暗色 overlay；主图改为 `object-contain` 无圆角；内容包裹半透明遮罩；Share modal backdrop 加深

未改动：答题逻辑、result 计算、Share Card 内部、数据库、Profile、Studio。

### Quiz Result Share Card 移动端优化 — 无圆角 + 模糊背景 + rotateY 翻转动画

1. **手机端卡片尺寸**：卡片 `max-width: calc(100vw - 48px)`，左右保留 24px 间隙，不溢出、不被截断。卡片填满容器宽度，竖版海报比例。
2. **卡片无圆角**：`borderRadius: 0`，分享卡片本体是直角矩形。弹窗遮罩、关闭按钮保留圆角。
3. **有图片时模糊背景**：当 `image_url` 存在时，卡片底层叠加一张 `filter: blur(40px) scale(1.15) opacity(0.45)` 的绝对定位大图，上面覆盖半透明 `cardColor` 遮罩保证文字可读。前景图仍 `object-fit: contain`，不裁切不变形。
4. **无图片时**：纯色背景（cardColor），无占位图，使用无图片排版。
5. **rotateY 翻转入场**：动画从 `rotateZ`（平面旋转）改为 `rotateY(-720deg)`（绕竖直轴翻转两圈），父容器 `perspective: 1200px` 提供 3D 深度，duration 1100ms，ease 顺滑。
6. **退出无旋转**：关闭时只 `opacity: 0`（200ms），不 rotate。
7. **保存图片精准**：`cardRef` 仍在卡片本体，`toPng` 不包含遮罩/按钮。

修改文件：
- `components/share/QuizResultShareCard.tsx` — `borderRadius: 0`；`width: 100%`；新增模糊背景层 + 半透明遮罩；内容包裹在 `relative z-10` 层
- `components/quiz-runtime/QuizResult.tsx` — 动画 `rotate`→`rotateY`；`perspective: 1200px`；退出仅 `opacity`；`maxWidth: calc(100vw - 48px)`

### Quiz Result Share Card 重构 — 全屏分享弹窗 + 旋转动画 + 主题色卡片

1. **分享弹窗重新设计**：移除旧的 bottom-sheet/modal 面板（标题"分享结果"、关闭按钮、双按钮栏），改为纯暗背景 + 居中卡片 + 弱化关闭按钮（右上角半透明 X）+ 保存按钮在卡片下方。
2. **旋转入场动画**：卡片从 `rotate(-720deg) scale(0.85)` 旋入到 `rotate(0deg) scale(1)`，duration 900ms，framer-motion ease curve。退出反向旋转 360deg。用户第一眼看到的是卡片本身。
3. **图片完整显示**：`object-fit: contain`，`maxHeight: 260px`，无裁切、无圆角、无变形，保持原始比例。
4. **无图片布局**：不再显示默认占位 SVG。无图片时结果名称更靠上、spacer 更大（24px vs 8px）、share_text 字号提升、description 区域自然扩展。
5. **卡片背景色**：使用 `useNipponTheme().accent`（Nippon random accent color），通过 `textColorFor()` 自动计算所有文字颜色（深色背景白字/浅色背景黑字）。fallback 到 Nippon theme color。
6. **保存图片精准截取**：`cardRef` 仍然挂在 `QuizResultShareCard` 上，`toPng` 只捕获卡片本身，不包括遮罩、关闭按钮、保存按钮。
7. **卡片内容保留**：quiz title、result name、subtitle、description、image_url、traits、share_text、SelfIDBox 全部真实数据。

修改文件：
- `components/share/QuizResultShareCard.tsx` — 完全重写，新增 `cardColor` prop，动态文字颜色，双布局（有图/无图）
- `components/quiz-runtime/QuizResult.tsx` — `accentColor` prop，分享弹窗改为全屏 overlay + 旋转动画
- `components/quiz-runtime/QuizPlayer.tsx` — 传 `accentColor={theme.accent}` 给 QuizResult

未改动：答题逻辑、result 计算、Supabase schema、Quiz Studio、Profile、OCR。

### Quiz Runtime UI 优化 — 选项无描边 + Nippon 主题标题 + 主题色选中态

1. **去掉选项卡片描边**：移除所有 `border`/`ring`/`outline`，选项卡片改为纯白背景 + 轻微阴影（idle）/ 主题色填充（selected）。
2. **Quiz 标题区域加 Nippon 主题背景**：标题卡片使用随机 Nippon Colors 纯色背景，大圆角（28px），文字颜色根据背景亮度自动切换黑/白（WCAG `textColorFor`）。页面刷新时重新随机，页面生命周期内固定。
3. **选项选中态使用主题色**：选中态不再是固定的 `var(--ink)` 黑色，而是当前随机 theme accent color，文字颜色由 `textColorFor(accent)` 自动适配。
4. **统一 `useNipponTheme()` hook**：新建 `components/quiz-runtime/useNipponTheme.ts`，复用 `lib/nippon-colors.ts` 和 `lib/random-theme.ts` 的 `textColorFor`。SSR-safe（初始值 `#DAC9A6`，mount 后替换），不 fetch 外部文件。
5. **QuizPlayer 接管标题渲染**：标题区域从 server component (`page.tsx`) 移至 client component (`QuizPlayer`)，与 theme hook 共享同一个 theme 实例。

修改文件：
- `components/quiz-runtime/useNipponTheme.ts` — 新增，shared random Nippon theme hook
- `components/quiz-runtime/OptionButton.tsx` — 移除 border，新增 `accentColor`/`accentText` props，选中态 inline style
- `components/quiz-runtime/QuestionCard.tsx` — 新增 `accentColor`/`accentText` props，透传 OptionButton
- `components/quiz-runtime/QuizPlayer.tsx` — 接入 `useNipponTheme()`，渲染主题标题卡片，清理未使用的 framer-motion imports
- `app/quiz/[slug]/page.tsx` — 移除旧静态标题 div，`<a>` 改为 `<Link>`（lint fix）

未改动：答题逻辑、结果计算、数据库、Profile、Share Card、Supabase schema。

### AI Quiz Studio UI 优化 #10 — Step 5 选项卡片隐藏 Vector Chips

1. **选项卡片默认隐藏 vector chips**：编辑模式下不再显示因子 chip + number input，预览模式下不再显示非零 effect chip。选项卡片仅保留：字母、文本、删除按钮、右下角 Vector 编辑按钮。
2. **Vector 数据保留**：effect 数据不被删除，Vector 编辑弹窗仍然可用，不影响保存和 AI 生成。
3. **清理死代码**：移除 `getEffectStyle`、`isLight`、`getFactorName`、`formatDelta`、`updateEffect` 五个仅用于 chip 渲染的 helper。

修改文件：
- `components/quiz-engine/QuestionEffectsCard.tsx` — 移除编辑态 chip + number input、预览态 chip 列表、5 个死 helper

### AI Quiz Studio UI 优化 #9 — Vector 弹窗颜色匹配 + 按钮移位 + Carousel 居中

1. **Vector 弹窗颜色匹配**：每条 factor slider 行现在复用选项卡片上对应 chip 的颜色（`accentColors[efIdx % n]`），不再使用统一色。
2. **去掉旧 Vector 指示图标**：移除 option card 左下角的 Sliders 按钮。
3. **Vector 编辑按钮移至右下角**：新按钮使用 `SlidersHorizontal` 图标，绝对定位 `absolute right-2 bottom-2`，不与删除按钮（top-2）冲突。
4. **Carousel 数字居中**：Result 和 Question 导航数字圆形按钮统一添加 `leading-none`，修复垂直偏位问题。

修改文件：
- `app/create/page.tsx` — Option Vector Editor Modal 每行独立取色、Result/Question 导航 dots 加 leading-none
- `components/quiz-engine/QuestionEffectsCard.tsx` — Sliders → SlidersHorizontal、Vector 按钮从 bottom-left 移到 absolute right-2 bottom-2

### AI Quiz Studio UI 优化 #8 — Step 5 重构：题目文本自动换行 + Option Vector Editor

1. **Step 标题简化**：「题目与选项影响」→「题目」
2. **Question 文本 textarea 化**：替换 InlineEditableInput 为 `<textarea>`，自动换行不横向滚动，高度随内容自动增长（useEffect + scrollHeight）。
3. **Option 文本 textarea 化**：同上，使用 `onInput` handler 实现 auto-resize。
4. **Option Vector 按钮**：每个 Option Card 左下角新增 Sliders 图标按钮（h-6 w-6 圆形），点击打开向量编辑弹窗。
5. **Option Vector Editor Modal**：与覆盖检查弹窗风格一致（bottom sheet 移动端 / 居中卡片桌面端，半透明遮罩点击关闭）。
   - 显示当前选项的所有因子效果
   - 布局：因子名（w-20 truncate）| range slider（-5~+5, step=1）| 数值（右对齐 tabular-nums）
   - 拖动 slider 实时更新 effect 值
   - Slider track 使用渐变显示当前位置
6. **Effect 范围扩大**：因子效果从 [-3, +3] 扩展到 [-5, +5]，步长 1。`updateEffect` 钳位和 number input min/max 同步更新。
7. **不改动**：Question Carousel、AI 生成逻辑、Prompt、Factor 逻辑均未触及。

修改文件：
- `app/create/page.tsx` — Step 5 标题改为「题目」、新增 optionVectorEditor state、QuestionEffectsCard 传入 onOptionVectorClick、新增 Option Vector Editor Modal
- `components/quiz-engine/QuestionEffectsCard.tsx` — 移除 InlineEditableInput 依赖、question/option 文本改用 auto-resize textarea、新增 Sliders Vector 按钮、effect 范围 [-5, +5]

### AI Quiz Studio UI 优化 #7 — Step 6 隐藏 + 覆盖检查入口 + 导航优化

1. **Step 6 隐藏 + 覆盖检查入口**：移除独立的「题目覆盖检查」Step 卡片。在 Step 5（题目与选项影响）标题栏右侧增加覆盖检查状态圆形按钮（AI 生成按钮左侧）。
   - 绿色 Check：全部覆盖
   - 黄色 AlertTriangle：部分覆盖不足
   - 红色 AlertCircle：覆盖严重缺失
   - 灰色 Minus：暂无数据
2. **覆盖检查 Modal**：点击状态按钮打开（与区分度 Modal 相同模式）。内容仅保留覆盖检查结果列表，纯色 Nippon 背景，无描边，无标题/解释/分隔线。底部未覆盖因子汇总框同步显示。
3. **导航数字区域横向滚动**：Result Carousel 和 Question Carousel 的数字圆点区域改为 `overflow-x-auto` + `flex-1`，大量数字时可横向滑动，不撑爆布局。
4. **导航按钮只保留箭头**：所有 ← → 按钮从文字标签（「上一题」「下一个」等）改为纯箭头，按钮从 `h-8 px-3` 缩小为 `h-7 w-7` 圆形。
5. **无跳号**：Step 编号 1-5 连续（Step 5 题目与选项影响为最后一个 Step）。

修改文件：
- `app/create/page.tsx` — 新增 covStatus/CovIcon/covColor/covLabel、Step 5 header 增加覆盖按钮、移除 Step 6 section + CoverageValidator import、新增 coverage modal、Result/Question/Vector 三处导航重构（scrollable dots + arrow-only buttons）
- `components/quiz-engine/CoverageValidator.tsx` — 不再被页面直接引用（保留组件以备将来复用）

### AI Quiz Studio UI 优化 #6 — Step 5 隐藏 + 区分度入口 + 编号顺延

1. **隐藏 Step 5 主卡片**：移除页面上独立的「结果区分度检查」Step section。区分度计算逻辑保留，仍在 `validateResultDistances` 中运行。
2. **Step 4 增加区分度状态按钮**：在「结果向量」标题右侧、AI 生成按钮左侧，增加圆形状态图标按钮。
   - 绿色 Check：区分度良好
   - 黄色 AlertTriangle：部分结果较接近
   - 红色 AlertCircle：区分度较差（相似度 ≥ 85%）
   - 灰色 Minus：结果不足（< 2 个）
3. **点击打开 Modal**：固定定位 bottom sheet（移动端）/ 居中卡片（桌面端），半透明遮罩点击关闭，内容 max-h-[75vh] 可滚动。
4. **Modal 内容**：只保留距离较近/区分度良好的结果对列表，纯色 Nippon 背景，无描边，无 Step 标题/解释/分隔线。空状态显示「至少需要 2 个结果才能检查区分度」。
5. **Step 编号顺延**：原 Step 6 → 新 Step 5，原 Step 7 → 新 Step 6。CoverageValidator 内部序号同步更新。

修改文件：
- `app/create/page.tsx` — 移除 Step 5 section、移除 DistanceValidator import、新增 DiscIcon/discColor/discLabel 状态计算、Step 4 header 增加状态按钮、新增 discrimination modal、Step 6/7 重编号
- `components/quiz-engine/CoverageValidator.tsx` — header 序号 7→6

### AI Quiz Studio UI 优化 #5 — 移除描边 + Step 解释折叠 + 帮助 Popover

1. **Step 5 & Step 7 移除描边**：删除所有 `border` class 和 `borderColor`/`itemBorder` style。只保留纯色背景 + 圆角，视觉更干净。
2. **Step 解释默认隐藏**：所有 `StepDesc` 从页面中移除。页面默认更紧凑。
3. **帮助图标**：StepLabel 新增 `description` prop，有描述时标题右侧显示 `CircleHelp` 图标（小尺寸、低视觉权重）。
4. **点击查看 Popover**：点击帮助图标弹出解释卡（`fixed` 底部定位 + 全屏透明遮罩），Mobile-first 的小卡片设计，含「关闭」按钮。
5. **QuizMetaCard StepLabel 同步更新**：Step 1 的 Mini StepLabel 同样支持帮助图标。

修改文件：
- `components/quiz-engine/DistanceValidator.tsx` — 移除 border + borderColor
- `components/quiz-engine/CoverageValidator.tsx` — 移除 border + itemBorder
- `app/create/page.tsx` — StepLabel 重写（CircleHelp + Popover）、StepDesc 移除、描述文本上移为 StepLabel prop
- `components/quiz-engine/QuizMetaCard.tsx` — StepLabel 同步更新 + 新增 useState/CircleHelp import

### AI Quiz Studio UI 优化 #4 — Step 5 & Step 7 纯色背景

1. **Step 5 距离区分度检查**：所有 item 统一使用一个 Nippon 纯色背景（`accentColors[5]`）。移除 `${warnColor}15`/`${goodColor}15` 等半透明背景，改用 solid color + `getReadableTextColor()` 确保文字可读。close/distinct pairs 通过 section header 区分。
2. **Step 7 题目覆盖检查**：所有覆盖提醒 item 统一使用一个 Nippon 纯色背景（`accentColors[2]`）。移除 `${coveredColor}15`/`${uncoveredColor}15` 半透明背景。图标颜色自适应明暗，check/X 路径描边自动反差。底部未覆盖汇总框也同步使用纯色。
3. **无 rgba/blur/glassmorphism**：两个 Step 均不再使用任何半透明、模糊或玻璃效果。

修改文件：
- `components/quiz-engine/DistanceValidator.tsx` — 新增 `getReadableTextColor` + 纯色 item 背景 + 自适应文字
- `components/quiz-engine/CoverageValidator.tsx` — 新增 `getReadableTextColor` + 纯色 item 背景 + 图标自适应

### AI Quiz Studio UI 优化 #3 — Carousel、选项字母、全卡片颜色

1. **Question Header**：删除左侧黑色圆形数字，保留 "Question N" 文本左对齐。
2. **选项字母 A/B/C/D**：放大为 `text-xl font-bold`，移除黑色圆形背景，使用 `items-center` 垂直居中，视觉权重更高。
3. **Step 2 Result Carousel**：从多列网格改为单卡片轮播。顶部 ← 上一个 | 数字圆点 | 下一个 → 导航。支持按钮切换，删除时自动调整索引。
4. **Step 4 Vector Carousel**：同步 Step 2 的 `resultIndex`，切换 Result 时 Vector 自动跟随。导航中间显示当前 Result 名称。
5. **Vector Card 全卡片颜色**：从左侧小边条改为整张卡片使用 Result Color 背景。`getReadableTextColor()` 自动判断所有文字颜色（黑/白），按钮、badge、slider 轨道自适应明暗。Slider 保持黑色。
6. **联动**：Step 2 和 Step 4 共享 `resultIndex` 状态，切换任一即同步。

修改文件：
- `components/quiz-engine/QuestionEffectsCard.tsx` — 删除数字圆 + 放大选项字母
- `components/quiz-engine/ResultVectorCard.tsx` — 全卡片背景色 + 自适应文字
- `app/create/page.tsx` — resultIndex 状态 + Step 2/4 轮播导航

### AI Quiz Studio UI 优化 #2（纯 UI，不改逻辑）

## Recent — 2026-06-04

### AI Quiz Studio UI 优化 #2（纯 UI，不改逻辑）

1. **RangeSelector 可读性修复**：移除 `inverted` 对颜色的影响。
   - 轨道背景固定白色 `#fff`
   - 未选中数字固定黑色 `var(--ink)`
   - 选中态：黑色圆形背景 + 白色数字（保持不变）
   - 移除 mouseEnter/mouseLeave hover 逻辑，简化代码
   - 不再受 Step 背景颜色深浅影响
2. **Step Header 改用纯数字**：从骰子符号改回纯数字，无圆形背景。
   - 数字字号与标题一致（`text-xl font-semibold`）
   - 数字颜色与标题一致（浅色背景 `var(--ink)`，深色背景白色）
   - 移除 DICE 映射常量

修改文件：
- `app/create/page.tsx` — RangeSelector 重构 + StepLabel 重写
- `components/quiz-engine/QuizMetaCard.tsx` — Mini StepLabel 同步更新

### AI Quiz Studio UI 优化（纯 UI，不改逻辑）

1. **Step 5 空状态**：删除「至少需要 2 个结果才能进行区分度检查」提示卡片。结果不足时 DistanceValidator 返回 null，保持干净空状态。
2. **Step 4 Result Name 可读性**：`ResultVectorCard` h3 标题新增 `getReadableTextColor()` 函数，根据卡片背景自动选择 `#1a1a1a` 或 `#ffffff`，确保 Result Name 始终可见。
3. **Step Header 骰子符号**：将黑色圆形数字 ①②③④⑤⑥ 替换为 Unicode 骰子面 ⚀⚁⚂⚃⚄⚅，7+ 不显示符号。
4. **移除黑色圆背景**：骰子符号无背景圆，使用 40-50% 透明度与标题对齐，风格更轻盈。

修改文件：
- `components/quiz-engine/DistanceValidator.tsx` — 删除不足 2 结果时的提示卡片，直接 return null
- `components/quiz-engine/ResultVectorCard.tsx` — 新增 `getReadableTextColor()` + h3 inline style
- `app/create/page.tsx` — StepLabel 重构：DICE 映射 + 骰子符号 + 移除黑色圆背景
- `components/quiz-engine/QuizMetaCard.tsx` — StepLabel 同步更新

### AI Quiz Studio — Flat Design（消除嵌套卡片，纯色扁平化）

- **消除所有嵌套卡片**：移除 Step 外框 → 内框 → 内容框 的三层嵌套结构。每个 Step 现在是一个完整的纯色背景卡片，所有内容（Header / Divider / Description / Controls / Content）直接放在同一个 section 内。
- **Step 1**：QuizMetaCard 本身即为 Step 卡片，StepLabel 通过 `stepNumber`/`stepLabel` props 内嵌到 QuizMetaCard 顶部
- **Step 2–6**：每个 Step 使用 `<section>` + Nippon 纯色背景，内部无额外卡片包装。说明文字、RangeSelector、内容网格全部平铺
- **Step 7**：CoverageValidator 支持 `noCard` 模式，内容由外层 Step section 提供背景
- **QuizStyleControls**：移除自身白色卡片包装，由外层 section 提供 Nippon 纯色背景；支持 `inverted` prop 控制文字颜色
- **FactorList**：新增 `noCard` prop，隐藏时内容直接继承父容器背景
- **颜色系统重构**：
  - Step 背景：每个 Step 独立随机 Nippon 纯色（solid，非 tinted）
  - 按钮：统一 `bg-[var(--ink)]` 黑色 + 白色文字
  - AI 生成按钮：黑色背景 + 白色文字
  - 添加按钮：黑色 `+`
  - Step Number 圆圈：黑色背景
  - RangeSelector 选中态：黑色
  - Slider 轨道：统一黑色（不再使用随机 accentColor）
  - 不再使用绿色/渐变色
- **暗色背景自适应**：`isLight()` 函数判断 Nippon 色亮度 → 浅色背景使用深色文字，深色背景使用白色文字
- **Hydration 修复**：`useNipponTheme` 使用 SSR_DEFAULT → `useEffect` 客户端随机化模式，避免 Math.random() 在 SSR 阶段执行
- **修改文件**：
  - `app/create/page.tsx` — 主题 hook 重构（9 个独立 bg）、StepSection/AIGenerateBtn/AddBtn/StepDivider/StepDesc 辅助组件、所有 Step 平铺渲染
  - `components/quiz-engine/QuizMetaCard.tsx` — 新增 `stepNumber`/`stepLabel` props + `isLight` 自适应
  - `components/quiz-engine/QuizStyleControls.tsx` — 移除自身卡片包装 + `inverted` prop
  - `components/quiz-engine/FactorList.tsx` — 新增 `noCard` prop
  - `components/quiz-engine/CoverageValidator.tsx` — 新增 `noCard` prop + 集成 StepLabel
  - `components/quiz-studio/EditableSlider.tsx` — 新增 `inverted` prop + 黑色轨道/thumb
  - `components/quiz-engine/SaveQuizButton.tsx` — 默认 fallback 从 `#b8a4ed` 改为 `#0a0a0a`

- **未修改**：AI 逻辑、Quiz Runtime、Profile、OCR、Explore、Auth、数据库结构、业务逻辑

---

## Recent — 2026-06-03 (evening)

### AI Quiz Studio — Nippon Colors UI（纯色日式杂志风）

- **Nippon Colors 颜色系统**：从 `Nippon_Colors.md` 提取全部 250 个传统日色 HEX，建为本地静态数组；`useNipponTheme()` hook 使用 `useState` lazy init 在页面刷新时随机抽取 3 个颜色（`hero`/`accent`/`accentAlt`），本次页面生命周期内固定
- **Hero 卡片简化**：删除副标题、说明文字、操作 icon grid；仅保留 `AI Quiz Studio` 标题 + 右侧 Library icon 按钮（打开 MyQuizzesModal）；背景改为 Nippon 纯色（hero color @ 10% opacity）
- **Step 统一卡片**：新增 `StepCard` 组件 — 所有 Step 1–7 包裹在统一的大圆角（28px）纯色背景卡片中（accent color @ 8% opacity），内含 Header / Divider / Controls / Description / Content
- **QuizMetaCard**：从渐变色改为纯色背景；新增可选 `bgColor` prop，传入时使用 Nippon 色，未传入时回退到原渐变色（Quiz Runtime 不受影响）
- **添加按钮**：全部 "+ 添加" / "+ 添加因子" / "+ 添加选项" 改为仅 "+"；按钮宽度同步缩小为 `h-8 w-8` 圆形
- **AI 生成按钮**：新增 `AIGenerateButton` 组件 — 从渐变色改为 Nippon 纯色背景；保留大小、位置、loading spinner 和 hover/active 效果
- **RangeSelector 紧凑化**：padding 从 `p-0.5` 缩为 `p-px`，chip padding 从 `px-2 py-0.5` 缩为 `px-1.5 py-0`，字体从 `text-xs` 缩为 `text-[10px]`，max-width 缩小；Question Count + Options Per Question 现在可并排显示
- **EditableSlider**：新增可选 `accentColor` prop — 传入时 active track fill + thumb 使用 Nippon 颜色，未传入时回退到 `currentColor`（Quiz Runtime 不受影响）
- **QuizStyleControls**：接收 `accentColor` 并传递给 EditableSlider
- **FactorList / CoverageValidator**：新增可选 `bgColor` prop，传入时使用 Nippon 色背景
- **SaveQuizButton**：新增可选 `accentColor` prop，"发布试玩版" 按钮从渐变色改为 Nippon 纯色
- **Step Number**：`StepLabel` 新增可选 `color` prop，数字圆圈使用 Nippon 色
- **Question 导航圆点**：选中态使用 Nippon accent 色
- **Nippon Colors 应用范围**：Hero Card ✓ / Step 背景 ✓ / Step Number ✓ / AI 按钮 ✓ / 添加按钮 ✓ / Slider Active Track ✓ / Chip Selected State ✓ / 发布按钮 ✓

- **修改文件**：
  - `app/create/page.tsx` — 几乎所有 UI 重写：新增 `NIPPON_COLORS` 数组（250 色）、`useNipponTheme` hook、`StepCard` 组件、`AIGenerateButton` 组件、`StepLabel` 增强、`RangeSelector` 紧凑化 + 颜色支持、所有 Step 使用 StepCard 包裹
  - `components/quiz-engine/QuizMetaCard.tsx` — 新增可选 `bgColor` prop
  - `components/quiz-engine/QuizStyleControls.tsx` — 新增可选 `accentColor` prop，传递至 EditableSlider
  - `components/quiz-engine/FactorList.tsx` — 新增可选 `bgColor` prop；添加按钮改为 "+"
  - `components/quiz-engine/CoverageValidator.tsx` — 新增可选 `bgColor` prop
  - `components/quiz-engine/SaveQuizButton.tsx` — 新增可选 `accentColor` prop
  - `components/quiz-studio/EditableSlider.tsx` — 新增可选 `accentColor` prop

- **未修改**：AI 逻辑、Quiz Runtime、Profile、OCR、Explore、Auth、数据库结构、业务逻辑

---

## Recent — 2026-06-03

### AI Quiz Studio — Quiz Style Controls（全局风格变量）

- **新增 4 个全局风格控制变量**（0–100 无极 Slider）：
  - `abstractness`（抽象度：真实 ←→ 抽象）— 影响 Question、Result、Description
  - `seriousness`（严肃度：搞怪 ←→ 严肃）— 影响 Question、Result、Share Text
  - `depth`（深度：轻松 ←→ 深度）— 影响 Question
  - `poeticness`（文艺度：直白 ←→ 文艺）— 影响 Result Description、Share Text

- **新文件**：
  - `components/quiz-engine/QuizStyleControls.tsx` — 4-slider 卡片 UI 组件，复用 `EditableSlider`
  - `supabase/migrations/add_quiz_style_controls.sql` — 4 columns（integer default 50）

- **修改文件**：
  - `lib/mock-quiz-engine.ts` — 新增 `QuizStyleControls` 接口 + `DEFAULT_STYLE` 常量
  - `app/create/page.tsx` — QuizState 新增 4 字段；`updateStyle` handler；传递到 Results/Questions API 和 SaveQuizButton；渲染 QuizStyleControls 卡片（Step 1 下方）
  - `lib/quizzes-db.ts` — SaveQuizInput 新增 4 可选字段；saveQuizSchema / updateQuizSchema 写入；getQuizForEdit 读取
  - `app/api/quiz-ai/generate-results/route.ts` — 接收 4 参数；System Prompt 新增 STYLE CONTROLS 段；User Message 新增风格参数块
  - `app/api/quiz-ai/generate-questions/route.ts` — 同上，接收参数并写入 Prompt

- **未修改**：Quiz Runtime、Profile、OCR、Explore、Auth、Factors API、Result Vectors API

---

## Recent — 2026-06-02

### AI Quiz Studio — 生成数量范围扩展

- **替换 `CountSelector` → `RangeSelector`**（`app/create/page.tsx`）
  - 接受 `min` / `max` / `value` / `onChange`，自动生成连续整数选项
  - 水平可滚动容器（`overflow-x-auto`，隐藏滚动条），`max-w-[260px] sm:max-w-[360px]`
  - 小 pills 保持 `shrink-0` 不换行，超出区域自然滚动
  - 风格与原有 `CountSelector` 完全一致（`rounded-full bg-[var(--ink)]/6` + 白色选中态）

- **数量范围更新**：

  | 模块 | 旧范围 | 新范围 | 默认值 |
  |------|--------|--------|--------|
  | 结果人格 (Results) | 4, 6, 8 | 4–16 | 6 |
  | 影响因子 (Factors) | 4, 5, 6, 8 | 4–16 | 5 |
  | 题目数量 (Questions) | 6, 8, 10, 12 | 4–20 | 8 |
  | 选项数量 (Options) | 3, 4 | 2–6 | 4 |

- **参数传递**：所有 AI API 调用自动使用最新 state 值（无需额外修改）

- **未修改**：AI Prompt、Quiz Runtime、OCR、Profile、Explore、Auth、Supabase schema

### Profile — 数据来源详情页（Source Detail Modal）

- **新建 `lib/source-detail-db.ts`** — `getSourceDetail(userId, sourceType, id)`
  - `ReportDetailData`：report_type, main_result, created_at, input_type, image_url, normalized_summary, core_vector, social_vector
  - `QuizDetailData`：quiz_title, quiz_slug, final_result_name/key, result_subtitle/description/image_url/traits, user_vector
  - Quiz detail 自动 JOIN `quizzes` 和 `quiz_results` 获取标题、slug、结果详情

- **新建 `app/api/profile/source-detail/route.ts`** — GET
  - `?source_type=report|quiz&id=...`
  - auth check → 401；数据不存在 → 404

- **新建 `components/profile/SourceDetailModal.tsx`** — 全屏 Modal
  - 顶部：返回箭头 + "数据来源详情" 标题
  - 内容可滚动，最大宽度 640px 居中
  - 风格与 DataSourceModal 一致（`bg-[#fffaf0]`）
  - 根据 source_type 渲染 ReportDetail 或 QuizDetail

- **新建 `components/profile/ReportDetail.tsx`**
  - 测评类型 / 结果 / 时间 / 来源标签（截图导入）
  - OCR 原图大图预览（有图）/ "未保存原始截图"（无图）
  - OCR Summary（normalized_summary，无则"暂无摘要"）
  - 核心人格维度：名称 + 进度条 + 数值，支持 `{value}` 和 `DimOut` 两种格式
  - 社交人格维度：同上

- **新建 `components/profile/QuizDetail.tsx`**
  - Quiz 标题 / 结果名称 / 副标题 / 描述
  - 结果图片（如有）
  - Traits 标签列表
  - "重新查看结果" 按钮 → `/quiz/[slug]`

- **修改 `components/DataSourceModal.tsx`**
  - 每条 source row 可点击 → 打开 SourceDetailModal
  - 新增 `detailSource` 状态
  - 点击内容区域（不触发 swipe），传递 source_type + id

- **交互流程**：
  ```
  Profile → 数据来源弹窗 → 点击任意 row → Source Detail Modal（全屏）
                                                      ├─ Report Detail
                                                      └─ Quiz Detail
  ```

- **未修改**：OCR、Quiz Runtime、Quiz Studio、Auth、Explore、Supabase schema

### Quiz Studio — 编辑功能（复用现有 Studio）

- **新增 `lib/quizzes-db.ts` — `getQuizForEdit(quizId, userId)`**
  - 读取 quizzes + quiz_results + quiz_factors + quiz_questions + quiz_options
  - 返回 `SaveQuizInput` 格式，可直接 setState 到 Quiz Studio
  - 内置 ownership 校验（`creator_user_id !== userId` → null）

- **新增 `lib/quizzes-db.ts` — `updateQuizSchema(input, quizId)`**
  - 更新 quizzes 行（title, hook, slug 等）
  - 删除旧 sub-rows：quiz_options → quiz_questions → quiz_results → quiz_factors
  - 重新插入当前 state 的所有 sub-rows
  - slug 冲突 → 抛错

- **新增 `app/api/quiz-studio/edit/route.ts`** — GET
  - `?quiz_id=xxx`
  - auth + ownership（`getQuizForEdit` 内置）→ 404 if not found/not owner

- **修改 `app/api/quiz-studio/save/route.ts`**
  - body 新增可选 `quizId` 字段
  - `quizId` 存在 → `updateQuizSchema()`（编辑模式）
  - `quizId` 不存在 → `saveQuizSchema()`（新建模式）

- **修改 `app/create/page.tsx`**
  - 从 `useSearchParams()` 读取 `quiz_id`
  - `quiz_id` 存在 → `useEffect` 调用 `/api/quiz-studio/edit` 加载数据到 state
  - Hero 区域显示 "✎ 编辑模式 — 正在编辑 Quiz"
  - Save 区域新增 "← 返回创建模式" 按钮（`router.push("/create")` 清空参数）
  - 包裹在 `<Suspense>` 中（Next.js 16 `useSearchParams` 要求）
  - 传递 `editMode` + `editQuizId` 给 `SaveQuizButton`

- **修改 `components/quiz-engine/SaveQuizButton.tsx`**
  - 新增 props：`editMode`、`editQuizId`
  - 编辑模式：按钮文字 "确认编辑" / "更新中..." / "编辑已保存" / "重试编辑"
  - 编辑模式不显示 slug + "发布试玩版" 按钮（保存后仍可发布）
  - body 中携带 `quizId` 触发服务端 update path

- **修改 `components/quiz-runtime/MyQuizzesModal.tsx`**
  - 滑动操作新增 "编辑" 按钮（violet `Pencil`，最左侧第一个）
  - 适用于 draft / sandbox / submitted
  - 点击 → `router.push(/create?quiz_id=xxx)` → 关闭弹窗

- **编辑流程**：
  ```
  MyQuizzesModal → 左滑 → 编辑 → /create?quiz_id=xxx
  → 加载数据到 state → 编辑 → 确认编辑 → POST /api/quiz-studio/save { quizId, ... }
  → updateQuizSchema → 删除旧数据 + 重新插入
  ```

- **未修改**：Quiz Runtime、OCR、Profile、Explore、Auth、AI Generation、Studio 结构

### Quiz Studio — 滑动操作 + submitted 状态 + 删除

- **新建 `supabase/migrations/add_submitted_status.sql`**
  - 更新 `quizzes.status` CHECK constraint 加入 `submitted`：`draft | sandbox | submitted | published | archived`

- **新建 `components/quiz-runtime/QuizSwipeActionRow.tsx`**
  - 通用 swipe-to-reveal 组件，参考 Profile 的 `SwipeToDeleteSourceRow` 交互
  - `overflow-hidden` 容器 + 多个 action button 藏在右后方
  - framer-motion `drag="x"` + spring 动画
  - 按钮从右向左排列，支持 `hidden`/`disabled` 控制
  - 父组件通过 `isOpen`/`onOpenChange` 管理单行展开

- **新建 `app/api/my-quizzes/status/route.ts`**：POST
  - auth + ownership 校验
  - 状态转换规则：`draft → sandbox`，`sandbox → draft | submitted`，`submitted` 不可回退
  - 非法转换 → 400

- **新建 `app/api/my-quizzes/delete/route.ts`**：POST
  - auth + ownership 校验
  - 逐级删除：`quiz_attempt_answers → quiz_attempts → quiz_options → quiz_questions → quiz_results → quiz_factors → quizzes`

- **重写 `components/quiz-runtime/MyQuizzesModal.tsx`**
  - 每条 Quiz 用 `QuizSwipeActionRow` 包裹
  - 按状态动态生成操作按钮：
    - `draft`：试玩（蓝 `Play`）+ 删除（红 `Trash2`）
    - `sandbox`：隐藏（灰 `EyeOff`）+ 提交审核（橙 `Send`）+ 删除
    - `submitted`：仅删除
    - `published`/`archived`：无操作按钮
  - 状态切换即时更新本地列表
  - 删除即时移除行
  - 操作反馈区（红色错误提示）

- **状态流转图**：
  ```
  draft ⇄ sandbox → submitted → (管理员) → published
                    ↘ archived
  ```

- **未修改**：Quiz Runtime、OCR、Profile、Auth、AI Generation、Explore

### Quiz 发布系统 — sandbox 状态 + 试玩次数限制

- **新建 `supabase/migrations/add_sandbox_status.sql`**
  - 更新 `quizzes.status` CHECK constraint：`draft | sandbox | published | archived`
  - 新增 `quizzes.attempt_count integer DEFAULT 0` 列

- **修改 `lib/quiz-runtime.ts`**
  - `QuizRuntimeData` 新增 `status: string`、`attempt_count: number`
  - 新增常量 `MAX_SANDBOX_ATTEMPTS = 20`

- **修改 `lib/quizzes-db.ts`**
  - `getQuizBySlug`：select 增加 `status` + `attempt_count`；`draft`/`archived` → 返回 `null`（`notFound()`）
  - `CreatorQuizRow`：新增 `attempt_count`
  - `getQuizzesByCreator`：select 增加 `attempt_count`

- **修改 `app/api/quiz-attempts/route.ts`**
  - 保存 attempt 前检查 sandbox 限制：`attempt_count >= 20` → 403 `SANDBOX_LIMIT_REACHED`
  - 保存 attempt 后递增 `quizzes.attempt_count`

- **修改 `components/quiz-runtime/QuizPlayer.tsx`**
  - `sandbox` + `attempt_count >= 20` → 显示"试玩次数已满，等待作者提交审核"，不展示题目

- **新建 `app/api/quiz-studio/sandbox/route.ts`**
  - POST：验证 auth + 所有权 → `draft → sandbox`
  - 非 draft 状态 → 400，非 owner → 403

- **修改 `components/quiz-engine/SaveQuizButton.tsx`**
  - 保存后显示"发布试玩版"按钮（gradient 样式）
  - 新增 `publishing` / `published` 状态，发布后显示分享链接 `/quiz/{slug}`

- **修改 `components/quiz-runtime/MyQuizzesModal.tsx`**
  - status 徽章：Draft（灰）/ Sandbox（蓝）/ Published（绿）
  - sandbox quiz 显示 `试玩 N / 20`

- **访问控制汇总**：
  - `sandbox` / `published` → 可访问、答题、保存 attempt、进入 profile、分享
  - `draft` / `archived` → `notFound()`
  - `sandbox` 达 20 次 → 客户端拦截 + 服务端 403
  - Explore / 搜索 → 仅 `published`（quizzes 暂未接入这些页面）

- **未修改**：Quiz Runtime 结果逻辑、OCR、Profile、Explore UI、Auth、AI 生成逻辑

### Quiz Studio 接入 Supabase Auth — creator_user_id

- **修改 `lib/quizzes-db.ts` — `saveQuizSchema`**
  - 新增 `creatorUserId: string` 参数，替换硬编码的 `DEV_USER_ID`
  - `saveQuizAttempt` 未修改（Quiz Runtime 已在上一轮迁移到 API route）

- **新建 `app/api/quiz-studio/save/route.ts`**：POST handler
  - 使用 `lib/supabase/server` 的 `createClient()` 获取 `supabase.auth.getUser()`
  - 未登录 → 401 `{ ok: false, error: "NOT_AUTHENTICATED" }`
  - 调用 `saveQuizSchema(body, user.id)` — `creator_user_id = user.id`
  - 日志：`[QuizStudio] saving quiz for user`、`[QuizStudio] creator_user_id`

- **修改 `components/quiz-engine/SaveQuizButton.tsx`**
  - 移除 `saveQuizSchema` 直接导入
  - 改为 `fetch("/api/quiz-studio/save", ...)` POST
  - 401 → "请先登录后再保存 Quiz。"

- **修改 `app/api/my-quizzes/route.ts`**
  - 移除 `DEV_USER_ID` 导入
  - 使用 server supabase client 获取 `user.id`
  - 未登录 → 401 `{ ok: false, error: "NOT_AUTHENTICATED", quizzes: [] }`
  - 查询 `.eq("creator_user_id", user.id)` 不再用 `DEV_USER_ID`
  - 返回格式改为 `{ ok, quizzes }`（之前是裸数组）
  - 日志：`[MyQuizzes] userId`、`[MyQuizzes] count`

- **修改 `components/quiz-runtime/MyQuizzesModal.tsx`**
  - 适配新响应格式 `data.quizzes`
  - 401 → "请先登录后查看你创建的 Quiz。"
  - 空数组 → "还没有创建过 Quiz。"（保持不变）

- **未修改**：Profile、OCR、Quiz Runtime attempt 保存、Explore/Admin、Supabase schema、AI generate APIs、Quiz Studio UI 大结构

### Quiz Runtime 接入 Supabase Auth — attempt 保存

- **新建 `app/api/quiz-attempts/route.ts`**：POST handler
  - 使用 `lib/supabase/server` 的 `createClient()` 获取 `supabase.auth.getUser()`
  - 未登录 → 401 `{ ok: false, error: "NOT_AUTHENTICATED" }`
  - 写入 `quiz_attempts`（`user_id = user.id`，不再使用 `DEV_USER_ID`）
  - 写入 `quiz_attempt_answers`（每个回答一行）
  - 保存成功后调用 `rebuildUserProfile(user.id)` 增量更新个人图谱
  - 关键日志：`[QuizAttempt] userId/quizId/finalResult/inserting attempt/attempt saved/answers saved/updating user_profile`

- **修改 `components/quiz-runtime/QuizPlayer.tsx`**
  - 移除 `saveQuizAttempt`、`DEV_USER_ID`、`rebuildUserProfile` 直接导入
  - 改用浏览器 `createClient()` 检查 `supabase.auth.getUser()`
  - 已登录 → `fetch("/api/quiz-attempts", ...)` 走服务端 API
  - 未登录 → 仅展示结果，不尝试写数据库
  - 新增 `syncStatus` / `syncError` 状态传递给 `QuizResult`

- **修改 `components/quiz-runtime/QuizResult.tsx`**
  - 新增可选 props：`syncStatus`、`syncError`
  - 新增 `SyncBanner` 组件，四种状态：
    - `syncing` — 旋转动画 "正在同步到个人图谱..."
    - `synced` — 绿色对号 "已同步到个人图谱"
    - `not-authenticated` — "登录后保存结果到个人图谱" + 登录按钮（/login）
    - `error` — 红色错误提示

- **未修改**：Quiz Studio、AI APIs、OCR、Explore/Profile/Admin、Supabase schema、UI 大结构

### auth.users → public.users 同步迁移

- 新增 `supabase/migrations/sync_auth_users_to_public.sql`：
  1. `CREATE TABLE IF NOT EXISTS public.users (id uuid PK, email text, created_at timestamptz)` — 确保表存在
  2. `handle_new_auth_user()` 函数 — auth.users insert 后自动同步到 public.users，`ON CONFLICT DO NOTHING`
  3. `on_auth_user_created` trigger — `AFTER INSERT ON auth.users`
  4. Backfill — 将已存在于 auth.users 但不在 public.users 的用户补入
- 无 UI / 业务逻辑改动

### 邮箱验证 rate limit 提醒

开发阶段注册报 `email rate limit exceeded` 的两种解法：
1. Supabase Dashboard → Authentication → Settings → **关闭 "Confirm email"**（临时）
2. 换一个邮箱地址，或等待限流窗口过期

## Recent — 2026-06-01

### Profile 接入 Supabase Auth（替换 DEV_USER_ID）

- **`app/profile/page.tsx`**：server component 中通过 `createClient().auth.getUser()` 获取真实用户，未登录 → `redirect("/login")`，`getUserProfile(user.id)`
- **`app/api/profile/sources/route.ts`**：GET 从 auth 获取 user，`getProfileSources(user.id)`，未登录返回 401
- **`app/api/profile/sources/delete/route.ts`**：POST 从 auth 获取 user，`user.id` 作为 delete 条件（`.eq("user_id", userId)`），未登录返回 401
- **`app/api/screenshot-report/route.ts`**：server 从 auth 获取 user.id 代替 client 传入的 `user_id`（安全：客户端无法伪造），未登录返回 401
- **`components/profile/ScreenshotReportUploader.tsx`**：移除 `DEV_USER_ID`，不再在 FormData 中发送 `user_id`（server 自行从 auth 获取）
- 保留 `lib/dev-user.ts` 不动（Quiz Runtime / Quiz Studio / explore 仍使用 DEV_USER_ID）

### Supabase Auth 登录页面

- 新增 `app/login/page.tsx` — client component 登录/注册页面
  - 登录：`signInWithPassword` → 成功跳转 `/profile` + `router.refresh()`
  - 注册：`signUp` → 自动确认则直接跳转，否则显示"请检查邮箱验证后登录"
  - 已登录状态：显示当前邮箱 + "进入个人图谱"按钮 + "退出登录"
  - 退出：`signOut` → 清空本地状态 + `router.refresh()`
- UI 风格与现有 SelfIDBox 一致：
  - canvas 底色（#fffaf0），surface-card 卡片容器（#f5f0e0）
  - 大圆角（32px 卡片、14px 输入框、pill 按钮）
  - 细边框输入框（hairline #e5e5e5），min-height 48px
  - 主按钮 bg-[var(--ink)] + 白色文字，次按钮白色底 + 细边框
  - 错误/成功消息页面内显示（红色/绿色 pill），无 alert
  - 底部小字"你的数据只用于生成个人图谱。"
- 未改动：profile / OCR / quiz / explore / DEV_USER_ID / RLS / middleware

### Supabase Auth 基础设施

- 新增 `lib/supabase/client.ts` — browser client（`createBrowserClient`），供 client component 使用
- 新增 `lib/supabase/server.ts` — server client（`createServerClient` + `next/headers` cookies），供 server component / route handler 使用
- 新增 `middleware.ts` — 仅刷新 auth session（`supabase.auth.getUser()`），不保护路由，不 redirect
  - matcher 排除 `_next/static`、`_next/image`、`favicon.ico`、静态资源
- 新增 `app/auth-debug/page.tsx` — server component，调用 `getUser()` 显示 user.id / user.email 或 "Not logged in"
- 保留旧 `lib/supabase.ts` 不动，业务逻辑（profile / OCR / quiz / explore / DEV_USER_ID）全部不受影响

### Quiz Result 分享卡片 & 保存图片

- 安装 `html-to-image` 依赖（PNG 导出）
- 新增 `components/share/QuizResultShareCard.tsx`：
  - forwardRef 组件，供 html-to-image 捕获
  - 固定 400px 宽，3:4 竖版比例，适合手机保存
  - 信息层级：quizTitle → 图片/占位图 → traits → "你的结果" → resultName → description → subtitle → shareText → SelfIDBox
  - 暖色纯色设计（#faf7f2 底色），圆角，字重大，简约高级
  - 无图片时显示简洁几何占位图形
- 更新 `components/quiz-runtime/QuizResult.tsx`：
  - "分享结果"按钮接入 modal（framer-motion AnimatePresence）
  - Modal 内展示 QuizResultShareCard，底部有"关闭"和"保存图片"按钮
  - 保存图片：toPng 2x pixelRatio → download `selfidbox-quiz-result.png`
  - 真实数据映射：quizTitle=quiz.title, resultName=top.result.name, traits=top.result.traits, shareText=top.result.share_text, 等
- 未改动：答题流程、结果计算、QuizPlayer、Supabase schema、profile、OCR、Explore、Quiz Studio

### Test Site 详情页 UI 精简

- 从 `TestSiteDetail.tsx` 删除了 4 个模块：
  1. Hero Card 中"去做这个测试"下方的 source 链接按钮（`<a>` 指向 `site.sourceUrl`）
  2. "邮箱报告" pill（`DetailPill`）
  3. "第三方网站" pill（`DetailPill`）
  4. 整个 `<ImportEmailBox>` 导入结果卡片（邮件导入路线已废弃，改为 OCR 截图导入）
- 从 `app/test-sites/[id]/page.tsx` 移除 `importEmail` 导入和 prop 传递
- Pills grid 现在只保留"预计完成时间"和"测试难度"两项
- 简介 → 相关测试推荐之间的 spacing 由 flex `gap-5` 自动收紧，无多余空白
- 未改动：Explore、Profile、OCR、Quiz Studio、数据库、配色/风格、简介、相关测试推荐

### Profile 数据来源删除功能

**目标**：用户可以在数据来源弹窗中删除某一条数据，删除后数据库记录被清除，user_profile 全量重算，列表刷新。

**新增文件**：

- **`components/profile/SwipeToDeleteSourceRow.tsx`** — 移动端滑动删除组件
  - 使用 framer-motion `drag="x"` 实现向左滑动露出删除按钮
  - `dragConstraints`: `{ left: -72, right: 0 }`，`dragElastic: 0.06` 提供紧致手感
  - 释放阈值 35%：滑动超过 25px 即吸附到打开状态，否则回弹
  - 删除按钮：`bg-[#fce8e6] text-[#c0392b]`（柔和红色），宽度 72px，文案 "删除"
  - 桌面端：hover 时在 row 右侧边缘显示 trash icon（`hidden md:flex` + `group-hover:opacity-100`）
  - 打开状态下点击 row 内容关闭滑动
  - 父组件通过 `isOpen` / `onOpenChange` 管理互斥（同一时间只有一行打开）
  - 接受 `className` prop 传递到外层容器（支持 `first:pt-0 last:pb-0` 等 CSS 伪类）

- **`app/api/profile/sources/delete/route.ts`** — 删除 API
  - `POST /api/profile/sources/delete`
  - Body: `{ source_type: "report" | "quiz", source_id: string }`
  - 根据 `source_type` 删除 `reports` 或 `quiz_attempts` 表中记录（带 `.eq("user_id", DEV_USER_ID)` 安全检查）
  - 记录不存在返回 404 + `"未找到该数据来源，或无权删除"`
  - 删除后调用 `rebuildUserProfileFromAllSources(userId)` 全量重建 user_profile
  - 成功返回 `{ ok: true, deleted: true, profile_rebuild_result: {...} }`
  - 失败返回 `{ ok: false, error: "..." }`

**修改文件**：

- **`lib/rebuild-user-profile.ts`** — 新增 `rebuildUserProfileFromAllSources(userId)` 函数
  - 全量读取所有 `reports`（`parse_status = "normalized"`）和 `quiz_attempts`（`included_in_profile = true`）
  - 不做增量过滤（不检查 `created_at > updated_at`，不检查 `fused_into_profile`）
  - 从零开始融合（不读取旧 `user_profile` 作为基线）
  - 无数据来源 → 重置为空/初始 profile：`core_vector = {}`, `social_vector = {}`, `selfid_profile = "待完善的人格画像"`, `summary = "目前还没有足够的数据生成个人图谱。"`, `report_count = 0`
  - 复用现有所有 helper：`extractReportDims`, `extractQuizDims`, `fuseDim`, `reportFallbackWeight`, `generateProfileLabel` 等
  - Quiz attempts 去重：同一 quiz_id 保留最新一条

- **`components/DataSourceModal.tsx`** — 集成删除流程
  - 新增状态：`openSwipeId`（当前打开的滑动行）、`deleteTarget`（待确认删除的条目）、`deleting`、`feedback`
  - 每行包裹 `<SwipeToDeleteSourceRow>` 替代原来的 `<div>`
  - 点击删除按钮 → 显示确认卡片：`"确定删除这条数据来源吗？删除后会重新计算你的个人图谱。"` + "取消" / "确认删除" 按钮
  - 确认后 `POST /api/profile/sources/delete` → 成功后乐观移除 + re-fetch + `router.refresh()`
  - 成功反馈：绿色 banner `"已删除，个人图谱已更新"`（3 秒自动消失）
  - 失败反馈：红色 banner 显示错误信息（3 秒自动消失）
  - 删除中状态：确认按钮显示 spinner，禁用取消按钮
  - 删除/确认进行中禁止其他行滑动操作（`disabled` prop）

**交互流程**：
1. 移动端：向左滑动 row → 右侧露出 "删除" 按钮 → 点击 → 确认对话框 → 确认/取消
2. 桌面端：hover row → 右侧出现 trash icon → 点击 → 确认对话框 → 确认/取消
3. 删除后：列表即时更新，Profile 页面 server component 通过 `router.refresh()` 重新获取数据

**安全**：API 删除使用 `.eq("user_id", DEV_USER_ID)` 确保只删除当前用户数据。

**No changes to**: OCR 服务、Quiz Studio、Quiz Runtime、Explore/Admin、Supabase schema、UI 大结构。

---

## Recent — 2026-05-31

### Profile 数据来源弹窗接入真实数据

**`lib/user-profile-db.ts`**:
- Added `ProfileSourceEntry` interface (id, source_type, created_at, title, result, meta)
- Added `getProfileSources(userId)` — queries `reports` (parse_status=normalized) and `quiz_attempts` (included_in_profile=true), batch-joins `quizzes` for title/slug, transforms to unified format, sorts by created_at desc

**`app/api/profile/sources/route.ts`** — new:
- GET handler using DEV_USER_ID, calls `getProfileSources`, returns `{ ok, sources }` or `{ ok: false, error, sources: [] }`

**`components/DataSourceModal.tsx`** — rewritten:
- Removed all mock data
- Fetches `/api/profile/sources` on modal open
- Loading state (spinner), error state (message + retry button), empty state ("还没有数据来源。")
- Mobile: fullscreen `fixed inset-0` with warm cream `bg-[#fffaf0]`
- Desktop: centered 720px-wide modal with `max-h-[80vh]`, `rounded-[32px]`
- Clean row layout: date + type badge on top line, title (bold) + result (muted) below
- Type badge: "截图" (purple pill) for reports, "Quiz" (amber pill) for quizzes
- Date format: YYYY-MM-DD
- Upload section preserved (toggleable)
- Re-exports `ProfileSourceEntry` type for consumers

**No changes to**: radar chart, user_profile aggregation, OCR service, Quiz Runtime, Supabase schema

---

### rebuildUserProfile: full recompute → incremental weighted fusion

**`lib/rebuild-user-profile.ts` — rewritten**:
- Changed from full recompute to **incremental weighted rolling average**
- Reads existing `user_profile` first; only processes new data since last update
- **New reports**: filtered by `created_at > user_profile.updated_at` (or all if no profile yet)
- **New quiz_attempts**: filtered by `fused_into_profile = false` (existing column, previously unused)
- After fusion, marks processed quiz_attempts with `fused_into_profile = true` for idempotency
- Per-dimension formula: `new_value = (old × count + incoming × weight) / (count + weight)`, same pattern for confidence; `count` now accumulates weights not source count
- `report_count` is cumulative (`old + new_reports + new_attempts`), never decreases
- Added `readOldDim()` to handle legacy flat-number dims and current DimOut objects
- Added `fuseDim()` for single-dimension incremental weighted average
- No new sources → returns `{ ok: false, reason: "NO_NEW_SOURCES" }`, profile untouched
- Verbose console logging: old/new dims, per-dimension changes, cumulative counts, upsert confirmation

**`lib/user-profile-db.ts`**:
- Exported `DimOut` interface (`{ value, confidence, count }`)
- Fixed `UserProfileRow.core_vector` / `social_vector` types from `Record<string, number>` to `Record<string, DimOut>` (matches actual stored shape)

**No changes to**: UI, OCR FastAPI proxy, Supabase schema, callers (API route + QuizPlayer)

---

## Recent — 2026-05-27 (evening)

### Profile fusion: incremental → full recompute, latest-attempt-per-quiz

**`lib/profile-fusion.ts` — rewritten**:
- Changed from incremental fusion (marking attempts as fused) to **full recompute** every call
- **Latest attempt per quiz**: deduplicates `quiz_attempts` by `(user_id, quiz_id)`, keeps only most recent `created_at`
- Sources: normalized reports (standard format `{ count, value, confidence }`) + latest quiz attempts (flat `{ key: number }`)
- All sources contribute independently to per-dimension weighted average
- Output always standard format: `{ value: rounded, confidence: min(1, totalWeight/count), count: sources }`
- `report_count` = reports used + unique quizzes used (not total attempts)
- Invalid keys in quiz_attempts.user_vector logged via `console.warn` and skipped
- No `fused_into_profile` dependency — removed from `saveQuizAttempt` also
- Protection: zero valid sources → return early, don't touch user_profile

**`lib/quizzes-db.ts`**: removed `fused_into_profile: false` from `saveQuizAttempt` insert

---

## Recent — 2026-05-27

### Profile Fusion: UGC Quiz → user_profile closed loop

**Global factor library** (`lib/selfid-factors.ts`):
- New file. Exports `SELFID_FACTORS` — 16 canonical Selfid personality dimensions (8 core + 8 social)
- Each factor: `key`, `name` (Chinese), `group` ("core"|"social"), `description`
- Exports helpers: `SELFID_FACTOR_KEYS` (Set), `CORE_KEYS`, `SOCIAL_KEYS`, `FACTOR_BY_KEY` (Record)

**generate-factors API constrained** (`app/api/quiz-ai/generate-factors/route.ts`):
- AI now SELECTS from SELFID_FACTORS catalog instead of freely inventing factors
- User message includes full factor library; system prompt instructs to pick only from catalog
- Validation rejects any key not in `SELFID_FACTOR_KEYS` + detects duplicate keys

**Quiz Studio factor adding** (`app/create/page.tsx`):
- `addFactor` now opens a factor picker showing unused SELFID_FACTORS (group-tagged: core/social)
- New `selectFactor(key)` callback creates factor from SELFID_FACTORS entry (id=key, name=Chinese name, nameEn=description)
- Picker auto-hides when all 16 factors are used
- FactorList inline editing preserved — display names remain customizable

**quiz_attempts new columns** (`supabase/migrations/add_quiz_attempt_profile_fields.sql`):
- New migration: `ALTER TABLE quiz_attempts ADD included_in_profile boolean DEFAULT true`, `ADD profile_weight numeric DEFAULT 0.3`
- Partial index on `(user_id, included_in_profile) WHERE included_in_profile = true`

**Quiz attempts bound to DEV_USER_ID** (`lib/quizzes-db.ts`):
- `saveQuizAttempt` now writes `user_id: DEV_USER_ID` (was null), `included_in_profile: true`, `profile_weight: 0.3`

**Profile fusion engine** (`lib/profile-fusion.ts`):
- New file. `refreshUserProfileFromSources(userId)`:
  1. Reads `reports` WHERE `parse_status = 'normalized'` → core_vector, social_vector, confidence (default 0.5)
  2. Reads `quiz_attempts` WHERE `included_in_profile = true` → user_vector, profile_weight (default 0.3)
  3. Maps quiz user_vector keys to core/social groups via `CORE_KEYS`/`SOCIAL_KEYS`
  4. Weighted average across all sources per dimension (skips non-finite values)
  5. Preserves existing `selfid_profile` and `summary` from current user_profile row
  6. Upserts into `user_profile` (onConflict: user_id), sets `report_count`, `updated_at`

**Post-quiz profile refresh** (`components/quiz-runtime/QuizPlayer.tsx`):
- `finishQuiz` is now async, awaits `saveQuizAttempt`
- After save succeeds, fire-and-forget calls `refreshUserProfileFromSources(DEV_USER_ID)`
- Profile page (`/profile`) sees updated radar charts on next visit

**Verification**: `tsc --noEmit` zero errors, `npm run build` 30 routes compiled (~2.9s), `npm run lint` no new warnings

---

### Quiz Studio: creator_user_id + My Quizzes entry

**DEV user** (`lib/dev-user.ts`):
- New file: `export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001"`

**Save with creator** (`lib/quizzes-db.ts`):
- `saveQuizSchema` now writes `creator_user_id: DEV_USER_ID` to `quizzes`
- New `getQuizzesByCreator(userId)` — returns `{ id, slug, title, hook, status, created_at }[]`, ordered by `created_at desc`

**API route** (`app/api/my-quizzes/route.ts`):
- `GET` — uses `DEV_USER_ID`, calls `getQuizzesByCreator`, returns JSON array

**Hero card redesign** (`app/create/page.tsx`):
- Replaced gradient hero with clean white card + thin border
- 4-icon action grid (2×2 mobile, 4×1 desktop): Library (opens modal), Sparkles/Wand/Settings (placeholder)
- Wired `MyQuizzesModal` open/close state

**My Quizzes modal** (`components/quiz-runtime/MyQuizzesModal.tsx`):
- Full-screen mobile / centered 560px desktop panel
- Backdrop blur, slide-up animation (framer-motion)
- Fetches `/api/my-quizzes` on open; loading spinner; empty state ("还没有创建过 Quiz")
- Each quiz row: title, hook, status badge, date — full row clickable → `router.push(/quiz/[slug])`
- Slug validation (empty slug shows error, no navigation)

---

## Recent — 2026-05-26 (later)

### Quiz Runtime: `/quiz/[slug]` user-facing quiz page

**New route**: `app/quiz/[slug]/page.tsx` — server component fetching quiz from Supabase via `getQuizBySlug`, `notFound()` on miss, passes to client `QuizPlayer`. Includes `loading.tsx`.

**Data layer** (`lib/quizzes-db.ts`):
- Added `getQuizBySlug(slug)` — fetches quiz + factors + results + questions + options in parallel
- Added `saveQuizAttempt()` — writes `quiz_attempts` + `quiz_attempt_answers` (user_id = null for now)

**Runtime logic** (`lib/quiz-runtime.ts`):
- `calculateUserVector(factorKeys, answers)` — init 50, sum effects × 10, clamp 0–100
- `rankRuntimeResults(userVector, results)` — Euclidean distance + similarity ranking
- Runtime data types (`QuizRuntimeData`, `QuizFactorData`, `QuizResultData`, `QuizQuestionData`, `QuizOptionData`, `AnswerRecord`, `RankedRuntimeResult`)

**UI components** (`components/quiz-runtime/`):
- `QuizPlayer` — state machine (quiz → result), forward/back nav, 300ms auto-advance, answer re-selection on back
- `QuestionCard` — single question with AnimatePresence fade+slide, option state logic (idle/selected/dimmed)
- `OptionButton` — framer-motion tap scale, 3 visual states
- `QuizProgress` — thin progress bar + step counter
- `QuizResult` — staggered fade-in: image (if image_url), similarity badge, name, subtitle, description, traits, secondary results, retry/share buttons

**New dependency**: framer-motion (^12.x)

**Design**: Minimal premium — cream canvas, black/white cards, thin borders ([var(--ink)]/8–/25), subtle shadows, no gradients, mobile-first. Linear/Typeform/Apple aesthetic.

**Note**: `saveQuizSchema` function preserved unchanged in `lib/quizzes-db.ts`.

---

## Earlier — 2026-05-26

### Quiz Studio: Step 5 layout fix + Result image upload

**Step 5 header layout**
- `DistanceValidator` no longer renders its own step number/title — extracted to `page.tsx` with `StepLabel` matching Steps 1-4, 6
- Added description card, divider, empty-state handling (< 2 results)

**Result image upload**
- Added `image_url?: string` to `Result` type (`lib/mock-quiz-engine.ts`)
- New `lib/image-upload.ts`: canvas-based image compression (max 800px, webp) + Supabase Storage upload to `quiz-result-images` bucket
- `ResultCard` now has image icon (lucide `Image`) in top-right, hidden file input, upload states (loading spinner / error feedback), and image preview when `image_url` set
- `quizzes-db.ts` now saves `image_url` in `quiz_results` insert
- SQL migration at `supabase/migrations/add_image_url.sql`: ALTER TABLE + storage bucket + RLS policies

---

## 1. Overview

**SelfIDBox** — AI-driven personality expression platform with two product lines:
- **Route A — Personality Report Aggregator**: Users forward test reports to `@selfidbox.com`; Cloudflare Email Worker + DeepSeek parses them into structured Supabase data.
- **Route B — UGC AI Quiz Platform**: Users create/share AI-generated personality quizzes backed by vector-space matching.

**Phase**: Static MVP — frontend only, mock data throughout. Validating IA, page UX, and component architecture before connecting real backend.

**Tech stack**: Next.js 16.2.6 (App Router), React 19.2.4, Tailwind CSS v4, TypeScript 5.x. Recharts 3.8.1 installed but **unused** (radar chart is custom SVG).

**Repo**: 1 commit (`c56c388 Initial commit`), branch `master`.

---

## 2. Route Inventory

| # | Route | File | Type | Status | Notes |
|---|---|---|---|---|---|
| 1 | `/` | `app/page.tsx` | Static | **STALE** | Default create-next-app template. Never customized. |
| 2 | `/explore` | `app/explore/page.tsx` | Static | **Done (mock)** | Test discovery hub. Nav, hero, search (non-functional), categories grid, popular cards. Data from `lib/test-sites.ts`. |
| 3 | `/explore/personality` | `app/explore/personality/page.tsx` | Static | **Done (mock)** | Delegates to `CategoryPage`. |
| 4 | `/explore/career` | `app/explore/career/page.tsx` | Static | **Done (mock)** | Delegates to `CategoryPage`. |
| 5 | `/explore/fun` | `app/explore/fun/page.tsx` | Static | **Done (mock)** | Delegates to `CategoryPage`. |
| 6 | `/test-sites/[id]` | `app/test-sites/[id]/page.tsx` | Dynamic | **Done (Supabase)** | Fetches via `getTestSiteBySlug()`. Uses `mapTestSite()` adapter. `notFound()` on miss. Related sites from `getTestSitesByCategory()`. Has `loading.tsx`. |
| 7 | `/profile` | `app/profile/page.tsx` | Static | **Done (mock)** | Personal graph. 2 custom SVG radar charts + summary + AI card + source cards. All data hardcoded inline. |
| 8 | `/create` | `app/create/page.tsx` | Client | **Done (Editable Quiz Builder)** | AI Quiz Studio — 7 editable sections with unified quiz state. Inline editing with fusion glass UI — no form borders. AI Copilot on Results. Save to Supabase. |
| 9 | `/inbox` | `app/inbox/page.tsx` | Static | **STUB** | Placeholder: "人格报告收件箱准备中" |
| 10 | `/q/[id]` | `app/q/[id]/page.tsx` | Dynamic | **STUB** | Placeholder: "测试答题页准备中" |
| 11 | `/r/[id]` | `app/r/[id]/page.tsx` | Dynamic | **STUB** | Placeholder: "测试结果页准备中" |
| 12 | `/debug-supabase` | `app/debug-supabase/page.tsx` | Static | **Dev only** | Calls real Supabase queries, dumps JSON. |
| 13 | `/admin` | `app/admin/page.tsx` | Static | **Done (Supabase)** | Dashboard: stats (total/published/draft/categories), quick links, recent 5 sites. |
| 14 | `/admin/test-sites` | `app/admin/test-sites/page.tsx` | Dynamic | **Done (Supabase)** | Test site table with search, category filter, status filter, edit/delete actions. |
| 15 | `/admin/test-sites/new` | `app/admin/test-sites/new/page.tsx` | Static | **Done (Supabase)** | Create form: 20+ fields, tag chip input, toggle switches, validation. |
| 16 | `/admin/test-sites/[id]/edit` | `app/admin/test-sites/[id]/edit/page.tsx` | Dynamic | **Done (Supabase)** | Edit form: pre-filled from DB, same fields as new. |
| 17 | `/admin/categories` | `app/admin/categories/page.tsx` | Static | **Done (Supabase)** | Category table with edit/delete actions. |
| 18 | `/admin/categories/new` | `app/admin/categories/new/page.tsx` | Static | **Done (Supabase)** | Create form: slug, name, description, icon, sort_order, status. |
| 19 | `/admin/categories/[id]/edit` | `app/admin/categories/[id]/edit/page.tsx` | Dynamic | **Done (Supabase)** | Edit form: pre-filled from DB. |
| 20 | `/api/quiz-ai/generate-results` | `app/api/quiz-ai/generate-results/route.ts` | API | **Done** | POST — calls DeepSeek, returns structured personality results JSON. Key kept server-side. |
| 21 | `/api/quiz-ai/generate-factors` | `app/api/quiz-ai/generate-factors/route.ts` | API | **Done** | POST — calls DeepSeek with results context, returns factor dimensions to differentiate results. |
| 22 | `/api/quiz-ai/generate-result-vectors` | `app/api/quiz-ai/generate-result-vectors/route.ts` | API | **Done** | POST — calls DeepSeek with results + factors, returns 0-100 vector values per result × factor. |
| 23 | `/api/quiz-ai/generate-questions` | `app/api/quiz-ai/generate-questions/route.ts` | API | **Done** | POST — calls DeepSeek with results + factors + vectors, generates scenario-based questions with factor_effects options. |

---

## 3. Component Inventory

### 3.1 Shared Components

| Component | File | Client/Server | Purpose | Data source |
|---|---|---|---|---|
| `ImportEmailBox` | `components/ImportEmailBox.tsx` | Client (`useState`) | Copy-to-clipboard email UI | `email` prop — receives `"demo@selfidbox.com"` (mock) |
| `RelatedTestSites` | `components/RelatedTestSites.tsx` | Server | 3-col grid of related test cards | `sites` prop — from `getRelatedTestSites()` (mock) |
| `TestSiteDetail` | `components/TestSiteDetail.tsx` | Server | Full test site detail layout | `site` + `relatedSites` props (mock) |
| `ProfileSummary` | `components/ProfileSummary.tsx` | Server | Profile hero: gradient, tags, title, description | Props — all hardcoded in profile page |
| `ProfileRadar` | `components/ProfileRadar.tsx` | Server | **Custom SVG N-sided radar chart** | `data: RadarPoint[]` prop — hardcoded in profile page |
| `VectorCard` | `components/VectorCard.tsx` | Server | Colored stat card (5 accent tones) | Props — hardcoded in profile page |

### 3.2 Quiz Studio Components (`components/quiz-studio/`)

| Component | Purpose |
|---|---|
| `InlineEditableInput` | Transparent inline input, auto-width via hidden measure span, `currentColor` adapts to card bg |
| `InlineEditableTextarea` | Transparent textarea with auto-resize, same glass fusion style |
| `EditableChipList` | Inline chip pills with add/delete, Enter to commit |
| `EditableSlider` | Custom 0-100 slider with pointer capture, track + thumb, card-integrated style |

### 3.3 Quiz Engine Components (`components/quiz-engine/`)

| Component | Purpose | Data source |
|---|---|---|
| `QuizMetaCard` | Gradient hero: title/hook inline-editable, type/audience/tone as editable chips | `meta, onChange?` |
| `ResultCard` | Colored card: name/subtitle/desc/traits/shareText all inline-editable, delete button (hover) | `result, index, onChange?, onDelete?` |
| `FactorList` | Cream card: factor name/key inline-editable per pill, add/delete buttons | `factors, onChange?, onAdd?, onDelete?` |
| `ResultVectorCard` | Vector bar chart → custom `EditableSlider` per factor when editing | `result, vector, factors, index, onValueChange?` |
| `QuestionEffectsCard` | Question text + option text inline-editable, factor effects as ±3 number inputs, add/delete option/question | `question, factors, index, onChange?, onDelete?` |
| `CoverageValidator` | Checks each factor covered by ≥1 question option. **Real logic.** | `questions, factors` (mock data, real algo) |
| `DistanceValidator` | Pairwise result vector distance. Flags close pairs (sim > 55%). **Real logic.** | `resultVectors, results` (mock data, real algo) |
| `SimilarityRanking` | Ranks results by similarity to user vector. **Real logic.** | `userVector, resultVectors, results` (mock data, real algo) |
| `FinalResultPreview` | Final result hero: name, match %, interpretation, traits, secondary note | Props (mock) |
| `SaveQuizButton` | "保存这个测试" button with loading/success/error states, calls `saveQuizSchema()` | Client component — Supabase via `lib/quizzes-db.ts` |

### 3.4 Explore Components (`app/explore/_components/`)

| Component | Purpose |
|---|---|
| `category-page.tsx` | Shared layout for personality/career/fun — nav, header, filters, card grid |
| `test-card.tsx` | Colored card linking to `/test-sites/[id]` |

---

## 4. Data Layer

### 4.1 Mock Data (active — all routes use these)

| File | Contents |
|---|---|
| `lib/test-sites.ts` | `TestSite` type + 12 mock sites (4 personality, 4 career, 4 fun) + 3 categories + helpers (`getTestsByCategory`, `getTestSite`, `getRelatedTestSites`). `importEmail = "demo@selfidbox.com"`. |
| `lib/mock-quiz-engine.ts` | Full type system (`QuizMeta, Result, Factor, ResultVector, Question, OptionEffect, UserVector`) + 1 complete mock quiz ("测测你像哪种乐器" — 5 results, 5 factors, 5 vectors, 2 questions, 1 mock user vector, interpretation text). |
| `app/profile/page.tsx` (inline) | Two `RadarPoint[]` arrays (corePersonality 8D, socialExpression 8D) + `sourceCards[]` (3 cards). All hardcoded. |

### 4.2 Real Data Layer (implemented but only used by debug page)

| File | Purpose |
|---|---|
| `lib/supabase.ts` | Supabase client singleton from `NEXT_PUBLIC_SUPABASE_*` env vars |
| `lib/test-sites-db.ts` | `getCategories()`, `getPublishedTestSites()`, `getTestSiteBySlug()`, `getTestSitesByCategory()` — queries `test_categories` and `test_sites` tables with joins |
| `lib/quizzes-db.ts` | `saveQuizSchema()` — writes full quiz schema (quizzes → quiz_factors → quiz_results → quiz_questions → quiz_options) to Supabase |
| `lib/test-supabase.ts` | `testSupabaseConnection()` — connectivity smoke test |

### 4.3 Real Algorithms (active — operate on mock data)

| File | Purpose |
|---|---|
| `lib/quiz-vector.ts` | Euclidean distance, similarity (normalized 0–100), rank by similarity, pairwise distance validation (55% threshold), question coverage validation. Production-quality, operates on `lib/mock-quiz-engine.ts` types. |

---

## 5. Backend Services (external — NOT in this repo)

| Service | Status | Notes |
|---|---|---|
| Cloudflare Email Routing | **Deployed** | Catch-all `*@selfidbox.com` |
| Cloudflare Email Worker | **Deployed** | Receives + parses forwarded email |
| DeepSeek API | **Deployed** | Email content → structured JSON (called by Worker) |
| Supabase PostgreSQL | **Connected** | `reports` table; Worker writes to it |
| Supabase (frontend side) | **Ready, not wired** | Client + query functions exist; only `/debug-supabase` uses them |
| Auth / user system | **None** | No auth pages, no user context, no session management |

---

## 6. Design System

- **Palette**: Cream canvas `#fffaf0`, near-black ink `#0a0a0a`, 3 surface tiers, 6 accent colors (pink/teal/lavender/peach/ochre/mint)
- **Typography**: Inter via `font-family` in globals.css. Geist variables referenced in `@theme` but **never loaded** (no `next/font`).
- **Border radius**: Very generous — `rounded-[20px]` through `rounded-[36px]` and `rounded-full`
- **Shadows**: Custom token pattern `shadow-[0_18px_50px_rgba(10,10,10,0.07)]` (repeated inline)
- **Gradients**: 2 gradient patterns repeated inline across components
- **Accent color map**: The same `Record<string, string>` of 6 accent hex values is duplicated in 4 files

---

## 7. Build & Lint

| Check | Status |
|---|---|
| `npm run lint` | **Pass** — zero warnings, zero errors |
| `npm run build` | **Pass** — all 24 pages generated in ~2.2s |
| `npx tsc --noEmit` | **Pass** — zero type errors |

---

## 8. Git Status (uncommitted)

**Modified** (12 files): `AGENTS.md`, `app/create/page.tsx`, `app/explore/_components/category-page.tsx`, `app/explore/page.tsx`, `app/profile/page.tsx`, `app/test-sites/[id]/page.tsx`, `components/ProfileRadar.tsx`, `lib/test-sites.ts`, `lib/test-sites-db.ts`, `package.json`, `package-lock.json`

**Untracked** (24 files/dirs): `.claude/`, `TASKER_STATUS.md`, `app/admin/` (7 files), `app/debug-supabase/`, `components/admin/` (7 files), `components/quiz-engine/` (9 files), `lib/admin-db.ts`, `lib/mock-quiz-engine.ts`, `lib/quiz-vector.ts`, `lib/supabase.ts`, `lib/test-sites-db.ts`, `lib/test-supabase.ts`

---

## 9. Critical Gaps & Issues

1. **Homepage (`/`) is untouched** — still the default create-next-app boilerplate. No SelfIDBox branding or navigation.
2. **recharts is an unused dependency** — installed but never imported (radar chart is custom SVG).
3. **Geist font variables undefined** — `--font-geist-sans` and `--font-geist-mono` in `@theme` but never loaded via `next/font`.
4. **Accent color map duplicated 4x** — same 6-color map in `test-card.tsx`, `RelatedTestSites.tsx`, `TestSiteDetail.tsx`, `explore/page.tsx`.
5. **Search input at `/explore` is non-functional** — no `onChange`/`onSubmit`, no state.
6. **3 stub pages** — `/inbox`, `/q/[id]`, `/r/[id]` are placeholder text only.
7. **No authentication** — no login, no user context, no session.
8. **No tests** — zero test files, no testing library in dependencies.
9. **No SEO metadata** — only root layout has generic title. No sitemap, no robots.txt.
10. **No DB schema in repo** — `test_categories` and `test_sites` tables are queried but no migration file documents them.
11. **No error boundaries or suspense** — only one `loading.tsx` exists (for test-sites detail).

---

## 10. Recent Changes

### 2026-05-25 (10)

- **全模块 Pin 系统 + Icon Visibility 统一修复** — ① 类型扩展：`Factor`、`ResultVector`、`Question` 接口全部新增 `isPinned: boolean` 字段（默认 `false`），mock 数据同步。② **Factors Pin**：`FactorList` 每个 factor pill 右侧新增 Pin/PinOff icon，pinned 状态加 `ring-2 + shadow`。`handleGenerateFactors()` 保留 pinned factors，只向 AI 请求 `factorCount - pinned.length` 个新因子，`pinned_factors`（含 key/name）传给 API，响应后 merged（pinned 在前，new 在后）。`generate-factors` API：接收 `pinned_factors`，SYSTEM_PROMPT 新增 PINNED FACTORS 规则，user prompt 显式列出并禁止语义重复，`factor_count` 下限从 3 降为 1。③ **Result Vectors Pin**：`ResultVectorCard` header 区域新增 Pin/PinOff icon。`handleGenerateResultVectors()` 收集 pinned vectors，只向 AI 发送 unpinned results，`pinned_vectors`（含 key/name/values）传给 API 作参考，响应后 pinned vectors 原样保留，new vectors 使用 AI 返回值。`generate-result-vectors` API：接收 `pinned_vectors` 作参考（不生成），SYSTEM_PROMPT 新增 PINNED VECTORS 规则，`results` 下限降为 1。④ **Questions Pin**：`QuestionEffectsCard` 右上角新增 Pin/PinOff icon（与删除 × 并列）。`handleGenerateQuestions()` 保留 pinned questions，只请求 `questionCount - pinned.length` 个新题，`pinned_questions`（含 text）传给 API。`generate-questions` API：接收 `pinned_questions`，SYSTEM_PROMPT 新增 PINNED QUESTIONS 规则（不生成场景/主题高度相似的题目），`question_count` 下限从 3 降为 1。⑤ **Icon Visibility 统一修复**：所有组件 icon 从 `opacity-0 group-hover:opacity-100` 改为始终可见。Colored cards（ResultCard）：`bg-white/20 hover:bg-white/35 text-current/80`。Surface cards（FactorList、ResultVectorCard、QuestionEffectsCard）：`bg-black/8 hover:bg-black/16 text-[var(--ink)]/60 hover:text-[var(--ink)]`。Pinned 状态 icon：`bg-[var(--ink)]/12 text-[var(--ink)]`（surface）或 `bg-white/30 text-current`（colored）。删除 × 和 Pin 按钮始终 visible。⑥ 新增 callbacks：`toggleFactorPin`、`toggleResultVectorPin`、`toggleQuestionPin`。
- **涉及文件**: `lib/mock-quiz-engine.ts`（3 个 type + mock 数据）、`components/quiz-engine/ResultCard.tsx`（icon 修复）、`components/quiz-engine/FactorList.tsx`（Pin UI + icon 修复）、`components/quiz-engine/ResultVectorCard.tsx`（Pin UI + icon 修复）、`components/quiz-engine/QuestionEffectsCard.tsx`（Pin UI + icon 修复）、`app/create/page.tsx`（所有 module 的 pin 逻辑 + 3 个 toggle callbacks）、`app/api/quiz-ai/generate-factors/route.ts`（pinned_factors + prompt）、`app/api/quiz-ai/generate-result-vectors/route.ts`（pinned_vectors + prompt）、`app/api/quiz-ai/generate-questions/route.ts`（pinned_questions + prompt）
- **验证**: `tsc --noEmit` 零错误，`npm run build` 22 页生成成功（~2.5s compile），`npm run lint` 仅预存 debug 文件报错（无关）

### 2026-05-25 (9)

- **Results Pin 系统** — 用户可以固定（pin）喜欢的结果人格卡片。① `Result` 接口新增 `isPinned: boolean` 字段（默认 `false`），`mapAIResults()` 同步默认值。② `ResultCard` 右上角新增 Pin/PinOff 图标（`lucide-react`）：unpinned 时 hover 才显示半透明 PinOff，pinned 后始终显示 filled Pin + 白底高亮，卡片增加 `ring-2 ring-white/40` 边框 + `box-shadow` 柔光效果。③ AI 生成逻辑改造：`handleGenerateResults()` 收集所有 `isPinned=true` 的结果 → 发送 `pinned_results`（含 key/name/traits）到 API → 只请求 `resultCount - pinned.length` 个新结果 → 响应后拼接 pinned + new → pinned 结果保留原 vector（不重置为默认 50），new 结果用 defaultVector。④ `generate-results` API 更新：接收 `pinned_results` 参数，SYSTEM_PROMPT 新增 PINNED RESULTS 规则（不重复 key、不生成语义相似结果、保持人格区分度），user prompt 显式列出已固定结果并强调避免重复。⑤ `togglePin()` callback 通过 useCallback 切换单条结果的 isPinned。
- **涉及文件**: `lib/mock-quiz-engine.ts`（类型+映射+mock数据）、`components/quiz-engine/ResultCard.tsx`（Pin UI）、`app/create/page.tsx`（togglePin + AI 逻辑）、`app/api/quiz-ai/generate-results/route.ts`（pinned_results 接收+prompt 升级）
- **范围限制**: 本轮仅 Results 模块。Factors / Questions / Vectors 等模块暂不涉及 pin。

### 2026-05-25 (8)

- **Questions 单题分页** — Questions + Option Effects 模块从全量列表改为单题聚焦视图。新增 `questionIndex` state + 导航栏：← 上一题 / 下一题 → 按钮（首/末题自动 disabled），中间数字圆点指示器（可点击跳转，当前题高亮 ink 色）。添加题目自动跳转到新题，删除当前题后智能切到合理索引（不越界）。AI 生成题目后自动回到第 1 题。Coverage Validator 和保存逻辑仍然基于全部 questions。

### 2026-05-25 (7)

- **Quiz Studio 第一轮优化** — ① `/create` 初始状态改为空白（移除 mock 数据预填），各模块显示空状态提示引导用户使用 AI 生成或手动添加。② Quiz Meta 卡片移除底部 type/audience/tone 标签区，只保留 title + hook 编辑。③ Results/Factors/Questions 三个 AI 模块增加 `CountSelector` pill 选择器：Results 可选 4/6/8 个结果（默认 6），Factors 可选 4/5/6/8 个因子（默认 5），Questions 可选 6/8/10/12 题 × 3/4 选项（默认 8题/4选）。④ Factor 卡片隐藏英文 nameEn 和 key 编辑区，只显示中文名称。

### 2026-05-25 (6)

- **Quiz Studio AI Copilot — Questions 生成** — 新增 `app/api/quiz-ai/generate-questions/route.ts`：POST 端点，接收 quiz meta + results + factors + result_vectors + question_count + options_per_question，生成场景化的向量空间测试题目。每个 option 通过 factor_effects（-3~+3，1-3 个因子）间接推动用户向量，而非直接加分到 result。题目要求场景化、有画面感、易选择、适合分享，不医疗化。完整校验：factor keys 合法性、值范围、effect 数量、labels 格式。`/create` 页面 Questions 模块新增 "AI 生成题目" 按钮（与 "+ 添加" 并列），生成后 Coverage Validator 自动重新检查因子覆盖。

### 2026-05-25 (5)

- **Quiz Studio AI Copilot — Result Vectors 生成** — 新增 `app/api/quiz-ai/generate-result-vectors/route.ts`：POST 端点，接收 quiz meta + results + factors，为每个 result × factor 组合分配 0-100 人格向量值。AI 根据 result traits/description + factor 含义合理分配：核心特征 80-95、非匹配 10-30、中性 40-60，结果间有明显区分度。完整校验所有 result key × factor key 存在且值在 0-100。`/create` 页面 Result Vectors 模块新增 "AI 设置结果向量" 按钮，生成后自动更新 sliders（用户仍可手动调整），Distance Validator 自动基于新向量重新计算。

### 2026-05-25 (4)

- **Quiz Studio AI Copilot — Factors 生成** — 新增 `app/api/quiz-ai/generate-factors/route.ts`：POST 端点，服务端调用 DeepSeek，接收 quiz meta + results 上下文 + factor_count，返回严格 JSON 格式的因子维度列表（key/name/description）。API 将已有 results 传给 AI，确保生成的 factors 能有效区分各个结果人格。`/create` 页面 Factors 模块新增 "AI 生成影响因子" 按钮（与 Results 按钮同款渐变风格）。生成后自动重建 resultVectors：保留同名 key 的值，新 key 默认 50，移除旧 key。

### 2026-05-25 (3)

- **Quiz Studio — 全线可编辑 Quiz Builder** — 创建 4 个融合式编辑组件（`components/quiz-studio/`）：`InlineEditableInput`（自适应宽度、透明边框、currentColor 适配）、`InlineEditableTextarea`（自动高度）、`EditableChipList`（chip 增删）、`EditableSlider`（自定义 0-100 slider）。全部使用 `bg-transparent` + `border-current/10` + `focus:border-current/30` 风格，与卡片背景完美融合，无白底表单感。Quiz Meta/Results/Factors/Result Vectors/Questions 五个模块全部可编辑：文字用 inline input/textarea、特质用 chip list、向量用 slider、因子效果用小型数字输入。支持新增/删除 Result/Factor/Question/Option。所有编辑通过 `useCallback` 写回统一的 `QuizState`。AI 生成 results 后自动创建新 resultVectors。删除 result/factor 时同步清理关联数据。

### 2026-05-25 (2)

- **Quiz Studio AI Copilot — Results 生成** — 新增 `app/api/quiz-ai/generate-results/route.ts`：POST 端点，服务端调用 DeepSeek API，接收 quiz meta + result_count，返回严格 JSON 格式的人格结果列表（key/name/subtitle/description/traits/share_text）。API key 仅存于 `.env.local`（`DEEPSEEK_API_KEY`），前端不暴露。`Result` 类型扩展了 `subtitle`/`shareText` 可选字段，新增 `AIResult` 接口 + `mapAIResults()` 映射函数。`/create` 页面转换为客户端组件，Results 模块新增 "AI 生成结果人格" 按钮（渐变紫色药丸风格），含 loading spinner + 错误提示，成功后替换当前 results state。

### 2026-05-25

- **Quiz Studio /create 页面职责修正 + Supabase 保存接入** — 从 `/create` 页面移除 Mock User Result (SimilarityRanking) 和 Final Result Preview 两个模块，因为它们是用户答题后的结果展示，不属于创作者设计测试的页面。创建 `lib/quizzes-db.ts`，实现 `saveQuizSchema()` 函数，按顺序写入 quizzes → quiz_factors → quiz_results → quiz_questions → quiz_options，slug 重复时抛出中文友好错误。创建 `components/quiz-engine/SaveQuizButton.tsx` 客户端组件，含 loading/success/error 三态，成功后显示 slug。按钮已接入 `/create` 页面底部。

### 2026-05-24 (4)

- **Global unified TopNavbar** — Installed `lucide-react`. Created `components/layout/TopNavbar.tsx`: client component using `usePathname()` for active state detection. Three nav items: SelfIDBox (brand), 个人图谱 (Radar icon), Quiz Studio (WandSparkles icon). Active pill uses subtle `bg-white` + box-shadow, inactive items are muted with `hover:bg-white/60`. Icons always visible, labels hidden on mobile (`hidden sm:inline`). Accepts optional `rightSlot` prop for page-specific actions. Integrated into `/profile`, `/create`, and `/explore` (via ExploreClient). Explore search mode still uses its own dedicated search bar; normal mode renders TopNavbar with a search button as rightSlot. Removed all duplicate inline nav markup from the three pages.

### 2026-05-24 (3)

- **Supabase query hardening + caching** — Created `lib/supabase-timeout.ts`: `withTimeout<T>(fn, fallback, label, timeoutMs)` wraps any async query with `Promise.race` + 8s default timeout, returns fallback on timeout/error, logs `[label] timeout` or `[label] failed` with redacted messages, swallows late rejections. Created `lib/cache.ts`: in-memory TTL cache + helper factories (`listQuery`, `singleQuery`, `keyedSingleQuery`) that layer cache→timeout correctly (errors never cached). Updated all read queries:
  - **test-sites-db.ts**: `getCategories` — 8s timeout, 600s cache. `getPublishedTestSites` — 8s timeout, 60s cache. `getTestSiteBySlug` — 8s timeout, 60s cache, per-slug key. `getTestSitesByCategory` — 8s timeout, inline wrapped.
  - **user-profile-db.ts**: `getUserProfile` — 8s timeout, **5s cache** (short: OCR→refresh must see new data). Per-userId cache key.
  - **admin-db.ts**: All 6 read functions (`getAdminCategories`, `getAdminCategoryById`, `getAdminTestSites`, `getAdminTestSiteById`, `getAdminStats`, `getRecentTestSites`) — 8s timeout, **no cache**. CRUD writes unchanged.
- **Timeout prevents 50s hangs**: `Promise.race` returns fallback after 8s, even if undici ConnectTimeout eventually fires. No page throws 500 on Supabase downtime.

### 2026-05-24 (2)

- **/profile UI refinement** — Removed personality tags from ProfileSummary card (tags prop, rendering, deriveTags function all deleted). Moved ScreenshotReportUploader into DataSourceModal as a toggleable inline section ("上传测评截图" button); uploader no longer occupies standalone page area when profile exists (empty state still shows it). Radar chart titles changed to Chinese ("核心人格" / "社会表达") and subtitle kept in Chinese. All 16 dimension labels mapped from English DB keys to Chinese via `DIM_LABELS` dictionary. Radar SVG resized: RADIUS 142→115, LABEL_OFFSET 26→36, giving Chinese labels more breathing room and preventing edge clipping. Radar layout changed from 2-column grid to single-column stack. Deleted bottom "AI-style summary" card (summary already in top card). Removed `tags` prop from ProfileInteractions.

### 2026-05-24

- **Screenshot OCR upload on /profile** — Created `POST /api/screenshot-report` Next.js API route, proxies multipart/form-data to local OCR API (`http://127.0.0.1:8000/screenshot-report`), keeps `OCR_API_KEY` server-side only. Created `components/profile/ScreenshotReportUploader.tsx` client component: file selection with image preview, upload with loading state, success display (test type, main result, OCR confidence), duplicate detection ("这张截图已经上传过"), error handling with retry. Uses dev-mode hardcoded `DEV_USER_ID` with TODO for Supabase Auth. Added to `/profile` page right below the ProfileSummary card. "刷新个人图谱" button calls `router.refresh()`, "查看报告列表" opens existing DataSourceModal. New env vars: `OCR_API_BASE_URL`, `OCR_API_KEY` (no `NEXT_PUBLIC_` prefix).
- **/profile wired to real Supabase data** — Created `lib/user-profile-db.ts` with `getUserProfile(userId)` querying `user_profiles` table via `.eq("user_id", userId).single()`. Rewrote `/profile` page from client component with mock data to async server component fetching real `user_profiles`. JSONB `core_vector`/`social_vector` converted to `RadarPoint[]` via `toRadarPoints()`. Tags derived from top 4 core_vector dimensions. Empty state ("还没有人格图谱") with upload CTA when no profile row exists. Created `components/profile/ProfileInteractions.tsx` client boundary for DataSourceModal open/close state. Removed all mock profile data from page.

### 2026-05-21

- **Profile page optimization** — Simplified `ProfileSummary`: removed "融合画像" (archetype) sidebar card and "SelfID 不是单一测评结果……" note block. Added "数据来源" button at card bottom. Created `DataSourceModal` component: overlay popup with mock data entries (date, test name, results), scrollable, auto-wrap, gradient style matching profile card. Removed bottom "数据来源" VectorCard grid and "About SelfID" footer section. Profile page converted to client component for modal state.

### 2026-05-19

- **`/explore` unified filtering** — Merged categories grid + popular tests into a single tab+filter system. Tabs: "热门" + all DB categories, horizontally scrollable. Date range pills: 7d / 30d / all. URL-driven: `?tab=hot&range=all`. Filtering: server-side by category slug + created_at range, sorted by `popularity_score` desc. Added `created_at` / `popularity_score` fields to `TestSite` type + mapper.
- **Click tracking** — Added `recordTestSiteClick(slug)` in `lib/test-sites-db.ts` (inserts `test_site_clicks` row + increments `test_sites.click_count`). Created `POST /api/test-sites/[id]/click` route. Added `ExternalTestButton` client component: fire-and-forget fetch + `window.open`. Updated `TestSiteDetail` "去做这个测试" button.
- **Admin CMS built** — 7 new routes under `/admin`: dashboard with stats, test-sites CRUD (list/new/edit), categories CRUD (list/new/edit). New files: `lib/admin-db.ts` (CRUD + stats queries), `components/admin/` (8 components: AdminSidebar, AdminHeader, TestSiteForm, TestSiteTable, CategoryForm, StatusBadge, FeaturedBadge, DeleteConfirm). Features: search/filter, tag chip input, toggle switches, delete confirmation modal, form validation.
- **`/test-sites/[id]` Supabase migration** — Replaced `generateStaticParams` + mock `getTestSite()` with dynamic Supabase fetch via `getTestSiteBySlug()`. Route is now fully dynamic (ƒ). Related sites fetched from `getTestSitesByCategory()` with current site filtered out. `notFound()` on miss.
- **`/explore` Supabase migration** — Replaced mock data (`lib/test-sites.ts`) with real Supabase queries (`lib/test-sites-db.ts`) in both `app/explore/page.tsx` and `app/explore/_components/category-page.tsx`. Added `TestSiteRow` / `CategoryRow` types, `mapTestSite()` / `mapCategory()` adapters (snake_case → camelCase, derived accent/difficulty defaults), and empty-state UI for zero results. Pages are now async server components.
- **Radar chart rewrite** — Replaced Recharts `RadarChart` with pure SVG in `ProfileRadar.tsx`. Grid renders as proper N-sided polygon (octagon for 8D data). Removed dimension value grid below charts. Chart is now a server component.
- **AGENTS.md** — Added section 9: after every task, update `TASKER_STATUS.md`.
- **TASKER_STATUS.md** — Created this file. Comprehensive project audit.

### 2026-05-17 (approximate)

- AI Quiz Studio built — 9 components (`components/quiz-engine/`) + data model (`lib/mock-quiz-engine.ts`) + vector math (`lib/quiz-vector.ts`)
- Supabase client + data access layer created (`lib/supabase.ts`, `lib/test-sites-db.ts`)
- Debug Supabase page added (`app/debug-supabase/`)
- All 6 main routes scaffolded and building
- Initial commit (`c56c388`)

---

## 11. Recommended Next Steps

1. Replace homepage (`/`) with actual SelfIDBox landing content
2. Remove unused `recharts` dependency from `package.json`
3. Load Geist font properly via `next/font` in root layout (or remove unused `@theme` references)
4. Centralize the 6-color accent map into `lib/colors.ts` (de-duplicate from 4 files)
5. Wire up Supabase data layer to `/explore` and `/test-sites/[id]` (replace mock `test-sites.ts`)
6. Build `/inbox` page — email import instructions + import status
7. Build `/q/[id]` and `/r/[id]` — quiz taking + result pages
8. Connect `/profile` radar charts to real backend fusion API
9. Connect Quiz Studio to real AI quiz generation pipeline
10. Add DB schema migration file to repo
11. Add error boundaries and loading states
