"use client";

import { useEffect, useRef } from "react";
import { isSafari } from "./browser-detect";

/**
 * Safari/WebKit only: locks body scroll when `locked` is true.
 *
 * On iOS Safari, `overflow: hidden` on <body> does NOT prevent the rubber-band
 * overscroll.  The only reliable approach is `position: fixed` + restoring
 * scroll position on unlock.
 *
 * On Chromium this hook is a no-op — `overflow: hidden` already works there.
 *
 * Usage:
 *   useSafariScrollLock(showModal);
 */
export function useSafariScrollLock(locked: boolean): void {
  const savedY = useRef(0);

  useEffect(() => {
    if (!isSafari() || !locked) return;

    const body = document.body;
    savedY.current = window.scrollY;

    // Remember original inline styles so we can restore them exactly
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    const prevOverflow = body.style.overflow;

    body.style.position = "fixed";
    body.style.top = `-${savedY.current}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      body.style.overflow = prevOverflow;
      window.scrollTo(0, savedY.current);
    };
  }, [locked]);
}
