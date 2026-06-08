"use client";

import { useState } from "react";
import { CoverFlowSources } from "@/components/profile/CoverFlowSources";
import { WordSphereModal } from "@/components/profile/WordSphereModal";

export function ProfileInteractions({
  title,
}: {
  title: string;
  description: string;
}) {
  const [sphereOpen, setSphereOpen] = useState(false);

  return (
    <>
      <CoverFlowSources />

      {title && (
        <>
          {/* Divider */}
          <hr className="border-0 border-t border-[var(--ink)]/8" />

          {/* One-line personality summary */}
          <p
            onClick={() => setSphereOpen(true)}
            className="cursor-pointer text-center text-lg font-medium leading-relaxed tracking-wide text-[var(--ink)]/80 transition active:scale-[0.97] hover:text-[var(--ink)] sm:text-xl"
          >
            {title}
          </p>
        </>
      )}

      <WordSphereModal
        open={sphereOpen}
        onClose={() => setSphereOpen(false)}
      />
    </>
  );
}
