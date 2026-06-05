import { motion } from "framer-motion";
import type { QuizOptionData } from "@/lib/quiz-runtime";

type OptionState = "idle" | "selected" | "dimmed";

interface Props {
  option: QuizOptionData;
  state: OptionState;
  onClick: () => void;
  accentColor: string;
  accentText: string;
}

export function OptionButton({ option, state, onClick, accentColor, accentText }: Props) {
  const isSelected = state === "selected";
  const isDimmed = state === "dimmed";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDimmed}
      whileTap={{ scale: isDimmed ? 1 : 0.985 }}
      className={`w-full rounded-2xl px-5 py-4 text-left transition-all duration-150 ${
        isSelected
          ? "shadow-md"
          : "bg-white text-[var(--ink)] shadow-sm hover:bg-[var(--ink)]/3 hover:shadow-md"
      } ${isDimmed ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
      style={
        isSelected
          ? { backgroundColor: accentColor, color: accentText }
          : undefined
      }
    >
      <span
        className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
        style={
          isSelected
            ? { backgroundColor: "rgba(255,255,255,0.2)", color: accentText }
            : { backgroundColor: "rgb(28 28 28 / 0.06)", color: "var(--muted)" }
        }
      >
        {option.label}
      </span>
      <span className="text-[15px] font-medium leading-snug">{option.text}</span>
    </motion.button>
  );
}
