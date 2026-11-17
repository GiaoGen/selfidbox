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
  const previewRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [printed, setPrinted] = useState(false);
  const reducedMotion = useReducedMotion();
  const printing = !loading && !printed && !reducedMotion;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const preview = previewRef.current;
    const feed = feedRef.current;
    const paper = paperRef.current;
    const overlay = frame?.closest<HTMLElement>("[data-app-overlay]");
    if (!frame || !preview || !feed || !paper || !overlay) return;

    const measure = () => {
      const width = frame.clientWidth;
      if (!width) return;
      paper.style.width = `${width}px`;
      const height = paper.offsetHeight;
      if (!height) return;
      const maxHeight = Math.min(overlay.clientHeight, parseFloat(getComputedStyle(frame).maxHeight) || overlay.clientHeight);
      const availableHeight = Math.max(1, maxHeight - (controlsRef.current?.offsetHeight ?? 0));
      const scale = Math.min(1, availableHeight / height);
      paper.style.setProperty("--receipt-scale", String(scale));
      preview.style.width = `${width * scale}px`;
      preview.style.height = `${height * scale}px`;
      const top = frame.getBoundingClientRect().top - overlay.getBoundingClientRect().top;
      const distance = Math.ceil(top + preview.offsetTop + preview.offsetHeight + 2);
      feed.style.setProperty("--feed-start", `${-distance}px`);
    };
    measure();
    let frameId = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    });
    observer.observe(frame);
    observer.observe(paper);
    observer.observe(overlay);
    if (controlsRef.current) observer.observe(controlsRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
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
      <div ref={previewRef} className={styles.preview}>
        <div
          ref={feedRef}
          className={`${styles.feed} ${loading ? "" : styles.enter}`}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) setPrinted(true);
          }}
        >
          <div ref={paperRef} className={styles.paper}>{children}</div>
        </div>
      </div>
      {controls && <div ref={controlsRef} className={styles.controls} inert={printing}>{controls}</div>}
    </motion.div>
  );
}
