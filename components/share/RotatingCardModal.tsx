"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { useSafariScrollLock } from "@/lib/use-safari-scroll-lock";

/* ================================================================== */
/*  RotatingCardModal                                                   */
/*                                                                     */
/*  Reusable full-screen modal with rotateY flip-in animation.          */
/*  Click backdrop to close. Card interior clicks do not close.         */
/*                                                                     */
/*  Used by:                                                            */
/*  - Quiz Result Share Card (profile data source)                       */
/*  - OCR Screenshot Card (profile data source)                         */
/*  - Quiz Runtime share modal                                          */
/* ================================================================== */

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Max width of the card wrapper. Defaults to "calc(100vw - 48px)". */
  maxWidth?: string;
  /** Ref to the card DOM element for PNG export. When provided, a download button is shown. */
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

export function RotatingCardModal({ open, onClose, children, maxWidth, cardRef }: Props) {
  // Safari: lock body scroll when modal is open
  useSafariScrollLock(open);
  const [saving, setSaving] = useState(false);

  async function handleDownload() {
    if (!cardRef?.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = "selfidbox-share-card.png";
      link.href = dataUrl;
      link.click();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ perspective: "1200px" }}
        >
          {/* backdrop — click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80"
          />

          {/* card — rotateY flip-in, simple fade-out */}
          <motion.div
            initial={{ rotateY: -720, scale: 0.9, opacity: 0 }}
            animate={{ rotateY: 0, scale: 1, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="relative z-10 flex w-full flex-col items-center"
            style={{ maxWidth: maxWidth ?? "calc(100vw - 48px)" }}
          >
            {children}
            {cardRef && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={saving}
                className="self-end mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/70 transition hover:bg-white/25 hover:text-white disabled:opacity-40"
                aria-label="保存图片"
              >
                <Download size={14} />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
