"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, WandSparkles, User, Search, LogOut, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { DataSourceModal } from "@/components/DataSourceModal";
import { PwaDownloadModal } from "@/components/PwaDownloadModal";
import { SearchOverlay } from "./SearchOverlay";
import type { AuthUser } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Tray internal helpers                                               */
/* ------------------------------------------------------------------ */

function TrayDivider() {
  return <hr className="mx-3 my-1.5 border-t-2 border-dashed border-[var(--ink)]/15" />;
}

function TrayNavItem({
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
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-[15px] font-semibold transition-colors ${
        active
          ? "bg-[var(--ink)]/8 text-[var(--ink)]"
          : "text-[var(--body)] hover:bg-[var(--ink)]/4"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function TrayActionItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-3 text-left text-[15px] font-medium text-[var(--body)] transition hover:bg-[var(--ink)]/4"
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  SlideOutTray                                                        */
/* ------------------------------------------------------------------ */

export function SlideOutTray() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  /* ---- tray state ---- */
  const [open, setOpen] = useState(false);

  /* ---- sub-modals ---- */
  const [searchOpen, setSearchOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [pwaOpen, setPwaOpen] = useState(false);

  /* ---- user ---- */
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userFetched, setUserFetched] = useState(false);

  function openTray() {
    setOpen(true);
    if (userFetched) return;
    setUserFetched(true);
    setUserLoading(true);
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        setUser(null);
        setUserLoading(false);
        return;
      }
      try {
        const { data: row } = await supabase
          .from("users")
          .select("username")
          .eq("id", u.id)
          .single();
        setUser({ id: u.id, email: u.email, username: row?.username ?? null });
      } catch {
        setUser({ id: u.id, email: u.email });
      }
      setUserLoading(false);
    });
  }

  /* ---- sign out ---- */
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
    router.push("/login");
    router.refresh();
  }, [router, supabase]);

  /* ---- active route detection ---- */
  const isExplore = pathname === "/explore" || pathname.startsWith("/explore/");
  const isCreate = pathname.startsWith("/create");
  const isProfile = pathname.startsWith("/profile");

  /* ---- close tray ---- */
  const closeTray = useCallback(() => {
    setOpen(false);
    setUserFetched(false);
  }, []);

  return (
    <>
      {/* ── Hamburger button ── */}
      <button
        type="button"
        onClick={openTray}
        className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--ink)] transition-colors hover:text-[var(--muted)]"
        aria-label="打开菜单"
      >
        <Menu size={24} />
      </button>

      {/* ── Tray overlay + sheet ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-[var(--ink)]/25"
              onClick={closeTray}
              aria-label="关闭菜单"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />

            {/* tray sheet — slides from right */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 z-50 flex w-[280px] max-w-[75vw] flex-col bg-[var(--surface-card)] shadow-[0_0_50px_rgba(10,10,10,0.15)] overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* ── Perforated edge — top ── */}
              <div
                className="pointer-events-none shrink-0 h-[6px]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
                  backgroundSize: "8px 6px",
                  backgroundRepeat: "repeat-x",
                }}
              />

              {/* ── Header ── */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[13px] font-semibold text-[var(--muted)]">
                  菜单
                </span>
                <button
                  type="button"
                  onClick={closeTray}
                  className="flex h-7 w-7 items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                  aria-label="关闭菜单"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── Navigation ── */}
              <nav className="flex flex-col px-1 pt-2">
                <TrayNavItem
                  href="/explore"
                  active={isExplore}
                  icon={<Compass size={20} />}
                  label="主页"
                  onClick={closeTray}
                />
                <TrayDivider />
                <TrayNavItem
                  href="/create"
                  active={isCreate}
                  icon={<WandSparkles size={20} />}
                  label="创作"
                  onClick={closeTray}
                />
                <TrayDivider />
                <TrayNavItem
                  href="/profile"
                  active={isProfile}
                  icon={<User size={20} />}
                  label="个人"
                  onClick={closeTray}
                />
                <TrayDivider />
                <button
                  type="button"
                  onClick={() => {
                    closeTray();
                    setSearchOpen(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-[15px] font-semibold text-[var(--body)] transition-colors hover:bg-[var(--ink)]/4"
                >
                  <Search size={20} />
                  <span>搜索</span>
                </button>
              </nav>

              {/* ── Thick separator ── */}
              <hr className="mx-4 my-4 border-t-2 border-dashed border-[var(--ink)]/20" />

              {/* ── User section ── */}
              <div className="px-4 pb-4">
                {userLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ink)]/15 border-t-[var(--ink)]/40" />
                  </div>
                ) : user ? (
                  <>
                    <p className="truncate px-1 text-[14px] font-semibold text-[var(--ink)]">
                      {user.username ? `@${user.username}` : user.email}
                    </p>
                    {user.username && (
                      <p className="truncate px-1 text-[12px] text-[var(--muted)]">
                        {user.email}
                      </p>
                    )}

                    <div className="mt-2">
                      <TrayDivider />
                      <TrayActionItem
                        label="数据来源"
                        onClick={() => {
                          closeTray();
                          setSourceOpen(true);
                        }}
                      />
                      <TrayDivider />
                      <TrayActionItem
                        label="下载APP"
                        onClick={() => {
                          closeTray();
                          setPwaOpen(true);
                        }}
                      />
                      <TrayDivider />
                    </div>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 bg-[var(--ink)] px-4 py-2.5 text-[14px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98]"
                    >
                      <LogOut size={14} />
                      退出登录
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeTray}
                    className="flex w-full items-center justify-center gap-1.5 bg-[var(--ink)] px-4 py-2.5 text-[14px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98]"
                  >
                    登录
                  </Link>
                )}
              </div>

              {/* ── Perforated edge — bottom ── */}
              <div
                className="pointer-events-none shrink-0 h-[6px] mt-auto"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
                  backgroundSize: "8px 6px",
                  backgroundRepeat: "repeat-x",
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Sub-modals ── */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <DataSourceModal open={sourceOpen} onClose={() => setSourceOpen(false)} />
      <PwaDownloadModal open={pwaOpen} onClose={() => setPwaOpen(false)} />
    </>
  );
}
