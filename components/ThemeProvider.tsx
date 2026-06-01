"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { generateRandomTheme, type RandomTheme } from "@/lib/random-theme";

const ThemeContext = createContext<RandomTheme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState(() => generateRandomTheme());
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): RandomTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
