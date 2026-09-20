# SkillLoop verification — 19 September 2026

## Verified locally

Environment: Windows, Node.js 24.13.1, installed Google Chrome, Next.js 16.3.5.

| Check                                      | Result                                              |
| ------------------------------------------ | --------------------------------------------------- |
| TypeScript                                 | Passed                                              |
| ESLint                                     | Passed                                              |
| Unit/authentication/deployment-guard tests | 17 passed, including 5 skill-management tests       |
| Formatting                                 | Passed                                              |
| Optimized production build                 | Passed, exit 0                                      |
| Production browser suite                   | 16 passed, including 5 new management/history tests |
| Production and full dependency audits      | 0 reported vulnerabilities in each                  |
| Missing-database readiness check           | Expected exit 1; no SQLite fallback                 |
| Cloud database and public URL              | Not verified; deployment credentials unavailable    |

The audit is a point-in-time dependency check, not a security certification.

The desktop-first pass adds dedicated tests at **1280×720, 1366×768, 1440×900 and 1920×1080**. Browser tests use `PLAYWRIGHT_PRODUCTION=true` against `next start` and local SQLite. Node's experimental SQLite warning is expected; these checks do not verify a cloud database.

## Current account and skill-management pass

- Verified profile dropdown (My profile / Log out), own-profile logout, Escape/outside dismissal, invalidation of `/api/state` access and persistence of logout after reload. Refresh responses use a session-version guard so old responses do not restore logged-out state.
- Verified Other category, empty/existing skill picker, tag addition using + and Enter, case-insensitive duplicate rejection, eight-tag limit and removal. Unadded tag drafts block publishing instead of disappearing silently.
- Verified create → pause → reuse prefill → edit and republish → reload retains one listing with the original ID.
- Verified cancelled and confirmed deletion, disappearance after reload, ownership rejection via APIs and blocked deletion while a booking is open. Domain tests also cover return-swap skills and inviting/active Trade Circles.
- Audited status consumers: snapshots omit deleted listings; edit/pause/request/save/matching reject or exclude them. Historical sessions use stored booking titles/outcomes rather than dereferencing the deleted listing. Historical circle labels have a fallback.
- A labelled API + UI test sets up a completed paid session and evidence, deletes its skill as owner, then opens the historical session, reads feedback, publishes a review and checks credit activity in the browser. Saved-list cleanup and preserved review records are asserted.
- New menu/chooser layouts are tested at 320, 390, 768, 1280 and 1440 pixels wide; deletion confirmation also fits at 320px. Desktop screenshots of the profile menu, tag chips and existing-skill picker, plus narrow deletion, were visually inspected.
- First new tests needed alert selectors scoped to the dialog (Next.js also has a route-announcer alert). The history test needed to await completion of demo login before its first API read. The corrected full production suite passed **16/16** in about one minute. These were test-harness issues, not suppressed application failures.

## Presentation and function documentation

The full function guide is `C:\Users\jadu\Desktop\resaerch 13 sept v1\docs\FUNCTION-GUIDE.md`. Five implemented-feature PNGs, PDF, overview and editable source live in `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation`. `npm run slides` regenerates them using Playwright and local fonts, checking slide count, text-box fit/footer clearance, no external resources or render errors, image dimensions, five PDF pages and source/output checksums. All five slides were visually inspected for readable text and layout; the final circle diagram was adjusted so no arrowhead is hidden behind a person card. Problem framing and capability value are not presented as research statistics or measured impact.

The first desktop run reproduced preserved page scroll on sidebar navigation. It also found a test using “Send message” instead of the profile's “Say hello” button; that selector was corrected. Navigation now resets page scroll, active sidebar items expose `aria-current`, and Ctrl/Cmd+K does not switch pages behind an open dialog. A desktop flex layout keeps the chat composer inside laptop-height viewports. The expanded production suite passed all 11 tests after these application changes; `npm run check` and `npm run build` also passed. Local command logs are gitignored.

The first expanded browser run found a 320px skill-detail dialog overflow and a test that searched the wrong navigation group for Learning credits. The profile row now wraps within the dialog, and the test uses the Your journey navigation. A shared submit-button arrow also needed an explicit opt-out for Login. All three corrections are covered by the passing suite. Screenshot captures disable finite animations to avoid capturing the mobile sidebar mid-transition after viewport resizing.

## Browser coverage

Actual automated Chrome UI interactions, not just API calls:

- Dedicated desktop coverage for all sidebar panels, scrolling between panels, Ctrl/Cmd+K, modal Escape behaviour, laptop-height chat with the conversation list and composer visible, and screenshot captures at four desktop resolutions.
- Asha proposes a Trade Circle, Cara and Ben separately consent, no lessons activate at 1/3 or 2/3 consent, and participants can open their own lessons after 3/3. Cara submits task evidence; Asha records peer feedback; the feedback survives reload. This tests the actual judge-demo sequence.

