# SkillLoop — working function guide

Desktop-first walkthrough of the implemented demo. Use fictional details and a password you do not use elsewhere. Registration does not verify real contact ownership; credits are not money. Public hosting has not yet been verified.

## 1. Start or return to an account

1. Open the local site at **http://localhost:3000**, or your production Vercel URL after deployment.
2. On **Login**, choose **One-click demo login** to explore an isolated workspace as Alex. This is a disposable demo, not password registration.
3. To return to the same account later, use **Register** instead: enter a name, date of birth (18+), fictional email or ten-digit demo phone number, country and password (at least 10 characters). Your initial time zone is detected from the browser; edit it later in your profile.
4. Enter the six-digit code displayed in the demo inbox. No email or SMS is sent. Codes expire after five minutes, are single-use and have attempt/resend limits.
5. Later choose **Login**, enter that contact and password, and return to the same workspace while its records remain valid.
6. Use the top-right avatar → **Log out**, or **My profile → Log out**, to invalidate the current session. Escape/outside click dismisses the avatar menu. Logout does not delete your account.

There is no password reset. Demo personas and old passwordless registrations cannot use password login. Account records expire after 14 days without successful password login; workspace expiry can invalidate access separately.

## 2. Navigate the desktop

| Area                      | What it does                                                            |
| ------------------------- | ----------------------------------------------------------------------- |
| Home                      | Discover listings, filter results and browse public learning posts      |
| Requests                  | Incoming/sent/upcoming/completed/closed booking records                 |
| Trade                     | Three-person Trade Circles and direct swaps                             |
| Chat                      | Conversations, message requests and persistent messages                 |
| My profile                | Profile details, own listings, reviews and contribution statistics      |
| My learning / My teaching | Bookings filtered by learner/provider role                              |
| My schedule               | Scheduled sessions ordered by time; not a recurring-availability editor |
| Saved skills              | Published listings you bookmarked                                       |
| Learning credits          | Fictional balance and credit activity/reference records                 |

Navigation resets the page scroll. **Ctrl+K / Cmd+K** opens/focuses Home search unless a dialog is open. Dialogs close with their close button or Escape; deletion cannot be dismissed while its request is being submitted. Narrow screens use the navigation toggle and bottom navigation. Desktop remains the primary layout.

## 3. Discover and save skills

1. Search a skill title, description, tag, person or username on **Home**.
2. Select a category: Development, Design, Languages, Music, Business, Lifestyle or **Other**.
3. Open **Filters** for teaching language, offer type and online/in-person delivery. **Clear** resets these filters and the category. “Recently shared” is a feed label, not an interactive sorting control.
4. Use **Discover**, **Skill trades** or **Free sessions** to change the feed.
5. Open a skill card for its outcome, duration, language, description, modes and optional provider-submitted portfolio link.
6. Open the provider's profile from the card/detail. Click a bookmark to save/unsave a published listing, then use **Saved skills** to find it again.

Paused listings are hidden from other participants. Deleted listings disappear from discovery, profiles, saved lists and matching. Portfolio links are self-reported, not independently verified.

## 4. Share a new skill

1. Click **Share a skill → Create a new skill**. **My profile → Register new skill** is a direct shortcut to the same form.
2. Add a title, category (including **Other**), teaching level, description and a concrete **By the end, you can…** outcome.
3. Under **Search tags**, type one tag and click **+** or press **Enter**. Repeat as needed. Use a chip's × button to remove it.
4. Add **1–8 unique tags**, each up to **30 characters**. Duplicates are rejected case-insensitively. Do not enter a comma-separated list. A typed draft must be added or cleared before publishing.
5. Choose teaching language, session duration and delivery. Select at least one offer: skill exchange, paid mentorship or free community session.
6. For paid mentorship, set the fictional credits per session. Optionally add a secure portfolio URL.
7. Click **Publish my skill**. It appears on Home and in your profile, and persists after reload.

