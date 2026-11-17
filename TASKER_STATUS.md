# TASKER STATUS

Last updated: 2026-11-17

---

### 2026-11-17 — UI 更新推送前审查与回归修复

- 修复共用小票弹层键盘焦点逃逸问题，加入对话框语义、顶层焦点约束、Escape 关闭与焦点恢复，避免键盘切换底层视图后留下滚动锁定。
- 修复详情请求晚于关闭或再次打开操作返回时，重新打开旧小票或覆盖新小票的问题。新增 `lib/__tests__/source-card-open.test.ts`，覆盖关闭后响应、旧响应与旧失败三类竞态。
- 46 个变更 TS／TSX 文件 ESLint、TypeScript、107 项单测及 diff 检查通过。排除独立数据脚本后的 UI 提交快照完成默认 Turbopack 生产构建，54 个新增／修改源文件与构建快照一致。
- Chromium／WebKit 验证弹层焦点及延迟请求回归，并以生产构建完成登录页、创建页、游客个人页跳转、真实 Explore 列表、答题、带时间小票、PNG 下载与关闭流程，无 hydration 错误。个人页使用模拟账户验收，真实账户及 iOS 真机待验收；构建保留现有 middleware 弃用等非阻断提示，临时验证服务已关闭。

### 2026-11-17 — 雷达小票正式接入与 900ms 出票

- 全部共用小票出票统一为 900ms，保留底边先从页面顶部进入及两次约 90ms 停顿。个人页数量行右侧增加线条雷达／小票切换图标，两视图采用 180ms 淡入，保留悬挂小票各排横滑位置。
- 新增 `RadarReceipts.tsx` 与 `radar-receipts.module.css`，上下展示核心人格、社会表达两张雷达小票。沿用 `SELFID_FACTORS` 的两组各八维定义与说明，缩略态展示数据覆盖、雷达及较高的两项数值；展开显示雷达、逐维分数／说明和更新时间，并复用出票、长票滚动与 PNG 下载。
- 个人页并行接入现有 `getUserProfile` 只读读取，画像读取失败时提示错误并保留收藏展示。支持旧数字／对象字段、零值、缺失数据与空收藏。共用 `ProfileRadar` 增加响应式标签与缺失维度断线，SVG 标题使用单个字符串，坐标统一两位小数，保证 Node／WebKit 首屏一致。
- 新增 `lib/__tests__/profile-radar.test.tsx` 回归 SVG 服务端标题、缺失维度与跨引擎精度问题。ESLint、TypeScript、104 项单测及 diff 检查通过。Chromium／WebKit 组件验证覆盖四类尺寸、六类画像格式、两视图／滑动保留、180ms 过渡、900ms 出票、空态／错误态、雷达标签及 PNG 内容；隔离 Next 工作区完成两引擎、四类尺寸、五类数量的 SSR／切换／展开验收，确认无 hydration 错误或警告。生产数据源零行只读查询通过，浏览器使用模拟账户与数据，iOS 真机待验收；临时服务已关闭。

### 2026-11-17 — 雷达入口与雷达小票交互审核示例

- 在仓库外新增 `profile-radar-receipts-preview.html`，数量行右侧使用线条雷达图标切换个人页视图。雷达视图采用上下排列的“核心人格／社会表达”两张小票，缩略态展示雷达图、简述和两项摘要，点击后按雷达图／逐维分数及解读／票底信息展开。
- 两类小票示例统一为 900ms 顶部出票，底边先进入并包含两次约 90ms 停顿，可通过示例设计控件调整时长。维度数值、解读与测试票内容均为排版演示，正式功能实施待审核。
- Chromium／WebKit 在 320／390／736px 检查通过，覆盖右侧图标对齐、视图往返、两张雷达小票、缩略图标签边界、900ms 底边先出／两次停顿、五项详细解读、长票滚动及关闭返回。

### 2026-11-17 — 审核通过的顶部出票口动画正式接入

- 新增共用 `components/share/ReceiptPrint.tsx`，个人页／数据来源弹层及 quiz runtime 自动弹出、再次分享均接入。根据卡片自然高度和弹层位置计算屏幕外起点，整张小票底边先从页面顶部进入，保持尺寸向下移动，1.4 秒内包含两次约 140ms 停顿。
- 共用样式改为整张票面的平移。出票时由全屏弹层顶部裁切，长票也使用完整自然高度；结束后恢复长票滚动，保存／登录操作淡入并开放交互。保留加载就绪后出纸与系统减少动态效果支持。
- ESLint、TypeScript、101 项单测和 diff 检查通过。Chromium／WebKit 模拟数据验证覆盖四类尺寸、底边先出现／票头仍在屏幕外、恒定宽高、单向下移、两次停顿、异步旧记录、动画中关闭／重开、自动／手动分享、长票滚动及有图 PNG 内容。另验证动画自然结束、结束前后宽度一致和操作解锁。iOS 真机待验收，临时服务已关闭。

