import { NextResponse } from "next/server";
import {
  getCategories,
  getPublishedTestSites,
  mapCategory,
  mapTestSite,
} from "@/lib/test-sites-db";
import { getExploreQuizCards } from "@/lib/explore/fetch";
import { testSiteToExploreCard } from "@/lib/explore/mapper";
import type { ExploreCard } from "@/lib/explore/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [categoryRows, siteRows, quizCards] = await Promise.all([
      getCategories(),
      getPublishedTestSites(),
      getExploreQuizCards(),
    ]);

    const siteCards: ExploreCard[] = siteRows
      .map(mapTestSite)
      .map(testSiteToExploreCard);

    const allCards: ExploreCard[] = [...siteCards, ...quizCards];

    return NextResponse.json({ ok: true, cards: allCards });
  } catch (e) {
    console.error("[search-cards] Failed to fetch explore cards", e);
    return NextResponse.json(
      { ok: false, error: "数据加载失败" },
      { status: 500 },
    );
  }
}
