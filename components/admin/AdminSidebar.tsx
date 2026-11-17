import Link from "next/link";
import type { ReactNode } from "react";

const linkStyle =
  "flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm font-semibold transition-colors";

export function AdminSidebar() {
  return (
    <aside className="w-full shrink-0 rounded-[28px] bg-[var(--surface-card)] p-4 shadow-[0_18px_50px_rgba(10,10,10,0.06)]">
      <details>
        <summary className="cursor-pointer px-4 py-3 text-lg font-bold tracking-[-0.02em]">
          SelfID <span className="text-[var(--muted)]">Admin</span>
          <span className="ml-2 text-xs text-[var(--muted)]">管理导航</span>
        </summary>
        <nav aria-label="管理后台" className="flex flex-col gap-1">
          <NavSection label="概览">
            <NavItem href="/admin">Dashboard</NavItem>
          </NavSection>

          <NavSection label="内容管理">
            <NavItem href="/admin/test-sites">Test Sites</NavItem>
            <NavItem href="/admin/categories">Categories</NavItem>
            <NavItem href="/admin/quizzes">Quizzes</NavItem>
          </NavSection>

          <NavSection label="系统">
            <NavItem href="/admin/ai-usage">AI Usage</NavItem>
          </NavSection>

          <NavSection label="快捷操作">
            <NavItem href="/admin/test-sites/new">+ 新增测试</NavItem>
            <NavItem href="/admin/categories/new">+ 新增分类</NavItem>
          </NavSection>

          <div className="mt-auto px-4 py-3">
            <Link
              href="/explore"
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            >
              ← 返回前台
            </Link>
          </div>
        </nav>
      </details>
    </aside>
  );
}

function NavSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function NavItem({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`${linkStyle} text-[var(--body)] hover:bg-white hover:text-[var(--ink)]`}
    >
      {children}
    </Link>
  );
}
