"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { isSafari } from "@/lib/browser-detect";
import { ReceiptPrint } from "./ReceiptPrint";

/* ================================================================== */
/*  RotatingCardModal                                                   */
/*                                                                     */
/*  Reusable full-screen modal with receipt-feed animation.            */
/*  Click backdrop to close. Card interior clicks do not close.         */
/*                                                                     */
/*  Used by:                                                            */
/*  - Quiz Result Share Card (profile data source)                       */
/*  - OCR Screenshot Card (profile data source)                         */
/*  - Quiz Runtime share modal                                          */
/* ================================================================== */

interface Props {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Max width of the card wrapper. Defaults to "calc(100cqw - 48px)". */
  maxWidth?: string;
  /** Ref to the card DOM element for PNG export. When provided, a download button is shown. */
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

export function RotatingCardModal({ open, loading = false, onClose, children, maxWidth, cardRef }: Props) {
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!open || !overlay) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const isTopOverlay = () => {
      const overlays = document.querySelectorAll("[data-app-overlay]");
      return overlays[overlays.length - 1] === overlay;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopOverlay()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(overlay.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]"))
        .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[inert]") && element.getClientRects().length > 0);
      const current = document.activeElement;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || current === overlay || !overlay.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (isTopOverlay() && !overlay.contains(event.target as Node)) overlay.focus({ preventScroll: true });
    };
    overlay.focus({ preventScroll: true });
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocus, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocus, true);
      if (previousFocus?.isConnected && overlay.contains(document.activeElement)) previousFocus.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  async function handleDownload() {
    const card = cardRef?.current;
    if (!card) return;
    setSaving(true);
    try {
      if (isSafari() && card.querySelector("img")) {
        // Prime WebKit's SVG image cache before exporting the final PNG.
        await toPng(card, { pixelRatio: 2, cacheBust: true });
      }
      const dataUrl = await toPng(card, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = "selfidbox-share-card.png";
      link.href = dataUrl;
      link.click();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="完整小票"
          tabIndex={-1}
          data-app-overlay className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        >
          {/* backdrop — click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80"
          />

          {/* Feed the receipt after its content is ready. */}
          <ReceiptPrint
            loading={loading}
            className="relative z-10 max-h-[calc(100cqh-48px)] w-full"
            style={{ maxWidth: maxWidth ?? "calc(100cqw - 48px)" }}
            controls={cardRef && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={saving}
                className="self-end mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/70 transition hover:bg-white/25 hover:text-white disabled:opacity-40"
                aria-label="保存图片"
              >
                <Download size={14} />
              </button>
            )}
          >
            {children}
          </ReceiptPrint>
        </div>
      )}
    </AnimatePresence>
  );
}
