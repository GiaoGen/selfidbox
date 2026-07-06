# Safari (WebKit) Image Preload Optimization

**Date**: 2026-07-06
**Status**: Design approved — ready for implementation plan
**Scope**: Safari-specific, image preloading for quiz result → share card flow

## Problem

On iOS Safari, when a user finishes a quiz and the share card auto-opens, the result image (`image_url` from Supabase Storage) often hasn't finished loading, causing a visible flash/blank area. This does not happen on Chromium browsers.

### Root Cause

`QuizPlayer.tsx` preloads all result images via `new Image()` on mount (commit `a9a8fe3`). This works in Chromium because:

- `new Image()` triggers high-priority download + full decode + strong cache retention

But Safari/WebKit behaves differently:

- `new Image()` triggers **low-priority speculative** fetch
- Image data may be downloaded but **not fully decoded** (lazy decoding)
- Cache references are **weak** — during 2-5 minutes of quiz-taking, iOS Safari may evict decoded images under memory pressure
- When the share card renders, the `<img>` tag needs the image immediately — Safari must re-fetch from Supabase Storage

Additionally, `QuizResult.tsx` auto-opens the share card via `useEffect(() => setShowShare(true), [])` **immediately** on mount, before the result page's `<img>` tags have finished loading in Safari.

### Affected Flow

```
QuizPlayer mount → new Image() preload (works in Chrome, no-op in Safari)
    ↓ (user answers questions, 2-5 min)
finishQuiz() → phase="result" → QuizResult renders
    ↓ (same tick)
useEffect → setShowShare(true) → share card animates in
    ↓
QuizResultShareCard <img> needs image NOW → Safari re-fetches → BLANK FLASH
```

## Design

### Principle: Safari-only code paths, zero impact on Chromium

All changes are guarded by `isSafari()` from a new utility module. When `isSafari()` returns `false`, the existing code path executes unchanged.

### Safari Detection: `lib/browser-detect.ts`

New file. Exports a single function:

```ts
export function isSafari(): boolean
```

Uses user-agent string parsing: checks for `Safari` but not `Chrome`/`Chromium`/`CriOS`. Client-only (`typeof navigator !== 'undefined'` guard). No dependencies.

### Change 1: Enhanced Preload in `QuizPlayer.tsx`

**File**: `components/quiz-runtime/QuizPlayer.tsx`
**Target**: Lines 33-42 (the preload `useEffect`)

When `isSafari()` is true, use two parallel channels to prime both of WebKit's internal caches:

| Channel | Mechanism | Cache Layer Targeted |
|---------|-----------|---------------------|
| Channel 1 | `new Image()` + `.decode()` | Decoded bitmap cache |
| Channel 2 | `fetch()` with CORS mode | HTTP/disk cache |

Channel 1 (`decode()`): forces WebKit to fully decode the image rather than stopping at speculative prefetch. The `.decode()` Promise resolves when the image is safe to render — at which point it's definitely in the decoded cache.

Channel 2 (`fetch()`): WebKit's HTTP cache and image cache are distinct layers. A `fetch()` call downloads the raw bytes and stores them in HTTP cache. When the `<img>` tag later requests the same URL, the HTTP layer returns cached bytes instantly even if the decoded bitmap was evicted.

When `isSafari()` is false: existing `new Image()` code runs unchanged.

### Change 2: Delayed Share Card Auto-Open in `QuizResult.tsx`

**File**: `components/quiz-runtime/QuizResult.tsx`
**Target**: Line 63 (the auto-open `useEffect`)

When `isSafari()` is true, instead of immediately calling `setShowShare(true)`, wait for the result image `<img>` element in the DOM to fire its `load` event.

This ensures the image is fully loaded and decoded in Safari's render pipeline before the share card (which uses the same `resultImageUrl`) renders its own `<img>` tags.

**Safety net**: A `setTimeout(fn, 1500)` acts as a maximum wait. If the image fails to load or the event is missed, the share card still opens after 1.5 seconds. This prevents the optimization from becoming a blocking failure.

**Edge cases handled**:
- Image already loaded (`img.complete === true` + `naturalWidth > 0`): open immediately
- Image not yet loaded: attach one-time `load` listener + timeout
- No image result (`resultImageUrl` is undefined): open immediately (nothing to wait for)

When `isSafari()` is false: existing `setShowShare(true)` runs unchanged.

### What is NOT Changed

- No UI changes (DOM structure, styles, animations untouched)
- No backend changes (API routes, Supabase, image upload pipeline)
- No Service Worker changes
- No `next.config.ts` changes
- No new npm dependencies
- No changes to `QuizResultShareCard` or `RotatingCardModal`

## File Manifest

| File | Action | Estimated Lines |
|------|--------|-----------------|
| `lib/browser-detect.ts` | **Create** | ~8 |
| `components/quiz-runtime/QuizPlayer.tsx` | Modify (preload effect) | ~8 added |
| `components/quiz-runtime/QuizResult.tsx` | Modify (auto-open effect) | ~12 added |

Total: **1 new file, 2 modified files, ~28 lines net change**

## Verification

1. **Build**: `npm run build` passes with zero errors
2. **Lint**: `npm run lint` passes with zero new warnings
3. **Test**: `npm run test` passes (existing tests unaffected)
4. **Chrome**: Quiz → result → share card behavior identical to current (no regression)
5. **iOS Safari**: Share card opens with result image already visible (no blank flash)
6. **Edge case**: Image load failure → share card opens after 1.5s timeout (not blocked forever)
7. **Edge case**: Quiz result without image → share card opens immediately (no unnecessary wait)
