"use client";

import { LegalContent } from "@/components/legal/LegalModal";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-5 py-8">
      <div className="mx-auto max-w-[680px] text-[14px] leading-[1.8] text-[var(--body)]">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">服务条款</h1>
        <LegalContent tab="terms" />
        <p className="mt-8 text-[12px] text-[var(--muted)]/50">
          最后更新：2026-06-24 · 联系：giaogen001@gmail.com
        </p>
      </div>
    </main>
  );
}