### 2026-11-17 — 顶部出票口动画审核示例

- 在仓库外生成 `receipt-bottom-first-preview.html`，以矩形卡片模拟从屏幕顶部外侧向下送纸。卡片底边与底部标签先露出，整张保持固定尺寸向下移动，包含两次短暂停顿及重新出票按钮，正式页面调整待审核。
- Chromium／WebKit 在 320／736px 预览宽度下检查通过，验证初始完全隐藏、底部先出现、单向下移、两次停顿、最终完整入屏及按钮重播。

### 2026-11-17 — 分享小票改为向下出纸动画

- 新增共用 `components/share/receipt-print.module.css`，以从上向下裁切展开和 24px 以内的下移实现出纸效果，总长 1.05 秒，分三段推进并包含两次约 105ms 停顿。个人页／数据来源共用弹层与 quiz runtime 结果页自动弹出、再次分享使用同一动画，支持系统减少动态效果设置。
- 共用弹层接入现有 `cardLoading` 状态，异步旧记录在正文就绪后启动出纸。动画位于导出节点外层，展开后继续支持长票滚动、关闭与重开。
- 更正上一轮 PNG 验收遗漏，旧验证产物与本轮测试均发现 WebKit 首次生成 PNG 可能缺少结果图片。本轮在 Safari 有图分享卡导出前预渲染一次，固定本次点击对应的卡片节点，再生成正式 PNG；两处分享入口已通过实际下载图片内容及图片区像素检查。
- ESLint、TypeScript、101 项单测与 diff 检查通过。Chromium／WebKit 模拟数据组件验证覆盖 320px／390px 手机、桌面、平板，逐点验证向下展开、两次停顿、加载后启动、动画中关闭／重开、自动和手动分享、减少动态效果、有图／无图／长票滚动及 PNG。iOS 真机待验收，临时验证服务已关闭。

### 2026-11-17 — 个人页无图副标题与正式分享小票时间

- 个人页无图缩略小票在结果名称下加入已有副标题，按可用高度显示一至两行并限制文字边界，纯文字结果与 tags 保持分区。图片失败回退到文字小票时同样展示副标题。
- 正式分享小票底部增加虚线分隔的创建时间，11px 字号，左侧标签、右侧数字时间，统一 UTC+8 并纳入 PNG 导出。个人页展开、数据来源与答题分享入口传入时间，缩略小票仅展示原有内容和新增副标题。缺失或无效时间时隐藏时间区。
- 答题保存接口使用现有 `created_at` 字段补充 `createdAt` 响应。当前结果先固定生成时间，保存成功后切换为数据库记录创建时间；游客或保存失败时使用本次生成时间。历史游客补存记录沿用入库时刻。
- ESLint、TypeScript、101 项现有单测、3 项隔离保存接口回归及 diff 检查通过。Chromium／WebKit 验证五类尺寸、长副标题、破图、0–100 张小票、时间缺省／非法／跨日、游客／已保存／失败／旧接口响应、分享重开及 PNG 导出；隔离 Next 工作区的个人页 SSR／展开／导出流程通过。生产数据源零行只读查询确认 `id`／`created_at` 字段有效。浏览器使用模拟账户和数据，iOS 真机待验收，临时 6002／6003 服务已关闭。

### 2026-11-16 — 分享卡片测试时间可行性检查

- 核对共用分享卡、答题结果入口、个人页列表／详情与游客登录后补存链路。分享卡当前缺少时间参数，个人页来源及详情已携带 `quiz_attempts.created_at`，可以通过前端传参展示现有记录时间并纳入 PNG 导出。
- 仓库 schema 与插入逻辑表明 `created_at` 使用记录入库时刻。即时答题流程未保留完成时间，游客补存数据也未携带原完成时间。精确记录得到结果的时刻需要在结果生成时固定时间并随补存链路持久化，历史补存记录缺少可还原的原始完成时间。建议小票底部用虚线分隔的小字号日期时间，本轮完成代码评估。

### 2026-11-16 — Profile 悬挂区调整为三排

- 悬挂区上限调整为三根横向绳子，每排默认三张，超过九张后从第一排轮流追加并独立横滑。现有尺寸计算按三排分配可用高度，使原四排状态下的小票放大。
- ESLint、TypeScript、101 项 Vitest 单测通过。Chromium／WebKit 模拟数据组件验证通过，覆盖五类尺寸、0–100 张数量切换、十四张分配为 5／5／4、横滑／鼠标拖动、图文边界、详情和 PNG 下载。临时验证服务关闭，本轮浏览器验收使用组件模拟数据。

### 2026-11-16 — Profile 悬挂小票正式接入

