"use client";

import Link from "next/link";
import type { QuizDetailData } from "@/lib/source-detail-db";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

interface Props {
  data: QuizDetailData;
}

export function QuizDetail({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
          Quiz 测试
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">
          {data.quiz_title}
        </h2>
        <div className="mt-3 flex items-center gap-3 text-sm text-[var(--muted)]">
          <span>{formatDate(data.created_at)}</span>
          <span className="inline-block rounded-full bg-[#ffb084]/30 px-2.5 py-0.5 text-xs font-semibold text-[#b85c2a]">
            Quiz
          </span>
        </div>
      </div>

      {/* Result */}
      <div className="rounded-2xl border border-[var(--ink)]/8 bg-white p-5">
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
          测试结果
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[var(--ink)]">
          {data.final_result_name || data.final_result_key}
        </h3>
        {data.result_subtitle && (
          <p className="mt-1 text-[15px] text-[var(--body)]">
            {data.result_subtitle}
          </p>
        )}
        {data.result_description && (
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--body)]">
            {data.result_description}
          </p>
        )}
      </div>

      {/* Result image */}
      {data.result_image_url && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
            结果图片
          </h3>
          <div className="overflow-hidden rounded-2xl border border-[var(--ink)]/8">
            <img
              src={data.result_image_url}
              alt={data.final_result_name || "结果图片"}
              className="w-full object-cover aspect-[4/3]"
            />
          </div>
        </div>
      )}

      {/* Traits */}
      {data.result_traits.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
            结果标签
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.result_traits.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-[var(--ink)]/10 bg-white px-4 py-2 text-sm font-medium text-[var(--ink)]"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Result URL */}
      {data.quiz_slug && (
        <div className="pt-2">
          <Link
            href={`/quiz/${data.quiz_slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M5.5 5.5v4a1 1 0 001 1h4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 10l4.5-4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            重新查看结果
          </Link>
        </div>
      )}
    </div>
  );
}