The demo permits up to 20 non-deleted listings per participant. All critical input and ownership rules are checked again on the server.

## 5. Edit, pause, reuse or delete a skill

- **Edit:** open **My profile** and click the listing's pencil. **Save skill** changes its details without changing whether it is paused.
- **Pause / publish:** use the pause/play control beside an owned listing. Pausing stops new discovery/requests; it does not cancel existing commitments.
- **Reuse:** choose **Share a skill → Use an existing skill**, select your listing and edit its prefilled details. **Save and publish skill** updates and publishes the **same listing ID**, including paused listings. It does not create a duplicate. An empty picker explains how to create your first listing.
- **Delete:** in your profile click the listing's trash button. Read the confirmation and choose **Keep skill** to cancel or **Delete skill** to confirm. This is an irreversible listing removal in the interface, not a complete erasure of historical records.
- **Deletion blocked:** a pending, countered, awaiting-payment or scheduled booking prevents deletion. This also protects the return skill in a swap and skills in inviting/active Trade Circles. Complete or cancel those commitments, or pause the listing instead.
- Only the owner may edit, publish, pause or delete their listing. Repeated deletion is safe; a deleted listing cannot be restored via edit/publish APIs.

Completed sessions keep their stored title, outcome, task evidence, peer feedback and reviews. Credit activity also remains available even when its listing is removed.

## 6. Edit your profile

1. Open **My profile → Edit profile**.
2. Update your display name, workspace-unique username, biography, country, optional general area, time zone and languages.
3. Add **I want to learn** interests. Unlike skill tags, this field and profile languages currently use comma-separated entries. Exact interest/tag matches are used for Trade Circle suggestions.
4. Toggle accepting new learning requests. Add optional social/portfolio links.
5. Upload a JPEG, PNG or WebP avatar under 512 KB, then save. Images are stored server-side and accessed within the authenticated workspace.

Contact, date of birth and credit balance are omitted from public profile responses. Teaching/learning counts, minutes, trade statistics, ratings and peer-reviewed badges reflect demo activity, not certified qualifications.

## 7. Request a session or direct swap

1. Open another participant's published skill → **Let's learn together**.
2. Choose one of the offered modes:
   - **Free session:** no credit charge.
   - **Paid mentorship:** fictional credits are charged only after the provider accepts and the learner explicitly pays.
   - **Skill trade:** select your own published trade skill and propose the return lesson time as well.
3. Choose the proposed time and add an introduction/learning goal. Inputs use the **device's time zone**; session summaries use your **profile time zone**.
4. Click **Send learning request**. The provider opens **Requests**, then accepts, declines or selects **Suggest a time**.
5. The other participant may accept a counterproposal. Time conflicts and overlapping commitments are rejected server-side.
6. For accepted paid requests, the learner chooses **Use … credits** before the payment hold expires. Retrying the payment does not charge twice.

For a solo demonstration, switch personas using **Demo** in the header to respond as the provider. Separate visitors need a shared invitation to access the same workspace.

## 8. Manage a scheduled lesson

1. Open a booking from Requests, My learning, My teaching or My schedule.
2. The provider can **Set meeting link** with a secure HTTPS URL; **Join meeting** opens that external service. There is no built-in video calling.
3. Use **Open chat** to coordinate.
4. Before attendance is confirmed, eligible direct bookings can **Reschedule**. The original time remains agreed until the other participant chooses **Accept new time**.
5. **Cancel session** asks for confirmation and applies the server's eligibility rules. Eligible paid cancellations return fictional credits if the simulated recipient balance can cover the refund.
6. Each participant separately chooses **Confirm attendance**. A direct swap also requires both people to **Confirm return lesson**. The booking completes only when all required confirmations exist.

The demo allows confirming future attendance to show the workflow; it does not prove that a lesson occurred. Circle sessions are cancelled through the Trade Circle rather than the individual session button.

## 9. Record work, feedback and reviews

