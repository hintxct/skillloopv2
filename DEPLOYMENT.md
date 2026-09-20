# Publish the SkillLoop web application on Vercel

Start with the production `*.vercel.app` address Vercel assigns. **You do not need to buy a domain, install a phone app, or leave your laptop running.** This deploys a fictional shared-backend demo, not a production-ready campus identity or payments service.

## Quick start for this Windows project

### A. Put the source on GitHub

The workspace was not a Git repository at the time of inspection. Install Git and Node 24 if needed. Open the VS Code terminal:

```powershell
Set-Location 'C:\Users\jadu\Desktop\resaerch 13 sept v1'
npm ci
npm run check
npm run build
git init
git branch -M main
git add .
git status --short
git diff --cached --stat
```

Review the staged files before committing. The existing ignore rules exclude secrets, `.data`, `.next`, `node_modules`, test screenshots and logs. Do not force-add those files.

Create an **empty** GitHub repository (no generated README). Commit with `git commit -m "Prepare SkillLoop web demo"`, then use the exact **add remote** and **push** commands GitHub displays for that repository. If Git asks for identity, configure your own name/email; authenticate through GitHub's supported sign-in flow. Never put passwords or tokens into a commit or paste them into chat.

### B. Import and connect the database

1. Sign in at **vercel.com → Add New → Project**, connect GitHub and import the repository.
2. Use **Next.js**, root directory containing `package.json`, **Node 24.x**, install `npm ci`, build `npm run build`. Leave Output Directory at the framework default. This app cannot be published as a static `out` folder because it has server APIs.
3. Provision a separate **Neon PostgreSQL** database, directly in Neon or through **Vercel Marketplace → Neon Postgres**, and connect it to the project. If you need to create the Vercel project first, the first deployment is only a setup step; it is not ready to share yet.
4. In **Project Settings → Environment Variables**, add `DATABASE_URL` with the provider's **pooled TLS connection string**, and `DEMO_MODE=true`, for **Production**. If Neon supplies a prefixed variable, map the correct value to the exact name `DATABASE_URL`.
5. Initially leave `APP_ORIGIN` unset. Never prefix these variables with `NEXT_PUBLIC_`. The database password must stay server-side.
6. For preview testing, use a separate Neon database/branch and scope its variables to **Preview**; migrate/check that database too. Do not point untrusted preview code at production data.

### C. Create the cloud schema once

On your computer, copy the example only if you do not already have a local env file:

```powershell
if (-not (Test-Path '.env.local')) { Copy-Item '.env.example' '.env.local' }
```

Open `.env.local` in VS Code. Set `DATABASE_URL` to the same production-demo connection string and `DEMO_MODE=true`. Then:

```powershell
npm run db:migrate
npm run db:check
```

Continue only when the check says **PostgreSQL connection and SkillLoop schema are ready**. These scripts load `.env.local` themselves. Check the target database before migrating. Local SQLite records are **not** uploaded. Once `.env.local` points to the cloud, local app runs also use that database; use separate development credentials for later testing.

### D. Redeploy and share the production URL

1. In **Deployments**, deploy/redeploy the production branch after setting the environment variables. Environment changes do not update an already built deployment.
2. Copy the **production domain** displayed by Vercel, not a protected preview/build URL.
3. In **Settings → Deployment Protection**, ensure protection does not cover the intended public production domain. Standard Protection can keep previews protected while production domains stay public; labels/options depend on your plan. Keep account/team administration protected.
4. Open the production URL in an incognito desktop browser with no Vercel login. Test **One-click demo login**, publish a skill and reload. Register with fictional details, log out and return with the same password.
5. Open **Help & privacy** and check **PostgreSQL · shared backend**. Generate a shared workspace invitation from **Demo** and join in a second browser; test a request and chat across the two browsers.
6. Share that URL only after these checks. A public website is not the same as a public database: visitors must never receive the database connection string.

Every fresh demo account has an isolated seeded workspace. Different visitors do not automatically appear in one campus directory. Shared invitations are the deliberate joint-testing mechanism, and anyone holding one can act as its fictional personas.

**If something fails**

| Symptom                                   | Check                                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Page loads but sign-in fails              | Production `DATABASE_URL`, `DEMO_MODE=true`, migration, and a redeployment after env changes          |
| Database schema missing                   | Run `db:migrate` and `db:check` against the correct database/branch                                   |
| Visitor sees a Vercel login               | Share the production domain; check Deployment Protection scope                                        |
| Origin/request rejection                  | Use the exact HTTPS site address; remove an incorrect `APP_ORIGIN` and redeploy                       |
| New browser has different users/changes   | Expected isolation; join the same shared invitation to collaborate                                    |
| Database check succeeds but requests fail | Inspect Vercel runtime logs privately; check TLS, provider availability, region and connection limits |

