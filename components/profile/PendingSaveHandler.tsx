"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * On mount, checks sessionStorage for a pending quiz save.
 * If the user is now authenticated, submits the save and clears the key.
 */
export function PendingSaveHandler() {
  useEffect(() => {
    const raw = sessionStorage.getItem("pendingQuizSave");
    if (!raw) return;
    let pending: { quizId: string; userVector: Record<string, number>; ranking: unknown[]; answers: unknown[] } | null = null;
    try { pending = JSON.parse(raw); } catch { /* corrupt */ }
    // Clear immediately — prevents duplicate saves on remount / refresh
    sessionStorage.removeItem("pendingQuizSave");
    if (!pending) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      fetch("/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: pending!.quizId,
          userVector: pending!.userVector,
          ranking: pending!.ranking,
          answers: pending!.answers,
        }),
      });
    });
  }, []);

  return null;
}
