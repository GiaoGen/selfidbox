"use client";

import { useState } from "react";
import Link from "next/link";
import { Radar, ReceiptText } from "lucide-react";
import { HangingReceipts } from "@/components/profile/HangingReceipts";
import { RadarReceipts } from "./RadarReceipts";
import type { ProfileSourceEntry, UserProfileRow } from "@/lib/user-profile-db";
import styles from "./radar-receipts.module.css";

export function ProfileInteractions({
  initialSources,
  profile,
  profileError = false,
}: {
  initialSources?: ProfileSourceEntry[];
  profile?: UserProfileRow | null;
  profileError?: boolean;
}) {
  const sources = initialSources ?? [];
  const [view, setView] = useState<"tickets" | "radar">("tickets");
  const isRadar = view === "radar";

  return (
    <section aria-label="个人收藏">
      <div className={styles.switchRow}>
        <p className={styles.count}>{isRadar ? "我的雷达 · 2 张" : `我的小票 · ${sources.length} 张`}</p>
        <button
          type="button"
          className={styles.viewToggle}
          aria-label={isRadar ? "返回小票" : "查看雷达"}
          aria-pressed={isRadar}
          onClick={() => setView(isRadar ? "tickets" : "radar")}
        >
          {isRadar ? <ReceiptText size={20} strokeWidth={1.5} /> : <Radar size={20} strokeWidth={1.5} />}
        </button>
      </div>
      <div className={styles.view} hidden={isRadar}>
        {sources.length > 0 ? (
          <HangingReceipts sources={sources} showCount={false} />
        ) : (
          <p className="text-sm text-[var(--muted)]">
            当前没有任何数据，<Link href="/explore" className="font-semibold text-[var(--ink)] hover:underline">去首页选一个喜欢的</Link>
          </p>
        )}
      </div>
      <div className={styles.view} hidden={!isRadar}>
        <RadarReceipts profile={profile ?? null} error={profileError} />
      </div>
    </section>
  );
}
