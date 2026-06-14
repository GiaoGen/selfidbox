"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, WandSparkles, User, Search, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DataSourceModal } from "@/components/DataSourceModal";
import { SearchOverlay } from "./SearchOverlay";

type AuthUser = { id: string; email?: string };

/* ------------------------------------------------------------------ */
/*  Nav item (icon + label, active pill)                                */
/* ------------------------------------------------------------------ */

function NavItem({
  href,
  active,
  icon,
  label,
  onClick,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const classes = `flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition-all duration-200 ${
    active
      ? "bg-[var(--ink)] text-white shadow-[0_2px_8px_rgba(10,10,10,0.15)]"
      : "text-[var(--muted)] hover:text-[var(--ink)]"
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  return (
    <Link href={href} className={classes}>
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
  const supabase = createClient();

  /* ---- active detection ---- */
  const isExplore = pathname === "/explore" || pathname.startsWith("/explore/");
  const isCreate = pathname.startsWith("/create");
  const isProfile = pathname.startsWith("/profile");

  /* ---- search ---- */
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  /* ---- profile menu (only when already on /profile) ---- */
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // fetch user when on profile page (needed for menu)
  useEffect(() => {
    if (!isProfile) return;
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) setUser({ id: u.id, email: u.email });
    });
  }, [isProfile, supabase]);

  // close profile menu on outside click
  useEffect(() => {
    if (!profileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileMenuOpen]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileMenuOpen(false);
    router.push("/login");
    router.refresh();
  }, [router, supabase]);

  return (
    <>
      {/* ---- Search overlay ---- */}
      <SearchOverlay open={searchOpen} onClose={closeSearch} />

      {/* ---- Profile menu popup (appears above navbar, only on /profile) ---- */}
      {profileMenuOpen && user && (
        <>
          {/* backdrop */}
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setProfileMenuOpen(false)}
            aria-label="关闭菜单"
          />
          {/* menu sheet */}
          <div
            ref={profileMenuRef}
            className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] left-4 right-4 z-50 mx-auto max-w-sm rounded-[24px] border border-white/50 bg-white/75 p-4 shadow-[0_8px_40px_rgba(10,10,10,0.12)] backdrop-blur-xl"
          >
            <p className="truncate px-3 pt-1 text-[14px] font-medium text-[var(--muted)]">
              {user.email}
            </p>

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setSourceOpen(true);
              }}
              className="mt-1.5 w-full rounded-full px-3 py-2.5 text-left text-[14px] font-medium text-[var(--ink)]/70 transition hover:bg-[var(--ink)]/6"
            >
              数据来源
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--ink)] px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <LogOut size={14} />
              退出登录
            </button>
          </div>
        </>
      )}

      {/* ---- Data source modal ---- */}
      <DataSourceModal
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
      />

      {/* ---- Bottom navbar ---- */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-end justify-center pb-[calc(16px+env(safe-area-inset-bottom))]"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="flex items-center gap-3 px-2"
          style={{ pointerEvents: "auto" }}
        >
          {/* ---- Main capsule ---- */}
          <div className="flex items-center gap-0.5 rounded-full border border-white/50 bg-white/70 px-2 py-2 shadow-[0_4px_24px_rgba(10,10,10,0.08),0_1px_3px_rgba(10,10,10,0.04)] backdrop-blur-xl">
            <NavItem
              href="/explore"
              active={isExplore}
              icon={<Compass size={20} />}
              label="Explore"
            />
            <NavItem
              href="/create"
              active={isCreate}
              icon={<WandSparkles size={20} />}
              label="Create"
            />
            <NavItem
              href="/profile"
              active={isProfile}
              icon={<User size={20} />}
              label="Profile"
              onClick={
                isProfile ? () => setProfileMenuOpen((v) => !v) : undefined
              }
            />
          </div>

          {/* ---- Search circle ---- */}
          <button
            type="button"
            onClick={openSearch}
            className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/70 text-[var(--muted)] shadow-[0_4px_24px_rgba(10,10,10,0.08),0_1px_3px_rgba(10,10,10,0.04)] backdrop-blur-xl transition-all hover:text-[var(--ink)] active:scale-95"
            aria-label="搜索"
          >
            <Search size={22} />
          </button>
        </div>
      </nav>
    </>
  );
}
