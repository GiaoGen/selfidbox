"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./receipt-print.module.css";

interface Props {
  children: ReactNode;
  controls?: ReactNode;
  loading?: boolean;
  className: string;
  style?: CSSProperties;
}

export function ReceiptPrint({ children, controls, loading = false, className, style }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [printed, setPrinted] = useState(false);
  const reducedMotion = useReducedMotion();
  const printing = !loading && !printed && !reducedMotion;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const paper = paperRef.current;
    const overlay = frame?.closest<HTMLElement>("[data-app-overlay]");
    if (!frame || !paper || !overlay) return;

    const measure = () => {
      const top = frame.getBoundingClientRect().top - overlay.getBoundingClientRect().top;
      const distance = Math.ceil(top + paper.offsetTop + paper.offsetHeight + 2);
      paper.style.setProperty("--feed-start", `${-distance}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(paper);
    observer.observe(overlay);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <motion.div
      ref={frameRef}
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className={`${styles.frame} ${printing ? styles.feeding : ""} ${className}`}
      style={style}
    >
      <div
        ref={paperRef}
        className={`${styles.paper} ${loading ? "" : styles.enter}`}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setPrinted(true);
        }}
      >
        {children}
      </div>
      {controls && <div className={styles.controls} inert={printing}>{controls}</div>}
    </motion.div>
  );
}
