/**
 * Credit system — atomic spend / grant / query helpers.
 *
 * All writes go through Postgres RPC functions (see migration 015) to
 * guarantee the check + deduct is a single atomic operation.
 */

import { createServiceClient } from "@/lib/supabase/service";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface CreditBalance {
  base_credits: number;
  bonus_credits: number;
  used_credits: number;
  available: number;
}

export interface CreditEvent {
  type: string;
  amount: number;
  reference_id: string | null;
  created_at: string;
}

export interface CreditSnapshot {
  balance: CreditBalance;
  events: CreditEvent[];
}

/* ------------------------------------------------------------------ */
/*  RPC helpers                                                         */
/* ------------------------------------------------------------------ */

/** Lazily create a user_credits row, or refill monthly base to 20. */
async function ensureUserCredits(userId: string): Promise<void> {
  const db = createServiceClient();
  await db.rpc("ensure_user_credits", { target_user_id: userId });
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Fetch full credit snapshot for the UI panel.
 * Ensures lazy init + monthly refill before returning.
 */
export async function getCredits(userId: string): Promise<CreditSnapshot> {
  await ensureUserCredits(userId);
  const db = createServiceClient();

  const [{ data: row }, { data: events }] = await Promise.all([
    db
      .from("user_credits")
      .select("base_credits, bonus_credits, used_credits")
      .eq("user_id", userId)
      .single(),
    db
      .from("credit_events")
      .select("type, amount, reference_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const base = row?.base_credits ?? 0;
  const bonus = row?.bonus_credits ?? 0;
  const used = row?.used_credits ?? 0;

  return {
    balance: {
      base_credits: base,
      bonus_credits: bonus,
      used_credits: used,
      available: base + bonus - used,
    },
    events: (events as CreditEvent[]) ?? [],
  };
}

/**
 * Atomically spend 1 credit. Returns remaining balance or throws.
 * MUST be called from service_role context (AI API routes).
 */
export async function spendCredit(
  userId: string,
): Promise<number> {
  // Ensure row + monthly refill before spend
  await ensureUserCredits(userId);
  const db = createServiceClient();

  const { data, error } = await db.rpc("spend_credit", {
    target_user_id: userId,
  });

  if (error) throw new Error(`spend_credit RPC failed: ${error.message}`);

  const result = data as { ok: boolean; credits_remaining?: number; error?: string };
  if (!result.ok) {
    throw new Error(result.error === "INSUFFICIENT" ? "INSUFFICIENT" : "NO_CREDITS");
  }

  return result.credits_remaining!;
}

/**
 * Grant bonus credits via the deduped RPC.
 * Silently skips if already granted for the same (type, ref_id).
 */
export async function grantCredit(
  userId: string,
  type: "quiz_completed" | "quiz_approved" | "guest_signup",
  amount: number,
  referenceId?: string,
): Promise<void> {
  await ensureUserCredits(userId);
  const db = createServiceClient();

  // grant_credit handles dedup internally via unique index
  await db.rpc("grant_credit", {
    target_user_id: userId,
    event_type: type,
    amt: amount,
    ref_id: referenceId ?? null,
  });
  // Swallow duplicate silently — the RPC returns DUPLICATE but we don't care
}
