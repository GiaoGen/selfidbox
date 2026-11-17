"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";

/** Routes that use page transition animation */
const TRANSITION_ROUTES = ["/explore", "/create", "/profile"];

function shouldAnimate(pathname: string): boolean {
  return TRANSITION_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function NavbarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const animate = shouldAnimate(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, number>());
  const currentPath = useRef(pathname);
  const restoring = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      restoring.current = window.location.pathname !== currentPath.current;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    currentPath.current = pathname;
    scroll.scrollTop = restoring.current ? positions.current.get(pathname) ?? 0 : 0;
    restoring.current = false;
  }, [pathname]);

  return (
    <div
      ref={scrollRef}
      className="app-scroll"
      role="region"
      aria-label="页面内容"
      tabIndex={0}
      onScroll={(event) => {
        positions.current.set(currentPath.current, event.currentTarget.scrollTop);
      }}
    >
      {animate ? (
        <PageTransition key={pathname}>{children}</PageTransition>
      ) : (
        children
      )}
    </div>
  );
}
