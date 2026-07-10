"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";

/** Routes that use page transition animation */
const TRANSITION_ROUTES = ["/explore", "/create", "/profile"];

function shouldAnimate(pathname: string): boolean {
  return TRANSITION_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function NavbarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const animate = shouldAnimate(pathname);

  return (
    <>
      {animate ? (
        <PageTransition key={pathname}>{children}</PageTransition>
      ) : (
        children
      )}
    </>
  );
}
