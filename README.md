# SelfIDBox

AI-driven personality expression and quiz discovery platform.

## Overview

SelfIDBox lets users create AI-powered personality quizzes, take them, and build a long-term personality profile from their results. The platform fuses quiz results, uploaded test reports, and OCR-parsed screenshots into a 16-dimension personality vector visualized through radar charts, word clouds, and a Cover Flow carousel.

### Two Product Lines

- **Explore** — Discover and take personality quizzes and test site assessments
- **Quiz Studio** — Create AI-generated personality quizzes with full control over results, factors, vectors, and questions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Auth | Supabase Auth (cookie-based SSR) |
| AI | [DeepSeek Chat API](https://api.deepseek.com/v1/chat/completions) |
| OCR | External OCR service proxy |
| Storage | Supabase Storage (quiz result images) |
| Deployment | Vercel (default) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project
- A DeepSeek API key
- (Optional) OCR API access

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only

# DeepSeek AI
DEEPSEEK_API_KEY=sk-your-deepseek-key

# OCR (optional)
OCR_API_KEY=your-ocr-key
OCR_API_URL=https://your-ocr-service
```

### Database Setup

Run the Supabase migrations in order:

```bash
# From the supabase/migrations/ directory, run in numerical order:
# 001_add_image_url.sql
# 002_add_quiz_attempt_profile_fields.sql
# 003_sync_auth_users_to_public.sql
# 004_add_sandbox_status.sql
# 005_add_submitted_status.sql
# 006_add_quiz_style_controls.sql
# 007_add_quiz_metadata_fields.sql
# 008_add_ai_usage_logs.sql
# 009_add_ai_prompts.sql
```

### Install & Run

```bash
npm install
npm run dev        # Development server at http://localhost:3000
npm run build      # Production build
npm run start      # Start production server
```

## Project Structure

```
app/                          # Next.js App Router
├── admin/                    # Admin dashboard (auth-protected)
├── api/                      # API routes
│   ├── explore/              # Explore data endpoints
│   ├── profile/              # Profile data (sources, word-cloud)
│   ├── quiz-ai/              # AI generation (results, factors, vectors, questions)
│   ├── quiz-attempts/        # Quiz submission
│   └── quiz-studio/          # Quiz CRUD (save, edit, sandbox)
├── create/                   # Quiz Studio page
├── explore/                  # Explore/discover page
│   └── _components/          # Explore sub-components
├── profile/                  # User profile page
├── quiz/[slug]/              # Playable quiz page
├── quizzes/[slug]/           # Quiz detail page
├── test-sites/[id]/          # Test site detail page
├── login/                    # Login page
├── register/                 # Registration page
├── layout.tsx                # Root layout (metadata, PWA)
├── error.tsx                 # Error boundary
├── not-found.tsx             # Custom 404
├── robots.ts                 # Robots.txt
└── sitemap.ts                # Dynamic sitemap

components/
├── admin/                    # Admin dashboard components
├── auth/                     # Auth components (UserMenu)
├── explore/                  # Explore page components
├── layout/                   # Layout components
├── navigation/               # BottomAppNavbar, NavbarLayout, SearchOverlay
├── profile/                  # Profile components (CoverFlow, WordSphere, Radar)
├── quiz-engine/              # Quiz Studio builder components
├── quiz-runtime/             # Quiz player components
├── quiz-studio/              # Reusable quiz editor primitives
└── share/                    # Share card components

lib/
├── ai/                       # AI tracking, prompt versioning
├── explore/                  # Explore data fetching, mapping, types
├── prompts/                  # AI prompt templates (quiz-*)
├── cache.ts                  # In-memory TTL cache layer
├── logger.ts                 # Environment-aware logger
├── quizzes-db.ts             # Quiz CRUD operations
├── test-sites-db.ts          # Test site operations
├── user-profile-db.ts        # Profile read/write
├── rebuild-user-profile.ts   # Profile fusion engine
├── supabase.ts               # Static Supabase client
├── supabase/                 # SSR & browser Supabase clients
└── dev-user.ts               # Legacy dev user ID (being phased out)

supabase/
└── migrations/               # Database migration SQL files
```

## Architecture Notes

### Data Flow

1. **Quiz Creation**: Quiz Studio UI → `/api/quiz-ai/*` → DeepSeek API → validated JSON → Quiz DB tables
2. **Quiz Taking**: Quiz Player → user answers → user vector → Euclidean distance matching → result ranking → `/api/quiz-attempts` → DB
3. **Profile Building**: `rebuildUserProfile()` fuses quiz attempts + uploaded reports into `core_vector` (8 dimensions) + `social_vector` (8 dimensions) → AI summary generation
4. **Caching**: `lib/cache.ts` provides in-memory TTL caching for frequently-read data (categories, test sites, profile, quiz details)

### Auth Model

- Supabase Auth with cookie-based SSR (`@supabase/ssr`)
- Middleware refreshes session cookies on every request
- Protected routes (`/admin`, `/profile`, `/create`) redirect unauthenticated users to `/login`
- API routes that mutate data require authentication
- AI generation routes require authentication

### Style Parameters (Quiz Generation)

The Quiz Studio exposes 6 style controls that shape AI-generated questions:

| Control | Range | Description |
|---------|-------|-------------|
| Abstractness | 0 (concrete) – 100 (abstract) | Scenario framing |
| Seriousness | 0 (casual) – 100 (formal) | Tone and language |
| Goofiness | 0 (normal) – 100 (absurd) | Content playfulness |
| Depth | 0 (surface) – 100 (deep) | Question probing level |
| Poeticness | 0 (plain) – 100 (lyrical) | Language quality |
| Title Relevance | 0 (indirect) – 100 (tight) | Theme binding strength |

Each control uses a 5-band strategy system (very_low/low/mid/high/very_high) that translates numeric values into explicit behavioral instructions for the AI.

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Ensure all environment variables are set in the Vercel project settings.

### Pre-Launch Checklist

See `PRODUCTION_READINESS_AUDIT.md` for the complete pre-launch checklist covering security, performance, SEO, error handling, and observability.

Key items before first production deploy:
- [ ] Rotate all API keys (DeepSeek, Supabase)
- [ ] Verify RLS policies are enabled on all Supabase tables
- [ ] Set up rate limiting for AI generation endpoints
- [ ] Configure `metadataBase` URL in `app/layout.tsx`
- [ ] Update `robots.ts` and `sitemap.ts` with your production domain
- [ ] Set up error tracking (e.g., Sentry)

## License

Private — all rights reserved.
