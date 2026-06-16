"use client";

import Link from "next/link";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";

type StampCardProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  colorKey?: string;
};

export function StampCard({ children, href, onClick, colorKey }: StampCardProps) {
  const bg = colorKey ? nipponColorForSlug(colorKey) : "#ffffff";
  const textColor = colorKey ? textColorForNipponBg(bg) : "var(--ink)";

  const perforation = (isVertical: boolean) => ({
    backgroundImage: isVertical
      ? "radial-gradient(circle at 3px 4px, var(--canvas) 2.5px, transparent 2.5px)"
      : "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
    backgroundSize: isVertical ? "6px 8px" : "8px 6px",
    backgroundRepeat: isVertical ? "repeat-y" : "repeat-x",
  });

  const inner = (
    <div
      className="relative flex aspect-square w-full items-center justify-center p-4"
      style={{ backgroundColor: bg, color: textColor }}
    >
      {/* 四边锯齿 */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-[6px]"
        style={perforation(false)}
      />
      <div
        className="pointer-events-none absolute left-0 right-0 bottom-0 h-[6px]"
        style={perforation(false)}
      />
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-[6px]"
        style={perforation(true)}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-[6px]"
        style={perforation(true)}
      />
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full">
        {inner}
      </button>
    );
  }

  return inner;
}
