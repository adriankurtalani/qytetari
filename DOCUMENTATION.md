# Zëri i Qytetarit — Project Documentation

**Last updated:** June 15, 2026  
**Repository:** [github.com/adriankurtalani/qytetari](https://github.com/adriankurtalani/qytetari)  
**Branch:** `master`

---

## Table of Contents

1. [Vision & Purpose](#1-vision--purpose)
2. [Current Status](#2-current-status)
3. [Tech Stack](#3-tech-stack)
4. [Git History](#4-git-history)
5. [Architecture Overview](#5-architecture-overview)
6. [Database Schema & Migrations](#6-database-schema--migrations)
7. [Features Implemented](#7-features-implemented)
8. [Pages & Routes](#8-pages--routes)
9. [API Reference](#9-api-reference)
10. [Project Structure](#10-project-structure)
11. [Environment Variables](#11-environment-variables)
12. [Issues Fixed During Development](#12-issues-fixed-during-development)
13. [Deployment Guide](#13-deployment-guide)
14. [Gaps vs. Product Requirements](#14-gaps-vs-product-requirements)
15. [Next Steps & Commands](#15-next-steps--commands)

---

## 1. Vision & Purpose

**Zëri i Qytetarit** is a digital citizen reporting platform for Kosovo. Citizens can report, document, and track everyday problems (infrastructure, services, businesses, institutions) with photos and GPS location. The platform aims to create transparency between citizens, businesses, and public institutions — framed as a modern problem-reporting system, not a complaint board.

**Target users:**
- **Citizens** — submit reports, vote, comment (when verified), track status
- **Businesses** — respond to reports, manage reputation
- **Municipalities** — manage cases and statuses (role exists in schema)
- **Admins** — moderate content, manage users, configure site branding

Full product requirements live in [`project-requirements.md`](./project-requirements.md).

---

## 2. Current Status

| Area | Status |
|------|--------|
| Local development | Working (`npm run dev`) |
| Production build | Working (`npm run build` passes) |
| GitHub | Pushed to `master` (3 commits) |
| Vercel deployment | Build fix pushed (`4a35f51`); redeploy should succeed if env vars are set |
| Supabase migrations | 5 SQL files ready; **must be run manually** in Supabase SQL Editor |
| Storage bucket | Must be created manually: `report-photos` (public) |
| Admin user | Must be promoted manually via SQL |
| Site settings CMS | Requires migration `005_site_settings.sql` |

---

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, TailwindCSS 4, Lucide icons |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Maps | Leaflet + OpenStreetMap tiles + marker clustering |
| AI (optional) | OpenAI GPT-4o-mini for content moderation |
| Validation | Zod |
| Hosting | Vercel (recommended) |

---

## 4. Git History

```
4a35f51  Fix Vercel build by adding Leaflet TypeScript types.
4f371b6  Add Zëri i Qytetarit MVP — citizen reporting platform for Kosovo.
58adfe4  Initial commit from Create Next App
```

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (Next.js)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Pages     │  │  API Routes  │  │   Middleware     │  │
│  │  (App Router)│  │  (server)    │  │  Auth + CSP      │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │  Supabase Clients     │                       │
│              │  client / server /    │                       │
│              │  admin (service role) │                       │
│              └───────────┬───────────┘                       │
└──────────────────────────┼───────────────────────────────────┘
                           ▼
              ┌────────────────────────┐
              │       Supabase         │
              │  PostgreSQL + Auth     │
              │  Storage + RLS         │
              └────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        OpenStreetMap              OpenAI API
        (map tiles)                (optional moderation)
```

**Key patterns:**
- **Server components** for data fetching where possible; client components for maps, forms, interactivity
- **Service role client** (`createServiceClient`) for admin operations, uploads, IP bans
- **Row Level Security (RLS)** on all tables; policies defined in migrations
- **Site settings** loaded via `SiteSettingsProvider` with DB + hardcoded fallbacks
- **CSP headers** set in middleware (`src/lib/csp.ts`) — `unsafe-eval` only in development

---

## 6. Database Schema & Migrations

Run **in order** via Supabase → SQL Editor:

### `001_initial_schema.sql`
Creates the full MVP schema:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends `auth.users`) |
| `categories` | Report categories (5 defaults seeded) |
| `businesses` | Business profiles with subscription tiers |
| `reports` | Citizen reports with GPS, status, AI fields |
| `report_photos` | Photo metadata linked to reports |
| `votes` | Support / disagree votes (logged-in or anonymous) |
| `comments` | Threaded comments (verified users only) |
| `business_responses` | Business replies to reports |
| `notifications` | In-app notification records |
| `ip_bans` | Temporary (24h) and permanent IP bans |
| `banned_words` | Admin-managed word blocklist |

**Enums:** `user_role`, `report_status`, `vote_type`, `ban_type`, `subscription_tier`, `notification_type`

**Triggers:**
- Auto-create profile on signup (`handle_new_user`)
- Vote count sync on `votes` table
- Comment count sync on `comments` table
- `updated_at` auto-update on key tables

**Default categories:**
1. Ushqim & Restorante
2. Ndërtim & Pasuri të Paluajtshme
3. Infrastrukturë Publike
4. Shërbime
5. Institucione Publike

### `002_fix_user_creation.sql`
Fixes **"Database error creating new user"** during signup:
- Recreates `handle_new_user()` trigger with `SECURITY DEFINER`
- Grants `supabase_auth_admin` permissions on `profiles`
- Relaxes RLS insert policy for profile creation

### `003_storage_policies.sql`
Fixes **photo upload RLS errors** for bucket `report-photos`:
- Public INSERT/SELECT policies
- Service role full access
- Authenticated UPDATE/DELETE

> **Manual step:** Create bucket `report-photos` as **public** in Supabase Storage before or after this migration.

### `004_add_profile_email.sql`
- Adds `email` column to `profiles`
- Backfills from `auth.users`
- Updates signup trigger to persist email and better default names

### `005_site_settings.sql`
- Creates singleton `site_settings` table (`id = 1`)
- Stores platform branding: name, logo, favicon, hero, footer, mission
- Public read RLS; admin-only update

---

## 7. Features Implemented

### 7.1 Authentication
| Feature | Route | Notes |
|---------|-------|-------|
| Register | `/auth/register` | Creates Supabase user + profile via trigger |
| Login | `/auth/login` | Email/password |
| Logout | Navbar | Clears session |
| Password reset | `/auth/reset-password` | Email link flow |
| Update password | `/auth/update-password` | After reset link |
| Email verification | `/auth/verify` | Post-registration confirmation |

Session management via `@supabase/ssr` in middleware (`src/middleware.ts`).

### 7.2 User Profiles
| Feature | Route | Notes |
|---------|-------|-------|
| View/edit profile | `/profile` | Name, username, city, photo |
| Anonymous mode toggle | `/profile` | Hides identity on new reports |
| Role-based access | — | `citizen`, `business`, `municipality`, `admin` |

### 7.3 Report Submission
| Feature | Route | Notes |
|---------|-------|-------|
| New report form | `/reports/new` | Title, description, category, city, business name (optional) |
| Photo upload | `/api/upload` | Up to 6 photos, max 5 MB each; **required** |
| GPS / map picker | `LocationPicker` component | Browser geolocation + draggable pin; city-based fallback coordinates |
| Moderation message | After submit | User sees 10–20 min review notice |
| AI pre-check | On submit | Banned words + optional OpenAI review |
| IP ban on violation | On flagged submit | 24h temporary, permanent on repeat |

### 7.4 Complaint Feed & Detail
| Feature | Route | Notes |
|---------|-------|-------|
| Homepage feed | `/` | Latest approved reports |
| Filters | Homepage | City, category, status, sort (latest / supported / trending) |
| Report detail | `/reports/[id]` | Full description, photos, map, votes, comments |
| Photo lightbox | Report detail | Gallery with zoom |
| Voting | `VoteButtons` | Support / disagree; one vote per user or anonymous ID |
| Comments | `CommentSection` | Verified logged-in users only; threaded replies |

### 7.5 Map
| Feature | Route | Notes |
|---------|-------|-------|
| Reports map | `/map` | All approved reports on OpenStreetMap |
| Marker clustering | `ReportsMap` | `leaflet.markercluster` |
| Category filter | Map page | Dropdown filter |
| Single report map | Report detail | Pin at report coordinates |
| Kosovo city centers | `CITY_COORDINATES` | 34 cities with lat/lng fallbacks |

### 7.6 Admin Panel
| Feature | Route | Notes |
|---------|-------|-------|
| Dashboard | `/admin` | Stats, pending reports queue, quick actions |
| Report moderation | `/admin` | Approve, reject, change status |
| User management | `/admin/users` | List users, verify, change roles |
| Banned words | `/admin/banned-words` | Add/remove blocked words |
| Site settings CMS | `/admin/settings` | Logo, favicon, hero, footer, SEO text |

Admin routes return 403 and redirect non-admins.

### 7.7 Business Dashboard
| Feature | Route | Notes |
|---------|-------|-------|
| Business home | `/business` | Profile, linked reports, responses |
| Respond to reports | `/business` | Text responses |
| Resolution evidence | Schema ready | `resolution_evidence_url` field exists |

### 7.8 Notifications
| Feature | Route | Notes |
|---------|-------|-------|
| Notification list | `/notifications` | In-app notifications |
| Events | API | Report approved/rejected, new comment, status change, business response |

### 7.9 Site Settings CMS
Configurable without code changes (after migration 005):

| Field | Used in |
|-------|---------|
| `platform_name`, `logo_url`, `logo_abbr` | Navbar, auth pages, `SiteLogo` |
| `favicon_url` | Browser tab (via metadata) |
| `site_title`, `site_description` | `generateMetadata` in layout |
| `hero_*` fields | Homepage hero section |
| `footer_*`, `mission_text` | Footer component |

**Fallback behavior:** If `site_settings` table is missing or empty, hardcoded defaults from `src/lib/site-settings-defaults.ts` are used so the app never blocks on load.

### 7.10 Security & Moderation
- **Content Security Policy** — middleware sets CSP per request
- **IP ban system** — `src/lib/ip-ban.ts`; temporary 24h → permanent escalation
- **Banned words** — checked before AI; triggers IP ban on match
- **AI moderation** — `src/lib/ai-moderation.ts`; graceful fallback when `OPENAI_API_KEY` is unset
- **RLS** — all tables protected; admin policies for moderation tables

### 7.11 UI / UX
- Responsive mobile layout (Navbar hamburger, touch-friendly controls)
- Shared components: `PageHeader`, `Card`, `Button`, `Badge`, `Modal`, `Toast`, `EmptyState`
- Albanian language throughout the UI
- Loading states and error handling on admin/settings pages

---

## 8. Pages & Routes

### Public
| Path | Type | Description |
|------|------|-------------|
| `/` | Dynamic | Homepage with report feed |
| `/map` | Dynamic | Interactive map |
| `/reports/[id]` | Dynamic | Report detail |
| `/reports/new` | Static | New report form |
| `/auth/login` | Static | Login |
| `/auth/register` | Static | Registration |
| `/auth/reset-password` | Static | Request password reset |
| `/auth/update-password` | Static | Set new password |
| `/auth/verify` | Static | Email verification |

### Authenticated
| Path | Description |
|------|-------------|
| `/profile` | User profile |
| `/notifications` | Notification inbox |
| `/business` | Business dashboard |

### Admin only
| Path | Description |
|------|-------------|
| `/admin` | Moderation dashboard |
| `/admin/users` | User management |
| `/admin/banned-words` | Word blocklist |
| `/admin/settings` | Site branding CMS |

---

## 9. API Reference

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/site-settings` | Public site branding (with defaults fallback) |
| `GET` | `/api/reports` | List reports (filtered, paginated) |
| `POST` | `/api/reports` | Submit new report (IP check, AI moderation) |
| `GET` | `/api/reports/[id]` | Single report with relations |
| `POST` | `/api/reports/[id]/vote` | Cast or change vote |
| `GET/POST` | `/api/reports/[id]/comments` | List / add comments |
| `POST` | `/api/upload` | Upload report photo to Supabase Storage |

### Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/PATCH` | `/api/notifications` | List / mark read |
| `GET/POST` | `/api/business` | Business profile & responses |

### Admin only
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET/PATCH` | `/api/admin/reports` | List / moderate reports |
| `GET/PATCH` | `/api/admin/users` | List / update users |
| `GET/POST/DELETE` | `/api/admin/banned-words` | Manage banned words |
| `GET/PATCH` | `/api/admin/site-settings` | Read / update site CMS |

---

## 10. Project Structure

```
qytetari/
├── .env.local.example          # Environment template (safe to commit)
├── DOCUMENTATION.md            # This file
├── README.md                   # Quick start guide
├── project-requirements.md     # Full PRD
├── package.json
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_fix_user_creation.sql
│       ├── 003_storage_policies.sql
│       ├── 004_add_profile_email.sql
│       └── 005_site_settings.sql
└── src/
    ├── middleware.ts           # Auth session refresh + CSP
    ├── app/
    │   ├── layout.tsx          # Root layout, metadata, providers
    │   ├── page.tsx            # Homepage
    │   ├── globals.css
    │   ├── admin/              # Admin panel pages
    │   ├── auth/               # Auth pages
    │   ├── business/           # Business dashboard
    │   ├── map/                # Map page
    │   ├── notifications/      # Notifications
    │   ├── profile/            # User profile
    │   ├── reports/            # Report pages
    │   └── api/                # API route handlers
    ├── components/
    │   ├── layout/             # Navbar, Footer, AuthLayout, SiteLogo
    │   ├── map/                # Leaflet map components
    │   ├── providers/          # SiteSettingsProvider
    │   ├── reports/            # ReportCard, Form, Comments, Votes, Gallery
    │   └── ui/                 # Shared UI primitives
    └── lib/
        ├── ai-moderation.ts    # OpenAI + banned word checks
        ├── constants.ts        # Cities, map defaults, limits
        ├── csp.ts              # Content Security Policy builder
        ├── ip-ban.ts           # IP ban check / create
        ├── map-utils.ts        # Leaflet helpers
        ├── notifications.ts    # Notification helpers
        ├── site-settings.ts    # Fetch/update site settings
        ├── site-settings-defaults.ts
        ├── types.ts            # TypeScript interfaces
        ├── utils.ts            # cn(), dates, getClientIP
        └── supabase/
            ├── client.ts       # Browser client
            ├── server.ts       # Server + service role clients
            └── middleware.ts   # Session refresh helper
```

---

## 11. Environment Variables

Copy `.env.local.example` → `.env.local` for local dev. Set the same values in Vercel for production.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-only; never expose to browser |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `http://localhost:3000` locally; Vercel URL in production |
| `OPENAI_API_KEY` | No | Enables AI moderation; without it, banned-word check + manual review only |

`.env.local` is gitignored. Never commit secrets.

---

## 12. Issues Fixed During Development

| Issue | Root cause | Fix |
|-------|------------|-----|
| User signup fails | Profile trigger / RLS blocking insert | Migration `002_fix_user_creation.sql` |
| Photo upload 400 / RLS | Missing storage policies | Migration `003_storage_policies.sql` + `/api/upload` |
| Admin users show "User" | Email not in profiles | Migration `004_add_profile_email.sql` |
| Map not centering on city | Missing city coordinates | `CITY_COORDINATES` in `constants.ts` |
| Settings page infinite load | `site_settings` table missing | Migration `005` + API/page fallbacks to defaults |
| CSP eval warning in dev | Strict CSP | `unsafe-eval` only in `NODE_ENV=development` |
| Vercel build fails | Missing `@types/leaflet` | Added `@types/leaflet` + `@types/leaflet.markercluster` (commit `4a35f51`) |

---

## 13. Deployment Guide

### Vercel (recommended)

1. Import repo from GitHub at [vercel.com/new](https://vercel.com/new)
2. Framework: Next.js (auto-detected)
3. Add all environment variables (see §11)
4. Deploy — should succeed after commit `4a35f51`

### Supabase Auth (production)

In Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/**`

### Post-deploy checklist

- [ ] All 5 migrations run on production Supabase
- [ ] `report-photos` bucket exists and is public
- [ ] Storage policies from `003` applied
- [ ] Vercel env vars set
- [ ] `NEXT_PUBLIC_APP_URL` matches Vercel domain
- [ ] Admin user promoted via SQL
- [ ] Test: register, login, submit report, admin approve, map view

---

## 14. Gaps vs. Product Requirements

Features from the PRD that are **partially implemented** or **not yet built**:

| PRD Feature | Status |
|-------------|--------|
| Anonymous reporting without account | Partial — anonymous ID for votes; reports still need photos/GPS |
| Municipality dashboard | Role exists in DB; no dedicated `/municipality` UI |
| Category management in admin | Read-only; no admin UI to add/edit categories |
| Business verification flow | Schema exists; manual verification only |
| Business premium / subscriptions | Schema (`subscription_tier`); no payment integration |
| Public statistics page | Admin stats only; no public-facing analytics |
| Business reputation score | Field exists; not calculated dynamically |
| Duplicate report detection | AI field exists; logic is basic |
| Email notifications | In-app only; no email channel |
| Mobile apps (iOS/Android) | Future — not started |
| Monetization (Stripe, etc.) | Future — not started |

---

## 15. Next Steps & Commands

Use this as your review checklist. Run commands in order for a fresh production setup.

### A. Verify local build still works

```bash
cd c:\Users\MSI\Desktop\qytetari
npm install
npm run build
npm run dev
```

Open http://localhost:3000

### B. Supabase — run all migrations (if not done yet)

In Supabase Dashboard → **SQL Editor**, run each file **in order**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_fix_user_creation.sql`
3. `supabase/migrations/003_storage_policies.sql`
4. `supabase/migrations/004_add_profile_email.sql`
5. `supabase/migrations/005_site_settings.sql`

### C. Supabase — create storage bucket

1. Supabase → **Storage** → **New bucket**
2. Name: `report-photos`
3. **Public bucket:** ON
4. Confirm storage policies from `003` are applied (re-run `003` if bucket was created after it)

### D. Supabase — configure auth URLs (production)

Set Site URL and Redirect URLs to your Vercel domain (see §13).

### E. Local environment

```bash
cp .env.local.example .env.local
```

Fill in Supabase URL, anon key, service role key, and `NEXT_PUBLIC_APP_URL`.

### F. Create admin user

1. Register on the app with your email
2. In Supabase SQL Editor:

```sql
UPDATE profiles
SET role = 'admin', is_verified = true
WHERE email = 'your@email.com';
```

### G. Vercel deployment

If not yet deployed:

1. Go to [vercel.com/new](https://vercel.com/new) → import `adriankurtalani/qytetari`
2. Add environment variables (same as `.env.local`)
3. Deploy

If already deployed but failed — trigger redeploy after `4a35f51` is on `master`:

```bash
git pull origin master
```

Then in Vercel dashboard → **Deployments** → **Redeploy** (or push any new commit).

**Required Vercel env vars:**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
OPENAI_API_KEY          # optional
```

### H. Post-deploy smoke test

1. Homepage loads with feed
2. Register / login works
3. Submit report with photo + GPS
4. Admin panel shows pending report
5. Approve report → appears on feed and map
6. Admin settings page loads and saves branding
7. Vote and comment (as verified user) work

### I. Recommended next development tasks

Priority order based on PRD gaps:

1. **Confirm Vercel deploy is live** and all env vars correct
2. **Run migration 005** if admin settings still shows migration banner
3. **Municipality dashboard** — UI for `municipality` role to update report statuses
4. **Admin category management** — CRUD for categories
5. **Business verification workflow** — request/approve verified badge
6. **Public statistics page** — city/issue/resolution charts
7. **Email notifications** — Supabase Auth emails + transactional for report events
8. **Anonymous report flow** — submit without account (PRD future feature)
9. **Payment integration** — Stripe for business subscriptions
10. **Custom domain** — connect domain in Vercel + update Supabase auth URLs

### J. Useful SQL snippets

**Check migration 005 applied:**
```sql
SELECT * FROM site_settings WHERE id = 1;
```

**List pending reports:**
```sql
SELECT id, title, status, created_at FROM reports WHERE status = 'pending_review' ORDER BY created_at DESC;
```

**Promote user to business role:**
```sql
UPDATE profiles SET role = 'business', is_verified = true WHERE email = 'business@email.com';
```

**View IP bans:**
```sql
SELECT * FROM ip_bans ORDER BY created_at DESC;
```

---

## Quick Reference

| Task | Command / Location |
|------|-------------------|
| Install deps | `npm install` |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |
| Env template | `.env.local.example` |
| DB migrations | `supabase/migrations/001` → `005` |
| PRD | `project-requirements.md` |
| Quick start | `README.md` |

---

*This document reflects the codebase as of commit `4a35f51`. Update it when major features or migrations are added.*
