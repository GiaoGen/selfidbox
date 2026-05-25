"use client";

import { useRef, useEffect, useLayoutEffect, useCallback } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
};

export function InlineEditableTextarea({
  value,
  onChange,
  placeholder = "",
  className = "",
  rows = 2,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Resize on mount even with empty value
  useLayoutEffect(() => {
    autoResize();
  }, [autoResize]);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const base =
    "bg-transparent border-b border-current/10 hover:border-current/25 focus:border-current/30 focus:outline-none rounded-sm px-1 py-2 transition-all duration-150 placeholder:text-current/20 resize-none w-full leading-relaxed";

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        autoResize();
      }}
      placeholder={placeholder}
      rows={rows}
      className={`${base} ${className}`}
    />
  );
}
