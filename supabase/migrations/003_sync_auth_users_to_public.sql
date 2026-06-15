-- ============================================================================
-- Migration: sync auth.users → public.users
--
-- Prerequisite: public.users must already exist with columns (id, email, created_at).
-- This script does NOT create the table — it only adds the trigger + backfill.
--
-- Effect: every new signup in auth.users is automatically mirrored to public.users,
-- so that foreign keys from reports / user_profile / quiz_attempts resolve correctly.
-- ============================================================================

-- 1. Trigger function: mirror new auth.users rows into public.users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Trigger: fire after insert on auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Backfill: sync any existing auth.users that are missing from public.users
-- ============================================================================

INSERT INTO public.users (id, email, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.created_at, now())
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
