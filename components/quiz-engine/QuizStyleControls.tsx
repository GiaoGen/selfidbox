"use client";

import { Sliders } from "lucide-react";
import type { QuizStyleControls } from "@/lib/mock-quiz-engine";
import { EditableSlider } from "@/components/quiz-studio/EditableSlider";

type Props = {
  style: QuizStyleControls;
  onChange: (patch: Partial<QuizStyleControls>) => void;
  accentColor?: string;
  inverted?: boolean;
};

const SLIDERS: {
  key: keyof QuizStyleControls;
  label: string;
  left: string;
  right: string;
}[] = [
  { key: "abstractness", label: "抽象度", left: "真实", right: "抽象" },
  { key: "seriousness", label: "严肃度", left: "轻松", right: "严肃" },
  { key: "goofiness", label: "搞怪度", left: "正常", right: "搞怪" },
  { key: "depth", label: "深度", left: "偏好", right: "深度" },
  { key: "poeticness", label: "文艺度", left: "直白", right: "文艺" },
  { key: "title_relevance", label: "主题相关度", left: "泛化", right: "紧扣" },
];

export function QuizStyleControls({ style, onChange, accentColor, inverted }: Props) {
  const mutedClass = inverted ? "text-white/55" : "text-[var(--muted)]";
  const bodyClass = inverted ? "text-white/80" : "text-[var(--body)]";
  const subtleClass = inverted ? "text-white/35" : "text-[var(--muted)]/60";

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <Sliders size={18} className={mutedClass} />
        <p className={`text-sm font-semibold ${mutedClass}`}>
          题目风格偏好
        </p>
      </div>

      <div className="space-y-5">
        {SLIDERS.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-semibold ${bodyClass}`}>
                {s.label}
              </span>
              <span className={`text-xs tabular-nums ${mutedClass}`}>
                {style[s.key]}
              </span>
            </div>
            <EditableSlider
              value={style[s.key]}
              onChange={(v) => onChange({ [s.key]: v })}
              accentColor={accentColor}
              inverted={inverted}
            />
            <div className="flex items-center justify-between mt-0.5">
              <span className={`text-[10px] ${subtleClass}`}>{s.left}</span>
              <span className={`text-[10px] ${subtleClass}`}>{s.right}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
