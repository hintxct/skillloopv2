# SkillLoop — five-slide presentation kit

## Ready-to-use files

All five slides are **1920×1080 PNGs (16:9)** with large bullet points, high-contrast light backgrounds, purple/mint accents and restrained vector graphics. They describe implemented capabilities only. No proposed rewards, unbuilt campus features, invented adoption figures or measured-impact claims are included.

| Slide                                | Absolute image path                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| 1. Problem statement                 | `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\png\01-problem-statement.png`  |
| 2. Solution                          | `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\png\02-solution.png`           |
| 3. How it works / technical approach | `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\png\03-technical-approach.png` |
| 4. Key features                      | `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\png\04-key-features.png`       |
| 5. Innovation & impact               | `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\png\05-innovation-impact.png`  |

- Presentation PDF: `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\SkillLoop-slides.pdf`
- Contact sheet: `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\overview.jpg`
- Editable sources: `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\index.html` and `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\slides.css`
- Renderer: `C:\Users\jadu\Desktop\resaerch 13 sept v1\scripts\render-slides.ts`
- Output dimensions and SHA-256 checksums: `C:\Users\jadu\Desktop\resaerch 13 sept v1\presentation\manifest.json`

## Put the images into PowerPoint

1. Create a blank presentation. Choose **Design → Slide Size → Widescreen (16:9)**.
2. Create five **Blank** slides; remove title/content placeholders.
3. On each slide choose **Insert → Pictures → This Device**, select the corresponding PNG and fit it to the full slide without cropping or changing its aspect ratio.
4. Keep the images at original quality; avoid picture compression. Add speaker notes below rather than adding more text to the images.
5. Save your presentation as `.pptx`. The supplied slide text is flattened into images; edit the HTML/CSS and regenerate to change the artwork. A native editable PowerPoint deck is not included.

You can also present the supplied PDF directly in full-screen mode. No website login or internet connection is needed to display the PNGs/PDF.

## Re-render or change text

In PowerShell:

```powershell
Set-Location 'C:\Users\jadu\Desktop\resaerch 13 sept v1'
npm run slides
```

Uses the project's existing Playwright dependency and bundled DM Sans/Manrope fonts. Windows uses installed Google Chrome automatically. Elsewhere install Playwright Chromium or set `PLAYWRIGHT_CHANNEL` to an installed Chrome/Edge channel. No app server is needed. The renderer checks five slides, loaded fonts, text-box boundaries/footer clearance, lack of external network assets, PNG dimensions and source/output hashes. These checks supplement visual inspection; they do not replace proofreading.

Headings use 74px type, main narrative bullets 39–42px, feature bullets 30px and disclosure footers 24px at full resolution. These sizes are intentional: keep slides sparse instead of reducing text to fit more content.

## Speaker notes (about two minutes)

### 1 — Problem statement

“A skill may already be available, but finding a suitable person and agreeing a lesson is a separate problem. Asha can teach Python and wants guitar. Cara wants Python but teaches design: the match works in only one direction. Scheduling and learning outcomes add more coordination. These are the problems this demo addresses, not claims from a survey.”

### 2 — Solution

“SkillLoop brings focused skill listings, discovery, requests and learning records into one desktop-first web app. The same account can teach and learn. People choose a swap, a free session or mentorship with fictional credits, then coordinate through chat and record their work.”

### 3 — Technical approach

“React and TypeScript provide the interface; Next.js routes validate changes and enforce ownership, consent and booking rules. Records persist in database transactions. Local testing uses SQLite; the deployment adapter is PostgreSQL. Three-person matching is explainable: exact skill interests and tags, common language and online delivery. Every person agrees before sessions activate. The public cloud deployment still needs verification.”

### 4 — Key features

“Skills can be created, edited, paused and reused without duplicates. Tags are added one at a time, including in the Other category. Deletion requires the owner's confirmation and is blocked while commitments are open. Profiles, search, saved skills, sessions, chat and peer feedback complete the workflow. Login and logout work, but contact verification and credits remain simulated.”

### 5 — Innovation & impact

“A third person closes the loop: Asha teaches Python to Cara, Cara teaches design to Ben, and Ben teaches guitar to Asha. We combine this exchange with explicit consent and learning records. The demonstrated value is a functioning workflow without a tuition payment in the circle—not a claim of measured educational improvement or an accredited qualification.”

## Short live demonstration

1. Use one-click demo login, then **Share a skill** to show Create new / Use existing. Add an Other-category skill and tags; pause and republish it without duplication.
2. Switch to **Asha** through **Demo**. Open **Trade**, propose the Python → Design → Guitar circle and keep the default non-overlapping future times.
3. Switch to **Cara** and accept: show 2/3 consent with no activated lessons. Switch to **Ben** and accept: three lessons activate.
4. As Cara, open the Python lesson, confirm attendance and share a short result. As Asha, confirm and review the result.
5. Refresh to show persistent feedback, then show the top-right profile/logout menu.

The future-attendance shortcut exists only to demonstrate the workflow. Persona switching and invitations are for fictional participants, not production identity control. Shared invitations let another browser test the same workspace; separate one-click logins create different workspaces.

## Claims and limits to preserve

- **Implemented and locally tested:** account/session controls, skill management, discovery, requests, scheduling, direct swaps, three-way consent, chat, task evidence, reviews and simulated credit history.
- **Not verified live:** Vercel deployment, managed PostgreSQL connectivity, custom domain, production latency or concurrency. Do not add a live URL until it has passed the public smoke test.
- Codes appear on screen; they do not verify phone/email ownership. Credits cannot be purchased, withdrawn or redeemed. Reports are saved without a staffed moderation service.
- Peer feedback is not accredited mastery. Three-way barter is established; this presentation does not claim a world-first invention or measured social impact.

Full function instructions: `C:\Users\jadu\Desktop\resaerch 13 sept v1\docs\FUNCTION-GUIDE.md`. Deployment walkthrough: `C:\Users\jadu\Desktop\resaerch 13 sept v1\DEPLOYMENT.md`.
