"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { ProfileSourceEntry } from "@/lib/user-profile-db";
import type { QuizDetailData, ReportDetailData } from "@/lib/source-detail-db";
import { QuizResultShareCard } from "@/components/share/QuizResultShareCard";
import { RotatingCardModal } from "@/components/share/RotatingCardModal";
import { useSourceCardOpen } from "./useSourceCardOpen";
import styles from "./hanging-receipts.module.css";

const GAP = 12;
const SAG = 15;
const ROW_SPACE = 46;

function ReceiptTicket({
  entry,
  onOpen,
}: {
  entry: ProfileSourceEntry;
  onOpen: (entry: ProfileSourceEntry) => void;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const hasImage = Boolean(entry.image_url && entry.image_url !== failedImage);
  const result = entry.result.trim() || entry.title;
  const traits = entry.traits ?? [];

  return (
    <button
      type="button"
      className={styles.ticket}
      aria-label={`${result}，查看完整小票`}
      onClick={() => onOpen(entry)}
    >
      <span className={styles.paper}>
        {hasImage ? (
          <span className={styles.imageMain}>
            <span className={styles.image}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.image_url!}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={() => setFailedImage(entry.image_url ?? null)}
              />
            </span>
            <span className={styles.imageName}>{result}</span>
          </span>
        ) : (
          <span className={`${styles.textMain} ${entry.subtitle?.trim() ? styles.withSubtitle : ""}`}>
            <span className={styles.textName}>{result}</span>
            {entry.subtitle?.trim() && <span className={styles.subtitle}>{entry.subtitle}</span>}
          </span>
        )}
        {!hasImage && traits.length > 0 && (
          <span className={styles.footer}>
            <span className={styles.tags}>
              {traits.slice(0, 4).map((trait, index) => (
                <span key={`${trait}-${index}`} title={trait}>{trait}</span>
              ))}
            </span>
          </span>
        )}
      </span>
    </button>
  );
}

interface RowProps {
  entries: ProfileSourceEntry[];
  index: number;
  width: number;
  ticketWidth: number;
  ticketHeight: number;
  onOpen: (entry: ProfileSourceEntry) => void;
}

