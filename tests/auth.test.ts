import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  CHALLENGE_COOKIE,
  hash,
  loginAccount,
  startChallenge,
  verifyChallenge,
} from "../src/lib/auth";
import type { Store } from "../src/lib/store";
import type { Room } from "../src/lib/types";

function memoryStore() {
  const records = new Map<string, unknown>();
  const store: Store = {
    async get<T>(kind: string, id: string) {
      return (records.get(`${kind}:${id}`) as T) ?? null;
    },
    async put(kind, id, value) {
      records.set(`${kind}:${id}`, structuredClone(value));
    },
    async remove(kind, id) {
      records.delete(`${kind}:${id}`);
    },
  };
  return { store, records };
}
const input = {
  name: "Test Learner",
  dob: "2000-01-01",
  contact: "learner@example.test",
  country: "IN",
  timezone: "Asia/Kolkata",
  password: "only-for-this-demo",
};
const request = (token?: string) =>
  new NextRequest("http://localhost:3000/api/auth/verify", {
    headers: token ? { cookie: `${CHALLENGE_COOKIE}=${token}` } : {},
  });

test("registration stores only a salted password hash and login restores the same workspace", async () => {
  const { store, records } = memoryStore();
  const challenge = await startChallenge(store, request(), input);
  assert.equal(
    JSON.stringify([...records.values()]).includes(input.password),
    false,
  );
  const verified = await verifyChallenge(
    store,
    request(challenge.token),
    challenge.code,
  );
  assert.ok(verified.token);
  const first = await store.get<{ roomId: string; userId: string }>(
    "session",
    hash(verified.token),
  );
  const token = await loginAccount(
    store,
    " Learner@Example.Test ",
    input.password,
  );
  assert.notEqual(token, verified.token);
  assert.deepEqual(await store.get("session", hash(token)), first);
  const room = await store.get<Room>("room", first!.roomId);
  assert.equal("password" in room!.users.at(-1)!, false);
  assert.equal("passwordHash" in room!.users.at(-1)!, false);
  await assert.rejects(
    loginAccount(store, input.contact, "wrong-password"),
    /incorrect/,
  );
  await assert.rejects(
    loginAccount(store, "missing@example.test", input.password),
    /incorrect/,
  );
  await assert.rejects(startChallenge(store, request(), input), /already uses/);
  assert.match(
    (await verifyChallenge(store, request(challenge.token), challenge.code))
      .error!,
    /expired/,
  );
  await store.remove("room", first!.roomId);
  await assert.rejects(
    loginAccount(store, input.contact, input.password),
    /expired/,
  );
});

test("two pending registrations cannot overwrite an existing account", async () => {
  const { store } = memoryStore();
  const first = await startChallenge(store, request(), input);
  const second = await startChallenge(store, request(), {
    ...input,
    password: "different-demo-password",
  });
  assert.ok(
    (await verifyChallenge(store, request(first.token), first.code)).token,
  );
  assert.match(
    (await verifyChallenge(store, request(second.token), second.code)).error!,
    /already uses/,
  );
  await assert.rejects(
    loginAccount(store, input.contact, "different-demo-password"),
    /incorrect/,
  );
  assert.ok(await loginAccount(store, input.contact, input.password));
});
