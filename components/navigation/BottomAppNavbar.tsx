"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, WandSparkles, User, Search, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { DataSourceModal } from "@/components/DataSourceModal";
import { SearchOverlay } from "./SearchOverlay";
import type { AuthUser } from "@/lib/types";

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
  const classes = `flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors duration-200 ${
    active
      ? "bg-[var(--ink)] text-white"
      : "text-white/70 hover:text-white"
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

  const fetchUser = useCallback(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return;
      try {
        const { data: row } = await supabase
          .from("users")
          .select("username")
          .eq("id", u.id)
          .single();
        setUser({
          id: u.id,
          email: u.email,
          username: row?.username ?? null,
        });
      } catch {
        setUser({ id: u.id, email: u.email });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch user when on profile page
  useEffect(() => {
    if (!isProfile) return;
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfile]);

  // re-fetch username when profile menu opens (picks up DB changes)
  useEffect(() => {
    if (profileMenuOpen) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileMenuOpen]);

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

      {/* ---- Profile menu popup (slides up from behind navbar) ---- */}
      <AnimatePresence>
        {profileMenuOpen && user && (
          <>
            {/* backdrop */}
            <motion.button
              type="button"
              className="fixed inset-0 z-20"
              onClick={() => setProfileMenuOpen(false)}
              aria-label="关闭菜单"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            {/* menu sheet — receipt style, slides up from behind navbar */}
            <motion.div
              ref={profileMenuRef}
              className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-4 right-4 z-20 mx-auto max-w-sm max-h-[60vh] overflow-y-auto bg-[var(--surface-card)] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.20)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "150%" }}
              transition={{ type: "spring", damping: 26, stiffness: 250 }}
            >
            {/* ---- 锯齿：顶部穿孔条 ---- */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-[6px]"
              style={{
                backgroundImage: "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
                backgroundSize: "8px 6px",
                backgroundRepeat: "repeat-x",
              }}
            />

            <p className="truncate px-3 pt-1 text-[14px] font-semibold text-[var(--ink)]">
              {user.username ? `@${user.username}` : user.email}
            </p>
            {user.username && (
              <p className="truncate px-3 text-[12px] text-[var(--muted)]">
                {user.email}
              </p>
            )}

            <hr className="my-3 border-t-2 border-dashed border-[var(--ink)]/15" />

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setSourceOpen(true);
              }}
              className="w-full px-3 py-2.5 text-left text-[14px] font-medium text-[var(--ink)]/70 transition hover:bg-[var(--ink)]/6"
            >
              数据来源
            </button>

            <hr className="my-3 border-t-2 border-dashed border-[var(--ink)]/15" />

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex w-full items-center justify-center gap-1.5 bg-[var(--ink)] px-4 py-2.5 text-[14px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98]"
            >
              <LogOut size={14} />
              退出登录
            </button>

            {/* ---- 锯齿：底部穿孔条 ---- */}
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-[6px]"
              style={{
                backgroundImage: "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
                backgroundSize: "8px 6px",
                backgroundRepeat: "repeat-x",
              }}
            />
          </motion.div>
        </>
      )}
      </AnimatePresence>

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
          className="flex items-center rounded-full bg-[var(--surface-card)]/10 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.20)] px-2 py-2"
          style={{ pointerEvents: "auto" }}
        >
          <NavItem
            href="/explore"
            active={isExplore}
            icon={<Compass size={20} />}
            label="Explore"
          />

          <span className="h-6 border-l-2 border-dashed border-[var(--ink)]/15" />

          <NavItem
            href="/create"
            active={isCreate}
            icon={<WandSparkles size={20} />}
            label="Create"
          />

          <span className="h-6 border-l-2 border-dashed border-[var(--ink)]/15" />

          <button
            type="button"
            onClick={openSearch}
            className="flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white/70 transition-colors duration-200 hover:text-white"
            aria-label="搜索"
          >
            <Search size={20} />
            <span className="hidden sm:inline">搜索</span>
          </button>

          <span className="h-6 border-l-2 border-dashed border-[var(--ink)]/15" />

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
      </nav>
    </>
  );
}
