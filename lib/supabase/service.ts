import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service_role key.
 * Bypasses RLS — use ONLY in server components or API routes
 * that have already performed their own auth check.
 *
 * Never import this in a client component or "use client" file.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
