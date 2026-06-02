"use client";

import type { ReportDetailData } from "@/lib/source-detail-db";

/* ------------------------------------------------------------------ */
/*  Dimension label mapping                                             */
/* ------------------------------------------------------------------ */

const DIM_LABELS: Record<string, string> = {
  social: "社交性",
  sensitivity: "敏感度",
  rationality: "理性度",
  curiosity: "探索欲",
  independence: "独立性",
  expressiveness: "表达欲",
  drive: "行动力",
  imagination: "幻想度",
  assertiveness: "主张性",
  security_need: "安全感需求",
  empathy: "共情力",
  dramaticness: "戏剧性",
  orderliness: "秩序感",
  contradiction: "反差感",
  attachment: "亲密倾向",
  presence: "存在感",
};

function cnLabel(key: string): string {
  return DIM_LABELS[key] ?? key;
}

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

/** Parse a dimension value from either flat number or {value, confidence, count} object */
function parseDimValue(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const k of ["value", "score", "percent"]) {
      const v = obj[k];
      if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    }
  }
  return null;
}

function renderVector(
  vector: Record<string, unknown> | null,
  title: string,
) {
  if (!vector) return null;
  const entries = Object.entries(vector)
    .map(([key, raw]) => ({ key, label: cnLabel(key), value: parseDimValue(raw) }))
    .filter((e) => e.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (entries.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">{title}</h3>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.key} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-sm text-[var(--body)]">
              {e.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-[var(--ink)]/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--ink)]/50 transition-all"
                style={{ width: `${e.value}%` }}
              />
            </div>
            <span className="w-8 text-right text-sm font-semibold text-[var(--ink)]">
              {e.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

interface Props {
  data: ReportDetailData;
}

export function ReportDetail({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Header info */}
      <div>
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
          测评类型
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">
          {data.report_type}
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-[var(--body)]">
          {data.main_result}
        </p>
        <div className="mt-3 flex items-center gap-3 text-sm text-[var(--muted)]">
          <span>{formatDate(data.created_at)}</span>
          <span className="inline-block rounded-full bg-[var(--ink)]/6 px-2.5 py-0.5 text-xs font-medium">
            {data.input_type === "screenshot" ? "截图导入" : "报告导入"}
          </span>
        </div>
      </div>

      {/* OCR Image */}
      {data.image_url ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
            OCR 原图
          </h3>
          <div className="overflow-hidden rounded-2xl border border-[var(--ink)]/8">
            <img
              src={data.image_url}
              alt="原始截图"
              className="w-full object-contain"
              style={{ maxHeight: 480 }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--ink)]/4 px-4 py-8 text-center">
          <p className="text-sm text-[var(--muted)]">未保存原始截图</p>
        </div>
      )}

      {/* Summary */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">
          OCR Summary
        </h3>
        {data.normalized_summary ? (
          <p className="text-[15px] leading-relaxed text-[var(--body)] whitespace-pre-line">
            {data.normalized_summary}
          </p>
        ) : (
          <p className="text-sm text-[var(--muted)]">暂无摘要</p>
        )}
      </div>

      {/* Core vector */}
      {renderVector(data.core_vector, "核心人格维度")}

      {/* Social vector */}
      {renderVector(data.social_vector, "社交人格维度")}
    </div>
  );
}
