## Goal
Make the **Admin** role fully functional with its own protected workspace, navigation, and management features.

## Current state
- Admin user exists (`admin@demo.app`) with role `admin` in `user_roles`.
- `has_role()` and `get_user_role()` DB functions already work.
- Login currently redirects admin to `/employee/space` (wrong) — there is no admin route at all.

## Changes

### 1. Routing
- Add layout `src/routes/_authenticated/admin.tsx` (sidebar + Outlet, ClickUp-style).
- Add admin pages:
  - `admin.dashboard.tsx` — KPIs (total users, recruiters, employees, offers, applications, contact messages) + recent activity charts.
  - `admin.users.tsx` — list all users with role, search, change role, delete account.
  - `admin.offers.tsx` — list all job offers, force-close / delete, view recruiter.
  - `admin.companies.tsx` — list companies, edit/delete.
  - `admin.messages.tsx` — read contact form submissions (already RLS-protected to admin).
  - `admin.reviews.tsx` — moderate reviews (delete inappropriate ones).
- Update `_authenticated.tsx` to allow admin through.
- Update `login.tsx` redirect: `admin → /admin/dashboard`.
- Add admin guard inside the admin layout (redirect non-admins).

### 2. Backend (server functions, admin-only)
Create `src/lib/admin.functions.ts` using `supabaseAdmin` + a `requireAdmin` middleware (wraps `requireSupabaseAuth` and checks `has_role`):
- `adminListUsers` — joins `auth.users` + `profiles` + `user_roles`.
- `adminUpdateUserRole(userId, role)`.
- `adminDeleteUser(userId)` — cascades.
- `adminGetStats` — counts across tables.
- `adminDeleteOffer(id)`, `adminDeleteReview(id)`, `adminDeleteCompany(id)`.

### 3. RLS migration (small additions)
- Add admin DELETE policies on `job_offers`, `companies`, `reviews`, `applications` so admin tools work via the user-context client too (defensive; admin server fns use service role).
- Add admin SELECT/UPDATE/DELETE policy on `user_roles` (already partly there).

### 4. UI (ClickUp-inspired)
- Reuse existing design tokens / gradients.
- Sidebar with sections: Dashboard, Users, Offers, Companies, Messages, Reviews.
- Tables with search, badges for roles/status, inline actions, confirm dialogs.
- KPI cards + simple charts (recharts already available via shadcn).

### 5. i18n
- Add `admin.*` keys in FR / EN / AR for nav + page titles.

### 6. TopBar
- Show "Admin" label + admin avatar menu when role === admin.

## Out of scope
- No new auth method, no signup for admin (admins are seeded / promoted by another admin).
- No edits to employee/recruiter flows beyond the login redirect.

## Result
Logging in as `admin@demo.app / Demo1234!` lands on `/admin/dashboard` with full management of users, offers, companies, messages, and reviews.