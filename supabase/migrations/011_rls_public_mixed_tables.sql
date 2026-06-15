-- ============================================================================
-- 011 — RLS Round 2: Public + Mixed-Permission Tables
-- ============================================================================
-- 目标：公开数据可被任何人读取，私有数据仅创建者可管理
-- 注意：admin 操作（admin-db.ts）使用 service_role，绕过 RLS
-- 注意：service_role 默认绕过 RLS，不受以下 policy 限制
-- ============================================================================

-- ============================================================================
-- 1. quizzes
-- ============================================================================

alter table quizzes enable row level security;

-- 任何人都能读已发布和试玩版
drop policy if exists "Anyone can read published quizzes" on quizzes;
create policy "Anyone can read published quizzes" on quizzes
  for select
  using (status in ('published', 'sandbox'));

-- 创建者可以读自己的所有 quiz（包括 draft / archived）
drop policy if exists "Creator can read own quizzes" on quizzes;
create policy "Creator can read own quizzes" on quizzes
  for select
  using (auth.uid() = creator_user_id);

-- 创建者可以新增
drop policy if exists "Creator can insert quizzes" on quizzes;
create policy "Creator can insert quizzes" on quizzes
  for insert
  with check (auth.uid() = creator_user_id);

-- 创建者可以更新
drop policy if exists "Creator can update own quizzes" on quizzes;
create policy "Creator can update own quizzes" on quizzes
  for update
  using (auth.uid() = creator_user_id);

-- 创建者可以删除（级联子表由应用层处理）
drop policy if exists "Creator can delete own quizzes" on quizzes;
create policy "Creator can delete own quizzes" on quizzes
  for delete
  using (auth.uid() = creator_user_id);

-- ============================================================================
-- 2. quiz_factors — 通过 quiz_id 关联 quizzes，继承父表权限
-- ============================================================================

alter table quiz_factors enable row level security;

drop policy if exists "Anyone can read factors of published quizzes" on quiz_factors;
create policy "Anyone can read factors of published quizzes" on quiz_factors
  for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_factors.quiz_id
        and quizzes.status in ('published', 'sandbox')
    )
  );

drop policy if exists "Creator can manage factors of own quizzes" on quiz_factors;
create policy "Creator can manage factors of own quizzes" on quiz_factors
  for all
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_factors.quiz_id
        and quizzes.creator_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. quiz_results — 同上
-- ============================================================================

alter table quiz_results enable row level security;

drop policy if exists "Anyone can read results of published quizzes" on quiz_results;
create policy "Anyone can read results of published quizzes" on quiz_results
  for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_results.quiz_id
        and quizzes.status in ('published', 'sandbox')
    )
  );

drop policy if exists "Creator can manage results of own quizzes" on quiz_results;
create policy "Creator can manage results of own quizzes" on quiz_results
  for all
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_results.quiz_id
        and quizzes.creator_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. quiz_questions — 同上
-- ============================================================================

alter table quiz_questions enable row level security;

drop policy if exists "Anyone can read questions of published quizzes" on quiz_questions;
create policy "Anyone can read questions of published quizzes" on quiz_questions
  for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_questions.quiz_id
        and quizzes.status in ('published', 'sandbox')
    )
  );

drop policy if exists "Creator can manage questions of own quizzes" on quiz_questions;
create policy "Creator can manage questions of own quizzes" on quiz_questions
  for all
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_questions.quiz_id
        and quizzes.creator_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. quiz_options — 同上
-- ============================================================================

alter table quiz_options enable row level security;

drop policy if exists "Anyone can read options of published quizzes" on quiz_options;
create policy "Anyone can read options of published quizzes" on quiz_options
  for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_options.quiz_id
        and quizzes.status in ('published', 'sandbox')
    )
  );

drop policy if exists "Creator can manage options of own quizzes" on quiz_options;
create policy "Creator can manage options of own quizzes" on quiz_options
  for all
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_options.quiz_id
        and quizzes.creator_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. ai_prompts — 仅 service_role 可读写
-- ============================================================================

alter table ai_prompts enable row level security;

-- No policies for authenticated users.
-- service_role bypasses RLS automatically.
-- Admin reads/writes via lib/ai/prompts.ts use service_role client.

-- ============================================================================
-- 7. test_sites — 公开读 published，admin 操作走 service_role
-- ============================================================================

alter table test_sites enable row level security;

drop policy if exists "Anyone can read published test sites" on test_sites;
create policy "Anyone can read published test sites" on test_sites
  for select
  using (status = 'published');

-- No insert/update/delete policies for authenticated users.
-- Admin CRUD via lib/admin-db.ts uses service_role client.

-- ============================================================================
-- 8. test_categories — 同上
-- ============================================================================

alter table test_categories enable row level security;

drop policy if exists "Anyone can read published categories" on test_categories;
create policy "Anyone can read published categories" on test_categories
  for select
  using (status = 'published');

-- ============================================================================
-- 9. test_site_clicks — 允许任何人 INSERT（匿名点击追踪）
-- ============================================================================

alter table test_site_clicks enable row level security;

drop policy if exists "Anyone can insert clicks" on test_site_clicks;
create policy "Anyone can insert clicks" on test_site_clicks
  for insert
  with check (true);
