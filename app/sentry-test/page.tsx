"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const [result, setResult] = useState<string | null>(null);

  const handleThrowError = () => {
    throw new Error("Sentry Test Error — thrown");
  };

  const handleCaptureException = () => {
    try {
      throw new Error("Sentry Test Error — captured");
    } catch (err) {
      Sentry.captureException(err);
      setResult("Error captured and sent to Sentry. Check your dashboard.");
    }
  };

  const handleCaptureMessage = () => {
    Sentry.captureMessage("Sentry Test Message", "info");
    setResult("Message sent to Sentry. Check your dashboard.");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-2xl font-bold">Sentry Test</h1>
      <p className="text-sm text-[var(--muted)]">
        Click a button and check your Sentry dashboard.
      </p>

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={handleCaptureException}
          className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Capture Exception
        </button>

        <button
          onClick={handleCaptureMessage}
          className="rounded-full border border-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:opacity-90"
        >
          Capture Message
        </button>

        <button
          onClick={handleThrowError}
          className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Throw Error (crash page)
        </button>
      </div>

      {result && (
        <p className="mt-4 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl">
          {result}
        </p>
      )}
    </main>
  );
}
