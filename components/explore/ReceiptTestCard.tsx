"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";
import styles from "./receipt-cards.module.css";

const titleSegmenter = new Intl.Segmenter("zh", { granularity: "word" });

export function ReceiptTestCard({ card }: { card: ExploreCard }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasImage = Boolean(card.image && card.image !== failedImage);
  const backgroundColor = card.bg_color || nipponColorForSlug(card.id);
  const color = card.text_color || textColorForNipponBg(backgroundColor);
  const description = card.description.trim();

  return (
    <Link
      href={card.href}
      aria-label={card.title}
      className={`${styles.card} ${hasImage ? "" : styles.textOnly}`}
      style={{ backgroundColor, color }}
    >
      <h3 className={styles.title}>
        {hasImage
          ? card.title
          : Array.from(titleSegmenter.segment(card.title), ({ segment, index }) => (
              <span key={index} className={styles.titleWord}>
                {segment}
              </span>
            ))}
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
