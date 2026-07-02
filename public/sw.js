/* ------------------------------------------------------------------ */
/*  SelfIDBox Service Worker                                           */
/*                                                                     */
/*  Strategy:                                                           */
/*  - Navigation (page loads): stale-while-revalidate                  */
/*    → Serve cached HTML instantly, update cache in background        */
/*    → Falls back to cache when offline                                */
/*  - Static assets (JS/CSS/images/fonts): cache-first                 */
/*    → Browser immutable cache handles most, SW is safety net         */
/*  - API / admin / auth routes: bypassed (network-only)               */
/*                                                                     */
/*  Cache lifecycle:                                                    */
/*  - Install: skipWaiting → activate immediately                      */
/*  - Activate: delete old version caches, claim all clients           */
/*  - Version bump CACHE_NAME to invalidate on deploy                  */
/* ------------------------------------------------------------------ */

const CACHE_NAME = "selfidbox-v1";

/* ---- Install: take over immediately ---- */
self.addEventListener("install", () => {
  self.skipWaiting();
});

/* ---- Activate: clean old caches, claim pages ---- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

/* ---- Fetch: stale-while-revalidate for nav, cache-first for assets ---- */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return; // Invalid URL, let browser handle
  }

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Bypass: API routes, admin, auth pages — always network
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/login")
  ) {
    return;
  }

  /* ---- Navigation: stale-while-revalidate ---- */
  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          // Revalidate in background
          const fetched = fetch(request)
            .then((response) => {
              if (response.ok && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached || Response.error());

          // Return cached immediately if available, otherwise wait for network
          return cached || fetched;
        }),
      ),
    );
    return;
  }

  /* ---- Static assets: cache-first ---- */
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached || fetched;
        }),
      ),
    );
  }
});