- 新增 `HangingReceipts.tsx` 与局部 `hanging-receipts.module.css`，个人页按每排三张、最多四根横向绳排展示，超过十二张后轮流追加并支持各排独立触屏横滑和鼠标拖动。绳子下垂统一 15px，小票倾斜不超过 1°，采用木夹、虚线、票底穿孔，操作使用滑动与点击展开。
- 按附件调整有图小票为图片／虚线／结果名称，隐藏该类缩略票的 tags。无图或图片失败时使用大字号结果名称、虚线与 tags，长名称与标签限制在票面内，点击查看完整结果并沿用 PNG 下载。四排随可用宽高缩放，矮横屏允许纵向滚动。
- 个人页移除两个雷达展示，使用现有结果来源列表判断空态，取消已移除雷达所需的聚合画像读取。复用现有登录校验、结果读取与详情交互，代码范围为个人页展示入口和新增前端组件。
- ESLint、TypeScript、101 项 Vitest 单测和 diff 检查通过。Chromium／WebKit 模拟数据组件验证覆盖 0–100 张、五类尺寸、分组／溢出、图文边界、破图、键盘、拖动、详情及 PNG 下载。另在隔离 Next 工作区验证当前个人页的服务端读取与浏览器流程，覆盖两引擎、四类尺寸和 0／1／3／12／14 张；真实账户与 iOS 真机待验收。临时服务关闭，6002／6003 释放。

### 2026-11-16 — Profile 悬挂小票交互示例

- 在仓库外生成可交互审核示例 `profile-hanging-receipts.html`，使用演示结果与现有图片素材，支持 1／3／6／12／14／20 张数量切换、最多四根横向绳排、超过十二张后的轮流追加及独立横滑、点击展开完整票面。视觉采用米白缩略小票、浅弧绳子、木夹与轻微错落倾斜，雷达图位置后续规划。
- Chromium／WebKit 检查通过，覆盖数量分配、四排入屏、溢出排滑动、详情开关与 320／390／736px 外层宽度，另验证鼠标拖动不会误开详情。正式页面实施待审核。

### 2026-11-16 — Profile 悬挂小票展示评估

- 用户确认展示方向为上下排列的横向绳排。1–3／4–6／7–9／10–12 张分别使用 1／2／3／4 根绳子，每排默认最多展示 3 张；超过 12 张后从第一排开始轮流追加，对应绳排独立横向滑动。
- 已核对当前个人页与分享卡片结构。手机四排三张适合作为缩略总览，缩放需同时受可用宽高与纸张比例约束，悬挂态建议突出名称／主图／少量特征，点开阅读完整票面。绳子采用轻微下垂、夹子错落和纸张小角度倾斜，具体视觉及实施待后续确认。

### 2026-11-16 — 分享卡片图片分割线间距

- 分享卡片图片区上下各增加 16px 内边距，高度同步设为 262px，为图片与两条虚线留出空间。
- Chromium／WebKit 多尺寸排版及 PNG 导出检查通过，覆盖有图、无图、竖图、破图和长文本；临时验证服务已关闭。

### 2026-11-16 — 分享卡片小票样式与无图大标题

- 共用 `QuizResultShareCard.tsx` 改为米白票面，复用结果页穿孔边缘，顶部展示测试标题／品牌，图片完整显示，结果名称、副标题、说明及矩形标签依次排版。无图和图片失败状态使用 36–56px 词组分行大标题，保持纵向票面，长内容自然增高。
- 新增局部 `components/share/quiz-result-share-card.module.css`，样式覆盖结果页、个人页轮播／结果块与数据来源中的共用分享卡片，原转图 ref 继续用于导出。
- ESLint、TypeScript、101 项 Vitest 单测与 diff 检查通过。Chromium／WebKit 各验证 272／346／382／560px 下有图、无图、缺省字段、长文本、竖图和破图，以及共用个人页分享下载；Next 实际答题入口覆盖桌面、440px 和 320px 手机下两种卡片的弹窗、关闭、滚动解锁与 PNG 导出，共验收 12 张真实下载图片。图片案例使用公开原图，测试数据由仓库外只读替身提供，iOS 真机待验收；临时服务关闭并确认释放 6002／6003。

### 2026-11-16 — 分享卡片小票样式审核预览

- 使用真实“麦辣鸡翅”结果数据和素材，在仓库外生成小票分享卡片预览与前后对照图。米白票面、上下穿孔、虚线分区和矩形特征标签与结果页呼应，测试标题／品牌移至顶部，副标题放在结果名称下方，图片留白略作收紧。
- 同份内容下沿用当前分享组件实测的 382×553.69px 宽高，Chromium 渲染与内容溢出检查通过。预览文件位于 `share-receipt-preview/`，正式组件实施待用户审核。

### 2026-11-16 — 修复大屏手机与平板布局

