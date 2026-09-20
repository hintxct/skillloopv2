import {
  createHash,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { NextRequest, NextResponse } from "next/server";
import type { Store } from "./store";
import type { Room } from "./types";
import { createRoom, createUser, uid } from "./seed";

export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export const secret = () => randomBytes(32).toString("base64url");
export const SESSION_COOKIE = "skillloop_session";
export const CHALLENGE_COOKIE = "skillloop_challenge";
type Session = { roomId: string; userId: string };
type Credentials = { salt: string; passwordHash: string };
type Account = Session & Credentials;
const deriveKey = promisify(scrypt);
const accountId = (contact: string) => hash(contact.trim().toLowerCase());
async function passwordKey(password: string, salt: string) {
  return (await deriveKey(password, salt, 64)) as Buffer;
}
type Challenge = {
  hash: string;
  input: {
    name: string;
    dob: string;
    contact: string;
    country: string;
    timezone: string;
  };
  attempts: number;
  createdAt: number;
  credentials?: Credentials;
};
export function assertDemo() {
  if (
    process.env.DEMO_MODE === "false" ||
    (process.env.VERCEL && process.env.DEMO_MODE !== "true")
  )
    throw new AppError(
      "Demo authentication is disabled. Set DEMO_MODE=true only on an isolated demo deployment.",
      503,
    );
}
export function cookie(
  response: NextResponse,
  name: string,
  value: string,
  seconds: number,
) {
  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      !!process.env.VERCEL || process.env.APP_ORIGIN?.startsWith("https://"),
    path: "/",
    maxAge: seconds,
  });
}
export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = new Set(
    [request.nextUrl.origin, process.env.APP_ORIGIN].filter(Boolean),
  );
  if (
    !origin ||
    !allowed.has(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AppError("Request origin is not allowed.", 403);
}
export async function limit(
  store: Store,
  key: string,
  max = 20,
  window = 60000,
) {
  const record = await store.get<{ count: number; until: number }>("rate", key);
  if (record && record.count >= max)
    throw new AppError("A little too fast. Please try again in a minute.", 429);
  const until = record?.until ?? Date.now() + window;
  await store.put(
    "rate",
    key,
    { count: (record?.count ?? 0) + 1, until },
    until,
  );
}
export async function requireSession(store: Store, request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token
    ? await store.get<Session>("session", hash(token))
    : null;
  if (!session) throw new AppError("Please sign in to continue.", 401);
  const room = await store.get<Room>("room", session.roomId);
  const user = room?.users.find((user) => user.id === session.userId);
  if (!room || !user)
    throw new AppError(
      "This demo session has expired. Start a fresh demo.",
      401,
    );
  return { session, room, user, token: token! };
}
export async function issueSession(store: Store, room: Room, userId: string) {
  const token = secret();
  await store.put(
    "session",
    hash(token),
    { roomId: room.id, userId },
    Date.now() + 7 * 86400000,
  );
  return token;
}
export async function startChallenge(
  store: Store,
  request: NextRequest,
  input: Challenge["input"] & { password?: string },
) {
  const { password, ...details } = input;
  if (
    password &&
    (await store.get<Account>("account", accountId(input.contact)))
  )
    throw new AppError("An account already uses these details. Please log in.");
  const previous = request.cookies.get(CHALLENGE_COOKIE)?.value;
  if (previous) {
    const old = await store.get<Challenge>("challenge", hash(previous));
    if (old && Date.now() - old.createdAt < 30000)
      throw new AppError(
        "Please wait 30 seconds before requesting another code.",
        429,
      );
    await store.remove("challenge", hash(previous));
  }
  const token = secret();
  const code = String(randomInt(100000, 1000000));
  const salt = randomBytes(16).toString("hex");
  const credentials = password
    ? {
        salt,
        passwordHash: (await passwordKey(password, salt)).toString("hex"),
      }
    : undefined;
  await store.put(
    "challenge",
    hash(token),
    {
      hash: hash(`${token}:${code}`),
      input: details,
      credentials,
      attempts: 0,
      createdAt: Date.now(),
    },
    Date.now() + 300000,
  );
  return { token, code };
}
export async function verifyChallenge(
  store: Store,
  request: NextRequest,
  code: string,
) {
  const token = request.cookies.get(CHALLENGE_COOKIE)?.value;
  const challenge = token
    ? await store.get<Challenge>("challenge", hash(token))
    : null;
  if (!token || !challenge)
    return { error: "This code expired. Request a new one." };
  if (challenge.attempts >= 5)
    return { error: "Too many attempts. Request a new code." };
  if (
    !timingSafeEqual(
      Buffer.from(challenge.hash),
      Buffer.from(hash(`${token}:${code}`)),
    )
  ) {
    challenge.attempts++;
    await store.put(
      "challenge",
      hash(token),
      challenge,
      challenge.createdAt + 300000,
    );
    return { error: "That code doesn't match. Please try again." };
  }
  await store.remove("challenge", hash(token));
  if (
    challenge.credentials &&
    (await store.get<Account>("account", accountId(challenge.input.contact)))
  )
    return { error: "An account already uses these details. Please log in." };
  const room = createRoom();
  const user = createUser(challenge.input, room);
  room.users.push(user);
  await store.put("room", room.id, room, Date.now() + 14 * 86400000);
  if (challenge.credentials)
    await store.put(
      "account",
      accountId(challenge.input.contact),
      {
        ...challenge.credentials,
        roomId: room.id,
        userId: user.id,
      },
      Date.now() + 14 * 86400000,
    );
  return { token: await issueSession(store, room, user.id) };
}
export async function loginAccount(
  store: Store,
  contact: string,
  password: string,
) {
  const id = accountId(contact);
  const account = await store.get<Account>("account", id);
  // Do the same expensive derivation even when the account does not exist.
  const key = await passwordKey(
    password,
    account?.salt ?? "skillloop-missing-account",
  );
  const expected = account
    ? Buffer.from(account.passwordHash, "hex")
    : Buffer.alloc(64);
  if (!timingSafeEqual(key, expected) || !account)
    throw new AppError("Email, phone or password is incorrect.", 401);
  const room = await store.get<Room>("room", account.roomId);
  if (!room?.users.some((user) => user.id === account.userId))
    throw new AppError(
      "This account has expired. Register again to start fresh.",
      401,
    );
  const expires = Date.now() + 14 * 86400000;
  await store.put("room", room.id, room, expires);
  await store.put("account", id, account, expires);
  return issueSession(store, room, account.userId);
}
export async function instantDemo(store: Store) {
  const room = createRoom();
  const user = createUser(
    {
      name: "Alex Morgan",
      dob: "2002-06-15",
      contact: "alex@example.test",
      country: "IN",
      timezone: "Asia/Kolkata",
    },
    room,
  );
  room.users.push(user);
  room.notifications.push({
    id: uid(),
    userId: user.id,
    title: "A little curiosity goes a long way",
    body: "Find a mentor, share a skill, or invite a friend to learn together.",
    target: "home",
    read: false,
    createdAt: room.createdAt,
  });
  await store.put("room", room.id, room, Date.now() + 14 * 86400000);
  return issueSession(store, room, user.id);
}
