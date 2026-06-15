-- ============================================================================
-- 010 — RLS Round 1: Private User Data
-- ============================================================================
-- 目标：防止用户互相读取隐私数据
-- 范围：user_profile, reports, quiz_attempts, quiz_attempt_answers, ai_usage_logs
-- 注意：service_role 默认绕过 RLS，不受以下 policy 限制
-- ============================================================================

-- ============================================================================
-- 1. user_profile
-- ============================================================================

alter table user_profile enable row level security;

drop policy if exists "Users can select own profile" on user_profile;
create policy "Users can select own profile" on user_profile
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on user_profile;
create policy "Users can insert own profile" on user_profile
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on user_profile;
create policy "Users can update own profile" on user_profile
  for update
  using (auth.uid() = user_id);

-- NO delete policy — users cannot delete their profile

-- ============================================================================
-- 2. reports
-- ============================================================================

alter table reports enable row level security;

drop policy if exists "Users can select own reports" on reports;
create policy "Users can select own reports" on reports
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on reports;
create policy "Users can insert own reports" on reports
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reports" on reports;
create policy "Users can update own reports" on reports
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own reports" on reports;
create policy "Users can delete own reports" on reports
  for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 3. quiz_attempts
-- ============================================================================

alter table quiz_attempts enable row level security;

drop policy if exists "Users can select own quiz attempts" on quiz_attempts;
create policy "Users can select own quiz attempts" on quiz_attempts
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own quiz attempts" on quiz_attempts;
create policy "Users can insert own quiz attempts" on quiz_attempts
  for insert
  with check (auth.uid() = user_id);

-- NO update / delete policies for users
-- (admin delete via lib/admin-db.ts uses service_role and bypasses RLS)

-- ============================================================================
-- 4. quiz_attempt_answers
-- ============================================================================

alter table quiz_attempt_answers enable row level security;

drop policy if exists "Users can select own attempt answers" on quiz_attempt_answers;
create policy "Users can select own attempt answers" on quiz_attempt_answers
  for select
  using (
    exists (
      select 1
      from quiz_attempts
      where quiz_attempts.id = quiz_attempt_answers.attempt_id
        and quiz_attempts.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own attempt answers" on quiz_attempt_answers;
create policy "Users can insert own attempt answers" on quiz_attempt_answers
  for insert
  with check (
    exists (
      select 1
      from quiz_attempts
      where quiz_attempts.id = quiz_attempt_answers.attempt_id
        and quiz_attempts.user_id = auth.uid()
    )
  );

-- NO update / delete policies for users

-- ============================================================================
-- 5. ai_usage_logs
-- ============================================================================

alter table ai_usage_logs enable row level security;

-- No policies for authenticated users — users cannot read or write this table.
-- service_role bypasses RLS automatically, so admin reads and server inserts
-- will continue to work without any policy.
