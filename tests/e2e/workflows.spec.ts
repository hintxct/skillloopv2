import { test, expect, type APIRequestContext } from "@playwright/test";
import type { Snapshot } from "../../src/lib/types";
const origin = "http://localhost:3000";
async function post(request: APIRequestContext, path: string, data: unknown) {
  return request.post(`${origin}/api/${path}`, {
    data,
    headers: { Origin: origin },
  });
}

test("browser discovery, forms, persistent profile and mobile layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "One-click demo login" }).click();
  await expect(
    page.getByRole("heading", { name: "Find your next spark." }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search skills or people" })
    .fill("Python");
  await expect(page.locator(".skill-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear search" }).click();
  await page
    .getByRole("button", { name: "Share a skill", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Create a new skill" }).click();
  await page
    .getByLabel("Skill title", { exact: true })
    .fill("Beginner public speaking");
  await page
    .getByLabel("Tell learners what to expect")
    .fill(
      "Practise a short talk in a friendly environment with constructive feedback.",
    );
  await page
    .getByLabel("By the end, you can…", { exact: true })
    .fill("Present a clear one-minute introduction.");
  await page.getByLabel("Search tags", { exact: true }).fill("Speaking");
  await page.getByRole("button", { name: "Add tag", exact: true }).click();
  await page.getByLabel("Search tags", { exact: true }).fill("English");
  await page.getByLabel("Search tags", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Publish my skill" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator(".skill-card").filter({ hasText: "Beginner public speaking" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: "My profile" })
    .click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page.getByLabel("Display name").fill("Alex Test Learner");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.reload();
  const state = (await (
    await page.request.get("/api/state")
  ).json()) as Snapshot;
  expect(state.me.name).toBe("Alex Test Learner");
  await page.screenshot({
    path: "test-results/desktop-home.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-home.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("API: separate sessions authorize booking, payment and chat securely", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext(),
    stranger = await browser.newContext();
  try {
    const demo = await post(a.request, "auth/demo", {});
    expect(demo.ok()).toBeTruthy();
    const initial = (await (
      await a.request.get(`${origin}/api/state`)
    ).json()) as Snapshot;
    const skill = initial.skills.find((s) => s.tags.includes("Python"))!;
    const invite = await (await post(a.request, "invite", {})).json();
    expect(
      (
        await post(b.request, "auth/join", {
          token: invite.token,
          userId: skill.ownerId,
        })
      ).ok(),
    ).toBeTruthy();
    const created = await post(a.request, "actions", {
      action: "request",
      skillId: skill.id,
      kind: "paid",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      note: "I want to build my first calculator.",
    });
    expect(created.ok()).toBeTruthy();
    const { bookingId } = await created.json();
    expect(
      (
        await post(b.request, "actions", {
          action: "booking",
          bookingId,
          operation: "accept",
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await post(a.request, "actions", {
          action: "booking",
          bookingId,
          operation: "pay",
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await post(a.request, "actions", {
          action: "booking",
          bookingId,
          operation: "pay",
        })
      ).ok(),
    ).toBeTruthy();
    const state = (await (
      await a.request.get(`${origin}/api/state`)
    ).json()) as Snapshot;
    expect(state.me.balance).toBe(10000 - skill.price);
    expect(state.payments).toHaveLength(1);
    const conversation = state.conversations[0];
    const payload = {
      action: "message",
      conversationId: conversation.id,
      text: "Hello from the first device!",
      clientId: crypto.randomUUID(),
    };
    expect((await post(a.request, "actions", payload)).ok()).toBeTruthy();
    expect((await post(a.request, "actions", payload)).ok()).toBeTruthy();
    const messages = await (
      await b.request.get(`${origin}/api/messages?id=${conversation.id}`)
    ).json();
    expect(messages.messages).toHaveLength(1);
    await post(stranger.request, "auth/demo", {});
    expect(
      (
        await stranger.request.get(
          `${origin}/api/messages?id=${conversation.id}`,
        )
      ).status(),
    ).toBe(404);
    expect(
      (
        await post(stranger.request, "actions", {
          action: "booking",
          bookingId,
          operation: "cancel",
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await a.request.post(`${origin}/api/actions`, {
          data: { action: "notifications" },
          headers: { Origin: "https://evil.example" },
        })
      ).status(),
    ).toBe(403);
    expect("dob" in state.users[0]).toBe(false);
    expect("contact" in state.users[0]).toBe(false);
    for (const request of [a.request, b.request])
      expect(
        (
          await post(request, "actions", {
            action: "booking",
            bookingId,
            operation: "confirm",
          })
        ).ok(),
      ).toBeTruthy();
    const final = (await (
      await a.request.get(`${origin}/api/state`)
    ).json()) as Snapshot;
    expect(final.bookings[0].status).toBe("completed");
  } finally {
    await a.close();
    await b.close();
    await stranger.close();
  }
});

test("demo OTP rejects wrong/replayed codes and supports arbitrary ten-digit numbers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().includes("Failed to load resource")
    )
      errors.push(message.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Register" }).click();
  await page.getByRole("button", { name: "Phone", exact: true }).click();
  await page.getByLabel("Your name").fill("Phone Demo");
  await page.getByLabel("Date of birth · private").fill("2000-01-01");
  await page
    .getByLabel("Phone number", { exact: true })
    .fill(String(Date.now()).slice(-10));
  await page.getByLabel("Password", { exact: true }).fill("test-password-2026");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator(".demo-inbox strong")).toBeVisible();
  const code = (await page.locator(".demo-inbox strong").textContent())!;
  await page.getByLabel("Enter your 6-digit code").fill("000000");
  await page.getByRole("button", { name: "Complete registration" }).click();
  await expect(page.locator(".auth-card [role='alert']")).toContainText(
    "doesn't match",
  );
  await page.getByLabel("Enter your 6-digit code").fill(code);
  await page.getByRole("button", { name: "Complete registration" }).click();
  await expect(
    page.getByRole("heading", { name: "Find your next spark." }),
  ).toBeVisible();
  expect((await post(page.request, "auth/verify", { code })).status()).toBe(
    400,
  );
  expect(errors).toEqual([]);
});

test("API: three person circle persists and activates after all participants consent", async ({
  request,
}) => {
  await post(request, "auth/demo", {});
  let state = (await (await request.get("/api/state")).json()) as Snapshot;
  const asha = state.users.find((u) => u.username === "asha")!;
  await post(request, "auth/switch", { userId: asha.id });
  state = (await (await request.get("/api/state")).json()) as Snapshot;
  const match = state.matches![0];
  expect(match).toBeTruthy();
  const startsAt = [24, 27, 30].map((h) =>
    new Date(Date.now() + h * 3600000).toISOString(),
  );
  expect(
    (
      await post(request, "actions", { action: "circle", ...match, startsAt })
    ).ok(),
  ).toBeTruthy();
  state = (await (await request.get("/api/state")).json()) as Snapshot;
  const circle = state.circles[0];
  for (const userId of match.members.slice(1)) {
    await post(request, "auth/switch", { userId });
    expect(
      (
        await post(request, "actions", {
          action: "circle-response",
          circleId: circle.id,
          accept: true,
        })
      ).ok(),
    ).toBeTruthy();
  }
  state = (await (await request.get("/api/state")).json()) as Snapshot;
  expect(state.circles[0].status).toBe("active");
  expect(state.bookings.filter((b) => b.circleId === circle.id)).toHaveLength(
    2,
  );
});
