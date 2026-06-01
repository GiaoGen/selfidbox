"use client";

import { forwardRef } from "react";

interface Props {
  quizTitle: string;
  resultName: string;
  resultSubtitle?: string;
  resultDescription?: string;
  resultImageUrl?: string;
  traits?: string[];
  shareText?: string;
}

const CARD_W = 400;

export const QuizResultShareCard = forwardRef<HTMLDivElement, Props>(
  function QuizResultShareCard(
    {
      quizTitle,
      resultName,
      resultSubtitle = "",
      resultDescription = "",
      resultImageUrl,
      traits = [],
      shareText = "",
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className="relative flex flex-col overflow-hidden bg-[#faf7f2]"
        style={{ width: CARD_W, aspectRatio: "3 / 4" }}
      >
        {/* ---- image or placeholder ---- */}
        <div className="mx-5 mt-5 overflow-hidden rounded-[20px] bg-[#e8e3da]">
          {resultImageUrl ? (
            <img
              src={resultImageUrl}
              alt=""
              className="block w-full"
              style={{ aspectRatio: "4 / 3" }}
              crossOrigin="anonymous"
            />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ aspectRatio: "4 / 3" }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
              >
                <circle
                  cx="18"
                  cy="20"
                  r="10"
                  fill="#d4cfc6"
                />
                <circle
                  cx="30"
                  cy="28"
                  r="6"
                  fill="#c4beb4"
                />
                <rect
                  x="20"
                  y="30"
                  width="16"
                  height="4"
                  rx="2"
                  fill="#d4cfc6"
                />
              </svg>
            </div>
          )}
        </div>

        {/* ---- traits ---- */}
        {traits.length > 0 && (
          <div className="mx-5 mt-4 flex flex-wrap gap-1.5">
            {traits.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full bg-[#e8e3da] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#5c554b]"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* ---- label ---- */}
        <p className="mx-5 mt-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#a09888]">
          你的结果
        </p>

        {/* ---- result name ---- */}
        <h1 className="mx-5 mt-1 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-[#1a1a1a]">
          {resultName}
        </h1>

        {/* ---- description ---- */}
        {resultDescription && (
          <p className="mx-5 mt-2 text-[15px] leading-[1.6] text-[#5c554b]">
            {resultDescription}
          </p>
        )}

        {/* ---- spacer ---- */}
        <div className="flex-1" />

        {/* ---- subtitle ---- */}
        {resultSubtitle && (
          <p className="mx-5 text-[14px] font-medium leading-[1.5] text-[#8a8178]">
            {resultSubtitle}
          </p>
        )}

        {/* ---- share text ---- */}
        {shareText && (
          <p className="mx-5 mt-1 text-[13px] leading-[1.5] text-[#a09888] italic">
            {shareText}
          </p>
        )}

        {/* ---- footer ---- */}
        <div className="mx-5 mb-5 mt-3 flex items-center justify-between border-t border-[#e0dbd2] pt-3">
          <p className="text-[12px] font-semibold tracking-[0.08em] text-[#c4beb4]">
            SelfIDBox
          </p>
          <p className="text-[11px] text-[#c4beb4]">
            {quizTitle}
          </p>
        </div>
      </div>
    );
  },
);
