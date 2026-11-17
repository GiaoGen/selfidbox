"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { ProfileRadar, type RadarPoint } from "@/components/ProfileRadar";
import { RotatingCardModal } from "@/components/share/RotatingCardModal";
import { SELFID_FACTORS } from "@/lib/selfid-factors";
import type { UserProfileRow } from "@/lib/user-profile-db";
import receiptStyles from "@/components/quiz-runtime/quiz-runtime.module.css";
import styles from "./radar-receipts.module.css";

const groups = [
  { key: "core", title: "核心人格", subtitle: "你的内在偏好" },
  { key: "social", title: "社会表达", subtitle: "你与外界的互动方式" },
] as const;

type Group = typeof groups[number];
type Dimension = RadarPoint & { key: string; description: string };

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function readValue(raw: unknown): number | null {
  let value = raw;
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    value = ["value", "score", "percent", "percentage", "level"]
      .map((key) => record[key])
      .find((entry) => typeof entry === "number" && Number.isFinite(entry));
  }
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(Math.max(0, Math.min(100, number))) : null;
}

function getDimensions(profile: UserProfileRow | null, group: Group): Dimension[] {
  const vector = group.key === "core" ? profile?.core_vector : profile?.social_vector;
  return SELFID_FACTORS.filter((factor) => factor.group === group.key).map((factor) => ({
    key: factor.key,
    name: factor.name,
    english: factor.key,
    description: factor.description,
    value: readValue(vector?.[factor.key]),
  }));
}

const RadarReceipt = forwardRef<HTMLDivElement, {
  group: Group;
  dimensions: Dimension[];
  compact?: boolean;
  updatedAt?: string;
}>(function RadarReceipt({ group, dimensions, compact = false, updatedAt }, ref) {
  const known = dimensions.filter((dimension) => dimension.value !== null);
  const highlights = [...known].sort((a, b) => b.value! - a.value!).slice(0, 2);
  const updatedDate = new Date(updatedAt ?? "");
  const formattedDate = Number.isNaN(updatedDate.getTime()) ? "" : dateFormatter.format(updatedDate);
  const Heading = compact ? "h2" : "h1";

  return (
    <div ref={ref} className={`${receiptStyles.receipt} ${styles.receipt} ${compact ? styles.compact : ""}`}>
      <header className={styles.receiptHeader}>
        {!compact && <div className={styles.meta}><span>人格画像</span><span className={styles.brand}>SelfIDBox</span></div>}
        <div className={styles.headingRow}>
          <Heading>{group.title}</Heading>
          {compact && <span className={styles.coverage}>{known.length} / {dimensions.length} 项维度</span>}
        </div>
        {!compact && <p className={styles.subtitle}>{group.subtitle}</p>}
      </header>
      <ProfileRadar title={`${group.title}雷达图`} data={dimensions} color="#797153" compact={compact} />
      {compact ? (
        <p className={styles.highlights}>
          {known.length > 0
            ? highlights.map((dimension) => `${dimension.name} ${dimension.value}`).join(" · ")
            : "完成相关测试后查看你的画像"}
        </p>
      ) : (
        <>
          <p className={styles.coverage}>数据覆盖 {known.length} / {dimensions.length} 项维度</p>
          <div className={styles.readings}>
            {dimensions.map((dimension) => (
              <section className={styles.reading} key={dimension.key}>
                <div className={styles.readingHeading}>
                  <h2>{dimension.name}</h2>
                  <span>{dimension.value === null ? "暂无数据" : `${dimension.value} / 100`}</span>
                </div>
                <p>{dimension.description}</p>
              </section>
            ))}
          </div>
          {formattedDate && <footer className={styles.footer}><span>更新时间</span><time dateTime={updatedDate.toISOString()}>{formattedDate}</time></footer>}
        </>
      )}
    </div>
  );
});

export function RadarReceipts({ profile, error = false }: { profile: UserProfileRow | null; error?: boolean }) {
  const [selected, setSelected] = useState<Group | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <>
      <section className={styles.collection} aria-label="我的雷达">
        {error && <p role="alert" className={styles.error}>雷达数据暂时无法加载，请刷新页面重试。</p>}
        {groups.map((group) => (
          <button type="button" key={group.key} className={styles.cardButton} aria-label={`展开${group.title}小票`} onClick={() => setSelected(group)}>
            <RadarReceipt group={group} dimensions={getDimensions(profile, group)} compact />
          </button>
        ))}
      </section>
      <RotatingCardModal open={selected !== null} onClose={() => setSelected(null)} cardRef={cardRef} maxWidth="min(560px, calc(100cqw - 48px))">
        {selected && <RadarReceipt ref={cardRef} group={selected} dimensions={getDimensions(profile, selected)} updatedAt={profile?.updated_at} />}
      </RotatingCardModal>
    </>
  );
}
