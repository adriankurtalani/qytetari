# Zëri i Qytetarit

Platforma digjitale për raportim, dokumentim dhe ndjekje të problemeve në jetën e përditshme në Kosovë.

## Tech Stack

- **Frontend:** Next.js 16, TypeScript, TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Maps:** OpenStreetMap (Leaflet)
- **AI Moderation:** OpenAI API (optional)
- **Hosting:** Vercel (recommended)

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase URL, anon key, and service role key from the Supabase dashboard.

### 3. Supabase database

Run **all** migrations in order via Supabase **SQL Editor**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_fix_user_creation.sql`
3. `supabase/migrations/003_storage_policies.sql`
4. `supabase/migrations/004_add_profile_email.sql`
5. `supabase/migrations/005_site_settings.sql`

### 4. Supabase Storage

Create a **public** bucket named `report-photos` in Supabase Storage.

### 5. Create an admin user

Register on the app, then in Supabase SQL Editor:

```sql
UPDATE profiles
SET role = 'admin', is_verified = true
WHERE email = 'your@email.com';
```

### 6. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial MVP — citizen reporting platform"
git remote add origin https://github.com/YOUR_USERNAME/qytetari.git
git push -u origin master
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variables (same as `.env.local.example`):

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only, never expose to client |
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel URL, e.g. `https://qytetari.vercel.app` |
| `OPENAI_API_KEY` | No | Enables AI moderation suggestions |

5. Deploy

### 3. Supabase Auth redirects

In Supabase → **Authentication** → **URL Configuration**, set:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add `https://your-app.vercel.app/**`

### 4. Promote admin (production)

Run the admin SQL update against your production Supabase project.

## Features

- Authentication (register, login, password reset, email verification)
- User profiles with anonymous mode
- Report submission with photos + GPS location
- Complaint feed with filters and voting
- Interactive map with cluster markers
- Admin panel (moderation, users, banned words, site settings CMS)
- Business dashboard
- AI moderation hooks + IP ban system
- In-app notifications

## Project Structure

```
src/
├── app/           # Pages & API routes
├── components/    # UI, layout, maps, reports
└── lib/           # Supabase clients, types, utilities
supabase/
└── migrations/    # Database schema (run in order)
```

## License

Private — all rights reserved.
