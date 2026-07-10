"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";
import { RotatingCardModal } from "@/components/share/RotatingCardModal";
import { QuizResultShareCard } from "@/components/share/QuizResultShareCard";
import { useSourceCardOpen } from "@/components/profile/useSourceCardOpen";
import type { ProfileSourceEntry } from "@/lib/user-profile-db";
import type { QuizDetailData, ReportDetailData } from "@/lib/source-detail-db";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const COLUMNS = 5;
const GAP = 10;

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type BlockSize = 1 | 2 | 3 | 4;

interface PlacedBlock {
  entry: ProfileSourceEntry;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  bg: string;
  textColor: string;
  fontSize: number;
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isVertical(colSpan: number, rowSpan: number): boolean {
  return colSpan === 1 && rowSpan >= 2;
}

function isLeftSide(col: number): boolean {
  return col < COLUMNS / 2;
}

function isAscii(text: string): boolean {
  return /^[\x00-\x7F]*$/.test(text);
}

function pickFontSize(size: BlockSize, rand: () => number): number {
  const ranges: Record<BlockSize, [number, number]> = {
    1: [12, 16],
    2: [14, 22],
    3: [16, 28],
    4: [18, 36],
  };
  const [min, max] = ranges[size];
  return Math.round(min + rand() * (max - min));
}

function pickShape(
  size: BlockSize,
  rand: () => number,
  forceHorizontal?: boolean,
): { colSpan: number; rowSpan: number } {
  switch (size) {
    case 1:
      return { colSpan: 1, rowSpan: 1 };
    case 2:
      if (forceHorizontal) return { colSpan: 2, rowSpan: 1 };
      return rand() < 0.5
        ? { colSpan: 2, rowSpan: 1 }
        : { colSpan: 1, rowSpan: 2 };
    case 3:
      if (forceHorizontal) return { colSpan: 3, rowSpan: 1 };
      return rand() < 0.5
        ? { colSpan: 3, rowSpan: 1 }
        : { colSpan: 1, rowSpan: 3 };
    case 4:
      return rand() < 0.4
        ? { colSpan: 4, rowSpan: 1 }
        : { colSpan: 2, rowSpan: 2 };
  }
}

/* ================================================================== */
/*  Size assignment — strictly by character count                      */
/* ================================================================== */

function sizeForLength(len: number): BlockSize {
  if (len <= 2) return 1;
  if (len <= 4) return 2;
  if (len <= 6) return 3;
  return 4;
}

/* ================================================================== */
/*  Placement engine                                                   */
/* ================================================================== */

function placeBlocks(entries: ProfileSourceEntry[]): PlacedBlock[] {
  if (entries.length === 0) return [];

  const rand = mulberry32(hashStr(entries.map((e) => e.id).join(",")));

  /* -- Sort: quiz+image > quiz > report -- */
  const sorted = [...entries].sort((a, b) => {
    const score = (e: ProfileSourceEntry) =>
      e.source_type === "quiz" && e.image_url ? 3
        : e.source_type === "quiz" ? 2
        : 1;
    return score(b) - score(a) || b.created_at.localeCompare(a.created_at);
  });

  /* -- Assign sizes (strictly by text length), then pair & shuffle -- */
  const pairs = sorted.map((entry) => ({
    entry,
    size: sizeForLength(entry.result.length),
  }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  /* -- Build items with shapes (English → horizontal only) -- */
  const items = pairs.map(({ entry, size }) => ({
    entry,
    ...pickShape(size, rand, isAscii(entry.result)),
  }));

  /* -- Place: greedy, larger area first -- */
  const MAX_ROWS = 30;
  const occupied: boolean[][] = Array.from({ length: MAX_ROWS }, () =>
    Array(COLUMNS).fill(false),
  );

  const sortedByArea = items
    .map((item, idx) => ({ ...item, idx }))
    .sort((a, b) => b.colSpan * b.rowSpan - a.colSpan * a.rowSpan);

  const placed: PlacedBlock[] = [];
  const n = sorted.length;
  const estRows = Math.max(1, Math.ceil(n / 3));

  for (const item of sortedByArea) {
    const { colSpan, rowSpan } = item;
    let found = false;

    for (let row = 0; row < MAX_ROWS - rowSpan + 1 && !found; row++) {
      // 1×3 constraint: not in last 3 rows
      if (
        colSpan === 1 &&
        rowSpan === 3 &&
        row + rowSpan - 1 >= estRows - 2
      ) {
        continue;
      }

      for (let col = 0; col <= COLUMNS - colSpan && !found; col++) {
        let fits = true;
        for (let dr = 0; dr < rowSpan && fits; dr++) {
          for (let dc = 0; dc < colSpan && fits; dc++) {
            if (occupied[row + dr][col + dc]) fits = false;
          }
        }
        if (!fits) continue;

        // Occupy
        for (let dr = 0; dr < rowSpan; dr++) {
          for (let dc = 0; dc < colSpan; dc++) {
            occupied[row + dr][col + dc] = true;
          }
        }

        const bg = item.entry.card_color || nipponColorForSlug(item.entry.id);
        // Re-derive size from shape area, then pick font size
        const area = colSpan * rowSpan;
        const size = (
          area <= 1 ? 1 : area <= 2 ? 2 : area <= 3 ? 3 : 4
        ) as BlockSize;
        const fontSize = pickFontSize(size, rand);

        placed.push({
          entry: item.entry,
          col,
          row,
          colSpan,
          rowSpan,
          bg,
          textColor: textColorForNipponBg(bg),
          fontSize,
        });
        found = true;
      }
    }
    // Not placed → silently dropped (accept imperfection)
  }

  return placed;
}

/* ================================================================== */
/*  Character rendering for vertical blocks                            */
/* ================================================================== */

function VerticalText({
  text,
  col,
}: {
  text: string;
  col: number;
}) {
  const left = isLeftSide(col);
  const rotate = left ? "rotate(90deg)" : "rotate(-90deg)";
  const chars = text.split("");
  if (!left) chars.reverse(); // right side: read bottom-to-top

  return (
    <div className="flex flex-col items-center">
      {chars.map((ch, i) => (
        <span key={i} className="inline-block" style={{ transform: rotate }}>
          {ch}
        </span>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function SourceBlocks({ sources }: { sources: ProfileSourceEntry[] }) {
  const entries = useMemo(
    () =>
      sources.filter(
        (s) =>
          s.result &&
          s.result !== "已解析" &&
          s.result !== "已完成",
      ),
    [sources],
  );

  const blocks = useMemo(() => placeBlocks(entries), [entries]);

  /* eslint-disable react-hooks/purity */
  const randomDelays = useMemo(() => {
    const n = blocks.length;
    if (n === 0) return [] as number[];
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const delays: number[] = new Array(n);
    let elapsed = 0;
    for (const idx of indices) {
      elapsed += 0.03 + Math.random() * 0.06;
      delays[idx] = elapsed;
    }
    return delays;
  }, [blocks.length]);
  /* eslint-enable react-hooks/purity */

  /* -- Card modal (shared hook: cache + three-tier fetch) -- */
  const { cardOpen, cardLoading, cardData, cardType, openCard, closeCard } =
    useSourceCardOpen();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleBlockClick = useCallback(
    (entry: ProfileSourceEntry) => { openCard(entry); },
    [openCard],
  );

  /* -- Row height = column width → 1×1 squares -- */
  const gridRef = useRef<HTMLDivElement>(null);
  const [rowH, setRowH] = useState(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el || blocks.length === 0) return;
    const calc = () => {
      const w = el.offsetWidth;
      const cw = (w - GAP * (COLUMNS - 1)) / COLUMNS;
      setRowH(Math.round(cw));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [blocks.length]);

  if (blocks.length === 0) return null;

  return (
    <>
      <div
        ref={gridRef}
        className="grid"
      style={{
        gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
        gridAutoRows: rowH > 0 ? `${rowH}px` : "auto",
        gap: GAP,
      }}
    >
      {blocks.map((b, i) => {
        const vertical = isVertical(b.colSpan, b.rowSpan);

        return (
          <motion.div
            key={b.entry.id}
            onClick={() => handleBlockClick(b.entry)}
            className="flex items-center justify-center overflow-hidden select-none cursor-pointer"
            style={{
              gridColumn: `${b.col + 1} / span ${b.colSpan}`,
              gridRow: `${b.row + 1} / span ${b.rowSpan}`,
              backgroundColor: b.bg,
              color: b.textColor,
              fontSize: b.fontSize,
              fontWeight: 500,
              lineHeight: vertical ? 1.15 : 1.35,
              letterSpacing: vertical ? "0" : "-0.01em",
              wordBreak: "break-word",
            }}
            initial={{ opacity: 0, scale: 0.90 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 22,
              delay: randomDelays[i] ?? 0,
            }}
          >
            {vertical ? (
              <VerticalText text={b.entry.result} col={b.col} />
            ) : (
              <span>{b.entry.result}</span>
            )}
          </motion.div>
        );
      })}
    </div>

    {/* ── Quiz Result Share Card ── */}
    {cardType === "quiz" && (
      <RotatingCardModal open={cardOpen} onClose={closeCard} cardRef={cardRef}>
        {cardLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
        {!cardLoading && cardData && (
          <QuizResultShareCard
            ref={cardRef}
            quizTitle={(cardData as QuizDetailData).quiz_title}
            resultName={(cardData as QuizDetailData).final_result_name}
            resultSubtitle={(cardData as QuizDetailData).result_subtitle ?? ""}
            resultDescription={(cardData as QuizDetailData).result_description ?? ""}
            resultImageUrl={(cardData as QuizDetailData).result_image_url ?? undefined}
            traits={(cardData as QuizDetailData).result_traits}
            cardColor={(cardData as QuizDetailData).result_color || "#DAC9A6"}
          />
        )}
      </RotatingCardModal>
    )}

    {/* ── OCR Screenshot Card ── */}
    {cardType === "report" && (
      <RotatingCardModal open={cardOpen} onClose={closeCard}>
        {cardLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
        {!cardLoading && cardData && (cardData as ReportDetailData).image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(cardData as ReportDetailData).image_url!}
            alt="OCR 截图"
            className="w-full select-none"
            style={{ objectFit: "contain", maxHeight: "80vh" }}
          />
        ) : null}
        {!cardLoading && cardData && !(cardData as ReportDetailData).image_url ? (
          <div className="flex items-center justify-center rounded-2xl bg-white/10 px-8 py-16 text-white/50 text-sm">
            未保存原始截图
          </div>
        ) : null}
      </RotatingCardModal>
    )}
    </>
  );
}
