# External Test Site Data Spec

> 基于代码实际使用情况整理（非基于 DB schema，因为无 migration 文件）。
> 整理日期：2026-06-25

---

## 1. 完整字段清单

### 1.1 test_categories 表

| # | 字段 | DB 类型 | 必填 | 用途 |
|---|------|---------|------|------|
| 1 | `id` | `uuid` | ✅ PK | 主键 |
| 2 | `name` | `text` | ✅ | 分类显示名（如 "人格测试"） |
| 3 | `slug` | `text` | ✅ | URL slug（如 `personality`），用于路由 `/explore/:slug` 和按分类筛选 |
| 4 | `description` | `text` | ❌ | 分类描述文本 |
| 5 | `icon` | `text` | ❌ | 图标标识（仅 admin 使用，目前无渲染逻辑） |
| 6 | `sort_order` | `integer` | ✅ | 排序权重，`ORDER BY sort_order ASC` |
| 7 | `status` | `text` | ✅ | `published` / `draft` / `archived` |
| 8 | `created_at` | `timestamptz` | ❌ | 创建时间 |

**RLS**: `status = 'published'` 的记录对任何人可读。Admin CRUD 走 service_role 绕过 RLS。

**被引用关系**:
- `test_sites.category_id → test_categories.id`
- `quizzes.category_id → test_categories.id`（migration 007，`ON DELETE SET NULL`）

---

### 1.2 test_sites 表

字段分为三类：**Admin 表单可写** / **公开可读（但不可写）** / **系统自动计算**。

#### A. Admin 表单可写字段（通过 TestSiteForm 提交）

| # | 字段 | DB 类型 | 必填(表单) | 用途 |
|---|------|---------|------------|------|
| 1 | `slug` | `text` | ✅ | URL slug，手动输入，用于路由 `/test-sites/:slug` |
| 2 | `name` | `text` | ✅ | 测试名称，显示在卡片标题和 detail 页 H1 |
| 3 | `category_id` | `uuid` | ✅ | FK → `test_categories.id`，决定分类归属 |
| 4 | `description` | `text` | ❌ | 短描述，显示在卡片中部和 detail 页小票卡 |
| 5 | `long_description` | `text` | ❌ | 长描述，**仅**当与 description 不同时在 detail 页单独展示 |
| 6 | `url` | `text` | ✅ | 外部测试链接，CTA 按钮点击跳转目标 |
| 7 | `logo_url` | `text` | ❌ | Logo 图片 URL（仅 admin 可见，目前无前端渲染） |
| 8 | `cover_image_url` | `text` | ❌ | 封面图 URL，**仅** detail 页渲染（StampCard 网格中） |
| 9 | `tags` | `text[]` | ❌ | 标签数组，显示在卡片底部和 detail 页（`#tag` 格式） |
| 10 | `language` | `text` | ❌ | 语言代码（默认 `zh`），仅 admin 可见 |
| 11 | `country` | `text` | ❌ | 国家代码（默认 `CN`），仅 admin 可见 |
| 12 | `estimated_minutes` | `integer` | ❌ | 预计完成分钟数，显示在卡片（`⏱ N min`）和 detail 页 StampCard |
| 13 | `difficulty` | `text` | ❌ | 难度：`轻松` / `标准` / `深入`。显示在 detail 页 StampCard |
| 14 | `pricing` | `text` | ❌ | 定价模式：`free` / `freemium` / `paid`。仅 admin 可见 |
| 15 | `supports_email_report` | `boolean` | ❌ | 是否支持邮箱报告。仅在 admin table 列表中显示 Yes/— |
| 16 | `email_report_note` | `text` | ❌ | 邮箱报告备注（仅 `supports_email_report=true` 时出现） |
| 17 | `status` | `text` | ✅ | `draft` / `published` / `archived`。RLS 仅暴露 `published` |
| 18 | `featured` | `boolean` | ✅ | 是否精选。精选卡片在排序中优先 |
| 19 | `sort_order` | `integer` | ❌ | 排序权重，admin 列表 `ORDER BY sort_order ASC` |

#### B. 公开可读但不可通过 Admin 编辑的字段

这些字段在 `TestSiteRow`（公开查询接口）中存在，在 `mapTestSite()` 中被读取，但 **Admin 表单不提供编辑入口**。它们可能是早期通过 Supabase Dashboard 手动添加的，或者是为未来功能预留的。

| # | 字段 | DB 类型 | 必填 | 用途 |
|---|------|---------|------|------|
| 20 | `source_name` | `text` | ❌ | 来源名称，显示在 detail 页小票卡左下角 |
| 21 | `source_url` | `text` | ❌ | 来源链接（预留，当前未使用于渲染） |
| 22 | `accent` | `text` | ❌ | 颜色主题 key（`pink` / `teal` / `lavender` / `peach` / `ochre` / `mint`）。若为空，`mapTestSite()` 用 slug hash 推导 |
| 23 | `popularity` | `text` | ❌ | 人气文案（如 "本周 12.4k 人在看"）。仅在 `TestSite` 前端类型中存在，**无渲染代码消费它** |
| 24 | `best_for` | `text` | ❌ | 适用人群描述。仅在 `TestSite` 前端类型中存在，**无渲染代码消费它** |