1. In a scheduled/completed session, the learner selects **Share my work**, describes the result and optionally includes a public link.
2. The provider selects **Review submitted work**, writes specific feedback and saves it.
3. The workspace shows the submitted work and **Peer-reviewed task** result. Resubmitting work clears the previous feedback so it can be reviewed again.
4. After completion, each participant may publish one rating and written session review. Reviews appear on the other participant's profile.

Attendance, task feedback and reviews are distinct records. No accredited certification, automatic mastery assessment or separate return-lesson evidence workflow is claimed. Large evidence-file uploads and PDF certificates are not implemented.

## 10. Use three-person Trade Circles

1. Publish an **online trade** skill and set your profile learning interests. A suggestion requires three distinct participants, exact case-insensitive tag/interest matches, the same teaching language and available participants; blocked pairs are excluded.
2. Open **Trade → Trade Circles** and propose a suggested circle with three non-overlapping lesson times.
3. The proposer consents at creation. Each of the other two participants chooses **Accept my commitment**.
4. No lessons activate at 1/3 or 2/3 consent. At **3/3**, three scheduled lessons are created. Each person sees the lessons they participate in.
5. Open lessons to chat, record attendance and submit/review work. All completed lessons complete the circle. Participants can cancel/withdraw through its available circle control.

Reproducible seeded example: switch to **Asha**, propose the Python → Design → Guitar circle; accept as **Cara**, then **Ben**. Asha teaches Python to Cara, Cara teaches design to Ben, Ben teaches guitar to Asha. This is deterministic rule-based matching, not an external intelligence service. Cancelled/completed circle history renders even after a listing is deleted.

## 11. Chat, block and report

1. On someone else's profile choose **Say hello** to create a message request. You may send one introduction; the recipient must accept before further conversation.
2. Open **Chat**, select a conversation and use the message composer. Scheduled bookings also enable participant chat.
3. Messages persist server-side; active chat polls approximately every three seconds, with read markers for messages actually fetched. The interface displays the latest 100 messages; older-message pagination exists in the API, not as a browsing control in the current interface.
4. Use the participant's profile to block/unblock or report a concern. Blocking prevents new requests, matching and messaging between the pair; it is not automatic cancellation of all historical bookings.
5. A session workspace also lets participants report an issue. Reports are stored, but **there is no staffed moderation service or admin dashboard**.

No typing/presence guarantee, end-to-end encryption, attachments or automated support response is claimed.

## 12. Public learning posts and notifications

- On Home select **Learning requests**, then its post action. Add a title, category, description, language and delivery preference; submit the post. Other participants can read it and contact its author. A post is not a booked session or a confirmed commitment.
- The header bell shows workspace notifications for supported request, session, chat and circle activity. Selecting a notification marks it read and opens its destination. These are in-app records, not email/push reminders.
- **Learning credits** shows the fictional balance and activity with `SIM-` references, amounts, dates and completed/returned status. Credits cannot be bought, withdrawn or redeemed.

## 13. Demonstrate across two browsers

1. Open **Demo** and generate a shared workspace invitation.
2. Copy the link into an incognito window or a second device that can reach the same hosted site.
3. Choose a fictional participant in that invitation. Test a request and chat between the two browsers.
4. Reload both pages to verify server persistence. Ordinary new demo logins create separate workspaces and will not see each other's changes.

Anyone holding a shared invitation can act as its demo personas. Do not use it for private or real-user data. A localhost URL is not accessible from someone else's device as your hosted site.

## 14. Help, deployment and scope

Open **Help & safety** in the sidebar or **Help & privacy** in the footer for demo disclosures and the backend connection label. Local mode reads **SQLite · local development**; the hosted configuration must read **PostgreSQL · shared backend**.

The full Windows/GitHub/Vercel procedure is in `C:\Users\jadu\Desktop\resaerch 13 sept v1\DEPLOYMENT.md`. Vercel account access, managed PostgreSQL and a public-browser smoke test remain required. This is an implemented bounded demo, not a production identity, payment or campus-management system.
