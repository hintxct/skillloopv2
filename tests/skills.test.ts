import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actionSchema,
  applyAction,
  findCircles,
  snapshot,
} from "../src/lib/domain";
import { createRoom } from "../src/lib/seed";

const time = (hours: number) =>
  new Date(Date.now() + hours * 3600000).toISOString();

test("Other category and tag validation apply to the API, not only the form", () => {
  const room = createRoom();
  const input = {
    action: "skill",
    data: { ...room.skills[0], category: "Other", tags: ["Crafts", "Repair"] },
  };
  assert.equal(actionSchema.safeParse(input).success, true);
  for (const tags of [
    [],
    ["Crafts", "crafts"],
    ["a".repeat(31)],
    Array.from({ length: 9 }, (_, i) => `tag${i}`),
  ]) {
    assert.equal(
      actionSchema.safeParse({ ...input, data: { ...input.data, tags } })
        .success,
      false,
    );
  }
  applyAction(room, room.users[0], actionSchema.parse(input));
  assert.equal(room.skills[0].category, "Other");
  assert.deepEqual(room.skills[0].tags, ["Crafts", "Repair"]);
});

test("reusing an existing skill republishes the original without duplicates and enforces ownership", () => {
  const room = createRoom();
  const skill = room.skills[0];
  const owner = room.users.find((u) => u.id === skill.ownerId)!;
  const count = room.skills.length;
  applyAction(room, owner, { action: "pause", skillId: skill.id });
  const action = actionSchema.parse({
    action: "skill",
    skillId: skill.id,
    publish: true,
    data: { ...skill, title: "Updated Python lesson" },
  });
  assert.throws(
    () => applyAction(room, room.users[1], action),
    /Skill not found/,
  );
  applyAction(room, owner, action);
  assert.equal(skill.status, "published");
  assert.equal(skill.title, "Updated Python lesson");
  assert.equal(room.skills.length, count);
});

test("deletion removes a listing and saves, is retry-safe, and cannot resurrect or delete another person's skill", () => {
  const room = createRoom();
  const skill = room.skills[0];
  const owner = room.users[0];
  const other = room.users[1];
  const original = { ...skill };
  room.saved[other.id] = [skill.id];
  assert.throws(
    () =>
      applyAction(room, other, { action: "delete-skill", skillId: skill.id }),
    /Skill not found/,
  );
  applyAction(room, owner, { action: "delete-skill", skillId: skill.id });
  applyAction(room, owner, { action: "delete-skill", skillId: skill.id });
  assert.equal(skill.status, "deleted");
  assert.deepEqual(room.saved[other.id], []);
  for (const user of [owner, other])
    assert.equal(
      snapshot(room, user, "test").skills.some((s) => s.id === skill.id),
      false,
    );
  assert.equal(
    findCircles(room.users, room.skills, owner.id).some((c) =>
      c.skillIds.includes(skill.id),
    ),
    false,
  );
  for (const action of [
    { action: "pause", skillId: skill.id },
    { action: "skill", skillId: skill.id, publish: true, data: original },
    { action: "save", skillId: skill.id },
    {
      action: "request",
      skillId: skill.id,
      kind: "free",
      startsAt: time(24),
      note: "",
    },
  ])
    assert.throws(() =>
      applyAction(
        room,
        action.action === "request" ? other : owner,
        actionSchema.parse(action),
      ),
    );
});

test("deletion protects open commitments but preserves completed session and credit history", () => {
  const room = createRoom();
  const skill = room.skills[0];
  const owner = room.users[0];
  const learner = room.users[1];
  applyAction(room, learner, {
    action: "request",
    skillId: skill.id,
    kind: "paid",
    startsAt: time(24),
    note: "",
  });
  const booking = room.bookings[0];
  assert.throws(
    () =>
      applyAction(room, owner, { action: "delete-skill", skillId: skill.id }),
    /open booking/,
  );
  applyAction(room, owner, {
    action: "booking",
    bookingId: booking.id,
    operation: "accept",
  });
  applyAction(room, learner, {
    action: "booking",
    bookingId: booking.id,
    operation: "pay",
  });
  assert.throws(
    () =>
      applyAction(room, owner, { action: "delete-skill", skillId: skill.id }),
    /open booking/,
  );
  for (const user of [owner, learner])
    applyAction(room, user, {
      action: "booking",
      bookingId: booking.id,
      operation: "confirm",
    });
  const before = JSON.stringify({
    bookings: room.bookings,
    payments: room.payments,
  });
  applyAction(room, owner, { action: "delete-skill", skillId: skill.id });
  assert.equal(
    JSON.stringify({ bookings: room.bookings, payments: room.payments }),
    before,
  );
  assert.equal(booking.status, "completed");
});

test("deletion protects the return skill in swaps and skills in inviting or active circles", () => {
  const room = createRoom();
  const skill = room.skills[0];
  const owner = room.users[0];
  const learner = room.users[1];
  const exchange = room.skills.find((s) => s.ownerId === learner.id)!;
  applyAction(room, learner, {
    action: "request",
    skillId: skill.id,
    kind: "trade",
    exchangeSkillId: exchange.id,
    startsAt: time(24),
    exchangeStartsAt: time(27),
    note: "",
  });
  assert.throws(
    () =>
      applyAction(room, learner, {
        action: "delete-skill",
        skillId: exchange.id,
      }),
    /open booking/,
  );
  applyAction(room, learner, {
    action: "booking",
    bookingId: room.bookings[0].id,
    operation: "cancel",
  });
  const match = findCircles(room.users, room.skills, owner.id)[0];
  applyAction(room, owner, {
    action: "circle",
    ...match,
    startsAt: [48, 51, 54].map(time),
  });
  assert.throws(
    () =>
      applyAction(room, owner, { action: "delete-skill", skillId: skill.id }),
    /Trade Circle/,
  );
  for (const id of match.members.slice(1))
    applyAction(
      room,
      room.users.find((u) => u.id === id)!,
      { action: "circle-response", circleId: room.circles[0].id, accept: true },
    );
  assert.throws(
    () =>
      applyAction(room, owner, { action: "delete-skill", skillId: skill.id }),
    /Trade Circle/,
  );
  applyAction(room, owner, {
    action: "circle-response",
    circleId: room.circles[0].id,
    accept: false,
  });
  assert.doesNotThrow(() =>
    applyAction(room, owner, { action: "delete-skill", skillId: skill.id }),
  );
});
