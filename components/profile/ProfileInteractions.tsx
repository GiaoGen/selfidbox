"use client";

import { useState, useMemo } from "react";
import { CoverFlowSources } from "@/components/profile/CoverFlowSources";
import { WordSphereModal } from "@/components/profile/WordSphereModal";
import { useWordCloud } from "@/components/profile/useWordCloud";

/* ------------------------------------------------------------------ */
/*  Dynamic font size by character length (mobile / desktop)            */
/* ------------------------------------------------------------------ */

function summaryFontClass(len: number): string {
  if (len <= 6) return "text-2xl sm:text-3xl";
  if (len <= 12) return "text-xl sm:text-2xl";
  if (len <= 20) return "text-lg sm:text-xl";
  if (len <= 30) return "text-base sm:text-lg";
  return "text-sm sm:text-base";
}

/* ------------------------------------------------------------------ */

export function ProfileInteractions({
  title,
}: {
  title: string;
  description: string;
}) {
  const [sphereOpen, setSphereOpen] = useState(false);
  const { words, loading, fetchWords } = useWordCloud();

  function onSummaryClick() {
    fetchWords();
    setSphereOpen(true);
  }

  const fontClass = useMemo(() => summaryFontClass(title.length), [title]);

  return (
    <>
      <CoverFlowSources />

      {title && (
        <>
          {/* Divider */}
          <hr className="border-0 border-t border-[var(--ink)]/8" />

          {/* One-line personality summary */}
          <div
            onClick={onSummaryClick}
            className="cursor-pointer rounded-3xl bg-[var(--surface-card)] px-4 py-3 text-center transition active:scale-[0.98] hover:brightness-[0.97]"
          >
            <p
              className={`truncate font-semibold tracking-wide text-[var(--ink)]/80 ${fontClass}`}
            >
              {title}
            </p>
          </div>
        </>
      )}

      {sphereOpen && !loading && (
        <WordSphereModal
          open={sphereOpen}
          onClose={() => setSphereOpen(false)}
          words={words}
        />
      )}
    </>
  );
}