- 全局铺满规则调整为视口宽度 ≤600px 或存在粗指针输入能力（`any-pointer: coarse`）。手机、平板及其他触控设备使用全屏米白画布，宽屏鼠标设备使用居中的 430×932px 桌面画布；屏幕旋转与窗口缩放通过 CSS 自动更新。
- Explore、加载占位与两个详情相关推荐移除重复的 430px 内容上限，使平板列表使用可用宽度，保留双列和 12px 瀑布流间距。本轮改动集中于 5 个前端文件。
- ESLint、TypeScript、101 项 Vitest 单测及 diff 检查通过。Chromium 与 WebKit 引擎覆盖 32 组触控／鼠标及视口组合，并以实际组件验证 iPhone 16 Pro Max、iPad Pro 13 横竖屏、桌面、窄窗口、六类弹窗、嵌套滚动锁定及旋转。真实页面验证 Explore／搜索 API 73 条数据、两个详情推荐、菜单／搜索与手机／平板答题分享，iOS 真机尚待验收。临时服务已关闭，6002／6003 确认释放。

### 2026-11-16 — 大屏手机与平板画布问题定位

- 当前全局 CSS 用视口宽度不超过 430px 作为铺满屏幕的条件，同时将默认画布限制为 430×932px。Chromium 触屏模拟复现 iPhone 16 Pro Max 440×956px 视口下保留 20px 圆角、左右各 5px 与上下各 12px 留白；iPad Pro 13 竖屏 1032×1376px 下仍使用 430×932px 画布。
- 该条件同样适用于相同 CSS 视口的真实设备。根因及复现结果已确认，手机边界与平板尺寸规则待调整；Safari 实机表现尚未验收。

### 2026-11-16 — 全站统一手机画布与大标题

- 根布局与全局错误页接入手机画布，桌面居中最大 430×932px，外围深炭灰、画布米白，短窗口随视口收缩，宽度不超过 430px 时铺满屏幕。页面在画布内滚动，导航支持路径切换回顶、浏览器后退恢复滚动位置及键盘滚动。
- Tailwind 响应式规则改为依据命名容器宽度，页面／侧栏／个人页轮播／分享卡与弹层尺寸使用容器单位。弹层统一标记，通过 CSS 锁定背景滚动并覆盖嵌套及退出动画，移除旧的 Safari body 固定定位锁定钩子；页面入场采用淡入，管理导航调整为可展开入口。纯文字小票标题增至 24–28px，继续按词组分行。
- Chromium 验证覆盖 320／390／430／768／1440px、短桌面窗口、公开页面与两个真实详情页、404、答题／结果／分享、菜单／搜索、六类弹层及嵌套滚动锁定，真实 Explore 数据与搜索 API 返回 73 条。创建页／个人页／管理导航和表格使用仓库外独立组件样例验收；受保护真实页面仅验证游客登录跳转，WebKit 引擎未安装，Safari 实机待验收。
- ESLint、TypeScript 与 diff 检查通过。101 项 Vitest 测试及 6 项 Node 脚本测试分别通过；完整 `npm test` 会将既有 `scripts/seed-simulated-users.test.cjs` 当作 Vitest 收集，报 No test suite found。首次预览命中旧 Turbopack 样式缓存，旧缓存已在生成目录内改名留存，重新生成后默认开发模式验证通过。临时服务全部关闭，6002／6003 已确认释放。

### 2026-11-16 — 全站手机画布方案评估

- 核对 FLIPIN 参考站，桌面主体最大 430×932px，窗口较矮时高度随视口收缩，外围深色背景；手机端主体铺满视口。
- 核对根布局、导航、弹层及路由，建议统一全站手机画布，并同步调整基于浏览器宽度的响应式规则、固定定位、滚动锁定和管理页宽表格。纯文字卡片标题建议由 20–24px 增至 24–28px。本轮完成可行性评估，具体样式实施待后续执行。

### 2026-11-16 — 纯文字小票标题分行

- 共用 ReceiptTestCard 的纯文字标题收窄至约四个汉字，按词组换行，示例呈现“你的灵魂／是什么／颜色”，保留原标题文字与标点，长标题最多显示四行。应用于 Explore 及两个详情页的相关推荐。
- ESLint、TypeScript 与 Chromium 独立组件样例验证通过，覆盖 320／390／430／1440px、中英文长标题、有图标题及横向溢出检查。本次浏览器检查采用组件静态渲染，未重跑整页交互。

### 2026-11-16 — Explore 与详情推荐区双列小票瀑布流

