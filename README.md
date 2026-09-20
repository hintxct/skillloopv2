# SkillLoop · desktop web application

A desktop-first browser-based skill exchange prototype: teach, learn, trade skills, or book mentorship using fictional credits. No mobile application installation is required.

## Run locally

Requires **Node.js 24 LTS** and npm.

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. The **Login** tab offers **One-click demo login** for an isolated fictional workspace. Choose **Register** to create a demo account with fictional email/phone details and a password; complete the on-screen code, then use **Login** to return to that same account. No email or SMS is sent. Use a password you don't use elsewhere. Local data persists in `.data/skillloop.sqlite` (Node's experimental built-in SQLite API); it is not stored in browser localStorage.

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm start
```

On Windows the browser tests use an installed Google Chrome automatically. Otherwise install Chromium once with `npx playwright install chromium`, or set `PLAYWRIGHT_CHANNEL=chrome` / `msedge` to use an installed browser. Tests include actual desktop/mobile UI interactions **and separately labelled API checks**. For production-mode browser testing after `npm run build`, set `PLAYWRIGHT_PRODUCTION=true` before `npm run test:e2e`; stop any existing server on port 3000 first.

`npm run check` runs TypeScript, ESLint, domain tests and formatting checks. `npm run format` applies formatting. The production build and browser tests are separate commands.

## Frontend and backend

- One **Next.js 16 / React 19 / TypeScript** project.
- Browser UI and server API routes deploy together to Vercel.
- **PostgreSQL is mandatory on Vercel**. Neon is a compatible managed option; use a pooled TLS connection string.
- Local development uses SQLite when `DATABASE_URL` is absent. This fallback is explicitly disabled on Vercel.
- Server-side database transactions govern bookings, payments and messages.
- The small demo stores one transactional document per isolated workspace, protected by a PostgreSQL advisory lock. This is intentionally a bounded prototype, not a high-throughput production marketplace. Normalise tables and use granular constraints/locks before scaling.
- Messages poll every three seconds when their view is visible. The rest of the workspace refreshes every five seconds. It is persistent cross-device chat, not a fabricated UI or end-to-end encryption.
- Small demo avatars (maximum 512 KB, validated image signatures) are persisted in the database and accessed through authenticated room-scoped URLs. **Vercel Blob is not yet integrated**; large document evidence uploads are deferred. Evidence currently supports public portfolio URLs and written task submissions.

## Implemented

- Responsive desktop, tablet and mobile browser layouts.
- OTP-shaped **simulated** registration with email or any ten-digit demo number, private DOB, country and name.
- Random single-use six-digit challenges, five-minute expiry, attempt limits, resend cooldown, secure session cookies and request-origin checks.
- Isolated seeded workspaces, persona switching and expiring scoped invitation links for multi-device judging.
- Editable profiles, avatars, unique workspace-scoped usernames, language preferences, time zones, social links and learning interests.
- Profile dropdown with My profile / Log out and a separate logout action on your own profile.
- Skill creation/edit/pause, Other category, removable tag chips, outcomes, durations and trade/paid/free options.
- Share a skill chooser: create new or prefill/update/republish an existing listing without duplication.
- Owner-only confirmed soft deletion, with protection for open bookings, return-swap skills and inviting/active Trade Circles; history stays recorded.
- Skill/username discovery, filters, saved cards, public learning requests and country flag assets.
- Incoming/sent/upcoming/completed requests, counter-proposals, scheduling conflicts, rescheduling and cancellation.
- Session workspaces: external meeting link, attendance, task submissions, peer review, session feedback and issue reporting.
- Direct swaps with independent attendance confirmations for each lesson.
- Three-person Trade Circles, explainable tag/language matching, unanimous consent and three scheduled lessons.
- Persistent chat with recipient consent, membership checks, blocking and retry deduplication.
- Learning credits with server-authoritative balances, activity, retry-safe charges and eligible cancellation refunds. These are simulated, not real money.
- Computed participation statistics and first-session recognition.
- Notifications, personal report records, privacy guidance and safety controls.

## Explicit boundaries

- **Demo authentication only.** No SMS/email is sent. Displayed codes are not verification of a real identity. Never connect this deployment to a real customer database.
- **No mainnet, testnet, actual crypto, escrow, withdrawals or real money.** Learning credits use a fictional integer-denominated ledger, not a token. Existing balances retain their value (100 internal units = 1 displayed credit).
- Persona switching and shared invitations deliberately allow people to act as fictional participants inside one isolated workspace. Do not enter private information. Usernames are unique within that workspace, not across all demos.
- An existing browser session resumes the same workspace. New password registrations can log back in using those details. Passwords use salted scrypt hashes stored separately from workspace profiles, with per-account/IP login rate limits. On-screen codes do **not** verify ownership of email/phone. Old passwordless registrations and one-click demo identities have no password login. There is no password reset. Account records expire after 14 days without a successful password login; shared workspaces may expire separately.
- Teaching languages and time zones work; the interface is **English only**. Country choices are a curated initial set, not full global coverage.
- Booking times are proposals. Recurring weekly availability and automated email/push reminders are not implemented. Scheduled conflicts are checked server-side.
- Attendance may be confirmed before the scheduled time **only to demonstrate the workflow**. It does not establish real attendance.
- Peer-reviewed task evidence and badges are not accredited certifications or employment guarantees. Review of the return lesson in a direct swap is not yet separate from primary-lesson evidence.
- Reports are stored; there is **no staffed moderation service or administrator panel** yet.
- No native video, AI integration, PDF certificates, QR generation, data-export UI, production account recovery or production identity verification.
- Demo records expire after inactivity; expired database rows require administrative cleanup for physical deletion. This is not a complete privacy retention programme.
- Demo photography, DM Sans / Manrope fonts and country flags are bundled locally. New workspaces do not need Google Fonts or Unsplash requests to render. Font licences and image source information are included with the assets; older local workspaces can retain their previous image URLs.

## Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Windows/GitHub/Vercel walkthrough. Start with Vercel's public production domain; a custom domain is optional and requires verified ownership.

1. Push this repository to your Git provider and import it into Vercel as Next.js.
2. Select Node.js **24.x**.
3. Provision a separate PostgreSQL database for this demo.
4. Set `DATABASE_URL` and `DEMO_MODE=true` in the relevant Vercel environment.
5. Run `npm run db:migrate` against that database **once before opening the deployment**.
   Then run `npm run db:check` to verify connectivity and schema without modifying records.
6. Deploy, test the public URL, then attach the domain.

The repository contains `.env.example` but no secrets. Never commit `.env.local`, connection strings, tokens or a real-user database.

## Demo walkthrough

1. Explore the demo as Alex and search for Python.
2. Request Asha's paid or free session for tomorrow.
3. Open **Demo** in the header and switch to Asha.
4. Accept the request in **Requests**.
5. Switch back to Alex; complete the simulated payment if applicable.
6. Open the session and chat. Generate a shared workspace link to repeat this from a second browser/phone.
7. Confirm attendance from each participant; share work and peer feedback.
8. Switch to Asha, open **Trade**, and propose the Python → Design → Guitar circle. Accept as the other participants.

The full step-by-step guide is in `C:\Users\jadu\Desktop\resaerch 13 sept v1\docs\FUNCTION-GUIDE.md`.

Five PowerPoint-ready 1920×1080 PNGs are in `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\png`. The presentation PDF, overview and editable HTML/CSS sources are in `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation`. Regenerate with `npm run slides` (uses the existing Playwright/Chrome setup, no running app required). See `C:\Users\jadu\Desktop\resaerch 13 sept v1\docs\PRESENTATION.md` for usage and speaker notes.

## Desktop validation

After building, run the dedicated desktop suite in PowerShell (port 3000 must be free):

```powershell
$env:PLAYWRIGHT_PRODUCTION = 'true'
npm run test:e2e -- tests/e2e/desktop.spec.ts
Remove-Item Env:PLAYWRIGHT_PRODUCTION
```

This covers 1280×720, 1366×768, 1440×900 and 1920×1080 browser viewports, sidebar navigation, the search shortcut, laptop chat layout, and the three-person circle → attendance → task → peer-feedback flow. The complete `npm run test:e2e` suite retains responsive regression coverage; desktop is the primary presentation surface.
