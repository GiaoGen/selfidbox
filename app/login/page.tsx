"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type AuthUser = {
  id: string;
  email?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ id: u.id, email: u.email });
      setChecking(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      setLoading(true);

      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      router.push("/profile");
      router.refresh();
    },
    [email, password, router, supabase],
  );

  const handleSignUp = useCallback(async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    const { error: err, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      // auto-confirmed — redirect
      router.push("/profile");
      router.refresh();
      return;
    }

    setSuccess("注册成功，请检查邮箱验证后登录。");
    setLoading(false);
  }, [email, password, router, supabase]);

  const handleSignOut = useCallback(async () => {
    setError("");
    setSuccess("");
    await supabase.auth.signOut();
    setUser(null);
    setEmail("");
    setPassword("");
    router.refresh();
  }, [router, supabase]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4">
        <div className="h-[2px] w-24 overflow-hidden rounded-full bg-[var(--ink)]/8">
          <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-[var(--ink)]" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--canvas)] px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* header */}
        <div className="text-center">
          <Link
            href="/explore"
            className="text-[22px] font-semibold tracking-[-0.03em] text-[var(--ink)]"
          >
            SelfIDBox
          </Link>
        </div>

        {/* card */}
        <div className="mt-8 rounded-[32px] bg-[var(--surface-card)] p-6 sm:p-8">
          {user ? (
            /* ---- logged in ---- */
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ink)]/8">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--ink)]"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                </svg>
              </div>

              <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                已登录
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">{user.email}</p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/profile"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  进入个人图谱
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--ink)]/12 bg-white px-6 text-[15px] font-semibold text-[var(--ink)] transition-all hover:border-[var(--ink)]/25"
                >
                  退出登录
                </button>
              </div>
            </div>
          ) : (
            /* ---- login form ---- */
            <>
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                欢迎回来
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                登录后同步你的测评报告、人格图谱和 Quiz 结果。
              </p>

              <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="text-[13px] font-semibold text-[var(--muted)]"
                  >
                    邮箱
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="mt-1.5 w-full rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[var(--ink)]/40"
                    style={{ minHeight: 48 }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-[13px] font-semibold text-[var(--muted)]"
                  >
                    密码
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="mt-1.5 w-full rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[var(--ink)]/40"
                    style={{ minHeight: 48 }}
                  />
                </div>

                {error && (
                  <p className="rounded-[12px] bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#dc2626]">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="rounded-[12px] bg-[#f0fdf4] px-4 py-3 text-[13px] font-medium text-[#16a34a]">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "..." : "登录"}
                </button>
              </form>

              <div className="mt-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSignUp}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--ink)]/12 bg-white px-6 text-[15px] font-semibold text-[var(--ink)] transition-all hover:border-[var(--ink)]/25 disabled:opacity-50"
                >
                  {loading ? "..." : "注册"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* footer */}
        <p className="mt-6 text-center text-[13px] text-[#9a9a9a]">
          你的数据只用于生成个人图谱。
        </p>
      </div>
    </main>
  );
}
