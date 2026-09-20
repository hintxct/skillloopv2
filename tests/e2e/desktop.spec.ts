import { test, expect, type Page } from "@playwright/test";

const desktops = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

async function navigate(page: Page, name: string, journey = false) {
  await page
    .getByRole("navigation", {
      name: journey ? "Your journey" : "Main navigation",
      exact: true,
    })
    .getByRole("button", { name, exact: true })
    .click();
}

async function switchTo(page: Page, name: string) {
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("desktop: sidebar navigation resets scroll and search respects open dialogs", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await expect(page.locator(".skill-card")).toHaveCount(13);
  for (const viewport of desktops) {
    await page.setViewportSize(viewport);
    await navigate(page, "Home");
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 1200));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    await navigate(page, "Requests");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    for (const [name, heading, journey] of [
      ["Trade", "Better, together.", false],
      ["Chat", "A conversation away.", false],
      ["My profile", "Your learning identity.", false],
      ["My learning", "Keep your curiosity going.", true],
      ["My teaching", "Knowledge worth sharing.", true],
      ["My schedule", "Make time to grow.", true],
      ["Saved skills", "Your little collection.", true],
      ["Learning credits", "Learning credits.", true],
    ] as const) {
      await navigate(page, name, journey);
      await expect(
        page
          .getByRole("navigation", {
            name: journey ? "Your journey" : "Main navigation",
            exact: true,
          })
          .getByRole("button", { name, exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeInViewport();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${name} at ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(viewport.width);
    }
    await page
      .getByRole("button", { name: "Share a skill", exact: true })
      .click();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "Learning credits.", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(
      page.getByRole("textbox", { name: "Search skills or people" }),
    ).toBeFocused();
    await page.screenshot({
      path: `test-results/desktop-home-${viewport.width}.png`,
      animations: "disabled",
    });
  }
  expect(errors).toEqual([]);
});

test("desktop: conversation list and composer fit laptop heights without page scrolling", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await page
    .getByRole("button", {
      name: "Explore Python, from zero to your first project",
      exact: true,
    })
    .click();
  await page.getByRole("dialog").locator(".profile-link").click();
  await page.getByRole("button", { name: "Say hello", exact: true }).click();
  await expect(page.getByLabel("Your message")).toBeVisible();
  await page
    .getByLabel("Your message")
    .fill("Hello Asha, can we practise Python together?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message p")).toHaveText(
    "Hello Asha, can we practise Python together?",
  );
  for (const viewport of desktops) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator(".chat-sidebar")).toBeVisible();
    const composer = (await page.locator(".message-composer").boundingBox())!;
    expect(
      composer.y + composer.height,
      `composer at ${viewport.width}`,
    ).toBeLessThanOrEqual(viewport.height);
    await expect(page.getByLabel("Your message")).toBeInViewport({ ratio: 1 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({
      path: `test-results/desktop-workspace-${viewport.width}.png`,
      animations: "disabled",
    });
  }
});

test("desktop: a Trade Circle needs three consents and records peer-reviewed learning", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await switchTo(page, "Asha Patel @asha");
  await navigate(page, "Trade");
  await page
    .getByRole("button", { name: "Propose this circle" })
    .first()
    .click();
  await expect(
    page.getByRole("dialog").locator('input[type="datetime-local"]'),
  ).toHaveCount(3);
  await page
    .getByRole("button", { name: "Invite the circle", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("1/3 accepted", { exact: true })).toBeVisible();
  await expect(page.locator(".circle-session-link")).toHaveCount(0);
  await switchTo(page, "Cara Silva @cara");
  await navigate(page, "Trade");
  await page.getByRole("button", { name: "Accept my commitment" }).click();
  await expect(page.getByText("2/3 accepted", { exact: true })).toBeVisible();
  await expect(page.locator(".circle-session-link")).toHaveCount(0);
  await switchTo(page, "Ben Carter @ben");
  await navigate(page, "Trade");
  await page.getByRole("button", { name: "Accept my commitment" }).click();
  await expect(page.getByText("3/3 accepted", { exact: true })).toBeVisible();
  await expect(page.locator(".circle-session-link")).toHaveCount(2);
  await page
    .getByText("3/3 accepted", { exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/desktop-circle.png",
    animations: "disabled",
  });

  await switchTo(page, "Cara Silva @cara");
  await navigate(page, "Trade");
  await page
    .locator(".circle-session-link")
    .filter({ hasText: "Python, from zero" })
    .click();
  await page
    .getByRole("button", { name: "Confirm attendance", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("1/2 confirmations");
  await page
    .getByRole("button", { name: "Share my work", exact: true })
    .click();
  await page
    .getByLabel("Describe your result, including any relevant public links")
    .fill(
      "I built a calculator using variables and functions, and tested addition and division by zero.",
    );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("dialog").locator("blockquote")).toContainText(
    "I built a calculator",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();

  await switchTo(page, "Asha Patel @asha");
  await navigate(page, "Trade");
  await page
    .locator(".circle-session-link")
    .filter({ hasText: "Python, from zero" })
    .click();
  await page
    .getByRole("button", { name: "Confirm attendance", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".session-head")).toContainText(
    "completed",
  );
  await page.getByRole("button", { name: "Review submitted work" }).click();
  await page
    .getByLabel("What did the learner demonstrate? Be specific.")
    .fill(
      "Cara demonstrated functions, arithmetic and safe handling of division by zero.",
    );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".review-result")).toContainText(
    "Peer-reviewed task",
  );
  await page.reload();
  await navigate(page, "Trade");
  await page
    .locator(".circle-session-link")
    .filter({ hasText: "Python, from zero" })
    .click();
  await expect(page.locator(".review-result")).toContainText(
    "Cara demonstrated functions",
  );
  await page.locator(".review-result").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/desktop-learning-evidence.png" });
  expect(errors).toEqual([]);
});
