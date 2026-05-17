"use client";

import { useState } from "react";

export function ImportEmailBox({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-[32px] bg-[#ffb084] p-5 text-[#0a0a0a] shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold opacity-75">导入结果</p>
          <h2 className="mt-2 text-3xl font-semibold leading-none tracking-[-0.04em]">
            把报告寄回 SelfIDBox
          </h2>
        </div>
        <div className="hidden h-14 w-14 rounded-[20px] bg-[#ff4d8b] sm:block" />
      </div>

      <p className="mt-5 text-sm leading-6 opacity-85">
        做完测试后，如果该网站支持邮件发送报告，你可以填写这个人格邮箱，SelfIDBox
        会自动帮你整理和分析结果。
      </p>

      <div className="mt-5 rounded-[24px] bg-white/45 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
          Personality email
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all text-xl font-semibold tracking-[-0.02em]">
            {email}
          </code>
          <button
            type="button"
            onClick={copyEmail}
            className="min-h-11 rounded-[16px] bg-[var(--ink)] px-5 text-sm font-semibold text-white"
          >
            {copied ? "已复制" : "复制邮箱"}
          </button>
        </div>
      </div>
    </section>
  );
}
