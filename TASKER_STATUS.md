# TASKER STATUS

Last updated: 2026-06-01

---

## Recent — 2026-06-01

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
