"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { QuizQuestionData, AnswerRecord } from "@/lib/quiz-runtime";
import { OptionButton } from "./OptionButton";

interface Props {
  question: QuizQuestionData;
  selectedOptionId: string | null;
  locked: boolean;
  direction: number;
  onSelect: (answer: AnswerRecord) => void;
}

export function QuestionCard({
  question,
  selectedOptionId,
  locked,
  direction,
  onSelect,
}: Props) {
  return (
    <div className="w-full">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={question.id}
          custom={direction}
          initial={{ opacity: 0, y: direction > 0 ? 16 : -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: direction > 0 ? -16 : 16 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          <h2 className="mb-8 text-[22px] font-semibold leading-[1.35] tracking-[-0.01em] text-[var(--ink)] sm:text-[26px]">
            {question.text}
          </h2>

          <div className="space-y-3">
            {question.options.map((opt) => {
              let state: "idle" | "selected" | "dimmed";
              if (locked) {
                state = opt.id === selectedOptionId ? "selected" : "dimmed";
              } else if (opt.id === selectedOptionId) {
                state = "selected";
              } else {
                state = "idle";
              }

              return (
                <OptionButton
                  key={opt.id}
                  option={opt}
                  state={state}
                  onClick={() =>
                    onSelect({
                      questionId: question.id,
                      optionId: opt.id,
                      effects: opt.factor_effects,
                    })
                  }
                />
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
