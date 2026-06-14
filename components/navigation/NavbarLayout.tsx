"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BottomAppNavbar } from "./BottomAppNavbar";
import { PageTransition } from "@/components/layout/PageTransition";

/** Routes that show the bottom app navbar */
const NAVBAR_ROUTES = ["/explore", "/create", "/profile"];

function shouldShowNavbar(pathname: string): boolean {
  return NAVBAR_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function NavbarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const show = shouldShowNavbar(pathname);

  return (
    <>
      {show ? (
        <PageTransition key={pathname}>{children}</PageTransition>
      ) : (
        children
      )}
      {show && (
        <>
          <BottomAppNavbar />
          {/* spacer to prevent content from being hidden behind the fixed navbar */}
          <div className="h-[calc(80px+env(safe-area-inset-bottom))] shrink-0" aria-hidden />
        </>
      )}
    </>
  );
}