- Desktop learner creates a workspace and shares its invitation with a second, independent mobile-width browser context.
- Mentor joins through the invitation UI; learner requests paid mentorship.
- Mentor counters the time using Enter; learner accepts and makes a simulated payment.
- Learner reschedules using Save; mentor accepts. ISO timestamps are checked across New York and Kolkata browser time zones.
- Both participants send messages through the composer. Newly viewed messages update read markers; messages survive a page reload.
- Skill creation, profile editing and persistence are exercised through forms.
- Simulated phone OTP rejects an incorrect code, accepts the single-use code and rejects replay. No real SMS is sent.
- Email/password registration → logout → incorrect-password error → successful password login restores the same user ID and name; the session survives reload. The Login tab alone offers one-click demo login.
- Login, Register, discovery and learning credits are checked at **320, 390, 768, 1024, 1440 and 1920px**. Selected body text is at least 16px, skill titles at least 20px, and the narrow-screen Share a skill button is at least 150px wide, left-aligned and stacked below the heading. Login has no submit arrow.
- Skill-detail, skill-creation, booking and session dialogs, active chat/composer, and populated credit activity are checked for internal horizontal overflow across the same six widths. Mobile navigation, filters and opening Learning credits from the menu are exercised through the UI.
- A 15-credit mentoring booking changes the learner's displayed balance from 100 to 85 credits and creates a 15-credit activity entry. The underlying integer ledger is unchanged: **100 internal units = 1 displayed credit**.
- New workspaces render without Google Fonts or Unsplash network requests.
- Covered UI flows assert no uncaught browser errors; sign-up and two-browser workflows also check unexpected console errors.

Separately labelled API tests check session authorization/isolation, forbidden origins, simulated payment retry safety, chat access and three-person circle consent. Those API tests are not represented as manual UI testing.

The current desktop review inspected discovery at 1366×768, chat at 1280×720 and 1920×1080, and circle/session captures. Earlier responsive review covered Login, Register, discovery, credits and narrow chat. Screenshots in `test-results` are gitignored and regenerated by the browser suite; they are visual review aids, not pixel-baseline assertions. Category/feed tab rows intentionally scroll within their own containers on narrow screens. Tests use desktop Chrome with resized viewports, not physical iOS/Android devices or Safari. This is not an exhaustive accessibility or cross-browser certification.

Visible components no longer use DUSD, wallet, prototype or hackathon labels. The internal `wallet` panel key and older unused CSS selectors remain for compatibility; technical documentation retains truthful demo/prototype descriptions. Simulation disclosures remain visible, including fictional credits, on-screen registration codes and the absence of staffed moderation. Report feedback now says only that the report was saved, without promising review.

## Deployment status and limitations

- **Not deployed or confirmed live.** Vercel account access and PostgreSQL setup are still required. Start with the public production `*.vercel.app` domain. A custom domain is optional; ownership of `skillloop.space` and DNS access have not been verified.
- **No managed PostgreSQL connection was available.** The production build's local browser tests used SQLite. Cloud database connectivity, persistence across Vercel instances and deployment latency remain unverified.
- `npm run db:check` verifies connectivity/schema once a database is connected. It does not silently fall back to SQLite. A regression test confirms Vercel refuses SQLite and requires explicit demo-mode opt-in.
- Password login uses salted scrypt hashes, request-origin checks, session cookies and account/IP rate limits. Registration codes are displayed on-screen and **do not verify email or phone ownership**. Demo personas and legacy passwordless registrations cannot use password login; there is no password reset. Account records expire after 14 days without successful password login, and workspace expiry can invalidate them separately.
- Learning credits and payments are fictional: no purchases, withdrawals or real-money transfers. Persona switching and shared invitation links are deliberately demo-only, not a production identity system. New accounts create isolated seeded workspaces rather than joining a campus-wide directory. Verified campus roles and redeemable institutional rewards are roadmap items, not implemented features.
- Workspace-document storage and its global transaction lock are bounded-demo choices, not a production-scale database model.

## Reproduce

From the project directory, with Node 24 and dependencies installed:

```powershell
npm run check
npm run build
$env:PLAYWRIGHT_PRODUCTION = 'true'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_PRODUCTION
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
npm ci --dry-run --ignore-scripts --no-audit
```

Stop any existing server on port 3000 first. Playwright starts the production server itself. On Windows it uses installed Chrome automatically; otherwise install Playwright Chromium once or set `PLAYWRIGHT_CHANNEL` to an installed compatible browser.

For publication, follow the root `DEPLOYMENT.md`: one Vercel project hosts frontend and API; connect an isolated managed PostgreSQL database, set server variables, migrate/check the schema, and verify the public Vercel production URL from an incognito browser. Optionally attach a domain you own using Vercel's exact DNS instructions.
