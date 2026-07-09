"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ================================================================== */
/*  PWA 安装教程 — 三个平台（iOS Safari / Chrome / Edge）                */
/* ================================================================== */

type PlatformTab = "ios" | "chrome" | "edge";

const TAB_LABELS: Record<PlatformTab, string> = {
  ios: "iOS",
  chrome: "Chrome",
  edge: "Edge",
};

function IosInstructions() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">1</span>
        <p>在 <strong className="font-semibold text-[var(--ink)]">Safari 浏览器</strong> 中打开 SelfIDBox 网站（不支持微信内置浏览器、QQ 浏览器等）。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">2</span>
        <p>点击 Safari 底部工具栏中间的 <strong className="font-semibold text-[var(--ink)]">「分享」按钮</strong>（方框 + 向上箭头的图标）。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">3</span>
        <p>在弹出菜单中向下滑动，找到并点击 <strong className="font-semibold text-[var(--ink)]">「添加到主屏幕」</strong>。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">4</span>
        <p>确认名称（可自行修改），然后点击右上角 <strong className="font-semibold text-[var(--ink)]">「添加」</strong>。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">✓</span>
        <p className="text-[var(--muted)]">完成后，主屏幕将出现 SelfIDBox 图标，点击即可像原生 App 一样全屏使用，不会显示浏览器地址栏和工具栏。</p>
      </div>
    </div>
  );
}

function ChromeInstructions() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">1</span>
        <p>在 <strong className="font-semibold text-[var(--ink)]">Chrome 浏览器</strong> 中打开 SelfIDBox 网站。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">2</span>
        <p>点击右上角 <strong className="font-semibold text-[var(--ink)]">「⋮」菜单按钮</strong>（三个竖点）。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">3</span>
        <p>在菜单中选择 <strong className="font-semibold text-[var(--ink)]">「添加到主屏幕」</strong>（部分版本显示为「安装应用」或「Add to Home screen」）。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">4</span>
        <p>在弹出的确认框中点击 <strong className="font-semibold text-[var(--ink)]">「安装」</strong>或「添加」。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">✓</span>
        <p className="text-[var(--muted)]">完成后，SelfIDBox 将出现在主屏幕或应用抽屉中，以独立窗口运行，提供接近原生 App 的体验。</p>
      </div>
    </div>
  );
}

function EdgeInstructions() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">1</span>
        <p>在 <strong className="font-semibold text-[var(--ink)]">Edge 浏览器</strong> 中打开 SelfIDBox 网站。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">2</span>
        <p>点击右上角 <strong className="font-semibold text-[var(--ink)]">「…」菜单按钮</strong>（三条横线）。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">3</span>
        <p>选择 <strong className="font-semibold text-[var(--ink)]">「添加至手机」</strong>（或直接显示为「安装 SelfIDBox」）。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">4</span>
        <p>在弹出的安装对话框中点击 <strong className="font-semibold text-[var(--ink)]">「安装」</strong>。</p>
      </div>
      <div className="flex items-start gap-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">✓</span>
        <p className="text-[var(--muted)]">完成后，SelfIDBox 将以独立窗口运行，可通过开始菜单或任务栏快速启动，享受无浏览器边栏的沉浸式体验。</p>
      </div>
    </div>
  );
}

function PlatformContent({ tab }: { tab: PlatformTab }) {
  if (tab === "ios") return <IosInstructions />;
  if (tab === "chrome") return <ChromeInstructions />;
  return <EdgeInstructions />;
}

/* ================================================================== */
/*  PwaDownloadModal                                                    */
/* ================================================================== */

interface PwaDownloadModalProps {
  open: boolean;
  onClose: () => void;
}

export function PwaDownloadModal({ open, onClose }: PwaDownloadModalProps) {
  const [tab, setTab] = useState<PlatformTab>("ios");

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[300px] shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
            style={{ backgroundColor: "var(--surface-soft)" }}
          >
            {/* perforation dots */}
            <div className="flex justify-center gap-1 py-1.5 overflow-hidden select-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="inline-block w-[3px] h-[3px] rounded-full bg-[var(--ink)]/12 shrink-0"
                />
              ))}
            </div>

            {/* tabs */}
            <div className="flex gap-0.5 px-2.5 pb-2 border-b-2 border-dashed border-[var(--ink)]/10">
              {(Object.keys(TAB_LABELS) as PlatformTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                    tab === t
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            {/* content */}
            <div
              className="px-2.5 py-3 text-[12px] leading-[1.7] text-[var(--body)]"
              style={{
                height: 420,
                overflowY: "scroll",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <PlatformContent tab={tab} />
            </div>

            {/* bottom */}
            <div className="border-t-2 border-dashed border-[var(--ink)]/10 px-2.5 py-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full bg-[var(--ink)]/6 py-2 text-[13px] font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)]/12"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
