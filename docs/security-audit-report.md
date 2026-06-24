# SelfIDBox 安全审计报告

> **审计日期**: 2026-06-24
> **审计范围**: Supabase RLS 策略（17 张表 / 12 个迁移文件）、20 个 API 路由、中间件、认证架构、管理员授权、环境变量、CSP/安全头、存储桶策略、限流、依赖漏洞
> **审计文件数**: 60+
> **总问题数**: 24（3 关键 / 8 高 / 7 中 / 6 低）

---

## 🔴 关键（Critical）— 上线阻断

### C-S1. 测验保存接口缺少所有权验证 — 任意用户可覆盖任意测验

- [x] **已修复** (2026-06-24)
- **位置**: `app/api/quiz-studio/save/route.ts:30-34`
- **修复**: 在 `updateQuizSchema` 调用前插入所有权验证——查询 `creator_user_id` 并与 `user.id` 比对，不匹配返回 403。模式复用自 `sandbox/route.ts`。同时修复了 catch 块中 `err.message` 泄露问题。

---

### C-S2. ~~RLS 状态不匹配 — 所有 submitted 测验对公网不可见~~ → 降级为 🟡 功能 Bug

- [x] **降级** (2026-06-24) — 经核实，审计报告对此问题的严重性评估有误。
- **实际情况**: 应用使用 `status = 'published'` 发布测验，该值同时存在于 CHECK 约束（migration 005）和 RLS 公开读策略（migration 013）中，**已发布测验公网正常可见**。
- **真实问题**: `'submitting'`（migration 013 引入，作为 20 次试运行状态）忘记同步更新 CHECK 约束，导致该状态无法写入 DB。`'submitted'`（CHECK 中存在的旧值）不在 RLS 中。这是命名不一致导致的 feature bug，不阻断上线。
- **修复方向**: 统一 `'submitting'`/`'submitted'` 命名，在 CHECK 约束中补上缺失的状态值。

---

### C-S3. 密钥泄露 — .env.local 包含明文 production 密钥

- [x] **风险接受** (2026-06-24) — 单人开发、`.env.local` 已 gitignored、机器可控，投入收益不成正比。生产密钥轮换 + 独立 dev 环境延后处理。
- **位置**: `.env.local:5,7`
- **注意**: 若未来团队扩大或开发环境变化，此项应优先处理。

---

## 🟠 高风险（High）

### H-S1. 未认证端点使用 service_role 客户端

- [ ] **未修复**
- **位置**: `app/api/test-sites/[id]/click/route.ts:4-16`
- **问题**: 零认证，但内部调用 `recordTestSiteClick()` 使用 `createServiceClient()`。虽然数据本身不敏感（点击计数），但这开了危险先例。
- **修复方向**: 如果端点应为公开，改用 anon-key 客户端 + RLS 策略写入。

---

### H-S2. 内部错误信息泄露给客户端（9 个路由）

- [x] **已修复** (2026-06-24)
- **修复**: 8 个文件 / 11 处 `error.message` / `err.message` 全部替换为中文通用提示。`console.error` 原样保留，服务端调试能力不受影响。前端不解析这些错误字符串，零兼容性风险。

---

### H-S3. 截图上传：无 MIME 类型验证、无大小限制、上游响应泄露

- [ ] **未修复**
- **位置**: `app/api/screenshot-report/route.ts:31-39,62`
- **问题**: 
  - 只检查 FormData 中 `file` 是否存在，不验证 MIME 类型、扩展名、文件大小
  - OCR API 失败时完整上游响应体返回给客户端
- **影响**: 任意文件上传到 OCR 处理管线、大文件内存耗尽、OCR API 内部信息暴露。
- **修复方向**: 限制 MIME 类型（`image/png`, `image/jpeg`, `image/webp`）、限制大小（如 10MB）、不将第三方 API 响应透传给客户端。

---

### H-S4. quizzes INSERT RLS 策略缺少 status 限制

- [x] **已修复** (2026-06-24)
- **修复**: 新迁移文件 `supabase/migrations/016_harden_quiz_insert_rls.sql`，WITH CHECK 添加 `and status = 'draft'`。应用使用 service_role 写入（绕过 RLS），不受影响。⚠️ 迁移文件需在 Supabase SQL Editor 中手动执行。

---

### H-S5. quizzes UPDATE RLS 策略缺少显式 WITH CHECK

- [ ] **未修复**
- **位置**: `supabase/migrations/011_rls_public_mixed_tables.sql:34-37`
- **问题**: 仅有 `using (auth.uid() = creator_user_id)`，无显式 `with check`，依赖 PostgreSQL 隐式默认行为。
- **修复方向**: 添加显式 `with check (auth.uid() = creator_user_id)`。

---

### H-S6. quiz_attempt_answers INSERT 策略缺少 quiz_id 完整性检查

