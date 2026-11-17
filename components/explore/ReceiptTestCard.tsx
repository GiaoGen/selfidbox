"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";
import styles from "./receipt-cards.module.css";

const titleSegmenter = new Intl.Segmenter("zh", { granularity: "word" });
const latinLetter = /\p{Script=Latin}/u;

export function ReceiptTestCard({ card }: { card: ExploreCard }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasImage = Boolean(card.image && card.image !== failedImage);
  const hasLatinTitle = latinLetter.test(card.title);
  const backgroundColor = card.bg_color || nipponColorForSlug(card.id);
  const color = card.text_color || textColorForNipponBg(backgroundColor);
  const description = card.description.trim();

  useLayoutEffect(() => {
    const title = titleRef.current;
    if (hasImage || !hasLatinTitle || !title) return;

    const fitWords = () => {
      const availableWidth = title.getBoundingClientRect().width;
      if (availableWidth === 0) return;
      const fontSize = parseFloat(getComputedStyle(title).fontSize);
      const words = title.querySelectorAll<HTMLElement>(`.${styles.latinWord}`);
      words.forEach((word) => word.style.removeProperty("font-size"));
      const widths = Array.from(words, (word) => word.getBoundingClientRect().width);
      words.forEach((word, index) => {
        if (widths[index] > availableWidth) {
          const fittedSize = fontSize * (availableWidth / widths[index]);
          word.style.fontSize = `${Math.floor(fittedSize * 100) / 100}px`;
        }
      });
    };

    fitWords();
    const observer = new ResizeObserver(fitWords);
    observer.observe(title);
    return () => observer.disconnect();
  }, [card.title, hasImage, hasLatinTitle]);

  return (
    <Link
      href={card.href}
      aria-label={card.title}
      className={`${styles.card} ${hasImage ? "" : styles.textOnly}`}
      style={{ backgroundColor, color }}
    >
      <h3 ref={titleRef} className={`${styles.title} ${!hasImage && hasLatinTitle ? styles.mixedTitle : ""}`}>
        {hasImage
          ? card.title
          : Array.from(titleSegmenter.segment(card.title), ({ segment, index }) =>
              hasLatinTitle && !segment.trim() ? segment : (
                <span key={index} className={`${styles.titleWord} ${latinLetter.test(segment) ? styles.latinWord : ""}`}>
                  {segment}
                </span>
              ),
            )}
      </h3>
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.image}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedImage(card.image)}
          className={styles.image}
        />
      )}
      {description && (
        <>
          <hr className={styles.divider} />
          <p className={styles.description}>{description}</p>
        </>
      )}
    </Link>
  );
}
