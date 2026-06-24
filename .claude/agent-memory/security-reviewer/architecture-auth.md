---
name: architecture-auth
description: Auth architecture — middleware, Supabase client types, admin gating, service role usage patterns
metadata:
  type: reference
---

# Auth Architecture

## Supabase Client Types

| File | Type | Key Used | Context |
|------|------|----------|---------|
| `lib/supabase/client.ts` | Browser (`createBrowserClient`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client components only — RLS-enforced |
| `lib/supabase/server.ts` | SSR (`createServerClient`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server Components + API routes — RLS-enforced |
| `lib/supabase/service.ts` | Service role (`createClient` from `@supabase/supabase-js`) | `SUPABASE_SERVICE_ROLE_KEY` (server-only) | Admin operations — BYPASSES RLS |

## Middleware Protection (`middleware.ts`)
- Runs on all paths except static assets
- Refreshes Supabase session via cookie
- Protected paths: `/admin`, `/profile`, `/create` — redirects to `/login` if no user
- Only checks authentication, NOT authorization (admin role is checked in `app/admin/layout.tsx`)

## Admin Authorization
- `app/admin/layout.tsx`: Server component, checks `user` from Supabase auth, then checks `user.id` against `ADMIN_USER_IDS` env var (comma-separated UUIDs)
- Admin pages use `createServiceClient()` for database access — bypasses RLS
- Service role key is NEVER exposed to client — read from `process.env.SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix)
- No client-side admin flag — admin status is determined server-side only

## Service Role Usage (verified safe)
All `createServiceClient()` callers:
- `lib/admin-db.ts` — gated by `app/admin/layout.tsx` auth + admin ID check
- `lib/quizzes-db.ts` — `saveQuizSchema`, `updateQuizSchema` are server-side only; `getQuizForEdit` checks `creator_user_id !== userId`
- `lib/test-sites-db.ts` — `recordTestSiteClick` has no auth check (click tracking, non-sensitive)
- `lib/credits/service.ts` — called from server-side API routes only; `getCredits` passes explicit `userId`
- `lib/ai/prompts.ts` — read/write AI prompt templates, called from admin pages + server-side AI routes
- `app/admin/ai-usage/page.tsx` — server component, gated by admin layout auth
- `app/api/quiz-studio/sandbox/route.ts` — has explicit auth + ownership + status checks

## Key Concern
`app/api/test-sites/[id]/click/route.ts` uses service_role client with ZERO authentication — while the data is non-sensitive (click counter), this sets a dangerous precedent.
