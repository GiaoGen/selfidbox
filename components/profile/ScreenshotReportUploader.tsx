"use client";
/* eslint-disable @next/next/no-img-element -- blob URL previews from URL.createObjectURL */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// TODO: replace DEV_USER_ID with Supabase Auth user id
const DEV_USER_ID = "b64cd3ef-2982-429e-b546-585d156774b6";

interface SuccessData {
  duplicate: false;
  report_id: number;
  parse_status: string;
  ocr: { text: string; confidence: number; line_count: number };
  report: { main_result: string; test_type: string; core_vector: Record<string, number>; social_vector: Record<string, number> };
  profile_result: { ok: boolean; profile: Record<string, unknown> };
}

interface DuplicateData {
  duplicate: true;
  message: string;
  existing_report_id: number;
}

type UploadState =
  | { phase: "idle" }
  | { phase: "selected"; file: File; preview: string }
  | { phase: "uploading" }
  | { phase: "success"; data: SuccessData }
  | { phase: "duplicate"; data: DuplicateData }
  | { phase: "error"; message: string };

export function ScreenshotReportUploader({
  onViewReports,
}: {
  onViewReports?: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ phase: "idle" });

  const handleFile = (file: File) => {
    const preview = URL.createObjectURL(file);
    setState({ phase: "selected", file, preview });
  };

  const handleUpload = async () => {
    if (state.phase !== "selected") return;
    setState({ phase: "uploading" });

    try {
      const form = new FormData();
      form.append("user_id", DEV_USER_ID);
      form.append("file", state.file);

      const res = await fetch("/api/screenshot-report", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setState({ phase: "error", message: json.error ?? "请求失败" });
        return;
      }

      if (json.duplicate) {
        setState({
          phase: "duplicate",
          data: json as DuplicateData,
        });
        return;
      }

      setState({
        phase: "success",
        data: json as SuccessData,
      });
    } catch {
      setState({ phase: "error", message: "网络请求失败，请稍后重试" });
    }
  };

  const reset = () => {
    if (state.phase === "selected") {
      URL.revokeObjectURL(state.preview);
    }
    if (fileRef.current) fileRef.current.value = "";
    setState({ phase: "idle" });
  };

  const iconCamera = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );

  return (
    <div className="rounded-[28px] bg-[#fffaf0]/70 p-5 shadow-[0_12px_40px_rgba(10,10,10,0.05)] sm:p-6">
      {/* idle — prompt to select */}
      {(state.phase === "idle" || state.phase === "selected") && (
        <div className="flex flex-col items-center gap-4 text-center">
          {state.phase === "selected" ? (
            <img
              src={state.preview}
              alt="预览"
              className="w-full max-w-sm rounded-[20px] object-cover shadow-md"
            />
          ) : (
            <label
              className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-[#b8a4ed]/40 bg-[#b8a4ed]/8 px-6 py-10 transition hover:bg-[#b8a4ed]/14"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#b8a4ed]/25 text-[#6b5bb8]">
                {iconCamera}
              </span>
              <span className="text-base font-semibold text-[#0a0a0a]">
                上传测评截图
              </span>
              <span className="text-sm text-[#0a0a0a]/55">
                上传任意测评结果截图，SelfIDBox 会自动识别结果并更新你的个人图谱
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          )}

          {state.phase === "selected" && (
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                className="rounded-full bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_100%)] px-6 py-2.5 text-sm font-semibold text-[#0a0a0a] shadow-md transition hover:brightness-105"
              >
                开始解析
              </button>
              <button
                onClick={reset}
                className="rounded-full bg-[#0a0a0a]/6 px-6 py-2.5 text-sm font-semibold text-[#0a0a0a] transition hover:bg-[#0a0a0a]/10"
              >
                重新选择
              </button>
            </div>
          )}
        </div>
      )}

      {/* uploading */}
      {state.phase === "uploading" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#b8a4ed]/20">
            <svg
              className="animate-spin text-[#6b5bb8]"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <p className="text-base font-semibold text-[#0a0a0a]">正在解析截图…</p>
          <p className="text-sm text-[#0a0a0a]/55">OCR 识别中，请稍候</p>
        </div>
      )}

      {/* success */}
      {state.phase === "success" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#4caf50]/15 text-[#2e7d32]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <p className="text-lg font-semibold text-[#0a0a0a]">解析完成</p>

          <div className="mt-1 w-full max-w-xs rounded-[20px] bg-white/60 p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#0a0a0a]/55">测试类型</span>
              <span className="font-semibold">{state.data.report.test_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#0a0a0a]/55">测试结果</span>
              <span className="font-semibold">{state.data.report.main_result}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#0a0a0a]/55">OCR 置信度</span>
              <span className="font-semibold">{Math.round(state.data.ocr.confidence * 100)}%</span>
            </div>
          </div>

          <div className="mt-3 flex gap-3">
            <button
              onClick={() => router.refresh()}
              className="rounded-full bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_100%)] px-6 py-2.5 text-sm font-semibold text-[#0a0a0a] shadow-md transition hover:brightness-105"
            >
              刷新个人图谱
            </button>
            {onViewReports && (
              <button
                onClick={onViewReports}
                className="rounded-full bg-[#0a0a0a]/6 px-6 py-2.5 text-sm font-semibold text-[#0a0a0a] transition hover:bg-[#0a0a0a]/10"
              >
                查看报告列表
              </button>
            )}
          </div>

          <button
            onClick={reset}
            className="mt-1 text-sm font-semibold text-[#0a0a0a]/45 transition hover:text-[#0a0a0a]"
          >
            上传另一张截图
          </button>
        </div>
      )}

      {/* duplicate */}
      {state.phase === "duplicate" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#ffb74d]/20 text-[#e65100]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <p className="text-lg font-semibold text-[#0a0a0a]">这张截图已经上传过</p>
          <button
            onClick={reset}
            className="mt-1 rounded-full bg-[#0a0a0a]/6 px-5 py-2 text-sm font-semibold text-[#0a0a0a] transition hover:bg-[#0a0a0a]/10"
          >
            上传其他截图
          </button>
        </div>
      )}

      {/* error */}
      {state.phase === "error" && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f44336]/15 text-[#c62828]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </span>
          <p className="text-lg font-semibold text-[#0a0a0a]">解析失败</p>
          <p className="max-w-xs text-sm text-[#0a0a0a]/55">{state.message}</p>
          <button
            onClick={reset}
            className="mt-1 rounded-full bg-[#0a0a0a]/6 px-5 py-2 text-sm font-semibold text-[#0a0a0a] transition hover:bg-[#0a0a0a]/10"
          >
            重新上传
          </button>
        </div>
      )}
    </div>
  );
}
