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
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--ink)] shadow-[0_1px_4px_rgba(10,10,10,0.08)] transition hover:bg-[var(--surface-strong)]"
      >
        <User size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-[20px] bg-white p-3 shadow-[0_12px_40px_rgba(10,10,10,0.12)] ring-1 ring-[var(--ink)]/6">
          <p className="truncate px-3 pt-1 text-[13px] font-semibold text-[var(--ink)]">
            {user.username ? `@${user.username}` : user.email}
          </p>
          {user.username && (
            <p className="truncate px-3 text-[11px] text-[var(--muted)]">
              {user.email}
            </p>
          )}

          {actions?.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className="mt-1.5 w-full rounded-full px-3 py-2 text-left text-[13px] font-medium text-[var(--ink)]/70 transition hover:bg-[var(--ink)]/6"
            >
              {action.label}
            </button>
          ))}

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--ink)] px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