- [ ] **未修复**
- **位置**: `supabase/migrations/010_rls_private_user_data.sql:95-105`
- **问题**: WITH CHECK 仅验证用户拥有该 attempt，不验证 answer 行中的 `quiz_id` 与 attempt 的 `quiz_id` 匹配。可能导致跨测验数据损坏。
- **修复方向**: 在 EXISTS 子查询中添加 `and quiz_attempts.quiz_id = quiz_attempt_answers.quiz_id`。

---

### H-S7. 存储桶上传策略无按用户文件夹隔离

- [ ] **未修复**
- **位置**: `supabase/migrations/001_add_image_url.sql:16-20`, `lib/image-upload.ts:46`
- **问题**: 
  - RLS 策略：任何认证用户可上传到存储桶任意路径，无文件类型/大小限制，无 DELETE 策略
  - 客户端上传路径 `{resultId}/{Date.now()}.webp` 无用户前缀
- **影响**: 用户 A 可写入用户 B 的路径。用户无法删除自己的上传。
- **修复方向**: 按用户 ID 文件夹隔离上传路径，添加 DELETE 策略。

---

### H-S8. CSP 允许 `'unsafe-inline'` 和 `'unsafe-eval'`

- [ ] **未修复**
- **位置**: `next.config.ts:54`
- **问题**: `script-src 'self' 'unsafe-inline' 'unsafe-eval'` 实际禁用了 script-src 保护，XSS 利用变得极其容易。
- **修复方向**: 移除 `'unsafe-inline'` 和 `'unsafe-eval'`。对确实必需的内联脚本使用 nonce 或 hash 方案。Next.js 16 原生支持 nonce CSP。

---

## 🟡 中风险（Medium）

### M-S1. `ensure_user_credits` RPC 使用不安全 search_path

- [ ] **未修复**
- **位置**: `supabase/migrations/015_credit_system.sql:111-115`
- **问题**: 使用 `SET search_path = 'public'`，而同级函数（`spend_credit`, `grant_credit`）正确使用 `SET search_path = ''` 加完全限定名。
- **修复方向**: 改为 `SET search_path = ''` 并完全限定所有对象引用。

---

### M-S2. `test_site_clicks` 匿名 INSERT `check(true)` — 无限制刷量

- [ ] **未修复**
- **位置**: `supabase/migrations/011_rls_public_mixed_tables.sql:196-201`
- **问题**: 任何人可无限写入该表。虽然应用使用 service_role（绕过此策略），但策略本身是敞开的门。
- **修复方向**: 既然应用使用 service_role，移除此匿名/认证 INSERT 策略。

---

### M-S3. 16/20 路由缺少限流

- [ ] **未修复**
- **位置**: 除 `quiz-ai/*` 外的所有 API 路由
- **问题**: 测验保存、个人资料、截图上传、用户更新等重要端点无限流保护。
- **修复方向**: 对所有写操作端点应用 `checkRateLimit()`。

---

### M-S4. 内存限流器在 Vercel Serverless 实例间无效

- [ ] **未修复**（已知限制）
- **位置**: `lib/rate-limit.ts:1-3`
- **问题**: 使用进程内 `Map` 存储。Vercel 上每个 serverless 调用可能落在不同实例上，限流不可靠。
- **修复方向**: 迁移到 Upstash Redis 或 Vercel KV。

---

### M-S5. 状态变更端点缺少 CSRF 保护

- [ ] **未修复**
- **问题**: POST/PATCH/DELETE 路由仅依赖 Supabase cookie session auth。无 CSRF token、无 `Origin`/`Referer` 头检查。
- **修复方向**: 对所有状态变更端点添加 `Origin`/`Referer` 头验证中间件。

---

### M-S6. 16 个 API 路由中有 79 处 console.log/error

- [ ] **未修复**
- **问题**: 客户端提供的数据、错误信息、内部状态在 API 路由中大量输出到控制台。Vercel 日志中可能泄露 PII。
- **修复方向**: 审计所有 API 路由中的 `console.*`，生产环境使用结构化日志 + PII 脱敏。

---

### M-S7. 截图上传客户端库无文件类型验证

- [ ] **未修复**
- **位置**: `lib/image-upload.ts:40-62`
- **问题**: 浏览器端上传函数压缩后上传到 Supabase，但没有 MIME 白名单，完全信任 `compressImage` 处理任何文件。
- **修复方向**: 压缩前添加 MIME 类型检查，拒绝非 `image/png`, `image/jpeg`, `image/webp` 的文件。

---

## 🟢 低风险（Low）

### L-S1. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 未使用

- [ ] **未修复**
- **位置**: `.env.local:6`
- **问题**: 值与 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 相同，但任何源文件都不引用。存在即增加攻击面。
- **修复方向**: 删除。

---

### L-S2. `rls-policies.sql` 指南有误导性注释

