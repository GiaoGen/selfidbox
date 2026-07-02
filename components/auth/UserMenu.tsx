"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, LogOut } from "lucide-react";
import type { AuthUser } from "@/lib/types";

export function UserMenu({
  actions,
}: {
  actions?: { label: string; onClick: () => void }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const menuRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (u) {
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
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
    router.push("/login");
    router.refresh();
  }, [router, supabase]);

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center bg-white text-[var(--ink)] shadow-[0_1px_4px_rgba(10,10,10,0.08)] transition hover:bg-[var(--surface-strong)]"
      >
        <User size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface-card)] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.20)]">
          {/* ---- 锯齿：顶部穿孔条 ---- */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 h-[6px]"
            style={{
              backgroundImage: "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
              backgroundSize: "8px 6px",
              backgroundRepeat: "repeat-x",
            }}
          />

          <p className="truncate px-3 pt-1 text-[13px] font-semibold text-[var(--ink)]">
            {user.username ? `@${user.username}` : user.email}
          </p>
          {user.username && (
            <p className="truncate px-3 text-[11px] text-[var(--muted)]">
              {user.email}
            </p>
          )}

          <hr className="my-3 border-t-2 border-dashed border-[var(--ink)]/15" />

          {actions?.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className="w-full px-3 py-2 text-left text-[13px] font-medium text-[var(--ink)]/70 transition hover:bg-[var(--ink)]/6"
            >
              {action.label}
            </button>
          ))}

          <hr className="my-3 border-t-2 border-dashed border-[var(--ink)]/15" />

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex w-full items-center justify-center gap-1.5 bg-[var(--ink)] px-4 py-2.5 text-[13px] font-semibold text-white transition-shadow transition-transform duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)] active:scale-[0.98]"
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
        </div>
      )}
    </div>
  );
}
