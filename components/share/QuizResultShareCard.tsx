"use client";

import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import receiptStyles from "@/components/quiz-runtime/quiz-runtime.module.css";
import styles from "./quiz-result-share-card.module.css";

const resultSegmenter = new Intl.Segmenter("zh", { granularity: "word" });
const createdAtFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

interface Props {
  quizTitle: string;
  resultName: string;
  resultSubtitle?: string;
  resultDescription?: string;
  resultImageUrl?: string;
  traits?: string[];
  cardColor: string;
  createdAt?: string;
}

export const QuizResultShareCard = forwardRef<HTMLDivElement, Props>(
  function QuizResultShareCard(
    {
      quizTitle,
      resultName,
      resultSubtitle = "",
      resultDescription = "",
      resultImageUrl,
      traits = [],
      cardColor,
      createdAt,
    },
    ref,
  ) {
    const [failedImage, setFailedImage] = useState<string | null>(null);
    const traitsRef = useRef<HTMLDivElement>(null);
    const hasImage = Boolean(resultImageUrl && resultImageUrl !== failedImage);
    const createdDate = new Date(createdAt ?? "");
    const formattedCreatedAt = Number.isNaN(createdDate.getTime()) ? "" : createdAtFormatter.format(createdDate);

    useLayoutEffect(() => {
      const container = traitsRef.current;
      if (!container) return;
      const fitTraits = () => {
        const tags = Array.from(container.querySelectorAll("span"));
        tags.forEach((tag) => tag.style.whiteSpace = "nowrap");
        const overflow = tags.map((tag) => tag.scrollWidth > tag.clientWidth);
        tags.forEach((tag, index) => {
          if (overflow[index]) tag.style.whiteSpace = "normal";
        });
      };
      fitTraits();
      let frameId = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(fitTraits);
      });
      observer.observe(container);
      return () => {
        observer.disconnect();
        cancelAnimationFrame(frameId);
      };
    }, [traits]);

    return (
      <div ref={ref} className={styles.card}>
        <div className={`${receiptStyles.receipt} ${styles.receipt}`}>
          <header className={styles.header}>
            <div className={styles.meta}>
              <span className={styles.label}>
                <span
                  aria-hidden="true"
                  className={styles.accent}
                  style={{ backgroundColor: cardColor || "#DAC9A6" }}
                />
                测试结果
              </span>
              <span className={styles.brand}>SelfIDBox</span>
            </div>
            <p className={styles.quizTitle}>{quizTitle}</p>
          </header>

          {hasImage && (
            <div className={styles.image}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultImageUrl}
                alt=""
                crossOrigin="anonymous"
                onError={() => setFailedImage(resultImageUrl ?? null)}
              />
            </div>
          )}

          <div className={hasImage ? undefined : styles.textHero}>
            <h1 className={styles.resultName} aria-label={resultName}>
              {hasImage
                ? resultName
                : Array.from(resultSegmenter.segment(resultName), ({ segment, index }) => (
                    <span key={index} className={styles.resultWord}>
                      {segment}
                    </span>
                  ))}
            </h1>
            {resultSubtitle && <p className={styles.subtitle}>{resultSubtitle}</p>}
          </div>

          {resultDescription && <p className={styles.description}>{resultDescription}</p>}

          {traits.length > 0 && (
            <div ref={traitsRef} className={styles.traits}>
              {traits.slice(0, 4).map((trait, index) => (
                <span key={`${trait}-${index}`}>{trait}</span>
              ))}
            </div>
          )}

          {formattedCreatedAt && (
            <footer className={styles.createdAt}>
              <span>创建时间</span>
              <time dateTime={createdDate.toISOString()}>{formattedCreatedAt}</time>
            </footer>
          )}
        </div>
      </div>
    );
  },
);
