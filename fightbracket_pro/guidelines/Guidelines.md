# FightBracket Pro Guidelines & Rules

## Account Creation Rules (Mandatory)
During new account creation/registration, the following field rules must always be enforced across the UI, validation, and backend:

1. **Usertag / Gamer Tag (Required)**:
   - Required and absolutely must be entered by the user.
   - Cannot be optional or empty.

2. **First Name (Required)**:
   - Required and absolutely must be entered by the user.

3. **Last Name (Required)**:
   - Required and absolutely must be entered by the user.

4. **Birthday (Optional, Year is kept private)**:
   - Optional for the user to provide.
   - Privacy Rule: Year is strictly kept private and must not be exposed to other users or on public profile views (only Month and Day are displayed publicly).

5. **Email Address (Required by Supabase)**:
   - Required by Supabase for authentication, session management, and account recovery.

## Event Creation Rules ("CREATE EVENT")
1. **Account Required Before Event Creation**:
   - A user **must have an account first** in order to create or host an event.
   - Any attempt to click `+ CREATE EVENT`, host a tournament, or access the event creation flow without being logged in must prompt the user to log in or register.
   - Backend creation endpoints require an authenticated user ID.

## Bracket Import & Public Link Access Rules
1. **Public Import (No Account Required)**:
   - Users and visitors can import a bracket or live bracket (e.g., from Start.gg or via `IMPORT LIVE`) **without requiring an account**.
2. **Direct Link Access (No Account Required)**:
   - Clicking any link to the site (such as `/t/:subdomain`, `/t/:slug`, `/m/:matchId`, `?event=:slug`, or public directory links) must load and display the bracket or live bracket **without requiring an account**.
   - Public event details, matches, and bracket layouts remain accessible to unauthenticated viewers.

## Demo Bracket Trial Rules
1. **No Account Required**:
   - The Demo Bracket Trial **does not require an account**.
   - Users can test tournament features (generating brackets, match calling, station assignment, score reporting) completely free of login or registration gates.
2. **No Event Created**:
   - The Demo Bracket Trial **does not create a new event**.
   - Demo trials run strictly as a local, client-side sandbox. They do not persist to the community events database, do not publish public subdomains, and do not broadcast remote event syncs.
