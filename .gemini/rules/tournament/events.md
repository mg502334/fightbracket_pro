# Rule: Tournament & Event Bracket Access and Admin Permissions

Under Tournament and Event management in FightBracket Pro, the following access rules, lifecycle conditions, and administrative permission boundaries are strictly enforced:

---

## 1. Visitor & Non-Admin Bracket Access ("Awaiting Start")

When a visitor, spectator, player, or non-admin user clicks or navigates to a link for a tournament/event bracket (via direct URL, public event page, subdomain link, or shared bracket link):

- **Bracket Not Started Status**:
  - If the bracket has **not been started** yet (i.e. status is `pending`, `upcoming`, `not_started`, or `isTournamentStarted === false`):
    - Visitors **MUST** receive an **"Awaiting Start"** message / state (e.g., *"Bracket Awaiting Start — The event admin has not started this bracket yet. Please check back when the tournament begins."*).
    - Visitors and non-admins must **NEVER** be shown an active, editable, or runnable bracket view prior to the official tournament start.
- **Bracket Live / Started Status**:
  - Once the event admin has officially started the bracket, visitors and players may view the live bracket in **read-only** mode (displaying current standings, progression, match calls, and station assignments) without any editing capabilities.

---

## 2. Strict Event Admin Exclusivity

Event Admins are the **ONLY** authorized individuals who can run, manage, or modify tournament brackets:

- **Only Event Admins Can Run or Start the Bracket**:
  - Only authenticated Event Admins (organizers / tournament directors with verified admin permissions for that specific event) have the authority to click "Start Tournament", lock seeds, or initialize tournament progression.
  - Visitors, non-admin participants, and regular users are strictly blocked from starting, running, or simulating bracket progression.
- **Only Event Admins Can Change or Modify the Bracket**:
  - Any mutation to the bracket structure, seeding, matchups, scores, stations, or match outcomes is **strictly restricted to Event Admins**.
  - Non-admins cannot:
    - Advance matches or submit winning scores.
    - Drag-and-drop or swap competitor seeds.
    - Call or reassign matches to stations.
    - Disqualify (DQ) players or issue match forfeits.
    - Restart, reset, or wipe tournament brackets.

---

## 3. Customizable Buttons & Controls Policy

All customizable buttons, action toggles, and administrative configuration tools are **ONLY enabled for Event Admins**:

- **Admin-Only Enabled Buttons**:
  - `Start Tournament` / `Lock Seeds`
  - `Restart Tournament` / `Reset Bracket`
  - `Report Score` / `Advance Match` / `Declare Winner`
  - `Call Match` / `Assign Station` / `Stream Setup`
  - `Disqualify (DQ)` / `Forfeit`
  - `Shuffle Seeds` / `Manual Seed Swap` / `Re-order Competitors`
  - `Add Competitor` / `Remove Competitor`
  - `Bracket Settings` / `Ruleset Customization` / `Format Toggles` (e.g. Best of 3 vs Best of 5, Single/Double Elim, Swiss)
  - `Sync / Import External Event` (e.g. Start.gg synchronization)
- **Non-Admin View Constraints**:
  - For visitors and non-admin participants, all customizable buttons and management triggers must be **completely disabled, hidden, or omitted** from the UI.
  - The interface must enforce a strict read-only spectator experience.