`/api/health` is only a process/configuration indicator, **not** proof of database connectivity. The database check and real public-browser workflow are required. No Vercel deployment, database provisioning or DNS changes were performed by this guide.

## Domain versus hosting

If you own `skillloop.space` through **Spaceship**, Spaceship manages registration/DNS and **Vercel** runs the web application and API. Ownership and registrar access have not been verified. The domain is optional; the Vercel production domain works without it.

After deployment and DNS setup, visitors can open the website even when your laptop is off. Running `npm run dev` locally does not publish changes. Push to the Git branch connected to Vercel to deploy updates.

No deployment or DNS change has been made automatically by this repository. Account access is required.

## The simple setup

**One Git repository → one Vercel project → one managed PostgreSQL database.**

- Vercel deploys both the browser interface and `/api/*`; there is no second backend project, separate API URL, Express server, or CORS setup to maintain.
- Add **Neon Postgres** through Vercel Marketplace if you want database provisioning and billing managed from Vercel. Check its plan/usage limits before selecting a plan.
- Two required server variables: `DATABASE_URL` and `DEMO_MODE=true`. If the integration adds a prefixed variable instead, explicitly set `DATABASE_URL` to the pooled TLS connection string.
- Create the database schema once, verify it, deploy, then add your Spaceship domain. `vercel.json` already selects Next.js, `npm ci` and `npm run build`.
- This is a **fictional demo deployment**, not production identity verification or real payments.

## 1. Prepare the repository

Install Node 24 LTS, run `npm ci`, and verify:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Create a Git repository if needed, review what you commit, and push to your chosen private/public Git provider. Do not commit `.env.local`, `.data`, `node_modules`, `.next`, or logs.

## 2. Add the project to Vercel

- Import the repository.
- Framework preset: **Next.js**.
- Root directory: the directory containing `package.json`.
- Node version: **24.x**.
- Build command: `npm run build`.
- Keep the Next.js output-directory default; do not set a static `out` directory.
- No separate Express deployment, persistent process, or custom backend domain is necessary.

## 3. Connect PostgreSQL before using the demo

Provision a managed Postgres database (for example Neon through Vercel Marketplace). Select a database/compute region close to the Vercel server region.

Set these **server-side** environment variables:

| Variable       | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | The provider's TLS-enabled pooled Postgres connection string                                    |
| `DEMO_MODE`    | `true` for this isolated fictional prototype                                                    |
| `APP_ORIGIN`   | `https://skillloop.space` after attaching the domain; omit while initially testing preview URLs |

Do not prefix these with `NEXT_PUBLIC_`. Never turn off TLS certificate checking to solve a connection issue.

### Create the schema

Create `.env.local` on your own machine (it is gitignored):

```dotenv
DATABASE_URL="your-provider-connection-string"
DEMO_MODE=true
```

Then run:

```sh
npm run db:migrate
npm run db:check
```

This creates the prototype record table and expiry index. It is idempotent and does not reset users. Run migrations as a controlled setup step, not on every request or every Git preview build.

`db:check` is read-only: it verifies PostgreSQL connectivity and the expected schema and exits with a failure if setup is missing. It deliberately refuses to report local SQLite as deployment-ready. `/api/health` is only a liveness/configuration signal, not a database readiness test.

Use an isolated database for Preview versus the public demo if both are enabled. Do not connect a real customer database. On Vercel, missing `DATABASE_URL` produces a setup error instead of using non-persistent local files.

Redeploy after changing environment variables; existing deployments retain their configuration.

## 4. Confirm the Vercel URL first

Before publishing, you can test the production build locally (still SQLite unless you explicitly set `DATABASE_URL` to an isolated test database):

```powershell
npm run build
$env:PLAYWRIGHT_PRODUCTION = 'true'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_PRODUCTION
```

The test runner starts and stops `next start` itself. Do not run another server on port 3000 for this check. The browser suite covers two actual browser contexts with desktop/mobile viewports, different time zones, invitation joining, booking/counter-proposals, simulated payment, rescheduling, persistent chat, registration and responsive layout. Separate API tests cover authorization, payment retries and circle consent. Passing local tests does **not** verify the cloud database or public DNS.

Open the generated deployment/production URL in an incognito browser.

