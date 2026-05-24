# TASKER STATUS

Last updated: 2026-05-24

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
| 8 | `/create` | `app/create/page.tsx` | Static | **Prototype (mock)** | AI Quiz Studio — 9-step static walkthrough. All data from `lib/mock-quiz-engine.ts`. |
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

### 3.2 Quiz Engine Components (`components/quiz-engine/`)

| Component | Purpose | Data source |
|---|---|---|
| `QuizMetaCard` | Gradient hero: quiz title, hook, type, audience, tone | `meta: QuizMeta` (mock) |
| `ResultCard` | Result card with name, description, traits (colored by index) | `result: Result` (mock) |
| `FactorList` | Cream card listing factor names + English pills | `factors: Factor[]` (mock) |
| `ResultVectorCard` | Vector bar chart per factor with accent border | `result, vector, factors` (mock) |
| `QuestionEffectsCard` | Question + options with effect deltas as colored pills | `question, factors` (mock) |
| `CoverageValidator` | Checks each factor covered by ≥1 question option. **Real logic.** | `questions, factors` (mock data, real algo) |
| `DistanceValidator` | Pairwise result vector distance. Flags close pairs (sim > 55%). **Real logic.** | `resultVectors, results` (mock data, real algo) |
| `SimilarityRanking` | Ranks results by similarity to user vector. **Real logic.** | `userVector, resultVectors, results` (mock data, real algo) |
| `FinalResultPreview` | Final result hero: name, match %, interpretation, traits, secondary note | Props (mock) |

### 3.3 Explore Components (`app/explore/_components/`)

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
