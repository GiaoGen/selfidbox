"use client";

import { useRef, useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function InlineEditableInput({
  value,
  onChange,
  placeholder = "",
  className = "",
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [font, setFont] = useState("inherit");

  // Auto-width: sync input width to text content
  useEffect(() => {
    if (measureRef.current && ref.current) {
      const w = measureRef.current.offsetWidth;
      ref.current.style.width = `${Math.max(w + 16, 60)}px`;
      setFont(getComputedStyle(ref.current).font);
    }
  }, [value]);

  const base =
    "bg-transparent border-b border-current/10 hover:border-current/25 focus:border-current/30 focus:outline-none rounded-sm px-1 py-0.5 transition-all duration-150 placeholder:text-current/20 min-w-[60px]";

  return (
    <span className="relative inline-flex items-center">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${base} ${className}`}
        style={{ width: "auto" }}
      />
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] whitespace-pre px-1 py-0.5"
        style={{ font }}
      >
        {value || placeholder || " "}
      </span>
    </span>
  );
}
