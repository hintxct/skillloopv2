import { test, expect, type Page } from "@playwright/test";
import type { Snapshot } from "../../src/lib/types";

async function navigate(page: Page, name: string, mobile = false) {
  await page
    .getByRole("navigation", {
      name: mobile ? "Mobile navigation" : "Main navigation",
      exact: true,
    })
    .getByRole("button", { name, exact: true })
    .click();
}
async function state(page: Page): Promise<Snapshot> {
  const response = await page.request.get("/api/state");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test("UI: desktop learner and mobile mentor book, counter, pay and chat", async ({
  browser,
}) => {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: "America/New_York",
  });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "Asia/Kolkata",
  });
  const learner = await desktop.newPage();
  const mentor = await mobile.newPage();
  const errors: string[] = [];
  for (const page of [learner, mentor]) {
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !m.text().includes("Failed to load resource"))
        errors.push(m.text());
    });
  }
  try {
    await learner.goto("/");
    await learner.getByRole("button", { name: "One-click demo login" }).click();
    await learner.getByRole("button", { name: "Demo", exact: true }).click();
    await learner
      .getByRole("button", { name: "Generate shared workspace link" })
      .click();
    const invitation = await learner
      .getByLabel("Shared demo invitation")
      .inputValue();
    await learner.getByRole("button", { name: "Close dialog" }).click();
    await mentor.goto(invitation);
    await mentor.getByRole("button", { name: "See demo participants" }).click();
    await mentor.getByRole("button", { name: "Asha Patel @asha" }).click();
    await expect(
      mentor.getByRole("heading", { name: "Find your next spark." }),
    ).toBeVisible();

    await learner
      .getByRole("button", {
        name: "Explore Python, from zero to your first project",
        exact: true,
      })
      .click();
    await learner.getByRole("button", { name: "Let's learn together" }).click();
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await learner.setViewportSize({ width, height: 900 });
      expect(
        await learner
          .getByRole("dialog")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
        `booking form at ${width}`,
      ).toBe(true);
    }
    await learner.setViewportSize({ width: 1440, height: 1000 });
    await learner
      .getByRole("button", { name: "Paid mentorship", exact: true })
      .click();
    await learner
      .getByLabel("Say hello and share your learning goal")
      .fill("I would love to build a small calculator.");
    await learner
      .getByRole("button", { name: "Send learning request" })
      .click();
    await expect(learner.getByRole("dialog")).toHaveCount(0);

    await navigate(mentor, "Requests", true);
    await mentor
      .locator(".booking-card")
      .filter({ hasText: "Python, from zero" })
      .click({ timeout: 15000 });
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await mentor.setViewportSize({ width, height: 900 });
      expect(
        await mentor
          .getByRole("dialog")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      expect(
        await mentor.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
    await mentor.setViewportSize({ width: 390, height: 844 });
    await mentor.getByRole("button", { name: "Suggest a time" }).click();
    const timeInput = mentor.getByLabel(
      "New date and time · device local time",
    );
    const local = await timeInput.inputValue();
    const expectedTime = await mentor.evaluate(
      (value) => new Date(value).toISOString(),
      local,
    );
    // Enter and Save must both use the same validated ISO conversion.
    await timeInput.press("Enter");
    await expect(mentor.locator(".inline-editor")).toHaveCount(0);
    expect((await state(mentor)).bookings[0].startsAt).toBe(expectedTime);
    await navigate(learner, "Requests");
    await learner
      .locator(".booking-card")
      .filter({ hasText: "Python, from zero" })
      .click();
    await learner
      .getByRole("button", { name: "Accept request", exact: true })
      .click({ timeout: 15000 });
    await learner
      .getByRole("button", { name: "Use 15 credits", exact: true })
      .click();
    await expect(learner.locator(".session-head .badge")).toHaveText(
      "scheduled",
    );
    const paid = await state(learner);
    expect(paid.payments).toHaveLength(1);
    expect(paid.me.balance).toBe(8500);

    await learner
      .getByRole("button", { name: "Reschedule", exact: true })
      .click();
    const newTime = learner.getByLabel("New date and time · device local time");
    const next = await learner.evaluate(() => {
      const d = new Date(Date.now() + 72 * 3600000);
      return new Date(+d - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    });
    await newTime.fill(next);
    await learner.getByRole("button", { name: "Save", exact: true }).click();
    await expect(learner.locator(".inline-editor")).toHaveCount(0);
    await mentor
      .getByRole("button", { name: "Accept new time", exact: true })
      .click({ timeout: 15000 });
    const rescheduled = (await state(mentor)).bookings[0];
    expect(rescheduled.startsAt).toBe(
      await learner.evaluate((value) => new Date(value).toISOString(), next),
    );

    await learner
      .getByRole("button", { name: "Open chat", exact: true })
      .click();
    await mentor
      .getByRole("button", { name: "Open chat", exact: true })
      .click();
    await learner
      .getByLabel("Your message")
      .fill("Hello Asha, ready for our lesson!");
    await learner
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(
      mentor
        .locator(".message p")
        .filter({ hasText: "Hello Asha, ready for our lesson!" }),
    ).toBeVisible({ timeout: 15000 });
    await expect
      .poll(async () => (await state(mentor)).conversations[0].unread, {
        timeout: 15000,
      })
      .toBe(0);
    await mentor
      .getByLabel("Your message")
      .fill("Welcome! Let's start with variables.");
    await mentor
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(
      learner
        .locator(".message p")
        .filter({ hasText: "Welcome! Let's start with variables." }),
    ).toBeVisible({ timeout: 15000 });
    await learner
      .getByLabel("Your message")
      .fill("Great, I have my editor open.");
    await learner
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await expect(
      mentor
        .locator(".message p")
        .filter({ hasText: "Great, I have my editor open." }),
    ).toBeVisible({ timeout: 15000 });
    await expect
      .poll(async () => (await state(mentor)).conversations[0].unread, {
        timeout: 15000,
      })
      .toBe(0);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await mentor.setViewportSize({ width, height: 900 });
      expect(
        await mentor.evaluate(() => document.documentElement.scrollWidth),
        `chat at ${width}`,
      ).toBeLessThanOrEqual(width);
      for (const selector of [".chat-main", ".message-composer"]) {
        expect(
          await mentor
            .locator(selector)
            .evaluate((el) => el.scrollWidth <= el.clientWidth),
          `${selector} at ${width}`,
        ).toBe(true);
      }
      expect(
        await mentor
          .locator(".message p")
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(16);
    }
    await mentor.setViewportSize({ width: 390, height: 844 });
    await mentor.screenshot({
      path: "test-results/mobile-chat.png",
      animations: "disabled",
      fullPage: true,
    });
    await learner.reload();
    await navigate(learner, "Chat");
    await learner
      .locator(".chat-list-item")
      .filter({ hasText: "Asha Patel" })
      .click();
    await expect(learner.locator(".message p")).toHaveCount(3);
    await learner.screenshot({
      path: "test-results/desktop-chat.png",
      fullPage: true,
    });
    await learner
      .getByRole("navigation", { name: "Your journey", exact: true })
      .getByRole("button", { name: "Learning credits", exact: true })
      .click();
    await expect(learner.locator(".credits-hero h2")).toHaveText("85 credits");
    await expect(learner.locator(".payment-row")).toContainText("15 credits");
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await learner.setViewportSize({ width, height: 900 });
      expect(
        await learner.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      expect(
        await learner
          .locator(".payment-row")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await learner.screenshot({
        path: `test-results/credit-activity-${width}.png`,
        animations: "disabled",
      });
    }
    expect(errors).toEqual([]);
  } finally {
    await desktop.close();
    await mobile.close();
  }
});

test("UI: phone navigation, filters and dialogs fit without external visual assets", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      /fonts\.googleapis\.com|fonts\.gstatic\.com|images\.unsplash\.com/.test(
        request.url(),
      )
    )
      external.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await expect(page.locator(".skill-card")).toHaveCount(13);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll("main *, header *, footer *")]
        .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
        .map((el) => `${el.tagName}.${el.className}`)
        .slice(0, 20),
    }));
    expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(
      width,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(page.locator(".filter-panel")).toBeVisible();
  await page
    .getByRole("button", {
      name: "View Python, from zero to your first project",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", {
      name: "Python, from zero to your first project",
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.locator(".page-heading .add-skill").click();
  await page.getByRole("button", { name: "Create a new skill" }).click();
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page
        .getByRole("dialog")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
      `skill form at ${width}`,
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate(page, "Chat", true);
  await expect(
    page.getByRole("heading", { name: "Your conversations" }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(page.getByLabel("Search skills or people")).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  expect(external).toEqual([]);
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/mobile-viewport.png" });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/narrow-viewport.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/desktop-viewport.png" });
});
