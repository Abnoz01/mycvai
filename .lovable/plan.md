# CV Matching Platform — Full Build Plan

A trilingual (AR/EN/FR), light/dark, ClickUp-inspired recruitment platform with AI CV tools, job matching, and dual employee/recruiter spaces, fully wired to Supabase.

---

## 1. Design System (ClickUp-inspired)

- Palette: deep indigo/violet primary (`oklch(0.55 0.22 280)`), electric pink accent, neutral slate surfaces, success green, warning amber. Light + dark variants in `src/styles.css`.
- Typography: Inter (body) + Space Grotesk (headings).
- Tokens: rounded-xl cards, soft shadows, gradient hero, glass top bar.
- Components: shadcn/ui (button, card, dialog, dropdown, tabs, table, badge, sheet, sonner, form, input, select, switch).
- Theme provider (light/dark) + Language provider (AR/EN/FR with RTL for AR) using `i18next` + `react-i18next`.

## 2. Routing (TanStack Start)

```
/                       Landing (CD-01)
/login                  Sign in (employee or recruiter)
/signup/employee        CD-02
/signup/recruiter       CD-03
/faq
/contact
/_authenticated/employee/
   ├── space            My Space (CV upload + AI tools + stats)
   ├── jobs             Job offers + apply
   └── tracking         Applications dashboard
/_authenticated/recruiter/
   ├── dashboard        KPIs + my offers + applicants
   ├── publish          New job offer
   ├── candidates       Search candidates
   └── talents          AI talent matching
```

Auth guard via `_authenticated` layout + role check (redirect to correct space).

## 3. Database (Supabase)

Tables:
- `profiles` (id→auth.users, full_name, avatar_url, locale, theme)
- `user_roles` (user_id, role enum: `employee` | `recruiter` | `admin`) + `has_role()` security definer
- `employee_profiles` (user_id, age, location, experience_years, desired_salary, cv_url, cv_text, cv_score, profile_views)
- `companies` (id, owner_id, name, logo_url, description)
- `job_offers` (id, company_id, title, description, skills[], contract_type, location, salary, expires_at, easy_apply, views, status)
- `applications` (id, job_id, employee_id, match_percent, status: `pending|interview|accepted|rejected`, created_at)
- `invitations` (recruiter_id, employee_id, job_id, message, status)
- `reviews` (user_id, rating, comment, job_title) — for landing testimonials
- `contact_messages` (name, email, subject, message)

Storage buckets: `cvs` (private, owner-read), `avatars` (public), `logos` (public).

RLS: each table scoped by `auth.uid()` + `has_role()`. Recruiters see applications to their offers; employees see their own.

## 4. Server Functions (`createServerFn`)

- `uploadCv`, `parseCvText`
- `aiCorrectCv` (grammar/spacing) → Lovable AI Gateway
- `aiTranslateCv` (FR↔EN) → Lovable AI Gateway
- `aiMatchCvToJob` (returns 0–100) — used on apply + listing
- `aiFindTalents(jobId)` — ranks employees for recruiter
- `publishOffer`, `applyToOffer`, `updateApplicationStatus`
- `getEmployeeStats`, `getRecruiterDashboard`

All protected with `requireSupabaseAuth`. AI calls use `LOVABLE_API_KEY` (already set).

## 5. Pages — Detail

**Landing (CD-01):** glass top bar (lang switcher, theme toggle, employee/employer dropdown, login), hero with title + stats (offers count, match accuracy, 24/7), CTAs, "How it works" 3-step flow, 3 review cards, top company logos, FAQ accordion, contact form + info, footer.

**Auth:** email + password, role selected by route, email confirm redirect to `window.location.origin`.

**Employee Space (3 tabs):**
- *Mon espace*: CV upload (PDF/DOC/DOCX), profile form, "AI Correction CV" button → modal with Edit / AI Tools (Translate, Fix grammar) + live preview + download buttons; KPI tiles (applications, interactions, profile score, views).
- *Offres*: search bar, offer cards (type, easy-apply tag, location, salary, date, match %) + Apply button.
- *Suivi*: status dashboard (pending/interview/accepted/rejected) + open offers list with state.

**Recruiter Space (4 tabs):**
- *Dashboard*: KPI bar (active offers, total candidates, total views, interaction %); my offers table with Voir → details + applicants drawer (name, title, match %, Voir CV modal).
- *Publier*: full job form + easy-apply checkbox.
- *Candidats*: search + list (name, role, location, skills, match %) + Voir CV.
- *Talents*: AI search bar "Find best candidates" + Invite button.

## 6. AI Integration

Single edge-safe server fn calling Lovable AI Gateway (`google/gemini-2.5-flash`) for: CV correction, translation, CV↔offer match scoring, talent ranking. Match % cached on `applications` row.

## 7. Build Order

1. Migration: enums, tables, RLS, storage buckets, trigger to auto-create profile + role.
2. Design tokens + theme/lang providers + top bar + footer.
3. Landing page + FAQ + contact.
4. Auth pages (employee/recruiter signup, shared login) + role redirect.
5. Employee space (3 tabs) + CV upload + AI modal.
6. Recruiter space (4 tabs) + publish + applicants drawer.
7. AI server functions + matching.
8. Polish: animations, empty states, toasts, RTL check.

## 8. Test Credentials (seeded after build)

I will create these via Supabase after the schema is live and share them in chat:
- Employee: `employee@demo.app` / `Demo1234!`
- Recruiter: `recruiter@demo.app` / `Demo1234!`
- Admin: `admin@demo.app` / `Demo1234!`

(Email confirmation will be disabled for demo so they work immediately.)

---

## Technical Notes

- Stack: TanStack Start + Supabase (already connected) + shadcn/ui + Tailwind v4 + i18next + Lovable AI Gateway.
- No edge functions; all backend logic via `createServerFn`.
- RLS on every table; roles in dedicated `user_roles` table with `has_role()` SECURITY DEFINER to avoid recursion.
- CV files stored in private `cvs` bucket, signed URLs for recruiter viewing only when application exists.
- Match % computed at apply time and refreshed on demand.

Approve this plan and I'll start with the database migration, then build the UI top-to-bottom.