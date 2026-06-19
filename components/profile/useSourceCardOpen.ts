"use client";

import { useState, useRef, useCallback } from "react";
import type { ProfileSourceEntry } from "@/lib/user-profile-db";
import type { ReportDetailData, QuizDetailData } from "@/lib/source-detail-db";

/* ================================================================== */
/*  useSourceCardOpen                                                   */
/*                                                                     */
/*  Shared hook for opening quiz share cards / OCR screenshot cards     */
/*  from a profile source entry.                                        */
/*                                                                     */
/*  Three-tier data resolution:                                         */
/*  1. Source entry already has card-ready fields → instant (no fetch)   */
/*  2. In-memory detailCache hit → instant                               */
/*  3. Cache miss → fetch /api/profile/source-detail                    */
/*                                                                     */
/*  Used by DataSourceModal and CoverFlowSources.                        */
/* ================================================================== */

interface SourceCardState {
  cardOpen: boolean;
  cardLoading: boolean;
  cardData: ReportDetailData | QuizDetailData | null;
  cardType: "quiz" | "report" | null;
}

export function useSourceCardOpen() {
  const [state, setState] = useState<SourceCardState>({
    cardOpen: false,
    cardLoading: false,
    cardData: null,
    cardType: null,
  });

  const detailCache = useRef(new Map<string, ReportDetailData | QuizDetailData>());

  const openCard = useCallback(async (entry: ProfileSourceEntry) => {
    const cacheKey = `${entry.source_type}:${entry.id}`;

    /* 1. Source entry already has card-ready fields → instant open */
    if (entry.source_type === "quiz" && "traits" in entry) {
      const normalized: QuizDetailData = {
        id: entry.id,
        source_type: "quiz",
        created_at: entry.created_at,
        quiz_title: entry.title,
        quiz_slug: "",
        final_result_name: entry.result,
        final_result_key: "",
        result_subtitle: entry.subtitle ?? null,
        result_description: entry.description ?? null,
        result_image_url: entry.image_url ?? null,
        result_traits: entry.traits ?? [],
        result_share_text: entry.share_text ?? null,
        result_color: entry.card_color ?? null,
        user_vector: null,
      };
      detailCache.current.set(cacheKey, normalized);
      setState({ cardOpen: true, cardLoading: false, cardData: normalized, cardType: "quiz" });
      return;
    }

    if (entry.source_type === "report" && "image_url" in entry) {
      const normalized: ReportDetailData = {
        id: entry.id,
        source_type: "report",
        report_type: entry.title,
        main_result: entry.result,
        created_at: entry.created_at,
        input_type: "",
        image_url: entry.image_url ?? null,
        normalized_summary: null,
        core_vector: null,
        social_vector: null,
      };
      detailCache.current.set(cacheKey, normalized);
      setState({ cardOpen: true, cardLoading: false, cardData: normalized, cardType: "report" });
      return;
    }

    /* 2. Cache hit → instant open */
    const cached = detailCache.current.get(cacheKey);
    if (cached) {
      setState({
        cardOpen: true,
        cardLoading: false,
        cardData: cached,
        cardType: entry.source_type,
      });
      return;
    }

    /* 3. Cache miss → fetch from detail API */
    setState({ cardOpen: true, cardLoading: true, cardData: null, cardType: entry.source_type });

    try {
      const res = await fetch(
        `/api/profile/source-detail?source_type=${entry.source_type}&id=${entry.id}`,
      );
      const data = await res.json();
      if (data.ok) {
        detailCache.current.set(cacheKey, data.detail);
        setState({
          cardOpen: true,
          cardLoading: false,
          cardData: data.detail,
          cardType: entry.source_type,
        });
      } else {
        setState({ cardOpen: false, cardLoading: false, cardData: null, cardType: null });
      }
    } catch {
      setState({ cardOpen: false, cardLoading: false, cardData: null, cardType: null });
    }
  }, []);

  const closeCard = useCallback(() => {
    setState((prev) => ({ ...prev, cardOpen: false }));
  }, []);

  return {
    ...state,
    openCard,
    closeCard,
  };
}
