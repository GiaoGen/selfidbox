"use client";

import { useState, useEffect, useCallback, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/types";
import { LegalModal, TAB_LABELS, type LegalTab } from "@/components/legal/LegalModal";

type Mode = "login" | "signup" | "verify" | "forgot" | "reset";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const supabase = createClient();

  // 检测密码重置回调 — 在渲染阶段计算，避免 effect 中同步 setState
  const [isRecovery] = useState(() => {
    if (typeof window === "undefined") return false;
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashType = hashParams.get("type");
    const searchType = searchParams.get("type");
    return hashType === "recovery" || searchType === "recovery";
  });

  const [mode, setMode] = useState<Mode>(isRecovery ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(!isRecovery);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [legalTab, setLegalTab] = useState<LegalTab | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    // 安全：清除 URL 中的 recovery token，防止泄露到浏览器历史
    if (isRecovery) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }

    // 正常流程 — 检查已登录用户
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ id: u.id, email: u.email });
      setChecking(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Login                                                               */
  /* ------------------------------------------------------------------ */

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

      router.push(redirect || "/profile");
      router.refresh();
    },
    [email, password, redirect, router, supabase],
  );

  /* ------------------------------------------------------------------ */
  /*  Sign up — username is required, then verify OTP inline             */
  /* ------------------------------------------------------------------ */

  const handleSignUp = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      const trimmed = username.trim();
      if (!trimmed || trimmed.length < 2 || trimmed.length > 30) {
        setError("用户名需要 2–30 个字符");
        return;
      }

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
        // Auto-confirmed — save username then redirect
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: trimmed }),
        });

        const body = await res.json();

        if (!res.ok) {
          setError(body.error || "用户名保存失败，请重试");
          setLoading(false);
          return;
        }

        router.push(redirect || "/profile");
        router.refresh();
        return;
      }

      // Email OTP required — switch to inline verify mode
      setToken("");
      setLoading(false);
      setMode("verify");
    },
    [email, password, username, redirect, router, supabase],
  );

  /* ------------------------------------------------------------------ */
  /*  Verify OTP inline                                                   */
  /* ------------------------------------------------------------------ */

  const handleVerify = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");

      const code = token.trim();
      if (!code) {
        setError("请输入验证码");
        return;
      }

      setLoading(true);

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // Email verified — save username
      const trimmed = username.trim();
      if (trimmed) {
        await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: trimmed }),
        }).catch(() => {});
      }

      router.push(redirect || "/profile");
      router.refresh();
    },
    [email, username, token, redirect, router, supabase],
  );

  /* ------------------------------------------------------------------ */
  /*  Resend OTP                                                          */
  /* ------------------------------------------------------------------ */

  const handleResend = useCallback(async () => {
    setError("");
    setLoading(true);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(resendError.message);
    }

    setLoading(false);
  }, [email, supabase]);

  /* ------------------------------------------------------------------ */
  /*  Forgot password — send reset link                                  */
  /* ------------------------------------------------------------------ */

  const handleForgotPassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      setLoading(true);

      if (!email.trim()) {
        setError("请输入邮箱地址");
        setLoading(false);
        return;
      }

      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
      );

      setLoading(false);

      if (err) {
        if (err.status === 429) {
          setError("请求过于频繁，请稍后再试");
        } else {
          // 不泄露邮箱是否存在 — 仅记录日志
          console.error("Password reset error:", err.message);
        }
      }

      // 无论邮箱是否存在，始终显示相同成功消息（防邮箱枚举攻击）
      setSuccess("如果该邮箱已注册，验证码已发送至您的邮箱。请检查垃圾邮件文件夹。");
      setCodeSent(true);
    },
    [email, supabase],
  );

  /* ------------------------------------------------------------------ */
  /*  Reset with code — verify recovery OTP then update password         */
  /* ------------------------------------------------------------------ */

  const handleResetWithCode = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      const code = token.trim();
      if (!code) {
        setError("请输入验证码");
        return;
      }

      if (newPassword.length < 8) {
        setError("密码至少需要 8 个字符");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("两次输入的密码不一致");
        return;
      }

      setLoading(true);

      // Step 1: Verify recovery code (authenticates the user)
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // Step 2: Update password (user is now authenticated from verifyOtp)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess("密码已重置成功");
      setLoading(false);

      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1500);
    },
    [email, token, newPassword, confirmPassword, router, supabase],
  );

  /* ------------------------------------------------------------------ */
  /*  Resend recovery code                                                */
  /* ------------------------------------------------------------------ */

  const handleResendRecoveryCode = useCallback(async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    const { error: resendError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
    );

    setLoading(false);

    if (resendError) {
      if (resendError.status === 429) {
        setError("请求过于频繁，请稍后再试");
      } else {
        console.error("Resend recovery code error:", resendError.message);
      }
    } else {
      setSuccess("验证码已重新发送至您的邮箱。");
    }
  }, [email, supabase]);

  /* ------------------------------------------------------------------ */
  /*  Reset password — set new password after recovery link              */
  /* ------------------------------------------------------------------ */

  const handleResetPassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (newPassword.length < 8) {
        setError("密码至少需要 8 个字符");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("两次输入的密码不一致");
        return;
      }

      setLoading(true);

      const { error: err } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setSuccess("密码已重置成功");
      setLoading(false);

      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1500);
    },
    [newPassword, confirmPassword, router, supabase],
  );

  /* ------------------------------------------------------------------ */
  /*  Sign out                                                            */
  /* ------------------------------------------------------------------ */

  const handleSignOut = useCallback(async () => {
    setError("");
    setSuccess("");
    await supabase.auth.signOut();
    setUser(null);
    setEmail("");
    setPassword("");
    setUsername("");
    setToken("");
    setMode("login");
    router.refresh();
  }, [router, supabase]);

  /* ------------------------------------------------------------------ */
  /*  Switch mode — reset fields + errors                                */
  /* ------------------------------------------------------------------ */

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setUsername("");
    setToken("");
    setNewPassword("");
    setConfirmPassword("");
    setCodeSent(false);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4">
        <div className="h-[2px] w-24 overflow-hidden bg-[var(--ink)]/8">
          <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] bg-[var(--ink)]" />
        </div>
      </main>
    );
  }

  /* dashed divider for receipt sections */
  const dashedDivider = "my-4 border-t-2 border-dashed border-[var(--ink)]/15";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--canvas)] px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* card */}
        <div className="relative shadow-[0_4px_20px_rgba(0,0,0,0.20)] bg-[var(--surface-card)] p-6 sm:p-8">
          {/* ---- 锯齿：顶部穿孔条 ---- */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 h-[6px]"
            style={{
              backgroundImage: "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
              backgroundSize: "8px 6px",
              backgroundRepeat: "repeat-x",
            }}
          />

          {/* ---- 锯齿：底部穿孔条 ---- */}
          <div
            className="pointer-events-none absolute left-0 right-0 bottom-0 h-[6px]"
            style={{
              backgroundImage: "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
              backgroundSize: "8px 6px",
              backgroundRepeat: "repeat-x",
            }}
          />

          {/* header */}
          <div className="text-center">
            <Link
              href="/explore"
              className="text-[22px] font-semibold tracking-[-0.03em] text-[var(--ink)]"
            >
              SelfIDBox
            </Link>
          </div>

          <hr className={dashedDivider} />
          {user && mode !== "reset" ? (
            /* ---- logged in ---- */
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[var(--ink)]/8">
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

              <p className="mt-2 text-sm text-[var(--muted)]">
                {user.username ? `@${user.username}` : user.email}
              </p>
              {user.username && (
                <p className="text-xs text-[var(--muted)]/70">{user.email}</p>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/profile"
                  className="inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98]"
                >
                  进入个人图谱
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex min-h-12 items-center justify-center border border-[var(--ink)]/12 bg-white px-6 text-[15px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--ink)]/25"
                >
                  退出登录
                </button>
              </div>
            </div>
          ) : mode === "verify" ? (
            /* ---- verify OTP inline ---- */
            <>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[var(--ink)]/8">
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
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>

                <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                  验证邮箱
                </h1>

                <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                  请查看邮箱中的验证码
                </p>

                <p className="mt-1 text-[13px] font-medium text-[var(--muted)]/70">
                  {email}
                </p>
              </div>

              <hr className={dashedDivider} />

              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="token"
                    className="text-[13px] font-semibold text-[var(--muted)]"
                  >
                    验证码
                  </label>
                  <input
                    id="token"
                    type="text"
                    inputMode="numeric"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    autoComplete="one-time-code"
                    placeholder="输入验证码"
                    className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-center text-[24px] tracking-[0.3em] text-[var(--ink)] outline-none transition-colors placeholder:text-[13px] placeholder:tracking-normal placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                    style={{ minHeight: 56 }}
                  />
                </div>

                {error && (
                  <p className="bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#dc2626]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "..." : "验证"}
                </button>
              </form>

              <hr className={dashedDivider} />

              <p className="text-center text-[13px] text-[var(--muted)]">
                没有收到？{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="font-semibold text-[var(--ink)] hover:underline disabled:opacity-50"
                >
                  重新发送
                </button>
              </p>
            </>
          ) : mode === "forgot" ? (
            <>
              {/* ---- forgot password ---- */}
              {!codeSent ? (
                /* ---- Phase 1: enter email ---- */
                <>
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[var(--ink)]/8">
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
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                      </svg>
                    </div>

                    <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                      重置密码
                    </h1>

                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                      输入注册邮箱，我们将发送验证码。
                    </p>
                  </div>

                  <hr className={dashedDivider} />

                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="text-[13px] font-semibold text-[var(--muted)]"
                      >
                        邮箱
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                        style={{ minHeight: 48 }}
                      />
                    </div>

                    {error && (
                      <p className="bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#dc2626]">
                        {error}
                      </p>
                    )}

                    {success && (
                      <p className="bg-[#f0fdf4] px-4 py-3 text-[13px] font-medium text-[#16a34a]">
                        {success}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-1 inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? "..." : "发送验证码"}
                    </button>
                  </form>

                  <hr className={dashedDivider} />

                  <p className="text-center text-[13px] text-[var(--muted)]">
                    记起密码了？{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="font-semibold text-[var(--ink)] hover:underline"
                    >
                      返回登录
                    </button>
                  </p>
                </>
              ) : (
                /* ---- Phase 2: enter code + new password ---- */
                <>
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[var(--ink)]/8">
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
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>

                    <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                      验证身份
                    </h1>

                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                      请输入发送至邮箱的验证码
                    </p>

                    <p className="mt-1 text-[13px] font-medium text-[var(--muted)]/70">
                      {email}
                    </p>
                  </div>

                  <hr className={dashedDivider} />

                  <form onSubmit={handleResetWithCode} className="flex flex-col gap-4">
                    <div>
                      <label
                        htmlFor="recovery-token"
                        className="text-[13px] font-semibold text-[var(--muted)]"
                      >
                        验证码
                      </label>
                      <input
                        id="recovery-token"
                        type="text"
                        inputMode="numeric"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                        autoComplete="one-time-code"
                        placeholder="输入验证码"
                        className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-center text-[24px] tracking-[0.3em] text-[var(--ink)] outline-none transition-colors placeholder:text-[13px] placeholder:tracking-normal placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                        style={{ minHeight: 56 }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="new-password"
                        className="text-[13px] font-semibold text-[var(--muted)]"
                      >
                        新密码
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="至少 8 个字符"
                        className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                        style={{ minHeight: 48 }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="text-[13px] font-semibold text-[var(--muted)]"
                      >
                        确认密码
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        placeholder="再次输入新密码"
                        className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                        style={{ minHeight: 48 }}
                      />
                    </div>

                    {error && (
                      <p className="bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#dc2626]">
                        {error}
                      </p>
                    )}

                    {success && (
                      <p className="bg-[#f0fdf4] px-4 py-3 text-[13px] font-medium text-[#16a34a]">
                        {success}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-1 inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? "..." : "重置密码"}
                    </button>
                  </form>

                  <hr className={dashedDivider} />

                  <p className="text-center text-[13px] text-[var(--muted)]">
                    没有收到？{" "}
                    <button
                      type="button"
                      onClick={handleResendRecoveryCode}
                      disabled={loading}
                      className="font-semibold text-[var(--ink)] hover:underline disabled:opacity-50"
                    >
                      重新发送
                    </button>
                    {" · "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="font-semibold text-[var(--ink)] hover:underline"
                    >
                      返回登录
                    </button>
                  </p>
                </>
              )}
            </>
          ) : mode === "reset" ? (
            <>
              {/* ---- reset password ---- */}
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[var(--ink)]/8">
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                  设置新密码
                </h1>

                <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                  请输入新密码，完成后将自动登录。
                </p>
              </div>

              <hr className={dashedDivider} />

              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="text-[13px] font-semibold text-[var(--muted)]"
                  >
                    新密码
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="至少 8 个字符"
                    className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                    style={{ minHeight: 48 }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="text-[13px] font-semibold text-[var(--muted)]"
                  >
                    确认密码
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="再次输入新密码"
                    className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                    style={{ minHeight: 48 }}
                  />
                </div>

                {error && (
                  <p className="bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#dc2626]">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="bg-[#f0fdf4] px-4 py-3 text-[13px] font-medium text-[#16a34a]">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "..." : "重置密码"}
                </button>
              </form>

              <hr className={dashedDivider} />

              <p className="text-center text-[13px] text-[var(--muted)]">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-[var(--ink)] hover:underline"
                >
                  返回登录
                </button>
              </p>
            </>
          ) : mode === "login" ? (
            /* ---- login form ---- */
            <>
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                欢迎回来
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                登录后同步你的测评报告、人格图谱和 Quiz 结果。
              </p>

              <hr className={dashedDivider} />

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                    className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                    style={{ minHeight: 48 }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-[13px] font-semibold text-[var(--muted)]"
                    >
                      密码
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[12px] font-medium text-[var(--muted)]/70 transition-colors hover:text-[var(--ink)]"
                    >
                      忘记密码?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                    style={{ minHeight: 48 }}
                  />
                </div>

                {error && (
                  <p className="bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#dc2626]">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="bg-[#f0fdf4] px-4 py-3 text-[13px] font-medium text-[#16a34a]">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "..." : "登录"}
                </button>
              </form>

              <hr className={dashedDivider} />

              <p className="text-center text-[13px] text-[var(--muted)]">
                没有账号？{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-[var(--ink)] hover:underline"
                >
                  注册
                </button>
              </p>
            </>
          ) : (
            /* ---- sign up form ---- */
            <>
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                创建账号
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                注册后可同步你的测评报告、人格图谱和 Quiz 结果。
              </p>

              <hr className={dashedDivider} />

              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
                    className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                    style={{ minHeight: 48 }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="text-[13px] font-semibold text-[var(--muted)]"
                  >
                    用户名
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="2–30 个字符，注册后可修改"
                    className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
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
                    autoComplete="new-password"
                    className="mt-1.5 w-full border border-[var(--hairline)] bg-white px-4 py-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)]/50 focus:border-[var(--ink)]/40"
                    style={{ minHeight: 48 }}
                  />
                </div>

                {error && (
                  <p className="bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#dc2626]">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="bg-[#f0fdf4] px-4 py-3 text-[13px] font-medium text-[#16a34a]">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-6 text-[15px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "..." : "注册"}
                </button>
              </form>

              <hr className={dashedDivider} />

              <p className="text-center text-[13px] text-[var(--muted)]">
                已有账号？{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-[var(--ink)] hover:underline"
                >
                  登录
                </button>
              </p>
            </>
          )}
        </div>

        {/* legal links */}
        <hr className="mx-auto mt-5 w-2/3 border-t-2 border-dashed border-[var(--ink)]/10" />

        <div className="mt-3 flex items-center justify-center gap-1.5 select-none">
          {(Object.keys(TAB_LABELS) as LegalTab[]).map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[11px] text-[var(--ink)]/12">·</span>}
              <button
                type="button"
                onClick={() => setLegalTab(t)}
                className="text-[11px] text-[var(--muted)]/50 transition-colors hover:text-[var(--muted)]/80"
              >
                {TAB_LABELS[t]}
              </button>
            </span>
          ))}
        </div>

        {/* footer */}
        <p className="mt-3 text-center text-[13px] text-[var(--muted)]/40">
          你的数据只用于生成个人图谱。
        </p>
      </div>

      <LegalModal
        open={legalTab !== null}
        onClose={() => setLegalTab(null)}
        initialTab={legalTab ?? "terms"}
      />

    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
