"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type RadarPoint = {
  name: string;
  english: string;
  value: number | null;
};

type ProfileRadarProps = {
  title: string;
  data: RadarPoint[];
  color?: string;
  maxValue?: number;
  compact?: boolean;
};

function vertex(cx: number, cy: number, radius: number, index: number, total: number) {
  const angle = (2 * Math.PI / total) * index - Math.PI / 2;
  return {
    x: Number((cx + radius * Math.cos(angle)).toFixed(2)),
    y: Number((cy + radius * Math.sin(angle)).toFixed(2)),
  };
}

function clamp(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function dataPathD(cx: number, cy: number, radius: number, data: RadarPoint[], maxValue: number) {
  let path = "";
  let connected = false;
  for (let index = 0; index < data.length; index++) {
    const value = data[index].value;
    if (value === null || !Number.isFinite(value)) {
      connected = false;
      continue;
    }
    const point = vertex(cx, cy, radius * clamp(value / maxValue), index, data.length);
    path += `${connected ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    connected = true;
  }
  return data.length > 2 && data.every((point) => point.value !== null && Number.isFinite(point.value)) ? `${path}Z` : path;
}

export function ProfileRadar({ title, data, color = "#ff4d8b", maxValue = 100, compact = false }: ProfileRadarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);
  const height = compact ? 200 : 260;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      if (container.clientWidth > 0) setWidth(container.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(20, Math.min((width - 112) / 2, height / 2 - 36));
  const labelRadius = radius + 20;
  const maximum = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 100;
  const complete = data.length > 2 && data.every((point) => point.value !== null && Number.isFinite(point.value));
  const known = data.filter((point) => point.value !== null && Number.isFinite(point.value)).length;

  return (
    <div ref={containerRef} className="w-full select-none" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label={`${title}，${known} 项已有数据，满分 ${maximum}`}>
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            points={data.map((_, index) => {
              const point = vertex(cx, cy, radius * level, index, data.length);
              return `${point.x},${point.y}`;
            }).join(" ")}
            fill="none"
            stroke="var(--ink)"
            strokeOpacity={0.12}
            strokeWidth={0.8}
          />
        ))}
        {data.map((point, index) => {
          const end = vertex(cx, cy, radius, index, data.length);
          return <line key={point.english} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--ink)" strokeOpacity={0.1} strokeWidth={0.8} />;
        })}
        {known > 0 && (
          <path
            d={dataPathD(cx, cy, radius, data, maximum)}
            fill={complete ? color : "none"}
            fillOpacity={0.14}
            stroke={color}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        )}
        {data.map((point, index) => {
          if (point.value === null || !Number.isFinite(point.value)) return null;
          const position = vertex(cx, cy, radius * clamp(point.value / maximum), index, data.length);
          return (
            <circle key={point.english} cx={position.x} cy={position.y} r={2.5} fill={color}>
              <title>{`${point.name} ${point.value} / ${maximum}`}</title>
            </circle>
          );
        })}
        {data.map((point, index) => {
          const position = vertex(cx, cy, labelRadius, index, data.length);
          const anchor = Math.abs(position.x - cx) < 1 ? "middle" : position.x > cx ? "start" : "end";
          const characters = Array.from(point.name);
          const split = Math.ceil(characters.length / 2);
          const lines = characters.length > 3 ? [characters.slice(0, split).join(""), characters.slice(split).join("")] : [point.name];
          return (
            <text key={point.english} textAnchor={anchor} dominantBaseline="middle" fill="var(--muted)" fontSize={11}>
              {lines.map((line, lineIndex) => (
                <tspan key={lineIndex} x={position.x} y={position.y - (lines.length - 1) * 6 + lineIndex * 12}>{line}</tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
