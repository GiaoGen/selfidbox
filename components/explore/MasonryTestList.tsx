"use client";

import { useLayoutEffect, useRef } from "react";
import type { ExploreCard } from "@/lib/explore/types";
import { ReceiptTestCard } from "./ReceiptTestCard";
import styles from "./receipt-cards.module.css";

const GAP = 12;

export function MasonryTestList({ cards }: { cards: ExploreCard[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const items = Array.from(list.children) as HTMLDivElement[];
    let frame = 0;

    const layout = () => {
      const width = list.getBoundingClientRect().width;
      if (width === 0) return;

      list.dataset.ready = "true";
      const columnWidth = (width - GAP) / 2;
      const heights = items.map((item) => item.getBoundingClientRect().height);
      const columns = [0, 0];

      items.forEach((item, index) => {
        const column = columns[0] <= columns[1] ? 0 : 1;
        item.style.left = `${column * (columnWidth + GAP)}px`;
        item.style.top = `${columns[column]}px`;
        columns[column] += heights[index] + GAP;
      });

      list.style.height = `${Math.max(0, columns[0] - GAP, columns[1] - GAP)}px`;
    };

    const scheduleLayout = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    };

    layout();
    const observer = new ResizeObserver(scheduleLayout);
    observer.observe(list);
    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [cards]);

  return (
    <div ref={listRef} className={styles.masonry}>
      {cards.map((card) => (
        <div key={card.id} className={styles.item}>
          <ReceiptTestCard card={card} />
        </div>
      ))}
    </div>
  );
}
