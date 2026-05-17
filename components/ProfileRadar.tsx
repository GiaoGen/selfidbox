"use client";

import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export type RadarPoint = {
  name: string;
  english: string;
  value: number;
};

export function ProfileRadar({
  title,
  subtitle,
  data,
  color = "#ff4d8b",
}: {
  title: string;
  subtitle: string;
  data: RadarPoint[];
  color?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="rounded-[32px] bg-[var(--surface-card)] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.07)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--muted)]">{subtitle}</p>
          <h2 className="mt-1 text-3xl font-semibold leading-tight">{title}</h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          8D
        </span>
      </div>

      <div className="mt-5 h-[320px] w-full sm:h-[360px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="64%">
              <PolarGrid gridType="polygon" stroke="#d8d0bd" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: "#3a3a3a", fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                dataKey="value"
                fill={color}
                fillOpacity={0.34}
                stroke={color}
                strokeWidth={3}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[28px] bg-white/55">
            <div
              className="h-44 w-44 rounded-full border-[18px] opacity-55"
              style={{ borderColor: color }}
            />
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {data.map((item) => (
          <div
            key={item.english}
            className="flex items-center justify-between gap-3 rounded-[18px] bg-white/65 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{item.name}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                {item.english}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--ink)] px-3 py-1 text-sm font-semibold text-white">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
