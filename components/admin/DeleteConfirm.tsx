"use client";

import { useState } from "react";

export function DeleteConfirm({
  title,
  message,
  onConfirm,
  triggerLabel = "删除",
}: {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[14px] bg-[#ff4d8b]/10 px-4 py-2 text-sm font-semibold text-[#ff4d8b] hover:bg-[#ff4d8b]/20"
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(10,10,10,0.15)]">
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--body)]">{message}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-[16px] bg-[var(--surface-strong)] px-4 py-3 text-sm font-semibold"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded-[16px] bg-[#ff4d8b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