- Ensure the intended judge-facing domain does not require a Vercel team login.
- Keep Vercel administrative settings protected.
- Create a demo, publish a skill, and refresh.
- Use a second browser/context with a shared invitation to test requests and messages.
- Open **Help & privacy** and confirm its Connection section says **PostgreSQL · shared backend**.
- Test a failed request and a duplicate simulated payment.

## 5. Optional: add a custom domain you own

In **Vercel → your project → Settings → Domains**:

1. Add your domain (`skillloop.space` is the example below; only use it if you control it).
2. Add `www.skillloop.space`.
3. Choose `skillloop.space` as the canonical website and configure `www` to redirect to it.
4. Copy the **exact DNS records Vercel shows for this project**. Do not guess or reuse IP/CNAME values from an old tutorial.

In the authoritative DNS manager for the domain (Spaceship if you kept its nameservers):

- Configure the root/apex `@` record according to Vercel's instructions, usually an A record.
- Configure `www` according to the displayed CNAME target.
- Add any ownership-verification TXT record Vercel requests.
- Remove only conflicting web/parking A, AAAA or CNAME records for those same hostnames.
- Preserve unrelated MX, SPF, DKIM, DMARC, TXT and other existing service records.
- If DNS is managed elsewhere through custom nameservers, edit records there rather than in an inactive DNS panel.

Wait for DNS propagation and Vercel's domain verification. Vercel provisions HTTPS when the configuration is valid. Check both `https://skillloop.space` and the `www` redirect, including on mobile data rather than only the same Wi-Fi.

Registrar transfer is not required. Nameserver replacement is not required when you can add the records at your current DNS provider.

## 6. Publishing future changes

```text
Edit locally → test → commit → push production branch
                                ↓
                         Vercel builds/deploys
                                ↓
                        skillloop.space updates
```

Only source changes are deployed. Local SQLite data is not copied into PostgreSQL. Each deployed demo starts its own seeded workspace.

## Operations and limits

### Smooth-demo checklist

1. **Keep API and database close.** In the Vercel project's Function region settings choose a region near the Neon database, then redeploy. The code intentionally does not hard-code a region because the database location has not been selected. Static files still use Vercel's CDN.
2. **Use the provider's pooled, TLS-enabled URL.** The server reuses a small PostgreSQL pool (up to three connections per instance) with bounded timeouts. Do not disable certificate checks or substitute SQLite on Vercel.
3. **Check cold starts before presenting.** Some database plans suspend idle compute. Open the site and complete a login shortly before the demo, then test again from incognito. Check your provider's current plan before changing suspend settings; do not promise zero latency.
4. **Run the actual smoke test:** register → log out → password login → create an Other-category skill with tags → pause → reuse and republish without duplication → reload → delete a test listing. Separately verify that an open booking prevents deletion.
5. **Test shared state:** invite a second browser, accept a booking there, exchange chat messages and reload both. In Help & privacy confirm PostgreSQL. A green build or `/api/health` alone is insufficient.
6. **Watch usage and errors:** review Vercel runtime logs and Neon usage after the test. Do not publish database URLs/log secrets. Close unnecessary tabs: chat polls every three seconds and workspace state every five seconds while visible.
7. **Protect deployment data:** separate Preview from Production; keep `.env.local` and `.data` out of Git. Do not run the automated seeded-demo suite against real-user data. Keep the five-slide PDF and a screen recording available as offline presentation backup.

This configuration is suitable for demonstrating the bounded fictional prototype, not a guarantee of high-concurrency production performance. Managed PostgreSQL connectivity and public latency must be measured after account setup.

- Vercel Hobby is restricted to eligible non-commercial personal projects; check plan suitability. A real paid marketplace needs an appropriate hosting plan and payment/compliance work.
- Postgres, traffic and storage have usage limits; do not assume everything is free indefinitely.
- No background scheduler is required: challenges and payment holds use server-side timestamp checks.
- The UI polls, so close unnecessary test tabs and monitor request/database usage.
- Private APIs send `Cache-Control: private, no-store`.
- This prototype uses a global database transaction lock; it is appropriate only for a bounded demo. Load-test and redesign storage/concurrency before a real launch.
- Keep a downloaded demo recording and screenshots as a presentation backup. A local recording is not a substitute for a working submitted URL.

## References

- https://vercel.com/docs/domains/working-with-domains/add-a-domain
- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://neon.com/docs/guides/vercel
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- https://vercel.com/docs/deployment-protection
- https://vercel.com/docs/functions/configuring-functions/region