- Explore 主体调整为桌面居中、最大 430px 的窄版布局，加载占位同步为两列。列表卡片内容聚焦于标题、图片和简介，采用图片主视觉或大标题纯文字排版，简介位于虚线下方，图片按原比例显示。
- 新增 `ReceiptTestCard.tsx`、`MasonryTestList.tsx` 和局部 `receipt-cards.module.css`，由 Explore、QuizDetail 的相似测试和 RelatedTestSites 的相关推荐共用。瀑布流按原列表顺序依次填入较短的一列，ResizeObserver 在图片／文字尺寸变化后重排，横向与同列纵向间距统一 12px。
- ESLint、TypeScript 与 Chromium 验证通过。真实详情页各 3 张推荐卡片正常渲染；独立样例覆盖 320／360／390／430／768／1440px、原图比例、延迟加载、破图转文字、键盘顺序、筛选／时间范围、随机刷新和空列表，间距实测通过。首次真实列表读取曾触发既有 8 秒超时，后续读取恢复完整数据；验证使用的临时服务已关闭并确认释放 6002。

### 2026-11-10 — Quiz Runtime 候选结果缩略图

- “也可能像”的每条结果右侧展示对应 `result.image_url`，采用手机 48px、桌面 56px 的直角区域，图片等比例完整显示并靠右对齐；左侧长标题和副标题自然换行。
- 缺图或加载失败时保留文字行。沿用现有图片字段与原图地址，变更集中在 `QuizResult.tsx` 的展示逻辑。
- ESLint、TypeScript 和 Chromium 桌面／手机检查通过，独立样例覆盖图片对应、左右对齐、长文本、有图／无图混排与破图回退；真实 Explore 数据读取正常。验证请求的实际后端写入为零，临时服务结束后确认释放 6002 端口。

### 2026-11-05 — 排查本地端口占用及 Explore／登录连接失败

- 6001 被上一轮留下的预览服务占用，已停止。另用 6002 验证后也关闭，两个端口均确认释放。
- 独立普通 Node fetch、原生 HTTPS 和系统 curl 直连 Supabase 均复现 ECONNRESET；系统已启用 127.0.0.1:7897 代理，但 Node 进程没有代理环境配置。显式经过该代理后，公开数据查询与 Auth 设置接口恢复 200。
- 使用当前代码及真实数据，以 HTTP_PROXY／HTTPS_PROXY、NO_PROXY 和 NODE_OPTIONS=--use-env-proxy 启动临时 Next 服务，Explore 正常渲染、搜索接口返回 73 条数据，登录表单及浏览器 Auth 接口正常，浏览器无错误。尚未使用真实账号凭据完成登录验收。
- 本次仅补充排查记录并清理本轮启动的服务，没有修改应用代码、环境文件、全局代理配置或数据库。

### 2026-11-05 — Quiz Runtime 小票样式第一版

- 答题、结果、加载及异常状态统一为米白直角票面、上下穿孔边缘和虚线分区；选项改为带字母编号的条目，选中后深色反显并显示勾选，按钮和标签采用矩形样式。
- 新增局部 `components/quiz-runtime/quiz-runtime.module.css`。结果图片归入票面，分享弹窗增加宽高约束和滚动区域。改动限定前端展示，沿用原答题、计分和保存流程。
- 验证通过 ESLint、TypeScript 和 Chromium 桌面/手机浏览器检查，覆盖返回上一题、键盘答题、游客暂存、同步中/成功/失败、带图结果、试玩上限与空结果。使用仓库外独立只读预览数据和浏览器请求替身，实际后端写入为零；Safari 用户代理分支通过，尚未进行 WebKit 引擎及 Safari 实机验收。

### 2026-11-05 — 撤回探索页石墨磨砂主题试改

- 按用户要求恢复本轮修改的 8 个前端文件，删除新增的探索页主题样式文件，停止本轮启动的开发服务。原有未提交改动保留。
- 核对上述前端文件与修改前版本一致，主题文件已移除。本轮最终仅保留本状态记录。

### 2026-11-02 — 批量修订新增用户资料、测评内容及答题分布

- 按用户新要求，仅修改 `sim-20261102-v1` 的 64 个用户与 24 个测评：业务 display_name 清空并删除 Auth 同名 metadata；username 改为 64 个不同的生活化网名；邮箱全部随机化，QQ 30 个均为纯数字，163/Outlook/Gmail 仍为 22/6/6。Auth、email identity、业务用户与报告发件邮箱同步，未发邮件。
- 24 个测评去掉标题“模拟”前缀、改为 sandbox、清空 cover_image_url/published_at；主题描述及结果/因子说明去掉通用造数文案。保留内部批次信息和原始备份供追溯。
- 保持 432 次答题及原月份时间分布，重分配 423 次，最终 309 次关联 25 个原有已发布测评，64 人均覆盖原测评；当前答案共 5740 条。保护其他用户的一条答题及答案；24 个沙盒最大累计 6 次，未超过 20 次上限。同步重算结果、64 份画像、测评计数及完成奖励；原有测评内容不变，两位原作者奖励分别增加 156/150。
- 新增 `scripts/revise-seeded-data.cjs`，本地忽略目录保存 revision-before/plan/SQL/verification；事务先完整预演回滚再提交，检查并保护目标归属和并发计数/积分变化。批量字段、答案/结果/画像、原内容保护与两个新邮箱登录验证通过，脚本语法/ESLint及 diff 检查通过。全局积分账本两处已有差额在修改前即存在，未修补无关手动余额。

