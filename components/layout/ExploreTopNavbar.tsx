"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { TopNavbar } from "@/components/layout/TopNavbar";

/** TopNavbar + search button — matches Explore page navbar style. */
export function ExploreTopNavbar() {
  return (
    <TopNavbar
      rightSlot={
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_2px_10px_rgba(10,10,10,0.05)] transition hover:bg-[var(--surface-strong)]"
        >
          <Search size={16} />
          <span className="hidden sm:inline">搜索</span>
        </Link>
      }
    />
  );
}
