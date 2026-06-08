"use client";

import { useRef, useState, useCallback } from "react";

export interface WordCloudWord {
  label: string;
  count: number;
}

interface CacheEntry {
  words: WordCloudWord[];
  ts: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 min

export function useWordCloud() {
  const cacheRef = useRef<CacheEntry | null>(null);
  const [words, setWords] = useState<WordCloudWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchWords = useCallback(async () => {
    // Return cached if fresh
    if (cacheRef.current && Date.now() - cacheRef.current.ts < CACHE_TTL) {
      setWords(cacheRef.current.words);
      setFetched(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile/word-cloud");
      const data = await res.json();
      if (data.ok) {
        const list: WordCloudWord[] = data.words ?? [];
        cacheRef.current = { words: list, ts: Date.now() };
        setWords(list);
      }
    } catch {
      // silent — keep stale cache or empty
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  return { words, loading, fetched, fetchWords };
}
