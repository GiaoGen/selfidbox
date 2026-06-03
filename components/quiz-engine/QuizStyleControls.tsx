"use client";

import { Sliders } from "lucide-react";
import type { QuizStyleControls } from "@/lib/mock-quiz-engine";
import { EditableSlider } from "@/components/quiz-studio/EditableSlider";

type Props = {
  style: QuizStyleControls;
  onChange: (patch: Partial<QuizStyleControls>) => void;
};

const SLIDERS: {
  key: keyof QuizStyleControls;
  label: string;
  left: string;
  right: string;
}[] = [
  { key: "abstractness", label: "抽象度", left: "真实", right: "抽象" },
  { key: "seriousness", label: "严肃度", left: "搞怪", right: "严肃" },
  { key: "depth", label: "深度", left: "轻松", right: "深度" },
  { key: "poeticness", label: "文艺度", left: "直白", right: "文艺" },
];

export function QuizStyleControls({ style, onChange }: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--ink)]/8 bg-white p-5 shadow-[0_8px_30px_rgba(10,10,10,0.04)]">
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={18} className="text-[var(--muted)]" />
        <p className="text-sm font-semibold text-[var(--muted)]">
          Quiz Style Controls
        </p>
      </div>

      <div className="space-y-5">
        {SLIDERS.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-[var(--body)]">
                {s.label}
              </span>
              <span className="text-xs text-[var(--muted)] tabular-nums">
                {style[s.key]}
              </span>
            </div>
            <EditableSlider
              value={style[s.key]}
              onChange={(v) => onChange({ [s.key]: v })}
            />
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-[var(--muted)]/60">{s.left}</span>
              <span className="text-[10px] text-[var(--muted)]/60">{s.right}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
