"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, WandSparkles, User, Search, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Nav item (icon + label, active pill)                                */
/* ------------------------------------------------------------------ */

function NavItem({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 ${
        active
          ? "bg-[var(--ink)] text-white shadow-[0_2px_8px_rgba(10,10,10,0.15)]"
          : "text-[var(--muted)] hover:text-[var(--ink)]"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  BottomAppNavbar                                                      */
/* ------------------------------------------------------------------ */

export function BottomAppNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isExplore = pathname === "/explore" || pathname.startsWith("/explore/");
  const isCreate = pathname.startsWith("/create");
  const isProfile = pathname.startsWith("/profile");

  /* ---- search ---- */
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  const submitSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    closeSearch();
    router.push(`/explore?search=${encodeURIComponent(trimmed)}`);
  }, [query, closeSearch, router]);

  return (
    <>
      {/* ---- Search overlay ---- */}
      {searchOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center pb-[calc(80px+env(safe-area-inset-bottom))]">
          {/* backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-[var(--ink)]/15 backdrop-blur-sm"
            onClick={closeSearch}
            aria-label="关闭搜索"
          />
          {/* search bar */}
          <div className="relative z-10 mx-4 flex w-full max-w-[500px] items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-3 shadow-[0_8px_40px_rgba(10,10,10,0.12)] backdrop-blur-xl">
            <Search size={18} className="shrink-0 text-[var(--muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
                if (e.key === "Escape") closeSearch();
              }}
              placeholder="搜索测评、标签、分类..."
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 rounded-full p-1 text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={submitSearch}
              className="shrink-0 rounded-full bg-[var(--ink)] px-4 py-1.5 text-[13px] font-semibold text-white"
            >
              搜索
            </button>
          </div>
        </div>
      )}

      {/* ---- Bottom navbar ---- */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-end justify-center pb-[calc(12px+env(safe-area-inset-bottom))]"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="flex items-center gap-3 px-2"
          style={{ pointerEvents: "auto" }}
        >
          {/* ---- Main capsule ---- */}
          <div className="flex items-center gap-0.5 rounded-full border border-white/50 bg-white/70 px-1.5 py-1.5 shadow-[0_4px_24px_rgba(10,10,10,0.08),0_1px_3px_rgba(10,10,10,0.04)] backdrop-blur-xl">
            <NavItem
              href="/explore"
              active={isExplore}
              icon={<Compass size={18} />}
              label="Explore"
            />
            <NavItem
              href="/create"
              active={isCreate}
              icon={<WandSparkles size={18} />}
              label="Create"
            />
            <NavItem
              href="/profile"
              active={isProfile}
              icon={<User size={18} />}
              label="Profile"
            />
          </div>

          {/* ---- Search circle ---- */}
          <button
            type="button"
            onClick={openSearch}
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/70 text-[var(--muted)] shadow-[0_4px_24px_rgba(10,10,10,0.08),0_1px_3px_rgba(10,10,10,0.04)] backdrop-blur-xl transition-all hover:text-[var(--ink)] active:scale-95"
            aria-label="搜索"
          >
            <Search size={20} />
          </button>
        </div>
      </nav>
    </>
  );
}
