-- ============================================================================
-- Migration: 014 — RLS on public.users
--
-- public.users stores id, email, created_at, username.
-- Each user can only read/update their own row.
-- No INSERT/DELETE — rows are created by the trigger in 003.
--
-- Run this in the Supabase SQL Editor manually.
-- ============================================================================

alter table public.users enable row level security;

-- SELECT: user can only read their own row (navbar, profile display)
drop policy if exists "Users can read own row" on public.users;
create policy "Users can read own row" on public.users
  for select
  using (auth.uid() = id);

-- UPDATE: user can only update their own row (username change)
drop policy if exists "Users can update own row" on public.users;
create policy "Users can update own row" on public.users
  for update
  using (auth.uid() = id);
