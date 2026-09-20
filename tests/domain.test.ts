import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyAction,
  checkSlot,
  findCircles,
  publicUser,
  registrationSchema,
  snapshot,
} from "../src/lib/domain";
import { createRoom, createUser } from "../src/lib/seed";
const time = (hours: number) =>
  new Date(Date.now() + hours * 3600000).toISOString();
function fixture() {
  const room = createRoom();
  const me = createUser(
    {
      name: "Test Learner",
      dob: "2000-01-01",
      contact: "test@example.test",
      country: "IN",
      timezone: "Asia/Kolkata",
    },
    room,
  );
  room.users.push(me);
  return { room, me, skill: room.skills[0], provider: room.users[0] };
}

test("public profile and other participants omit private data", () => {
  const { room, me, provider } = fixture();
  const user = publicUser(room, provider);
  assert.equal("dob" in user, false);
  assert.equal("contact" in user, false);
  assert.equal("balance" in user, false);
  const view = snapshot(room, me, "test");
  assert.equal(view.users.length, 13);
  assert.equal(view.bookings.length, 0);
});
test("registration accepts demo phone and rejects minors and invalid dates", () => {
  const input = {
    name: "Test User",
    contact: "1234567890",
    dob: "2000-01-01",
    country: "IN",
    timezone: "Asia/Kolkata",
  };
  assert.equal(registrationSchema.safeParse(input).success, true);
  assert.equal(
    registrationSchema.safeParse({ ...input, dob: "2020-01-01" }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...input, dob: "2000-02-31" }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...input, timezone: "Nowhere/Invalid" })
      .success,
    false,
  );
});
test("paid booking requires provider consent and is charged idempotently", () => {
  const { room, me, skill, provider } = fixture();
  applyAction(room, me, {
    action: "request",
    skillId: skill.id,
    kind: "paid",
    startsAt: time(24),
    note: "Hello",
  });
  const b = room.bookings[0];
  assert.throws(() =>
    applyAction(room, me, {
      action: "booking",
      bookingId: b.id,
      operation: "accept",
    }),
  );
  applyAction(room, provider, {
    action: "booking",
    bookingId: b.id,
    operation: "accept",
  });
  assert.equal(b.status, "awaiting-payment");
  applyAction(room, me, {
    action: "booking",
    bookingId: b.id,
    operation: "pay",
  });
  applyAction(room, me, {
    action: "booking",
    bookingId: b.id,
    operation: "pay",
  });
  assert.equal(me.balance, 8500);
  assert.equal(provider.balance, 11500);
  assert.equal(room.payments.length, 1);
  applyAction(room, provider, {
    action: "booking",
    bookingId: b.id,
    operation: "cancel",
  });
  assert.equal(me.balance, 10000);
  assert.equal(provider.balance, 10000);
  assert.equal(room.payments[0].status, "refunded");
});
test("active bookings reserve both participants; expired holds do not", () => {
  const { room, me, skill, provider } = fixture();
  const start = time(24);
  applyAction(room, me, {
    action: "request",
    skillId: skill.id,
    kind: "paid",
    startsAt: start,
    note: "",
  });
  const b = room.bookings[0];
  applyAction(room, provider, {
    action: "booking",
    bookingId: b.id,
    operation: "accept",
  });
  assert.throws(() => checkSlot(room, [provider.id], start, 45));
  assert.throws(() => checkSlot(room, [me.id], start, 45));
  b.holdUntil = time(-1);
  assert.doesNotThrow(() => checkSlot(room, [me.id], start, 45));
  assert.throws(() =>
    applyAction(room, me, {
      action: "booking",
      bookingId: b.id,
      operation: "pay",
    }),
  );
});
test("attendance is distinct from evidence; both participants must confirm", () => {
  const { room, me, skill, provider } = fixture();
  applyAction(room, me, {
    action: "request",
    skillId: skill.id,
    kind: "free",
    startsAt: time(24),
    note: "",
  });
  const b = room.bookings[0];
  applyAction(room, provider, {
    action: "booking",
    bookingId: b.id,
    operation: "accept",
  });
  applyAction(room, me, {
    action: "booking",
    bookingId: b.id,
    operation: "confirm",
  });
  assert.equal(b.status, "scheduled");
  applyAction(room, provider, {
    action: "booking",
    bookingId: b.id,
    operation: "confirm",
  });
  assert.equal(b.status, "completed");
  assert.equal(b.demonstrated, false);
  applyAction(room, me, {
    action: "booking",
    bookingId: b.id,
    operation: "evidence",
    value: "I built a calculator and explained the addition function.",
  });
  assert.throws(() =>
    applyAction(room, me, {
      action: "booking",
      bookingId: b.id,
      operation: "feedback",
      value: "I approve my own work!",
    }),
  );
  applyAction(room, provider, {
    action: "booking",
    bookingId: b.id,
    operation: "feedback",
    value: "Explained how the function handles two numeric inputs.",
  });
  assert.equal(b.demonstrated, true);
  assert.equal(publicUser(room, me).stats.learned, 1);
});
test("chat requires membership, recipient consent and deduplicates retries", () => {
  const { room, me, provider } = fixture();
  const result = applyAction(room, me, {
    action: "conversation",
    userId: provider.id,
  });
  const conversationId = String(result.conversationId);
  applyAction(room, me, {
    action: "message",
    conversationId,
    text: "Hello",
    clientId: "first",
  });
  // Retrying the introduction must succeed before the recipient accepts.
  applyAction(room, me, {
    action: "message",
    conversationId,
    text: "Hello",
    clientId: "first",
  });
  assert.equal(room.conversations[0].messages.length, 1);
  assert.throws(() =>
    applyAction(room, me, {
      action: "message",
      conversationId,
      text: "More",
      clientId: "second",
    }),
  );
  applyAction(room, provider, { action: "accept-chat", conversationId });
  applyAction(room, me, {
    action: "message",
    conversationId,
    text: "More",
    clientId: "second",
  });
  applyAction(room, me, {
    action: "message",
    conversationId,
    text: "More",
    clientId: "second",
  });
  assert.equal(room.conversations[0].messages.length, 2);
  assert.throws(() =>
    applyAction(room, room.users[2], {
      action: "message",
      conversationId,
      text: "Intruder",
      clientId: "third",
    }),
  );
  applyAction(room, provider, { action: "block", userId: me.id });
  assert.throws(() =>
    applyAction(room, me, {
      action: "message",
      conversationId,
      text: "Blocked",
      clientId: "fourth",
    }),
  );
});
test("read markers acknowledge only fetched messages and never move backwards", () => {
  const { room, me, provider } = fixture();
  const result = applyAction(room, me, {
    action: "conversation",
    userId: provider.id,
  });
  const conversationId = String(result.conversationId);
  applyAction(room, provider, { action: "accept-chat", conversationId });
  for (const clientId of ["one", "two"])
    applyAction(room, provider, {
      action: "message",
      conversationId,
      clientId,
      text: clientId,
    });
  const c = room.conversations[0];
  c.messages[0].createdAt = "2026-01-01T10:00:00.000Z";
  c.messages[1].createdAt = "2026-01-01T10:01:00.000Z";
  applyAction(room, me, {
    action: "read",
    conversationId,
    messageId: c.messages[0].id,
  });
  assert.equal(snapshot(room, me, "test").conversations[0].unread, 1);
  applyAction(room, me, {
    action: "read",
    conversationId,
    messageId: c.messages[1].id,
  });
  applyAction(room, me, {
    action: "read",
    conversationId,
    messageId: c.messages[0].id,
  });
  assert.equal(c.read[me.id], c.messages[1].createdAt);
  assert.equal(snapshot(room, me, "test").conversations[0].unread, 0);
  assert.throws(() =>
    applyAction(room, me, {
      action: "read",
      conversationId,
      messageId: "missing",
    }),
  );
  assert.throws(() =>
    applyAction(room, room.users[2], {
      action: "read",
      conversationId,
      messageId: c.messages[1].id,
    }),
  );
});
test("three-way matching creates sessions only after unanimous consent", () => {
  const room = createRoom();
  const asha = room.users[0];
  const match = findCircles(room.users, room.skills, asha.id)[0];
  assert.ok(match);
  applyAction(room, asha, {
    action: "circle",
    ...match,
    startsAt: [time(24), time(27), time(30)],
  });
  const c = room.circles[0];
  assert.equal(room.bookings.length, 0);
  applyAction(
    room,
    room.users.find((u) => u.id === c.members[1])!,
    { action: "circle-response", circleId: c.id, accept: true },
  );
  assert.equal(room.bookings.length, 0);
  applyAction(
    room,
    room.users.find((u) => u.id === c.members[2])!,
    { action: "circle-response", circleId: c.id, accept: true },
  );
  assert.equal(c.status, "active");
  assert.equal(room.bookings.length, 3);
  assert.deepEqual(
    new Set(room.bookings.map((b) => b.learnerId)),
    new Set(c.members),
  );
});
test("reviews require completion and cannot be repeated", () => {
  const { room, me, skill, provider } = fixture();
  applyAction(room, me, {
    action: "request",
    skillId: skill.id,
    kind: "free",
    startsAt: time(24),
    note: "",
  });
  const b = room.bookings[0];
  assert.throws(() =>
    applyAction(room, me, {
      action: "review",
      bookingId: b.id,
      rating: 5,
      text: "Great session.",
    }),
  );
  applyAction(room, provider, {
    action: "booking",
    bookingId: b.id,
    operation: "accept",
  });
  for (const u of [me, provider])
    applyAction(room, u, {
      action: "booking",
      bookingId: b.id,
      operation: "confirm",
    });
  applyAction(room, me, {
    action: "review",
    bookingId: b.id,
    rating: 5,
    text: "Great session.",
  });
  assert.throws(() =>
    applyAction(room, me, {
      action: "review",
      bookingId: b.id,
      rating: 5,
      text: "Another review.",
    }),
  );
  assert.equal(publicUser(room, provider).stats.rating, 5);
});
