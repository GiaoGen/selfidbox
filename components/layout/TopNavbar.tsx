"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, WandSparkles, Search } from "lucide-react";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Nav link with icon + active pill state                              */
/* ------------------------------------------------------------------ */

function NavLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-white text-[var(--ink)] shadow-[0_1px_4px_rgba(10,10,10,0.06)]"
          : "text-[var(--muted)] hover:bg-white/60 hover:text-[var(--ink)]"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  TopNavbar                                                           */
/* ------------------------------------------------------------------ */

export function TopNavbar({ rightSlot }: { rightSlot?: ReactNode }) {
  const pathname = usePathname();

  const isExplore = pathname === "/explore";
  const isProfile = pathname.startsWith("/profile");
  const isCreate = pathname.startsWith("/create");

  return (
    <nav className="relative z-20 flex items-center justify-between bg-[var(--surface-card)] p-2 shadow-[0_4px_20px_rgba(0,0,0,0.20)]">
      <Link
        href="/explore"
        className="px-4 py-2 text-sm font-semibold text-[var(--ink)]"
      >
        SelfIDBox
      </Link>

      <div className="flex items-center gap-0">
        <NavLink
          href="/profile"
          active={isProfile}
          icon={<Radar size={16} />}
          label="个人图谱"
        />

        <span className="h-5 border-l-2 border-dashed border-[var(--ink)]/15" />

        <NavLink
          href="/create"
          active={isCreate}
          icon={<WandSparkles size={16} />}
          label="Quiz Studio"
        />

        {rightSlot ??
          (isExplore ? (
            <>
              <span className="h-5 border-l-2 border-dashed border-[var(--ink)]/15" />
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_2px_10px_rgba(10,10,10,0.05)] transition hover:bg-[var(--surface-strong)]"
              >
                <Search size={16} />
                <span className="hidden sm:inline">搜索</span>
              </Link>
            </>
          ) : null)}
      </div>
    </nav>
  );
}
