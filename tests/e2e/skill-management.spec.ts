import { test, expect, type Page } from "@playwright/test";
import type { Snapshot } from "../../src/lib/types";

async function state(page: Page): Promise<Snapshot> {
  const response = await page.request.get("/api/state");
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function profile(page: Page) {
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: "My profile", exact: true })
    .click();
}

test("desktop: new and existing skills, Other category, tag chips and confirmed deletion persist", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await page
    .getByRole("button", { name: "Share a skill", exact: true })
    .click();
  await page.getByRole("button", { name: "Use an existing skill" }).click();
  await expect(
    page.getByText("No existing skills yet.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create a new skill" }).click();
  await page
    .getByLabel("Skill title", { exact: true })
    .fill("Creative paper folding");
  await page.getByLabel("Category", { exact: true }).selectOption("Other");
  await page
    .getByLabel("Tell learners what to expect")
    .fill(
      "Learn to fold useful paper shapes with a patient step-by-step lesson.",
    );
  await page
    .getByLabel("By the end, you can…", { exact: true })
    .fill("Fold a paper crane and explain each step.");
  await page.getByRole("button", { name: "Publish my skill" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Add at least one search tag",
  );
  const tags = page.getByLabel("Search tags", { exact: true });
  await tags.fill("Origami");
  await page.getByRole("button", { name: "Add tag", exact: true }).click();
  await expect(tags).toHaveValue("");
  await tags.fill("Not added yet");
  await page.getByRole("button", { name: "Publish my skill" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await tags.evaluate((el: HTMLInputElement) => el.validity.customError),
  ).toBe(true);
  await tags.fill("origami");
  await tags.press("Enter");
  await expect(
    page.getByText("That tag is already added.", { exact: true }),
  ).toBeVisible();
  await tags.fill("Paper craft");
  await tags.press("Enter");
  await tags.fill("Temporary");
  await tags.press("Enter");
  await page
    .getByRole("button", { name: "Remove tag Temporary", exact: true })
    .click();
  await expect(
    page.getByRole("list", { name: "Added search tags" }).getByRole("listitem"),
  ).toHaveCount(2);
  for (let i = 1; i <= 6; i++) {
    await tags.fill(`Extra ${i}`);
    await tags.press("Enter");
  }
  await tags.fill("Ninth tag");
  await tags.press("Enter");
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "up to 8 tags",
  );
  await tags.fill("");
  for (let i = 1; i <= 6; i++) {
    await page
      .getByRole("button", { name: `Remove tag Extra ${i}`, exact: true })
      .click();
  }
  await page.screenshot({ path: "test-results/skill-tags-desktop.png" });
  await page.getByRole("button", { name: "Publish my skill" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Other", exact: true }).click();
  await expect(page.locator(".skill-card")).toHaveCount(1);
  let snapshot = await state(page);
  const skill = snapshot.skills.find((s) => s.ownerId === snapshot.me.id)!;
  expect(skill.category).toBe("Other");
  expect(skill.tags).toEqual(["Origami", "Paper craft"]);
  await profile(page);
  await page
    .getByRole("button", { name: `Pause ${skill.title}`, exact: true })
    .click();
  await expect(page.locator(".profile-skill")).toContainText("paused");
  await page
    .getByRole("button", { name: "Share a skill", exact: true })
    .click();
  await page.getByRole("button", { name: "Use an existing skill" }).click();
  await expect(
    page.getByRole("region", { name: "Your existing skills" }),
  ).toContainText("paused");
  await page.screenshot({ path: "test-results/existing-skills-desktop.png" });
  await page
    .locator(".existing-skill")
    .filter({ hasText: skill.title })
    .click();
  await expect(page.getByLabel("Skill title", { exact: true })).toHaveValue(
    skill.title,
  );
  await expect(
    page.getByRole("list", { name: "Added search tags" }),
  ).toContainText("Paper craft");
  await page
    .getByLabel("Skill title", { exact: true })
    .fill("Creative origami for beginners");
  await page.getByRole("button", { name: "Save and publish skill" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  snapshot = await state(page);
  const mine = snapshot.skills.filter((s) => s.ownerId === snapshot.me.id);
  expect(mine).toHaveLength(1);
  expect(mine[0]).toMatchObject({
    id: skill.id,
    status: "published",
    title: "Creative origami for beginners",
  });
  await profile(page);
  await page
    .getByRole("button", {
      name: "Delete Creative origami for beginners",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Keep skill", exact: true }).click();
  await expect(page.locator(".profile-skill")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Delete Creative origami for beginners",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Delete skill", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".profile-skill")).toHaveCount(0);
  await page.reload();
  snapshot = await state(page);
  expect(snapshot.skills.some((s) => s.id === skill.id)).toBe(false);
  await page
    .getByRole("button", { name: "Share a skill", exact: true })
    .click();
  await page.getByRole("button", { name: "Use an existing skill" }).click();
  await expect(
    page.getByText("No existing skills yet.", { exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("desktop: home profile menu and own profile can log out and invalidate the session", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await expect(
    page.getByRole("region", { name: "Profile options" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "Profile options" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open profile menu" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("heading", { name: "Find your next spark." }).click();
  await expect(
    page.getByRole("region", { name: "Profile options" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.screenshot({ path: "test-results/home-profile-logout.png" });
  await page
    .getByRole("region", { name: "Profile options" })
    .getByRole("button", { name: "Log out", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  expect((await page.request.get("/api/state")).status()).toBe(401);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "One-click demo login" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page
    .getByRole("region", { name: "Profile options" })
    .getByRole("button", { name: "My profile", exact: true })
    .click();
  await page
    .getByRole("main")
    .getByRole("button", { name: "Log out", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  expect((await page.request.get("/api/state")).status()).toBe(401);
});

test("desktop: deletion UI explains open commitments instead of removing a booked skill", async ({
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
  await page.getByRole("button", { name: "Let's learn together" }).click();
  await page.getByRole("button", { name: "Free session", exact: true }).click();
  await page.getByRole("button", { name: "Send learning request" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("button", { name: "Asha Patel @asha" }).click();
  await profile(page);
  await page
    .getByRole("button", {
      name: "Delete Python, from zero to your first project",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Delete skill", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "open booking or Trade Circle",
  );
  await page.getByRole("button", { name: "Keep skill", exact: true }).click();
  await expect(
    page.locator(".profile-skill").filter({ hasText: "Python, from zero" }),
  ).toHaveCount(1);
});

test("responsive: profile menu, existing-skill chooser and deletion dialog stay within the viewport", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await page.getByRole("button", { name: "Demo", exact: true }).click();
  await page.getByRole("button", { name: "Asha Patel @asha" }).click();
  await page.getByRole("button", { name: "Open profile menu" }).click();
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page
      .getByRole("region", { name: "Profile options" })
      .boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  }
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Share a skill", exact: true })
    .click();
  await page.getByRole("button", { name: "Use an existing skill" }).click();
  for (const width of [320, 390, 768, 1280, 1440]) {
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
  await page.getByRole("button", { name: "Close dialog" }).click();
  await profile(page);
  await page
    .getByRole("button", {
      name: "Delete Python, from zero to your first project",
      exact: true,
    })
    .click();
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/delete-skill-narrow.png",
    animations: "disabled",
  });
});

test("API + UI: ownership is enforced and completed sessions, feedback and receipts survive deletion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await expect(page.locator(".skill-card")).toHaveCount(13);
  const initial = await state(page);
  const skill = initial.skills.find((s) => s.tags.includes("Python"))!;
  const post = (path: string, data: object) =>
    page.request.post(`/api/${path}`, {
      data,
      headers: { Origin: "http://localhost:3000" },
    });
  expect(
    (
      await post("actions", { action: "delete-skill", skillId: skill.id })
    ).status(),
  ).toBe(404);
  expect(
    (
      await post("actions", {
        action: "skill",
        skillId: skill.id,
        publish: true,
        data: skill,
      })
    ).status(),
  ).toBe(404);
  expect(
    (await post("actions", { action: "save", skillId: skill.id })).ok(),
  ).toBe(true);
  expect(
    (
      await post("actions", {
        action: "request",
        skillId: skill.id,
        kind: "paid",
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        note: "Historical session check",
      })
    ).ok(),
  ).toBe(true);
  const booking = (await state(page)).bookings[0];
  const operation = async (op: string, value?: string) => {
    expect(
      (
        await post("actions", {
          action: "booking",
          bookingId: booking.id,
          operation: op,
          value,
        })
      ).ok(),
    ).toBe(true);
  };
  expect((await post("auth/switch", { userId: skill.ownerId })).ok()).toBe(
    true,
  );
  await operation("accept");
  expect((await post("auth/switch", { userId: initial.me.id })).ok()).toBe(
    true,
  );
  await operation("pay");
  await operation("confirm");
  await operation(
    "evidence",
    "I built a working Python calculator with functions.",
  );
  expect((await post("auth/switch", { userId: skill.ownerId })).ok()).toBe(
    true,
  );
  await operation("confirm");
  await operation(
    "feedback",
    "The calculator uses functions and handles invalid input.",
  );
  expect(
    (await post("actions", { action: "delete-skill", skillId: skill.id })).ok(),
  ).toBe(true);
  expect((await post("auth/switch", { userId: initial.me.id })).ok()).toBe(
    true,
  );
  await page.reload();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: "Requests", exact: true })
    .click();
  await page.locator(".booking-card").filter({ hasText: skill.title }).click();
  await expect(page.getByRole("dialog")).toContainText(skill.title);
  await expect(page.getByRole("dialog")).toContainText("completed");
  await expect(page.getByRole("dialog")).toContainText(
    "The calculator uses functions and handles invalid input.",
  );
  await page
    .getByPlaceholder("Share thoughtful, specific feedback…")
    .fill("Clear examples and a helpful first lesson.");
  await page
    .getByRole("button", { name: "Publish review", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Publish review", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("navigation", { name: "Your journey", exact: true })
    .getByRole("button", { name: "Learning credits", exact: true })
    .click();
  await expect(page.locator(".payment-row")).toContainText("15 credits");
  const final = await state(page);
  expect(final.saved).not.toContain(skill.id);
  expect(final.skills.some((s) => s.id === skill.id)).toBe(false);
  expect(final.reviews.some((r) => r.bookingId === booking.id)).toBe(true);
  expect(errors).toEqual([]);
});