#### C. 系统自动计算字段

| # | 字段 | DB 类型 | 必填 | 用途 |
|---|------|---------|------|------|
| 25 | `id` | `uuid` | ✅ PK | 主键，Supabase 自动生成 |
| 26 | `created_at` | `timestamptz` | ✅ | 创建时间，Supabase 自动生成。用于排序和热度计算 |
| 27 | `updated_at` | `timestamptz` | ❌ | 更新时间，Supabase 自动生成。仅 admin 可见 |
| 28 | `popularity_score` | `float` | ❌ | 热度分，由 `computeHeatScore(click_count, created_at)` 计算 |
| 29 | `click_count` | `integer` | ❌ | 点击计数，每次 `/api/test-sites/[id]/click` POST 时自增 |

---

## 2. 字段类型对照表

| DB 类型 | TypeScript 类型 | 备注 |
|---------|----------------|------|
| `uuid` | `string` | PK / FK |
| `text` | `string \| null` | 可空文本 |
| `text[]` | `string[] \| null` | PostgreSQL 数组 |
| `integer` | `number \| null` | 整数 |
| `float` / `double precision` | `number \| null` | 浮点数 |
| `boolean` | `boolean` 或 `boolean \| null` | 取决于接口 |
| `timestamptz` | `string` | ISO 8601 格式 |

---

## 3. 哪些字段影响 Explore 卡片展示

Explore 卡片由 `testSiteToExploreCard()`（`lib/explore/mapper.ts`）将 `TestSite` 映射为 `ExploreCard`，再由 `TestCard` 组件渲染。

| ExploreCard 字段 | 来源(test_sites) | 卡片渲染位置 |
|-----------------|-------------------|-------------|
| `title` | `name` | 卡片 H3 标题 |
| `description` | `description` | 虚线下方正文（line-clamp-3） |
| `categoryLabel` | `category.name`（JOIN） | 右上角小字 |
| `image` | **硬编码为空字符串** `""` | test_sites 卡片不显示图片（仅 quizzes 卡片有） |
| `tags` | `tags` | 底部 `#tag` 列表（最多 3 个） |
| `estimatedMinutes` | `estimated_minutes` | 底部 `⏱ N min` |
| `featured` | `featured` | 影响排序优先级（精选排最前） |
| `popularity_score` | `popularity_score` | 影响排序（热度分高的排前面） |
| `created_at` | `created_at` | 影响排序（同分按最新排）和时间范围筛选 |
| `accent` | `accent`（或 hash 推导） | **不直接影响卡片颜色**（颜色由 nippon-colors 按 id hash 生成） |
| `bg_color` / `text_color` | 由 `nipponColorForSlug(id)` 计算 | 卡片背景色和文字色 |
| `href` | `slug` → `/test-sites/{id}` | 卡片点击跳转链接 |
| `source_type` | 硬编码 `"official"` | 底部显示 "站外" 标签 |

**不参与 Explore 卡片展示的字段**：`long_description`、`url`、`source_name`、`source_url`、`logo_url`、`cover_image_url`、`language`、`country`、`pricing`、`supports_email_report`、`email_report_note`、`difficulty`、`popularity`、`best_for`

---

## 4. 哪些字段影响 Detail 页面展示

Detail 页由 `TestSiteDetail` 组件（`components/TestSiteDetail.tsx`）渲染。

| 展示区域 | 使用字段 | 备注 |
|---------|---------|------|
| **小票卡片标题** | `name` | H1 |
| **小票卡片分类** | `categoryLabel` | 右上角小字 |
| **小票卡片描述** | `description` | 虚线下正文 |
| **小票卡片 tags** | `tags` | `#tag` 格式，仅当数组非空时渲染 |
| **小票卡片来源** | `sourceName` | 左下角 |
| **详细描述区** | `longDescription` | **仅当** `longDescription !== description` 时显示独立 section |
| **封面图** | `coverImageUrl` | 仅当有值时显示在 StampCard 网格第一格 |
| **时长 StampCard** | `estimatedMinutes` | "N min" |
| **难度 StampCard** | `difficulty` | 轻松 / 标准 / 深入 |
| **CTA 按钮** | `url` | `window.open(site.url, "_blank")` 点击跳转 |
| **点击追踪** | `slug` → `id` | CTA 点击后 POST `/api/test-sites/{id}/click` |
| **页面背景色** | `accent` → `nipponColorForSlug(id)` | 小票卡片整体背景 |

**不参与 Detail 页展示的字段**：`logo_url`、`language`、`country`、`pricing`、`supports_email_report`、`email_report_note`、`popularity`、`best_for`、`source_url`（已读取但不渲染）

---

## 5. Slug 生成规则

**当前规则：手动输入，无自动生成。**

- Admin 表单中 `slug` 字段为自由文本输入框
- 前端校验：非空即可（`!form.slug.trim()` 时报错 "slug 必填"）
- 没有从 `name` 自动生成 slug 的逻辑
- 没有唯一性校验（依赖数据库 unique 约束报错）
- 格式约定：小写英文 + 连字符（如 `mbti-16-style`、`big-five-core`），但代码层面未强制

