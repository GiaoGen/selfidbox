"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import type { ExploreCard } from "@/lib/explore/types";

/* ------------------------------------------------------------------ */
/*  Search function (same fields as ExploreClient)                      */
/* ------------------------------------------------------------------ */

function searchCards(cards: ExploreCard[], query: string): ExploreCard[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return cards.filter((c) => {
    if (c.title.toLowerCase().includes(q)) return true;
    if (c.description.toLowerCase().includes(q)) return true;
    if (c.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (c.categoryLabel.toLowerCase().includes(q)) return true;
    return false;
  });
}

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  SearchOverlay                                                       */
/* ------------------------------------------------------------------ */

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();

  /* ---- cards data ---- */
  const [cards, setCards] = useState<ExploreCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/explore/search-cards")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) setCards(data.cards ?? []);
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  /* ---- search input ---- */
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // auto-focus when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  /* ---- debounce ---- */
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  /* ---- filtered results ---- */
  const results = useMemo(
    () => searchCards(cards, debouncedQuery),
    [cards, debouncedQuery],
  );

  /* ---- result click → close + navigate ---- */
  const handleResultClick = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  /* ---- render ---- */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {/* backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-[var(--ink)]/12 backdrop-blur-md"
            onClick={onClose}
            aria-label="关闭搜索"
          />

          {/* content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* ── Search header ── */}
            <div
              className="shrink-0 flex items-center gap-3 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-3"
            >
              <div className="flex flex-1 items-center gap-2 rounded-full border border-white/50 bg-white/80 px-4 py-3 shadow-[0_4px_24px_rgba(10,10,10,0.06)] backdrop-blur-xl">
                <Search size={18} className="shrink-0 text-[var(--muted)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索测评、标签、分类..."
                  className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 rounded-full p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 text-[14px] font-semibold text-[var(--ink)]/70 hover:text-[var(--ink)]"
              >
                取消
              </button>
            </div>

            {/* ── Results area ── */}
            <div className="flex-1 overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ink)]/15 border-t-[var(--ink)]/40" />
                </div>
              )}

              {/* Empty prompt */}
              {!loading && !debouncedQuery.trim() && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search
                    size={32}
                    className="mb-3 text-[var(--muted)]/40"
                  />
                  <p className="text-[14px] text-[var(--muted)]">
                    输入关键词搜索测评和 Quiz
                  </p>
                </div>
              )}

              {/* No results */}
              {!loading && debouncedQuery.trim() && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-[14px] font-medium text-[var(--ink)]/50">
                    没有找到相关内容
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--muted)]">
                    试试其他关键词
                  </p>
                </div>
              )}

              {/* Results list */}
              {!loading && results.length > 0 && (
                <>
                  <p className="mb-3 text-[12px] font-medium text-[var(--muted)]">
                    {results.length} 个结果
                  </p>
                  <div className="flex flex-col gap-2">
                    {results.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleResultClick(card.href)}
                        className="flex items-center gap-3 rounded-[20px] bg-white/80 p-4 text-left shadow-[0_1px_4px_rgba(10,10,10,0.04)] backdrop-blur-lg transition-colors transition-transform active:scale-[0.98] hover:bg-white"
                      >
                        {/* thumbnail */}
                        {card.image ? (
                          <img
                            src={card.image}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold"
                            style={{
                              backgroundColor: card.bg_color,
                              color: card.text_color,
                            }}
                          >
                            {card.title.slice(0, 2)}
                          </div>
                        )}

                        {/* text */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold text-[var(--ink)]">
                            {card.title}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-[var(--muted)]">
                            {card.description}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-block rounded-full bg-[var(--ink)]/6 px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                              {card.categoryLabel}
                            </span>
                            <span className="text-[10px] text-[var(--muted)]/70">
                              {card.source_type === "official"
                                ? "官方测评"
                                : "社区 Quiz"}
                            </span>
                          </div>
                        </div>

                        {/* chevron */}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="shrink-0 text-[var(--muted)]/40"
                        >
                          <path
                            d="M6 4l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
