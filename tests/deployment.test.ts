import { test } from "node:test";
import assert from "node:assert/strict";
import { transaction } from "../src/lib/store";
import { assertDemo } from "../src/lib/auth";

test("Vercel requires PostgreSQL and explicit isolated-demo opt-in", async () => {
  const original = {
    VERCEL: process.env.VERCEL,
    DATABASE_URL: process.env.DATABASE_URL,
    DEMO_MODE: process.env.DEMO_MODE,
  };
  try {
    process.env.VERCEL = "1";
    delete process.env.DATABASE_URL;
    delete process.env.DEMO_MODE;
    let called = false;
    await assert.rejects(
      transaction(async () => {
        called = true;
      }),
      /SETUP: Connect a PostgreSQL database/,
    );
    assert.equal(called, false);
    assert.throws(() => assertDemo(), /Demo authentication is disabled/);
    process.env.DEMO_MODE = "true";
    assert.doesNotThrow(() => assertDemo());
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