function ReceiptRow({ entries, index, width, ticketWidth, ticketHeight, onOpen }: RowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  } | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sag = SAG;
  const contentWidth = entries.length * ticketWidth + (entries.length - 1) * GAP;
  const edge = Math.max(20, (width - contentWidth) / 2);
  const scrollable = contentWidth + 40 > width + 1;

  const syncPins = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    for (const child of track.children) {
      const hanger = child as HTMLElement;
      const center = track.offsetLeft + hanger.offsetLeft + ticketWidth / 2 - track.scrollLeft;
      const normalized = Math.max(-1, Math.min(1, (center - width / 2) / (width / 2)));
      hanger.style.setProperty("--hang-offset", `${sag * (1 - normalized * normalized)}px`);
    }
  }, [sag, ticketWidth, width]);

  useLayoutEffect(syncPins, [syncPins, entries.length]);
  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const finishDrag = () => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag) return;
    if (track.hasPointerCapture(drag.pointerId)) track.releasePointerCapture(drag.pointerId);
    track.style.scrollSnapType = "";
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => { dragRef.current = null; }, 0);
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    dragRef.current = null;
    const track = event.currentTarget;
    if (event.pointerType !== "mouse" || track.scrollWidth <= track.clientWidth + 1) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: track.scrollLeft,
      moved: false,
    };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId || event.buttons !== 1) return;
    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) <= 5 && !drag.moved) return;
    drag.moved = true;
    const track = event.currentTarget;
    if (!track.hasPointerCapture(event.pointerId)) track.setPointerCapture(event.pointerId);
    track.style.scrollSnapType = "none";
    track.scrollLeft = drag.scrollLeft - delta;
    event.preventDefault();
  };

  return (
    <div
      className={styles.row}
      role="group"
      aria-label={`第${index + 1}排，${entries.length}张小票`}
      style={{
        height: ticketHeight + ROW_SPACE,
        "--sag": `${sag}px`,
        "--rope-angle": `${[-0.45, 0.3, -0.25, 0.45][index]}deg`,
        "--ticket-width": `${ticketWidth}px`,
        "--ticket-height": `${ticketHeight}px`,
        "--track-edge": `${edge}px`,
      } as CSSProperties}
    >
      <div className={styles.rope} aria-hidden="true" />
      <span className={`${styles.anchor} ${styles.left}`} aria-hidden="true" />
      <span className={`${styles.anchor} ${styles.right}`} aria-hidden="true" />
      <div
        ref={trackRef}
        className={`${styles.track} ${scrollable ? styles.scrollable : ""}`}
        role="list"
        aria-label={`第${index + 1}排小票`}
        onScroll={syncPins}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onLostPointerCapture={finishDrag}
        onPointerLeave={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) finishDrag();
        }}
        onClickCapture={(event) => {
          if (dragRef.current?.moved) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {entries.map((entry, ticketIndex) => {
          const center = edge + ticketWidth / 2 + ticketIndex * (ticketWidth + GAP);
          const normalized = Math.max(-1, Math.min(1, (center - width / 2) / (width / 2)));
          return (
            <div
              key={`${entry.source_type}:${entry.id}`}
              className={styles.hanger}
              role="listitem"
              style={{
                "--hang-offset": `${sag * (1 - normalized * normalized)}px`,
                "--tilt": `${[-1, 0.65, -0.4, 0.9, -0.7, 0.3][(ticketIndex + index * 2) % 6]}deg`,
                "--pin-angle": `${[-4, 4, 1, -3][(ticketIndex + index) % 4]}deg`,
              } as CSSProperties}
            >
              <ReceiptTicket entry={entry} onOpen={onOpen} />
              <span className={styles.pin} aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HangingReceipts({ sources, showCount = true }: { sources: ProfileSourceEntry[]; showCount?: boolean }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ width: 360, height: 640 });
  const { cardOpen, cardLoading, cardData, cardType, openCard, closeCard } = useSourceCardOpen();
  const referenceRowCount = Math.min(3, Math.ceil(sources.length / 3));

  useEffect(() => {
    if (!cardOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCard();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [cardOpen, closeCard]);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const scroll = board.closest<HTMLElement>(".app-scroll");
    const viewport = board.closest<HTMLElement>(".app-viewport");
    const measure = () => {
      if (viewport && board.parentElement) {
        board.style.marginLeft = `${viewport.getBoundingClientRect().left - board.parentElement.getBoundingClientRect().left}px`;
      }
      const top = board.getBoundingClientRect().top - (scroll?.getBoundingClientRect().top ?? 0)
        + (scroll?.scrollTop ?? window.scrollY);
      const safeBottom = scroll ? parseFloat(getComputedStyle(scroll).paddingBottom) : 0;
      const height = Math.max(480, Math.floor((scroll?.clientHeight ?? window.innerHeight) - top - 24 - safeBottom));
      const width = board.clientWidth;
      if (!width) return;
      setLayout((current) => current.width === width && current.height === height ? current : { width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    if (board.parentElement?.parentElement) observer.observe(board.parentElement.parentElement);
    if (scroll) observer.observe(scroll);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [referenceRowCount]);

  if (sources.length === 0) return null;

  const slots = Math.min(3, sources.length);
  const rowLimit = (layout.height - 20 - (referenceRowCount - 1) * GAP) / referenceRowCount;
  const ticketWidth = Math.max(24, Math.min(
    (Math.min(layout.width, 430) - 40 - (slots - 1) * GAP) / slots,
    (rowLimit - ROW_SPACE) / 1.5,
  ));
  const ticketHeight = ticketWidth * 1.5;
  const capacity = Math.max(1, Math.floor((layout.width - 40 + GAP + 0.5) / (ticketWidth + GAP)));
  const rowCount = Math.min(3, Math.ceil(sources.length / capacity));
  const initialCount = capacity * rowCount;
  const rows: ProfileSourceEntry[][] = Array.from({ length: rowCount }, () => []);
  sources.forEach((entry, index) => {
    const row = index < initialCount ? Math.floor(index / capacity) : (index - initialCount) % rowCount;
    rows[row].push(entry);
  });
  const quiz = cardType === "quiz" ? cardData as QuizDetailData | null : null;
  const report = cardType === "report" ? cardData as ReportDetailData | null : null;

  return (
    <>
      <section className={styles.collection} aria-label="我的小票">
        {showCount && <p className={styles.count}>我的小票 · {sources.length} 张</p>}
        <div ref={boardRef} className={styles.board} style={{ height: layout.height }}>
          {rows.map((entries, index) => (
            <ReceiptRow
              key={index}
              entries={entries}
              index={index}
              width={layout.width}
              ticketWidth={ticketWidth}
              ticketHeight={ticketHeight}
              onOpen={openCard}
            />
          ))}
        </div>
      </section>

      <RotatingCardModal
        open={cardOpen}
        loading={cardLoading}
        onClose={closeCard}
        cardRef={cardType === "quiz" ? cardRef : undefined}
        maxWidth={cardType === "quiz" ? "min(560px, calc(100cqw - 48px))" : undefined}
      >
        {cardLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
        {!cardLoading && quiz && (
          <QuizResultShareCard
            ref={cardRef}
            quizTitle={quiz.quiz_title}
            resultName={quiz.final_result_name}
            resultSubtitle={quiz.result_subtitle ?? ""}
            resultDescription={quiz.result_description ?? ""}
            resultImageUrl={quiz.result_image_url ?? undefined}
            traits={quiz.result_traits}
            cardColor={quiz.result_color || "#DAC9A6"}
            createdAt={quiz.created_at}
          />
        )}
        {!cardLoading && report && (report.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={report.image_url} alt="OCR 截图" className="w-full select-none object-contain max-h-[80cqh]" />
        ) : (
          <p className="bg-white/10 px-8 py-16 text-sm text-white/70">未保存原始截图</p>
        ))}
      </RotatingCardModal>
    </>
  );
}