### 2026-11-02 — 已执行当前 Supabase 的 64 人模拟数据批次

- 在正式 `selfidbox` project 执行 `sim-20261102-v1`：新增 64 个 Auth/业务用户、24 个完整测评（384 因子/96 结果/240 题/960 选项）、432 次答题/4310 条答案、40 份报告、64 份画像/积分账户、430 条积分流水、40 条模拟 AI 日志及 40 个图片文件；未创建环境、改结构/RLS、部署或调用付费 AI/OCR。
- QQ/163/Outlook/Gmail 为 30/22/6/6；历史覆盖 2026-05-16 至 11-02 的计划截止点，八九月注册和答题均占 75%。先验证 2 个账号，再完成全批次；管理 SQL 按批次/精确 ID 校准 Auth、邮箱身份及业务注册时间，实际审计与登录时间保留。总账号现为 Auth 76/业务 77，保留原有差异。
- 独立 SQL 校验时间、关联、画像计数和积分均无不一致；逐项数据、文件哈希及增量融合幂等验收通过。原 18 表 5414 条记录与 12 位 Auth 用户核心资料校验不变；抽样 5 账号登录/私有数据隔离通过。本地 6 项造数测试与脚本 ESLint/语法/diff 检查通过。
- 正式网站 3 个公开入口及 4 位代表用户的画像/来源/我的测评读取正常，跨用户详情为 404；浏览器无错误检查因 React #418 水合错误未通过，该错误在原有 `/quizzes/0` 页面也复现，已保留失败证据，未扩展修改前端。
- 新增 scripts 下造数、6 项测试和网站验收脚本；新增执行结果/维护文档并更新原方案。`.seed-data/` 已忽略，保存凭据、ID/图片清单、基线和验收结果、截图及待复核清理 SQL。外部解析服务不可达，未猜测失败状态；guest_signup 与逐用户站外点击仍按现有能力边界保留。

### 2026-11-02 — 汇总完整模拟数据方案文档（未执行）

- 新增 `docs/simulated-user-data-plan.md`，合并现有 project 的用户/角色/邮箱、完整历史时间及 Auth 时间校准、逐表字段、关联规则、图片、积分、AI、分阶段实施、验收及按批次清理方案。
- 建议目标：64 人、432 次答题、40 份有效报告、8 位作者/24 个测评、40 条模拟 AI 日志；八九月注册与答题均占 75%。逐表清单实际共 18 张 public 表，修正先前记录中的 17 张计数。
- 核对当前测评状态接口使用 submitted，答题部分仍判断 submitting；方案限制已发布/沙盒答题，未改业务代码。外部解析契约、guest_signup 和逐用户点击能力仍按文档标明边界，不声称已覆盖真实外部调用。
- 仅新增方案文档及更新状态；文档 diff 检查通过。未创建脚本、账号、业务数据或图片，未执行数据库写入、登录验证或付费调用。

### 2026-11-02 — 修正 Auth 历史创建时间的方案边界（未执行）

- 核对已安装 Auth SDK：AdminUserAttributes 未提供 created_at 参数；这属于 Admin API 的接口限制，不能据此断言数据库时间无法调整。
- 正式项目只读权限检查确认当前 SQL 连接为 postgres，具备 auth.users.created_at 与 auth.identities.created_at 的 UPDATE 权限。可采用 Admin API 创建账号后，按模拟批次和精确 ID 清单，通过受控 SQL 事务协调 Auth、身份与业务用户的模拟历史时间；保留实际执行时间及模拟标记，不改认证凭据或伪造历史审计日志。
- 该路径直接涉及 Auth 托管表，实施前需检查约束和触发器并以少量模拟账号验证登录及时间一致性；目前仅验证 SDK 和数据库元数据，未执行 UPDATE、未完成写入或登录验证。本次仅更新方案记录。

### 2026-11-02 — 补全模拟用户数据清单、历史时间与邮箱分布（仅方案）

- 只读核对当前 17 张 public 表及用户、答题、画像、积分、AI、截图和站外点击代码；补充每人必备账号/资料/答案/结果/画像/积分、按角色生成的报告/创作/AI 日志与关联图片，以及共享配置的覆盖边界。
- 建议 64 人邮箱分配 QQ 30、163 22、Outlook 6、Gmail 6；业务历史覆盖 2026-05-16 至执行时刻，八月/九月行为占比建议 40%/35%，模拟业务注册月份人数为 2/3/5/25/23/5/1（五月至十一月）。不发送邮件，邮箱字符串不代表真实邮箱归属。
- 明确 Auth 实际创建时间与模拟业务历史的区别；按时间顺序保持创建、发布、答题、报告、画像和积分一致。画像 report_count 包含有效报告与答题；站外点击无 user_id 且当前接口仅更新站点计数，不能声称已有逐用户点击追踪；guest_signup 需关联业务证据，不机械生成。
- 本次仍未创建脚本、账号、图片或任何数据库记录，未修改业务代码及结构；仅更新方案记录，文档 diff 检查通过。

