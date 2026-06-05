"use client";

import { useState, useEffect } from "react";
import { NIPPON_COLORS } from "@/lib/nippon-colors";
import { textColorFor } from "@/lib/random-theme";

const SSR_DEFAULT = "#DAC9A6"; // 鳥の子 — warm neutral for SSR

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface QuizTheme {
  headerBg: string;
  headerText: string;
  accent: string;
  accentText: string;
}

export function useNipponTheme(): QuizTheme {
  const [theme, setTheme] = useState<QuizTheme>(() => ({
    headerBg: SSR_DEFAULT,
    headerText: textColorFor(SSR_DEFAULT),
    accent: SSR_DEFAULT,
    accentText: textColorFor(SSR_DEFAULT),
  }));

  useEffect(() => {
    const headerBg = pickRandom(NIPPON_COLORS);
    const accent = pickRandom(NIPPON_COLORS);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme({
      headerBg,
      headerText: textColorFor(headerBg),
      accent,
      accentText: textColorFor(accent),
    });
  }, []);

  return theme;
}
