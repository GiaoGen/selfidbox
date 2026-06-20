-- ============================================================================
-- Migration: 013 — add 'submitting' to public read policies
--
-- Bug: quizzes with status='submitting' were only readable by their creator.
-- submitting should behave like sandbox: anyone can read + limited to 20 runs.
--
-- Run this in the Supabase SQL Editor manually.
-- ============================================================================

-- 1. quizzes — anyone can read published, sandbox, and submitting
-- ============================================================================
drop policy if exists "Anyone can read published quizzes" on quizzes;
create policy "Anyone can read published quizzes" on quizzes
  for select
  using (status in ('published', 'sandbox', 'submitting'));

-- 2. quiz_factors — inherit parent quiz visibility
-- ============================================================================
drop policy if exists "Anyone can read factors of published quizzes" on quiz_factors;
create policy "Anyone can read factors of published quizzes" on quiz_factors
  for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_factors.quiz_id
        and quizzes.status in ('published', 'sandbox', 'submitting')
    )
  );

-- 3. quiz_results — inherit parent quiz visibility
-- ============================================================================
drop policy if exists "Anyone can read results of published quizzes" on quiz_results;
create policy "Anyone can read results of published quizzes" on quiz_results
  for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_results.quiz_id
        and quizzes.status in ('published', 'sandbox', 'submitting')
    )
  );

-- 4. quiz_questions — inherit parent quiz visibility
-- ============================================================================
drop policy if exists "Anyone can read questions of published quizzes" on quiz_questions;
create policy "Anyone can read questions of published quizzes" on quiz_questions
  for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_questions.quiz_id
        and quizzes.status in ('published', 'sandbox', 'submitting')
    )
  );

-- 5. quiz_options — inherit parent quiz visibility
-- ============================================================================
drop policy if exists "Anyone can read options of published quizzes" on quiz_options;
create policy "Anyone can read options of published quizzes" on quiz_options
  for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_options.quiz_id
        and quizzes.status in ('published', 'sandbox', 'submitting')
    )
  );
