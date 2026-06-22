--------------------------------------------------------------
-- 015 — Credit system: user_credits + credit_events + RPC
--------------------------------------------------------------

-- 1. Event type enum --------------------------------------------------
DO $$ BEGIN
  CREATE TYPE credit_event_type AS ENUM (
    'base_monthly',
    'quiz_completed',
    'quiz_approved',
    'guest_signup',
    'ai_generate'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. User credits (one row per user) ----------------------------------
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_credits        integer NOT NULL DEFAULT 0,
  bonus_credits       integer NOT NULL DEFAULT 0,
  used_credits        integer NOT NULL DEFAULT 0,
  base_refilled_at    timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Prevent negative used counts
ALTER TABLE public.user_credits ADD CONSTRAINT non_negative_used
  CHECK (used_credits >= 0);

-- 3. Credit events (audit log + dedup source) --------------------------
CREATE TABLE IF NOT EXISTS public.credit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          credit_event_type NOT NULL,
  amount        integer NOT NULL,
  reference_id  text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_events_user
  ON public.credit_events(user_id, created_at DESC);

-- Dedup: one event of these types per (user, reference)
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_events_dedup
  ON public.credit_events(user_id, type, reference_id)
  WHERE type IN ('quiz_completed', 'quiz_approved');

-- 4. RLS ----------------------------------------------------------------
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
DROP POLICY IF EXISTS "users_read_own_credits" ON public.user_credits;
CREATE POLICY "users_read_own_credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own events
DROP POLICY IF EXISTS "users_read_own_events" ON public.credit_events;
CREATE POLICY "users_read_own_events" ON public.credit_events
  FOR SELECT USING (auth.uid() = user_id);

-- 5. RPC: atomic spend ------------------------------------------------
-- Called by service_role from AI API routes.
-- Returns: { ok, credits_remaining }
CREATE OR REPLACE FUNCTION spend_credit(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  row public.user_credits;
BEGIN
  -- Lock the row for atomicity
  SELECT * INTO row FROM public.user_credits
    WHERE user_id = target_user_id
    FOR UPDATE;

  -- On conflict (user_credits row deleted or never existed), default to 0
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_CREDITS');
  END IF;

  -- Check balance
  IF row.base_credits + row.bonus_credits - row.used_credits <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT');
  END IF;

  -- Spend
  UPDATE public.user_credits
    SET used_credits = used_credits + 1,
        updated_at = now()
    WHERE user_id = target_user_id;

  -- Log event
  INSERT INTO public.credit_events (user_id, type, amount)
    VALUES (target_user_id, 'ai_generate', -1);

  RETURN jsonb_build_object(
    'ok', true,
    'credits_remaining', row.base_credits + row.bonus_credits - row.used_credits - 1
  );
END;
$$;

-- 6. RPC: ensure user has a credit row (lazy init + monthly refill) ----
-- Called before spend/grant. Creates row if missing; refills base to 20
-- if a calendar month has passed since last refill.
CREATE OR REPLACE FUNCTION ensure_user_credits(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  row public.user_credits;
  avail integer;
  delta integer;
BEGIN
  SELECT * INTO row FROM public.user_credits
    WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    -- New user: start with 20 base credits
    INSERT INTO public.user_credits (user_id, base_credits, bonus_credits, used_credits, base_refilled_at)
      VALUES (target_user_id, 20, 0, 0, now());
    INSERT INTO public.credit_events (user_id, type, amount)
      VALUES (target_user_id, 'base_monthly', 20);
  ELSIF date_trunc('month', row.base_refilled_at) < date_trunc('month', now()) THEN
    -- New month: top up available to 20 if below
    avail := row.base_credits + row.bonus_credits - row.used_credits;
    IF avail < 20 THEN
      delta := 20 - avail;
      UPDATE public.user_credits
        SET base_credits = base_credits + delta,
            base_refilled_at = now(),
            updated_at = now()
        WHERE user_id = target_user_id;
      INSERT INTO public.credit_events (user_id, type, amount)
        VALUES (target_user_id, 'base_monthly', delta);
    ELSE
      UPDATE public.user_credits
        SET base_refilled_at = now(),
            updated_at = now()
        WHERE user_id = target_user_id;
    END IF;
  END IF;
END;
$$;

-- 7. RPC: grant bonus credit ------------------------------------------
-- Called by service_role from quiz-attempts / admin edit.
-- Dedup is handled by the unique index on credit_events.
-- Returns: { ok, credits_remaining }
CREATE OR REPLACE FUNCTION grant_credit(
  target_user_id uuid,
  event_type credit_event_type,
  amt integer,
  ref_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  row public.user_credits;
BEGIN
  -- Ensure row exists & monthly refill is fresh
  PERFORM ensure_user_credits(target_user_id);

  -- Try insert event — unique index prevents duplicates
  BEGIN
    INSERT INTO public.credit_events (user_id, type, amount, reference_id)
      VALUES (target_user_id, event_type, amt, ref_id);
  EXCEPTION WHEN unique_violation THEN
    -- Already granted for this (user, type, ref_id) — silently skip
    RETURN jsonb_build_object('ok', false, 'error', 'DUPLICATE');
  END;

  -- Grant bonus
  UPDATE public.user_credits
    SET bonus_credits = bonus_credits + amt,
        updated_at = now()
    WHERE user_id = target_user_id
    RETURNING * INTO row;

  RETURN jsonb_build_object(
    'ok', true,
    'credits_remaining', row.base_credits + row.bonus_credits - row.used_credits
  );
END;
$$;
