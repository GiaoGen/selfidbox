"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { DataSourceModal } from "@/components/DataSourceModal";

export function GlobalTopNavbar() {
  const router = useRouter();
  const [sourceOpen, setSourceOpen] = useState(false);

  return (
    <>
      <nav className="relative z-20 flex items-center justify-between rounded-full bg-[var(--surface-soft)] p-2">
        {/* Left: Home */}
        <Link
          href="/explore"
          className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-white/60"
        >
          SelfIDBox
        </Link>

        {/* Right group: Search + Avatar */}
        <div className="flex items-center gap-1">
          {/* Search → Explore */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_2px_10px_rgba(10,10,10,0.05)] transition hover:bg-[var(--surface-strong)]"
          >
            <Search size={16} />
            <span className="hidden sm:inline">搜索</span>
          </Link>

          {/* Avatar menu */}
          <UserMenu
            actions={[
              { label: "Profile", onClick: () => router.push("/profile") },
              { label: "数据来源", onClick: () => setSourceOpen(true) },
            ]}
          />
        </div>
      </nav>

      {/* Data source modal — globally available */}
      <DataSourceModal
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
      />
    </>
  );
}
