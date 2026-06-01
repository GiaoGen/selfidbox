import { HydrationDebug } from "@/components/debug/HydrationDebug";

export default function DebugMinimalPage() {
  return (
    <main style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Clean Minimal Test</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Zero injected scripts. Zero dangerouslySetInnerHTML. Only HydrationDebug.
      </p>
      <hr style={{ margin: "20px 0" }} />
      {process.env.NODE_ENV === "development" && <HydrationDebug />}
    </main>
  );
}
