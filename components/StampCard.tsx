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

  const inner = (
    <div
      className="relative flex aspect-square w-full items-center justify-center p-4"
      style={{ backgroundColor: bg, color: textColor }}
    >
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
