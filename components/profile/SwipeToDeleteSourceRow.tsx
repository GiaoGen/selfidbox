"use client";

import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

/* ================================================================== */
/*  SwipeToDeleteSourceRow                                              */
/*                                                                      */
/*  Mobile-first swipe-to-reveal delete.                                 */
/*  - Swipe left → reveals "删除" button on the right                   */
/*  - Desktop: hover shows a trash icon at the row edge                  */
/*  - Parent manages which row is open via isOpen / onOpenChange         */
/* ================================================================== */

const DELETE_BTN_WIDTH = 72;

interface SwipeToDeleteSourceRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
  /** Whether this row's delete button is currently revealed */
  isOpen: boolean;
  /** Called when this row wants to open or close the delete button */
  onOpenChange: (open: boolean) => void;
  /** Extra classes for the outer container */
  className?: string;
}

export function SwipeToDeleteSourceRow({
  children,
  onDelete,
  disabled = false,
  isOpen,
  onOpenChange,
  className = "",
}: SwipeToDeleteSourceRowProps) {
  const controls = useAnimation();

  /* Keep animation in sync with parent state (handles external close) */
  useEffect(() => {
    if (isOpen) {
      controls.start({ x: -DELETE_BTN_WIDTH });
    } else {
      controls.start({ x: 0 });
    }
  }, [isOpen, controls]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    const threshold = DELETE_BTN_WIDTH * 0.35;
    if (info.offset.x < -threshold) {
      onOpenChange(true);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* ---- Inner container: overflow-hidden clips the delete button ---- */}
      <div className="relative overflow-hidden group">
        {/* Behind-row delete button (revealed by swipe) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={disabled}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-[#fce8e6] text-[#c0392b] hover:bg-[#f9d4d1] active:bg-[#f5bcb7] transition-colors disabled:opacity-40 select-none"
          style={{ width: DELETE_BTN_WIDTH }}
          aria-label="删除"
        >
          <span className="text-sm font-semibold">删除</span>
        </button>

        {/* Draggable row — padding lives here so it moves with the content */}
        <motion.div
          drag={disabled ? (undefined as unknown as false) : "x"}
          dragConstraints={{ left: -DELETE_BTN_WIDTH, right: 0 }}
          dragElastic={0.06}
          onDragEnd={handleDragEnd}
          animate={controls}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative bg-[#fffaf0] touch-pan-y py-3"
          onClick={() => {
            if (isOpen) onOpenChange(false);
          }}
        >
          <div className="relative">
            {children}

            {/* Desktop hover: trash icon at right edge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={disabled}
              className="absolute right-0 top-0 bottom-0 hidden md:flex items-center px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gradient-to-l from-[#fffaf0] via-[#fffaf0]/90 to-transparent disabled:opacity-0"
              aria-label="删除"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c0392b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
