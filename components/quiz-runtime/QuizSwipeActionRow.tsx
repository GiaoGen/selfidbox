"use client";

import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

/* ================================================================== */
/*  QuizSwipeActionRow                                                  */
/*                                                                      */
/*  Mobile-first swipe-to-reveal action buttons.                        */
/*  - Swipe left → reveals action buttons behind the row                */
/*  - Parent manages which row is open via isOpen / onOpenChange         */
/*  - Buttons are laid out right-to-left in the DOM for visual order    */
/* ================================================================== */

export interface ActionButton {
  key: string;
  label: string;
  icon: React.ReactNode;
  bgClass: string;    // e.g. "bg-gray-100 text-gray-700"
  hoverClass: string; // e.g. "hover:bg-gray-200"
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

const BTN_WIDTH = 56;

interface Props {
  children: React.ReactNode;
  buttons: ActionButton[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function QuizSwipeActionRow({
  children,
  buttons,
  isOpen,
  onOpenChange,
  className = "",
}: Props) {
  const controls = useAnimation();
  const visibleButtons = buttons.filter((b) => !b.hidden);
  const totalWidth = visibleButtons.length * BTN_WIDTH;

  useEffect(() => {
    if (isOpen) {
      controls.start({ x: -totalWidth });
    } else {
      controls.start({ x: 0 });
    }
  }, [isOpen, controls, totalWidth]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    const threshold = totalWidth * 0.25;
    if (info.offset.x < -threshold) {
      onOpenChange(true);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden">
        {/* Action buttons behind the row (right-aligned) */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-row-reverse">
          {visibleButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
                btn.onClick();
              }}
              disabled={btn.disabled}
              className={`flex items-center justify-center text-xs font-semibold transition-colors disabled:opacity-30 select-none ${btn.bgClass} ${btn.hoverClass}`}
              style={{ width: BTN_WIDTH }}
              aria-label={btn.label}
            >
              <span className="flex flex-col items-center gap-0.5">
                {btn.icon}
                <span className="text-[10px] leading-none">{btn.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Draggable row */}
        <motion.div
          drag={totalWidth > 0 ? "x" : (undefined as unknown as false)}
          dragConstraints={{ left: -totalWidth, right: 0 }}
          dragElastic={0.06}
          onDragEnd={handleDragEnd}
          animate={controls}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative bg-white touch-pan-y"
          onClick={() => {
            if (isOpen) onOpenChange(false);
          }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
