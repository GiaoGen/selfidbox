/**
 * Simple logger — silenced in production, verbose in development.
 * Replace console.log / console.warn / console.error with these helpers
 * to avoid shipping debug output to production.
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  debug(...args: unknown[]) {
    if (isDev) console.log(...args);
  },
  info(...args: unknown[]) {
    // info always prints (low volume)
    console.log(...args);
  },
  warn(...args: unknown[]) {
    console.warn(...args);
  },
  error(...args: unknown[]) {
    console.error(...args);
  },
};