### 2026-11-02 — 当前 Supabase 项目模拟用户与使用数据方案（未执行）

- 只读核对正式项目 `selfidbox`：12 个 Auth 账号、13 条业务用户记录、144 次答题、1552 条答案、4 份报告、9 份画像；账号同步触发器已存在。Auth 与业务用户数量不一致，执行前需核对归属，不自动删除现有记录。
- 建议新增 64 个带批次标记的模拟账号，分轻度/普通/重度用户，生成关联测评、答案与可重建画像；创作者、报告与积分按测试范围补充。复用当前 project，不新建环境；模拟 AI 日志需单独标识，不作为真实调用或费用。
- 后续实施应提供预览、固定随机种子、批次清单、幂等重跑与按依赖清理，核对关联、计分、画像、积分及普通用户权限；同项目的公开内容和统计会受到模拟数据影响。
- 本次仅提供方案并更新状态文档，未创建脚本、账号或业务数据，未修改数据库结构、配置及应用代码，未执行写库或测试。

### 2026-11-02 — Explore 默认时间范围改为全部时间

- `app/explore/page.tsx` 的默认时间范围改为 `all`；`components/explore/ExploreClient.tsx` 同步调整 URL 默认值，手动选择 `7d` / `30d` 时保留参数，刷新后保持筛选。
- 验证：两个修改文件 ESLint 通过；直接执行源码中的范围解析和 URL 同步函数，确认默认/显式/无效参数处理及三种范围的 URL 刷新回读正确。无新增文件或架构变更，未部署。

### 2026-11-02 — 确认线上用量未更新的部署版本差异

- 用户确认实际在 `selfidbox.com` 生成内容。通过 Vercel 部署检查核对：正式域名当前对应 READY 部署 `dpl_5PuYVW8bC1tFECfSZca7dqwz9QZZ`，提交为 `51ac074`；AI Usage 修复提交为本地 `v1-release` 的 `d950e54`，尚未包含在当前正式版本中。
- 本地 `localhost:6001` 运行该仓库的 Next dev；本地 anon/service_role key 角色与正式 Supabase 项目匹配。本次服务端客户端真实只读查询成功（200、89 条），线上 SQL 也确认仍无新记录；前次直连失败本次未复现。
- 结论：本地可验证日志功能，同项目数据库允许本地/线上读取同一批记录；线上生成请求仍执行旧代码，需要部署包含修复的提交后再验收。仅更新排查记录，未继续修改业务代码、未写入线上数据库、未部署。

### 2026-11-02 — 修复 AI Usage 漏记与重复侧边栏

- `lib/ai/track-ai-usage.ts` 复用现有 service_role 客户端写日志，检查 Supabase 返回的 error、记录写入异常并返回可等待的 Promise；写入失败仍不改变 AI 业务响应。
- 四个 quiz-ai 生成接口改用已认证 `user.id`，等待日志写入；补齐 AI 输出缺字段、结构校验失败等漏记分支，保留已返回的 tokens（含后处理异常）。沿用现有表结构、计费与生成流程。
- AI Usage 页面移除重复侧边栏与嵌套主内容区，复用 Admin layout；读取或配置失败显示独立错误提示。继续展示最近 200 条，手动刷新读取最新记录。
- 新增 `lib/__tests__/ai-usage.test.ts`，覆盖四个接口的成功/失败记录、用户归属、等待写入、写库异常隔离、AI 调用前拦截，以及管理页面布局和读取错误；全量 Vitest 101 项、TypeScript noEmit、本次修改文件 ESLint 与 diff 检查通过。
- 线上只读 SQL 确认 service_role 可绕过 RLS 且具备 SELECT/INSERT 权限。本地现有服务端配置指向正式项目且配置了 service key，但直连查询两次均 fetch failed，真实 AI→数据库写入尚未联调；未调用付费 AI、未写入线上数据库、未部署。

### 2026-11-02 — AI Usage 漏记与重复侧边栏排查（仅方案，未修复）

