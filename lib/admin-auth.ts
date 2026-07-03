import { createClient } from "@/lib/supabase/server";

/**
 * Verify the caller is an admin. Returns the admin's user ID, or null
 * if unauthorized. Call this at the top of every admin server action
 * as defense-in-depth behind the layout-level admin check.
 *
 * Never throw — callers decide how to handle the null case.
 */
export async function requireAdmin(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const adminIds = (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!adminIds.includes(user.id)) return null;

    return user.id;
  } catch {
    return null;
  }
}
