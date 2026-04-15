# VibeSpark — Setup Guide

## 1. Supabase Project Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Environment Variables

```bash
cp .env.example .env.local
# Fill in the values from Supabase
```

## 3. Run Database Migrations

In the Supabase dashboard → **SQL Editor**, run these files in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_views_and_storage.sql`

## 4. Run Seed Data

1. Create your admin account by signing up on the site
2. Find your user UUID in Supabase → **Authentication → Users**
3. Edit `supabase/seed.sql` and replace `YOUR_ADMIN_USER_ID` with your UUID
4. Run the seed file in the SQL Editor

## 5. Create Storage Buckets

In Supabase → **Storage**, create these buckets:
- `startup-logos` (public)
- `startup-screenshots` (public)
- `avatars` (public)

## 6. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
4. In Supabase → **Authentication → Providers**, enable Google and add client ID/secret

### 6a. Localhost vs production (same Supabase project)

You do **not** need a separate Supabase project for local dev. Supabase will send the browser back to whatever `redirectTo` the app sends **only if** that URL is allowlisted.

1. In Supabase → **Authentication → URL Configuration**
2. Under **Redirect URLs**, add (adjust port if needed):
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3000/**`
3. Add your production site too, e.g. `https://yourdomain.com/**`
4. **Site URL** is the default when a redirect is invalid or missing — set it to your primary production URL, but the entries above are what allow localhost to work.

If localhost is missing, Supabase often falls back to **Site URL** and you land on production after login.

## 7. Set Admin Role

After creating your account, run this in the SQL Editor:
```sql
insert into user_roles (user_id, role)
values ('YOUR_USER_ID', 'admin')
on conflict (user_id, role) do nothing;
```

## 8. Run Locally

```bash
npm run dev
# Opens at http://localhost:3000
```

## 9. Deploy to Vercel

```bash
npx vercel
# Set environment variables in Vercel dashboard
# Add NEXT_PUBLIC_APP_URL=https://vibespark.co
```

## File Structure

```
vibespark/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Sign in / Sign up
│   ├── dashboard/
│   │   ├── admin/          # Admin panel
│   │   ├── startup/        # Startup owner dashboard
│   │   └── user/           # Community user dashboard
│   ├── directory/          # Startup directory
│   ├── research-lab/       # Research Lab
│   ├── startups/[slug]/    # Startup profile pages
│   ├── submit/             # Submit a startup
│   ├── trending/           # Trending startups
│   ├── claim/[slug]/       # Claim a startup
│   └── onboarding/         # Post-signup flow
├── components/
│   ├── layout/             # Navbar, Footer
│   ├── startup/            # StartupCard, CommentsSection, etc.
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/           # Client, server, middleware helpers
│   ├── validations/        # Zod schemas for all forms
│   └── utils/              # Signal score calc, date helpers
└── supabase/
    ├── migrations/         # SQL schema files
    └── seed.sql            # Seed data
```
