"use client";

import { forwardRef } from "react";
import { textColorFor } from "@/lib/random-theme";

interface Props {
  quizTitle: string;
  resultName: string;
  resultSubtitle?: string;
  resultDescription?: string;
  resultImageUrl?: string;
  traits?: string[];
  cardColor: string;
}

export const QuizResultShareCard = forwardRef<HTMLDivElement, Props>(
  function QuizResultShareCard(
    {
      quizTitle,
      resultName,
      resultSubtitle = "",
      resultDescription = "",
      resultImageUrl,
      traits = [],
      cardColor,
    },
    ref,
  ) {
    const hasImage = !!resultImageUrl;

    // ── Text colors ──
    // hasImage: white text on blurred image (no overlay), black text-shadow for readability
    // no image: computed from cardColor luminance
    const textColor = hasImage ? "#FCFAF2" : textColorFor(cardColor);
    const isLightBg = !hasImage && textColor === "#1C1C1C";
    const mutedColor = hasImage
      ? "rgba(255,255,255,0.72)"
      : isLightBg
        ? "rgba(28,28,28,0.55)"
        : "rgba(252,250,242,0.65)";
    const subtleColor = hasImage
      ? "rgba(255,255,255,0.4)"
      : isLightBg
        ? "rgba(28,28,28,0.3)"
        : "rgba(252,250,242,0.35)";
    const dividerColor = hasImage
      ? "rgba(255,255,255,0.15)"
      : isLightBg
        ? "rgba(28,28,28,0.1)"
        : "rgba(252,250,242,0.12)";
    const tagBg = hasImage
      ? "rgba(255,255,255,0.12)"
      : isLightBg
        ? "rgba(28,28,28,0.06)"
        : "rgba(252,250,242,0.1)";

    return (
      <div
        ref={ref}
        className="relative select-none overflow-hidden"
        style={{
          width: "100%",
          // no cardColor background when image exists — the blurred image IS the background
          backgroundColor: hasImage ? "transparent" : cardColor,
          color: textColor,
          borderRadius: 0,
        }}
      >
        {/* ── Blurred image as the card background ── */}
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resultImageUrl!}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{
              objectFit: "cover",
              filter: "blur(40px)",
              transform: "scale(1.2)",
            }}
            crossOrigin="anonymous"
          />
        )}

        {/* ── Content layer (transparent background) ── */}
        <div className="relative z-10 flex flex-col">
          {/* Foreground image (no crop, no rounded corners) */}
          {hasImage && (
            <div className="flex justify-center px-5 pt-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultImageUrl!}
                alt=""
                className="w-full"
                style={{ objectFit: "contain", maxHeight: 260 }}
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Traits */}
          {traits.length > 0 && (
            <>
              <div className={`flex flex-wrap gap-1.5 ${hasImage ? "mx-5 mt-4" : "mx-5 mt-5"}`}>
                {traits.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide"
                    style={{
                      backgroundColor: tagBg,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              {/* Divider */}
              <hr
                className="mx-5 my-3"
                style={{ border: "none", borderTop: `1px solid ${dividerColor}` }}
              />
            </>
          )}

          {/* Result name */}
          <h1
            className="mx-5 mt-1 text-[28px] font-bold leading-[1.15] tracking-[-0.02em]"
            style={{

            }}
          >
            {resultName}
          </h1>

          {/* Description */}
          {resultDescription && (
            <p
              className="mx-5 mt-2 text-[15px] leading-[1.6]"
              style={{
                color: mutedColor,

              }}
            >
              {resultDescription}
            </p>
          )}

          {/* Spacer (larger when no image) */}
          <div className="flex-1" style={{ minHeight: hasImage ? 8 : 24 }} />

          {/* Subtitle */}
          {resultSubtitle && (
            <p
              className="mx-5 text-[14px] font-medium leading-[1.5]"
              style={{
                color: mutedColor,

              }}
            >
              {resultSubtitle}
            </p>
          )}

          {/* Footer */}
          <div
            className="mx-5 mb-5 mt-3 flex items-center justify-between pt-3"
            style={{ borderTop: `1px solid ${dividerColor}` }}
          >
            <p
              className="text-[12px] font-semibold tracking-[0.08em]"
              style={{
                color: subtleColor,

              }}
            >
              SelfIDBox
            </p>
            <p
              className="text-[11px]"
              style={{
                color: subtleColor,

              }}
            >
              {quizTitle}
            </p>
          </div>
        </div>
      </div>
    );
  },
);
