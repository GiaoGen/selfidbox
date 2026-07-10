"use client";

import { useState } from "react";

type Props = {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function EditableChipList({
  items,
  onChange,
  placeholder = "输入后回车",
  className = "",
}: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function commit(keepOpen = false) {
    const v = draft.trim();
    if (v && !items.includes(v)) {
      onChange([...items, v]);
    }
    setDraft("");
    if (!keepOpen) setAdding(false);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const chipBase =
    "inline-flex items-center gap-1 rounded-full bg-current/10 px-3 py-1 text-xs font-semibold transition-colors";

  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className={chipBase}>
          {item}
          <button
            type="button"
            onClick={() => remove(i)}
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-current/15 text-[0.6rem] leading-none transition-colors hover:bg-current/25"
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(true);
            if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          onBlur={() => commit()}
          placeholder={placeholder}
          className="inline-flex h-7 w-24 items-center rounded-full bg-current/8 px-3 text-xs font-medium placeholder:text-current/20 focus:outline-none focus:ring-2 focus:ring-current/15"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={`${chipBase} cursor-pointer hover:bg-current/20`}
        >
          + 添加
        </button>
      )}
    </span>
  );
}
