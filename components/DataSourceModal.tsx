"use client";

import { useEffect, useRef, useState } from "react";
import { ScreenshotReportUploader } from "@/components/profile/ScreenshotReportUploader";

export interface DataSourceEntry {
  date: string;
  name: string;
  result: string;
}

const mockSources: DataSourceEntry[] = [
  {
    date: "2024-03-15",
    name: "MBTI 人格测试",
    result: "INFP — 内向 89%、直觉 76%、情感 82%、感知 71%",
  },
  {
    date: "2024-02-20",
    name: "动物人格测试",
    result: "猫头鹰型 — 观察力 85%、独立性 78%、敏感性 90%、理性度 72%",
  },
  {
    date: "2024-01-10",
    name: "职业倾向测试",
    result: "创意型 — 艺术表达 88%、抽象思维 82%、独立性 76%、秩序感 54%",
  },
];

export function DataSourceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#0a0a0a]/30 px-4 pt-[15vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_62%,#fffaf0_100%)] text-[#0a0a0a] shadow-[0_24px_64px_rgba(10,10,10,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 sm:p-6">
          <h2 className="text-xl font-semibold">数据来源</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-white/35 p-2 transition hover:bg-white/50"
            aria-label="关闭"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[50vh] space-y-3 overflow-y-auto px-5 pb-6 sm:px-6">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 rounded-full bg-white/35 px-4 py-2 text-sm font-semibold transition hover:bg-white/50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {showUpload ? "收起上传" : "上传测评截图"}
          </button>

          {showUpload && <ScreenshotReportUploader />}

          {mockSources.map((src, i) => (
            <div
              key={i}
              className="rounded-[24px] bg-white/35 p-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold opacity-60">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {src.date}
              </div>
              <p className="mt-2 text-base font-semibold">{src.name}</p>
              <p className="mt-1.5 text-sm leading-6 break-words whitespace-normal">
                {src.result}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
