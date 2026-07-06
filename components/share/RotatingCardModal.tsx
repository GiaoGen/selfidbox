"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
}

export function RotatingCardModal({ open, onClose, children, maxWidth }: Props) {
  // Safari: lock body scroll when modal is open
  useSafariScrollLock(open);

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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
