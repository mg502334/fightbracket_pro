Contributing to FightBracket Pro
⚠️ Important Notice: Restricted Contributions
FightBracket Pro is a mostly private project.
Contributions are limited to approved collaborators only.
This repository is not open for public pull requests or unsolicited changes.

If you are not an approved contributor, please do not submit issues, PRs, or forks.

🧱 Project Overview
FightBracket Pro is a competitive gaming platform built with:

Next.js (App Router)

Supabase (Auth, Database, Storage)

Custom FB Identifier System

Admin API backend

Unified user view (full_user)

Audit logging

Because this project handles authentication, identity, and admin‑level operations, stability and security are top priorities.

🚀 Getting Started (Approved Contributors Only)
1. Clone the repository
Code
git clone https://github.com/mg502334/fightbracket_pro.git
2. Install dependencies
Code
npm install
3. Environment variables
Create .env.local:

Code
NEXT_PUBLIC_SUPABASE_URL=<your-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
⚠️ Never commit .env.local or any secrets.

🌿 Branching Rules
Only approved contributors may create branches.

Use the following naming conventions:

Type	Example
Feature	feature/admin-dashboard
Fix	fix/profile-trigger
Docs	docs/update-readme
Refactor	refactor/api-users


All branches must start from main.

🔐 Security Requirements
These rules are mandatory:

✔ Never expose the Supabase Service Role Key
It must only be used in:

Server components

API routes

Server actions

✔ Do not bypass RLS
All database operations must respect Supabase Row Level Security.

✔ Do not modify identity triggers without approval
Critical functions:

handle_new_user_identifier

handle_new_user_profile

generate_unique_fb_id

✔ Audit logs must remain intact
audit_log_entries is part of the admin security model.

🧪 Development Guidelines
✔ Use TypeScript everywhere
✔ Keep admin routes server‑only
✔ Follow Next.js App Router conventions
✔ Keep code clean and maintainable
✔ Document any schema changes
🗄 Database Changes
If you modify the database:

Add SQL migrations under /supabase/migrations

Update /supabase/README.md

Ensure triggers still work

Update the unified view (full_user) if needed

🧪 Testing Before PR
Approved contributors must test:

User signup flow

Identifier generation

Profile creation

Admin API routes

Admin dashboard pages

Audit logging

📬 Submitting a Pull Request (Restricted)
Only approved contributors may submit PRs.

PR requirements:

Clear summary of changes

Screenshots (if UI changes)

Database migration notes (if applicable)

No secrets committed

No breaking changes without discussion

All PRs require review and approval before merging.

🤝 Code of Conduct
Be respectful

Communicate clearly

Keep security in mind

Maintain project stability

🏁 Final Notes
This project is not open for public contribution.
If you are not an approved collaborator, please refrain from submitting PRs or issues.

If you need access or want to request contributor status, contact the project owner directly.
