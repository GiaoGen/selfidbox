import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Replay on error only — avoids performance overhead
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  // Trace 10% of requests in production to catch regressions
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