- [ ] **未修复**
- **位置**: `supabase/rls-policies.sql:166-168`
- **问题**: 注释说 admin 通过前端使用 anon key，实际使用 service_role。更新注释。

---

### L-S3. `user_profile` 表无 DELETE 策略

- [ ] **未修复**
- **位置**: `supabase/migrations/010_rls_private_user_data.sql:30`
- **问题**: 有意为之且有文档记录，但可能与 GDPR 删除权冲突。
- **修复方向**: 考虑添加软删除列或删除 RPC。

---

### L-S4. `public.users` RLS 阻止用户名可用性检查

- [ ] **未修复**
- **位置**: `supabase/migrations/014_rls_public_users.sql:15-17`
- **问题**: 每个用户只能读自己的行，无法检查用户名是否被占用。冲突只能通过约束违规发现，**泄露用户名存在信息**。
- **修复方向**: 添加 SECURITY DEFINER RPC 函数 `check_username_available(text)`。

---

### L-S5. `rate-limit.ts` 中 setInterval 在 serverless 中可能不触发

- [ ] **未修复**
- **位置**: `lib/rate-limit.ts:22-24`
- **问题**: 模块级 `setInterval(prune, 60_000)` 在函数冻结时不会触发。长期实例有内存泄漏风险。

---

### L-S6. 单个 API 路由未设置 CORS 头

- [ ] **未修复**
- **问题**: 依赖 next.config.ts 的静态头注入处理 CORS。需在生产环境验证是否生效。

---

## ✅ 已确认安全

| 领域 | 状态 |
|------|------|
| **中间件路由保护** | `/admin`, `/profile`, `/create` 正确保护。静态资源被排除。 |
| **管理员授权** | `app/admin/layout.tsx` 服务端检查，对比 `ADMIN_USER_IDS` 环境变量。无客户端 admin 标记。 |
| **Service role 隔离** | `SUPABASE_SERVICE_ROLE_KEY` 无 `NEXT_PUBLIC_` 前缀。所有 service_role 使用均在服务端且经过认证门控。 |
| **RLS 覆盖率** | 全部 17 张表启用 RLS。无未保护表。 |
| **积分系统** | 所有变更通过 SECURITY DEFINER RPC 函数 + 原子性 check-and-deduct。无直接 INSERT/UPDATE。 |
| **XSS 防护** | 代码库中零 `dangerouslySetInnerHTML` 使用。 |
| **Secrets 不入 git** | `.gitignore` 正确排除 `.env*`（除 `.env.example`）。 |
| **Source maps** | 生产环境已禁用（`next.config.ts:69-71`）。 |
| **安全头** | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security`（2 年 + preload）, `Permissions-Policy`（禁用相机/麦克风/定位）均已配置。 |
| **Sentry DSN** | 正确使用 `NEXT_PUBLIC_SENTRY_DSN`（公开 DSN 是正常的）。Source maps 禁用防止源码泄露。 |
| **SQL 注入** | 全部查询使用 Supabase 参数化查询构建器。未发现原始 SQL 字符串拼接。 |

---

## 依赖漏洞检查

`package.json` 依赖审核，当前版本无已知关键 CVE：

- `@supabase/ssr: ^0.10.3` — 建议关注更新
- `@supabase/supabase-js: ^2.106.2` — 当前版本，无已知关键问题
- `next: 16.2.6` — 前沿版本，需关注安全补丁
- 无数据库驱动、ORM、原始 SQL 库 — Supabase 客户端处理所有参数化

---

## 修复优先级

### 上线前必须修复（3 项）
1. **C-S1** — 测验保存添加所有权验证
2. **C-S2** — 修复 submitting/submitted RLS 状态不匹配
3. **C-S3** — 轮换暴露的密钥

### 上线前应该修复（8 项）
4. **H-S1** — 未认证端点移除 service_role
5. **H-S2** — 9 个路由替换 `error.message` 为通用错误
6. **H-S3** — 截图上传添加类型/大小验证
7. **H-S4** — 收紧 quizzes INSERT RLS
8. **H-S5** — 添加显式 UPDATE WITH CHECK
9. **H-S6** — 修复 attempt_answers 完整性检查
10. **H-S7** — 存储桶按用户文件夹隔离
11. **H-S8** — 移除 CSP `unsafe-inline`/`unsafe-eval`

### 可延后修复（13 项）
M-S1 ~ M-S7, L-S1 ~ L-S6 — 安全加固项，上线后可迭代。

---

## 总体评估

**有条件通过** — 3 个关键问题修复前不建议上线。

高严重度问题主要集中在：
- **授权缺陷**（C-S1, H-S4, H-S5）
- **数据泄露路径**（H-S2, H-S3, C-S3）
- **RLS 配置错误**（C-S2, H-S6, H-S7）
- **CSP 配置过于宽松**（H-S8）

正面：RLS 覆盖率达到 100%（17/17 表）、无 SQL 注入向量、service role 隔离良好、管理员授权正确。
