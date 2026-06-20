"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TAGLINES = [
  "今天有更了解自己吗？",
  "今天想做什么测评呢？",
  "今天的心情还不错吧？",
];

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "早上好";
  if (h >= 12 && h < 18) return "下午好";
  return "晚上好";
}

export function Greeting({ className = "" }: { className?: string }) {
  const [name, setName] = useState<string | null | undefined>(undefined);
  const supabase = createClient();

  // Pick one of: time greeting or a random tagline — stable for the session
  const pick = useRef<{ type: "time" } | { type: "tagline"; text: string }>(
    Math.random() < 0.5
      ? { type: "time" }
      : { type: "tagline", text: TAGLINES[Math.floor(Math.random() * TAGLINES.length)] },
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) {
        setName(null);
        return;
      }
      try {
        const { data: row } = await supabase
          .from("users")
          .select("username")
          .eq("id", u.id)
          .single();
        setName(row?.username ?? u.email ?? null);
      } catch {
        setName(u.email ?? null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't render until we know the auth state
  if (name === undefined) return null;

  let display: string;
  if (pick.current.type === "time") {
    display = name ? `${timeGreeting()}，${name}` : timeGreeting();
  } else {
    display = pick.current.text;
  }

  return (
    <p className={`text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-[var(--ink)] ${className}`}>
      {display}
    </p>
  );
}
