/**
 * Detects Safari (and other WebKit-only browsers) via user-agent string.
 *
 * On iOS, ALL browsers use WKWebKit, so this returns true for any iOS browser
 * that isn't Chrome/CriOS — they all share the same WebKit image caching quirks.
 *
 * Returns false during SSR (no `navigator`).
 */
export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Safari UA always contains "Safari"; Chrome/Chromium/Edge add "Chrome" or "CriOS"
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS/i.test(ua);
}
