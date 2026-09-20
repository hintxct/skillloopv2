import { test, expect } from "@playwright/test";
import type { Snapshot } from "../../src/lib/types";

const widths = [320, 390, 768, 1024, 1440, 1920];

test("Login and Register are readable; password login restores a registered account", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Login", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "One-click demo login" }),
  ).toBeVisible();
  await expect(page.getByText(/hackathon|prototype/i)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }).locator("svg"),
  ).toHaveCount(0);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(
      await page
        .locator(".auth-card > .muted")
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await page.screenshot({
      path: `test-results/login-${width}.png`,
      animations: "disabled",
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "One-click demo login" }),
  ).toHaveCount(0);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(
      await page
        .locator(".auth-card")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/register-${width}.png`,
      animations: "disabled",
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByLabel("Your name").fill("Returning Learner");
  await page.getByLabel("Date of birth · private").fill("2000-01-01");
  const contact = `returning-${Date.now()}@example.test`;
  await page.getByLabel("Email address", { exact: true }).fill(contact);
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("checkbox").check();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.screenshot({
    path: "test-results/register-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const code = await page.locator(".demo-inbox strong").innerText();
  await page.getByLabel("Enter your 6-digit code").fill(code);
  await page.getByRole("button", { name: "Complete registration" }).click();
  await expect(page.locator(".skill-card")).toHaveCount(13);
  const registered = (await (
    await page.request.get("/api/state")
  ).json()) as Snapshot;
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.getByLabel("Email or phone").fill(contact);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator(".auth-card [role='alert']")).toContainText(
    "incorrect",
  );
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator(".skill-card")).toHaveCount(13);
  const restored = (await (
    await page.request.get("/api/state")
  ).json()) as Snapshot;
  expect(restored.me.id).toBe(registered.me.id);
  expect(restored.me.name).toBe("Returning Learner");
  await page.reload();
  await expect(page.locator(".skill-card")).toHaveCount(13);
  expect(errors).toEqual([]);
});

test("discovery, credits and navigation keep a comfortable reading size", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await expect(page.locator(".skill-card")).toHaveCount(13);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const selector of [
      ".skill-description",
      ".card-person > span:not(.avatar)",
      ".search-box input",
      ".page-heading p",
    ]) {
      expect(
        await page
          .locator(selector)
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
        `${selector} at ${width}`,
      ).toBeGreaterThanOrEqual(16);
    }
    expect(
      await page
        .locator(".skill-title")
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(20);
    const share = page.locator(".page-heading .add-skill");
    expect(
      await share.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    expect(await share.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    if (width <= 480) {
      const button = (await share.boundingBox())!;
      const heading = (await page
        .locator(".page-heading > div")
        .boundingBox())!;
      expect(button.width).toBeGreaterThanOrEqual(150);
      expect(button.y).toBeGreaterThanOrEqual(heading.y + heading.height);
      expect(button.x).toBe(heading.x);
    }
    await page.screenshot({
      path: `test-results/discovery-${width}.png`,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Learning credits", exact: true })
    .click();
  await expect(page.locator(".credits-hero h2")).toHaveText("100 credits");
  await expect(
    page.getByText("These are demo credits, not real money.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(/DUSD|demo wallet/i)).toHaveCount(0);
  await page.screenshot({ path: "test-results/credits-desktop.png" });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/credits-${width}.png`,
      animations: "disabled",
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Home", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Your journey", exact: true })
    .getByRole("button", { name: "Learning credits", exact: true })
    .click();
  await expect(page.locator(".credits-hero h2")).toHaveText("100 credits");
  await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
  await page.screenshot({
    path: "test-results/credits-mobile.png",
    animations: "disabled",
  });
});
