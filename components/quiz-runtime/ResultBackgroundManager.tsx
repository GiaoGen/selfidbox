"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { RankedRuntimeResult } from "@/lib/quiz-runtime";

interface Props {
  ranking: RankedRuntimeResult[];
}

/**
 * Single-image dynamic background — shows the blurred image of the
 * current top-ranked result. Crossfades when the top result changes.
 */
export function ResultBackgroundManager({ ranking }: Props) {
  const top = ranking[0];
  const imageUrl = top?.result?.image_url ?? null;

  if (!imageUrl) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {/* Readability overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(255,255,255,0.75)" }}
      />

      {/* Top1 blurred image — crossfade on change */}
      <AnimatePresence>
        <motion.img
          key={top.result.id}
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: "cover",
            filter: "blur(40px)",
            transform: "scale(1.15)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          crossOrigin="anonymous"
        />
      </AnimatePresence>
    </div>
  );
}
