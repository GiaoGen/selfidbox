"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: number;
  message: string;
}

let idCounter = 0;

export function HydrationDebug() {
  const [hydrated, setHydrated] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [ua, setUa] = useState("");
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  function addLog(message: string) {
    try {
      const entry: LogEntry = { id: ++idCounter, message };
      setLogs((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, 30);
      });
    } catch {
      // silently ignore log failures
    }
  }

  useEffect(() => {
    try {
      // eslint-disable-next-line
      setHydrated(true);
      setUa(navigator.userAgent);
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      addLog("Hydrated: yes — " + new Date().toISOString());
      addLog("UA: " + navigator.userAgent);
      addLog("Viewport: " + window.innerWidth + "x" + window.innerHeight);

      window.onerror = (msg, src, line, col, err) => {
        try {
          setErrorCount((c) => c + 1);
          addLog("ERROR: " + String(msg).slice(0, 100));
          if (src) addLog("  src: " + String(src).slice(-50) + ":" + line + ":" + col);
          if (err?.stack) addLog("  stack: " + err.stack.slice(0, 200));
        } catch {
          // ignore
        }
      };

      window.onunhandledrejection = (evt) => {
        try {
          setErrorCount((c) => c + 1);
          addLog("REJECTION: " + String(evt.reason).slice(0, 200));
        } catch {
          // ignore
        }
      };
    } catch {
      addLog("FATAL: useEffect itself threw");
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        width: "calc(100vw - 24px)",
        maxWidth: 400,
        maxHeight: "35vh",
        overflowY: "auto",
        zIndex: 100000,
        background: hydrated ? "rgba(0,100,0,0.92)" : "rgba(100,100,100,0.92)",
        color: "#fff",
        borderRadius: 12,
        padding: 10,
        fontFamily: "monospace",
        fontSize: 10,
        lineHeight: 1.4,
        pointerEvents: "none",
      }}
    >
      <div style={{ marginBottom: 6, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
        <span>Hydrated: {hydrated ? "yes" : "no"}</span>
        <span>errors: {errorCount}</span>
      </div>
      <div style={{ color: "#aaa", marginBottom: 4 }}>
        {ua || "(loading...)"}
      </div>
      <div style={{ color: "#aaa", marginBottom: 4 }}>
        {vw > 0 ? vw + "x" + vh : "(loading...)"}
      </div>
      {logs.map((entry) => (
        <div key={entry.id} style={{ marginBottom: 3, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 2 }}>
          <span style={{ color: "#ff0" }}>{entry.message}</span>
        </div>
      ))}
    </div>
  );
}
