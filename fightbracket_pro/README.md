
  # fightbracket_pro

  This is a code bundle for fightbracket_pro. The original project is available at https://www.figma.com/design/9cYiGIl3UHLzNtd9zUYVXy/fightbracket_pro.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  Overview
FightBracket Pro is a competitive gaming platform built with Next.js, Supabase, and a custom FB Identifier System designed to provide secure authentication, player identity management, and a full administrative backend.

This repository contains:

The FightBracket Pro web application

Supabase integration (auth, profiles, identifiers, audit logs)

Admin API routes

Unified user view

Database triggers and functions

Admin dashboard utilities

🚀 Tech Stack
Frontend / Backend
Next.js 14+ (App Router)

React

TypeScript

Database / Auth
Supabase

auth.users

fb_identifiers

user_profiles

audit_log_entries

full_user (view)

Admin
Server‑side API routes using Supabase Service Role Key

Admin dashboard pages consuming /api/admin/*

📂 Project Structure
Code
fightbracket_pro/
  app/
    api/
      admin/
        users/
          route.ts
        users/[id]/
          route.ts
        users/search/
          route.ts
        stats/
          route.ts
        logs/
          route.ts
        logs/[user_id]/
          route.ts
  supabase/
    migrations/
    functions/
  components/
  lib/
  public/
🔐 Authentication & Identity System
FightBracket Pro uses a three‑layer identity model:

1. Supabase Auth
Handles:

Email login

Password reset

Session management

2. FB Identifiers (fb_identifiers)
Automatically generated unique IDs:

Code
FB-XXXX-YYYY
Created via trigger:

handle_new_user_identifier()

3. User Profiles (user_profiles)
Stores:

first_name

last_name

gamer_tag

Created via trigger:

handle_new_user_profile()

🗄 Database Schema
Tables
auth.users

fb_identifiers

user_profiles

audit_log_entries

Unified View
full_user combines all user data:

sql
CREATE OR REPLACE VIEW public.full_user AS
SELECT
    au.id,
    au.email,
    fi.unique_id,
    up.first_name,
    up.last_name,
    up.gamer_tag,
    au.created_at
FROM auth.users au
LEFT JOIN public.fb_identifiers fi ON fi.user_id = au.id
LEFT JOIN public.user_profiles up ON up.id = au.id;
🛠 Admin API Routes
All admin routes live under:

Code
/api/admin
Available Endpoints
Route	Description
/api/admin/users	Get all users
/api/admin/users/search	Search users
/api/admin/users/[id]	Get single user
/api/admin/stats	System metrics
/api/admin/logs	All audit logs
/api/admin/logs/[user_id]	Logs for a specific user


These routes use the Supabase Service Role Key and must run server‑side only.

📊 Admin Dashboard
The admin dashboard consumes the API routes above to provide:

User management

Search

Activity logs

System metrics

Duplicate detection

Profile + identifier validation

🧪 Development
Install dependencies
Code
npm install
Run locally
Code
npm run dev
Environment variables
Create .env.local:

Code
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
📦 Deployment
FightBracket Pro can be deployed to:

Vercel

Supabase Edge Functions (optional)

Any Node‑compatible hosting

Ensure environment variables are configured in production.

🤝 Contributing
Fork the repository

Create a feature branch

Commit changes

Submit a pull request

Please ensure:

Code is typed (TypeScript)

Admin routes remain server‑only

No service role keys appear in client code

🛡 Security Notes
Admin API uses Service Role Key — never expose it client‑side

RLS is enabled on all user tables

Identifiers and profiles are created via secure triggers

Audit logs track admin‑level actions

📄 License
This project is proprietary and not licensed for public redistribution.