**使用方式**：
- 公开路由：`/test-sites/{slug}` → `getTestSiteBySlug(slug)` 查询
- 公开 API：`/api/test-sites/{slug}/click` → `recordTestSiteClick(slug)` 查询

**历史遗留**：`lib/test-sites.ts` 中的 mock 数据使用 `id` 字段作为唯一标识（如 `"mbti-16-style"`），但在 `mapTestSite()` 中 `id = row.slug || row.id`，即 **slug 被直接当作前端 TestSite 的 id 使用**。

---

## 6. Category 对应规则

```
test_sites.category_id (uuid) ──FK──▶ test_categories.id (uuid)
                                              │
                                     JOIN 后解析为：
                                     ├── category.slug → TestSite.category（前端路由用）
                                     └── category.name → TestSite.categoryLabel（前端显示用）
```

- **查询方式**：所有公开查询使用 Supabase 的嵌套 JOIN 语法 `category:test_categories(*)`
- **筛选方式**：`getTestSitesByCategory(categorySlug)` 先通过 slug 查出 category 的 id，再用 `category_id` 筛选 test_sites
- **Explore 页 tab 筛选**：`filterByTab()` 将 `ExploreCard.category_id`（即 category slug）与 tab id 做字符串匹配
- **RLS 联动**：两个表都有 `status = 'published'` 的 RLS 策略，但 JOIN 查询只对 test_sites 做 RLS 过滤——如果 category 是 draft 但 site 是 published，site 仍可被查出且显示 category 信息

---

## 7. Tags 格式要求

| 维度 | 规则 |
|------|------|
| **DB 存储** | PostgreSQL `text[]` 数组 |
| **Admin 输入** | TagInput 组件：输入文本 → 回车或点击"添加" → 加入数组 |
| **去重** | 添加时检查 `!value.includes(trimmed)`（不允许重复 tag） |
| **删除** | 点击 tag 上的 × 按钮从数组中移除 |
| **DB 值示例** | `{MBTI,自我理解,社交分享}` |
| **API 返回** | JSON 数组 `["MBTI", "自我理解", "社交分享"]` |
| **`mapTestSite()` 处理** | `Array.isArray(row.tags) ? row.tags : []`（容错非数组） |
| **卡片渲染** | 最多显示前 3 个，格式 `#tagName` |
| **搜索匹配** | `searchCards()` 对 `tags.some(t => t.toLowerCase().includes(q))` 做子串匹配 |
| **无长度/格式限制** | 无字符数上限、无正则校验 |

---

## 8. 数据流总结

```
┌──────────────────────────────────────────────────────────────────┐
│  ADMIN 录入                                                       │
│                                                                    │
│  TestSiteForm (20 个可写字段)                                      │
│    │                                                               │
│    ▼ server action (inline "use server")                           │
│    │ createTestSite() / updateTestSite()                           │
│    ▼                                                               │
│  Supabase test_sites (service_role, 绕过 RLS)                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  公开读取                                                          │
│                                                                    │
│  getPublishedTestSites() / getTestSiteBySlug()                     │
│    │ SELECT * FROM test_sites JOIN test_categories                 │
│    │ WHERE status = 'published' (RLS 强制)                         │
│    ▼                                                               │
│  TestSiteRow (29 字段)                                             │
│    │                                                               │
│    ▼ mapTestSite()                                                 │
│  TestSite (前端类型, 18 字段)                                       │
│    │                                                               │
│    ├──▶ testSiteToExploreCard() → ExploreCard → TestCard / TrendingCard
│    └──▶ TestSiteDetail (detail 页)                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. 已知问题 / 待清理项

1. **无 migration 文件**：`test_sites`、`test_categories`、`test_site_clicks` 三张表均通过 Supabase Dashboard 手动创建，未版本控制。
2. **`test_site_clicks` 表未使用**：有 RLS 策略允许匿名 INSERT，但应用代码只操作 `test_sites.click_count`，不写入 `test_site_clicks`。
3. **Admin 不可编辑的公开字段**：`source_name`、`source_url`、`accent`、`popularity`、`best_for` 存在于 `TestSiteRow` 但 Admin 表单无法编辑它们。如需更新需直接操作数据库。
4. **`popularity` 和 `best_for` 无渲染消费者**：它们存在于 DB 和 `TestSite` 类型中，但没有任何 UI 组件使用它们。
5. ~~**`cover_image_url` 不显示在 Explore 卡片**~~ → **已修复 (2026-06-25)**：`testSiteToExploreCard()` 改为 `image: site.coverImageUrl ?? ""`，卡片现在会展示封面图。
6. **`click_count` 不在任何 TS Row 类型中**：该列在 DB 中存在且被代码读写，但没有在任何 interface 中声明，属于隐式依赖。
7. **Category status 不一致风险**：published 的 test_site 可能 JOIN 到 draft 的 category（RLS 只过滤了 test_sites，没过滤 JOIN 的 categories）。
