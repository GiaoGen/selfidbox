import { motion } from "framer-motion";
import type { QuizOptionData } from "@/lib/quiz-runtime";

type OptionState = "idle" | "selected" | "dimmed";

interface Props {
  option: QuizOptionData;
  state: OptionState;
  onClick: () => void;
}

export function OptionButton({ option, state, onClick }: Props) {
  const isSelected = state === "selected";
  const isDimmed = state === "dimmed";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDimmed}
      aria-pressed={isSelected}
      whileTap={{ scale: isDimmed ? 1 : 0.985 }}
      className={`flex min-h-14 w-full items-start gap-3 border-b border-dashed border-[var(--ink)]/15 px-3 py-4 text-left transition-colors duration-150 last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] ${
        isSelected
          ? "bg-[var(--ink)] text-white"
          : "text-[var(--ink)] hover:bg-[var(--ink)]/5"
      } ${isDimmed ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
    >
      <span
        className={`shrink-0 pt-0.5 font-mono text-sm font-semibold ${
          isSelected
            ? "text-white/70"
            : "text-[var(--muted)]"
        }`}
      >
        {option.label}
      </span>
      <span className="min-w-0 flex-1 break-words text-[15px] font-medium leading-relaxed">{option.text}</span>
      {isSelected && (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
          <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </motion.button>
  );
}