- 只读核对代码与线上 Supabase：`ai_usage_logs` 已开启 RLS 且无 policy，四个 quiz-ai 接口却传入普通 SSR 用户客户端写日志；线上共 89 条，最新记录为台北时间 2026-06-15 00:47:48，近七天无新增。
- 确认日志 insert 未检查返回的 error、调用未等待写入；部分 AI 输出校验失败分支漏记或遗漏 tokens，日志 userId 来自请求体。页面与 Admin layout 重复渲染 AdminSidebar，页面已有 force-dynamic 但无主动刷新机制。
- 最小方案：沿用现有日志函数、表结构及 Admin layout，日志改服务端 service_role 写入、检查错误并等待完成，补齐失败分支与已认证用户归属，移除页面重复布局；查询失败与空记录分别显示。刷新方式建议先保留手动刷新。
- 验证仅包含源码、已安装 SDK 行为及线上只读 SQL；未调用付费 AI、未写入数据库、未执行修复或业务测试。仅更新本状态文档，无新增业务文件、架构或数据流变更。

### 2026-11-01 — 已上线项目简历亮点评估

- 根据用户确认，将项目状态更新为已上线；核对代码后提炼分阶段 AI 创作、可达范围校准计分、16 维多源画像融合、积分事务及 Safari 兼容等简历亮点。
- 明确表述边界：OCR 为外部服务集成；缓存与限流为进程内存实现；计分与画像权重为启发式规则，未验证心理测量效度、线上规模或性能提升比例。
- 验证：现有 Vitest 3 个测试文件、16 项测试全部通过（首次遇沙箱临时目录 EPERM，改用仓库内忽略目录作为临时目录后通过）；未进行线上验收。仅更新状态文档，未新增业务文件或改变架构、数据流。

## Current State

SelfIDBox **已上线**（2026-11-01 用户确认）。以下功能进展保留为既有开发记录，线上规模及运营指标待补充。

**导航系统重构**：底部 navbar 已完全移除，替换为顶部 Greeting 右侧 ≡ 按钮 + 右侧滑出托盘（SlideOutTray）。托盘内集中了全部导航项（主页/创作/个人/搜索）+ 用户功能（邮箱/数据来源/下载APP/登录退出），遵循小票设计语言（直角矩形、米白色、虚线分割、穿孔条）。`/create` 页面新增顶部 Greeting。

**Profile share card 下载**：RotatingCardModal 新增可选下载按钮，SourceBlocks / CoverFlowSources 均已接入。

**探索页排序修复**：站外测评点击权重降为 0.15×，冷启动加成从 2× 降为 1.3×，站内 Quiz 排序权重有效提升约 10×。

**Quiz Studio UX 多项优化**：trait 回车保持输入框、废弃分享文案移除、深度滑块标签修正、因子名称不可编辑、选项自动重编号、默认结果名空白。

**当前阻塞**：无。

**下一步**：持续线上维护，补充实际使用及性能指标，用于简历成果描述。

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

### 2026-07-11 — 导航系统重构：底部 navbar 移除 + 右侧滑出托盘 + Profile share card 下载

- **SlideOutTray 组件**（`53e1710`、`15ad1c7`）：
  - 新建 `components/navigation/SlideOutTray.tsx`（~260 行），完全自包含
  - ≡ 汉堡按钮位于 Greeting 右侧，点击后托盘从右侧滑入（280px / max 75vw）
  - 托盘内集中全部功能：4 个导航项（主页/创作/个人/搜索）+ 用户区域（未登录显示"登录"按钮，已登录显示用户名+数据来源+下载APP+退出登录）
  - 所有弹窗内聚在组件中（SearchOverlay、DataSourceModal、PwaDownloadModal）
  - 完整小票设计：直角矩形、`bg-[var(--surface-card)]` 米白底、虚线分割、顶部/底部穿孔条
  - 遮罩优化：`backdrop-blur-sm` → 纯暗色透明 `bg-[var(--ink)]/25`（省 GPU 性能）

- **底部 navbar 完全移除**（`15ad1c7`）：
  - 删除 `components/navigation/BottomAppNavbar.tsx`（~322 行）
  - `NavbarLayout.tsx` 精简：移除 BottomAppNavbar 导入/渲染/spacer，保留 PageTransition 逻辑
  - 无外部依赖——仅 NavbarLayout 引用 BottomAppNavbar，安全删除

- **页面集成**：
  - `/explore`（ExploreClient）、`/profile`（page.tsx）：Greeting + ≡ 按钮水平排列
  - `/create`（page.tsx）：顶部新增 Greeting + ≡ 按钮行（之前没有问候语）
  - 三个页面均已接入 SlideOutTray

- **Profile share card 下载按钮**（`9cd9f6a`）：
  - `RotatingCardModal` 新增可选 `cardRef` prop + 下载按钮（`html-to-image` toPng 导出 PNG）
  - 按钮位于卡片下方右对齐（`self-end`），不重叠卡片主体
  - `SourceBlocks.tsx`、`CoverFlowSources.tsx` 均接入：创建 ref → 传 QuizResultShareCard + RotatingCardModal

- 验证：`npm run lint` 零错误，`npm run build` 零错误，`npm run test` 16/16 通过

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

> 更早记录见 [`PROJECT_HISTORY.md`](./PROJECT_HISTORY.md)（2026-06-25 及更早）

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
