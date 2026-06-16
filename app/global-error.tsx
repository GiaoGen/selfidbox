"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--canvas)] px-6 text-[var(--ink)]">
          <p className="text-6xl">:/</p>
          <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em]">
            出了点问题
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            页面加载失败，请稍后再试。
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            重试
          </button>
        </main>
      </body>
    </html>
  );
}
