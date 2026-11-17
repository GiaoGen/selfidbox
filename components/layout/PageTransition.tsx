"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Wraps page content with a native-app-like entrance animation.
 *
 * Enter: opacity 0→1, 220ms ease-out.
 * Keep transforms off this wrapper so fixed dialogs use the app viewport.
 * No exit animation — the incoming page's enter handles the transition feel.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
