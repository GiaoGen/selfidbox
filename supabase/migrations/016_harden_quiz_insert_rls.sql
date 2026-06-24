-- ============================================================================
-- Migration: 016 — harden quizzes INSERT RLS with status restriction
--
-- Users can only insert quizzes with status='draft' via the anon key.
-- This prevents direct REST API calls from bypassing the draft→sandbox→published workflow.
-- The app uses service_role for inserts (saveQuizSchema), which bypasses RLS.
-- ============================================================================

drop policy if exists "Creator can insert quizzes" on quizzes;
create policy "Creator can insert quizzes" on quizzes
  for insert
  with check (auth.uid() = creator_user_id and status = 'draft');
