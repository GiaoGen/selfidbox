"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps page content with a native-app-like entrance animation.
 *
 * Enter: opacity 0→1 + translateY(8px)→0, 220ms ease-out.
 * No exit animation — the incoming page's enter handles the transition feel.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
