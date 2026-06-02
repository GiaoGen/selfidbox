import { createClient } from "@/lib/supabase/server";

export default async function AuthDebugPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_8px_40px_rgba(10,10,10,0.06)]">
        <h1 className="text-xl font-bold tracking-[-0.02em] text-[var(--ink)]">
          Auth Debug
        </h1>

        {user ? (
          <div className="mt-4 space-y-2 text-sm text-[var(--body)]">
            <p>
              <span className="font-semibold text-[var(--ink)]">User ID:</span>{" "}
              <code className="rounded-md bg-[var(--ink)]/6 px-1.5 py-0.5 text-[13px]">
                {user.id}
              </code>
            </p>
            <p>
              <span className="font-semibold text-[var(--ink)]">Email:</span>{" "}
              <code className="rounded-md bg-[var(--ink)]/6 px-1.5 py-0.5 text-[13px]">
                {user.email ?? "—"}
              </code>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">Not logged in</p>
        )}
      </div>
    </main>
  );
}
