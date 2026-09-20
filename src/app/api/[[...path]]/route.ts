import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { backendName, transaction } from "@/lib/store";
import {
  AppError,
  assertDemo,
  checkOrigin,
  cookie,
  hash,
  instantDemo,
  issueSession,
  loginAccount,
  limit,
  requireSession,
  secret,
  SESSION_COOKIE,
  CHALLENGE_COOKIE,
  startChallenge,
  verifyChallenge,
} from "@/lib/auth";
import {
  actionSchema,
  applyAction,
  blocked,
  findCircles,
  registrationSchema,
  snapshot,
} from "@/lib/domain";
import type { Room } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
function failure(error: unknown) {
  if (error instanceof z.ZodError)
    return json(
      { error: error.issues[0]?.message ?? "Please check your input." },
      400,
    );
  if (error instanceof AppError)
    return json({ error: error.message }, error.status);
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(
    "SkillLoop API:",
    message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, "[database URL redacted]"),
  );
  return json(
    {
      error: message.startsWith("SETUP:")
        ? message.slice(6)
        : "The service could not complete that request. Check server configuration and try again.",
    },
    503,
  );
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api\/?/, "");
  try {
    if (path === "health")
      return json({
        app: "SkillLoop",
        demo: true,
        configured: true,
      });
    return await transaction(async (store) => {
      if (path === "invite") {
        const token = request.nextUrl.searchParams.get("token") ?? "";
        const invitation = await store.get<{ roomId: string }>(
          "invite",
          hash(token),
        );
        if (!invitation)
          throw new AppError(
            "This invitation expired. Generate a new workspace link.",
            404,
          );
        const room = await store.get<Room>("room", invitation.roomId);
        if (!room) throw new AppError("Workspace expired.", 404);
        return json({
          participants: room.users.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            color: u.color,
          })),
          label:
            "Shared fictional demo workspace. Anyone with this link may play these demo personas.",
        });
      }
      const { room, user } = await requireSession(store, request);
      if (path === "state")
        return json({
          ...snapshot(room, user, backendName()),
          matches: findCircles(room.users, room.skills, user.id).filter(
            (c) =>
              !c.members.some((x) =>
                c.members.some((y) => x !== y && blocked(room, x, y)),
              ),
          ),
        });
      if (path === "messages") {
        const c = room.conversations.find(
          (c) =>
            c.id === request.nextUrl.searchParams.get("id") &&
            c.members.includes(user.id),
        );
        if (
          !c ||
          c.members.some((u) => u !== user.id && blocked(room, user.id, u))
        )
          throw new AppError("Conversation not found or blocked.", 404);
        const before = request.nextUrl.searchParams.get("before");
        const messages = c.messages
          .filter((m) => !before || m.createdAt < before)
          .slice(-100);
        return json({ messages, hasMore: messages.length === 100 });
      }
      throw new AppError("Not found.", 404);
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    assertDemo();
    if (Number(request.headers.get("content-length") ?? 0) > 30000)
      throw new AppError("Request is too large.", 413);
    const raw = await request.text();
    if (raw.length > 30000) throw new AppError("Request is too large.", 413);
    let body: unknown;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      throw new AppError("Invalid JSON.");
    }
    const path = request.nextUrl.pathname.replace(/^\/api\/?/, "");
    const ip = hash(
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local",
    );
    // Commit the rate limit independently so rejected actions also consume an attempt.
    await transaction((store) =>
      limit(store, `${ip}:${path}`, path.startsWith("auth") ? 30 : 180, 60000),
    );
    if (path === "auth/login") {
      const input = z
        .object({
          contact: z.string().trim().min(3).max(180),
          password: z.string().min(1).max(128),
        })
        .parse(body);
      await transaction((store) =>
        limit(
          store,
          `login:${hash(input.contact.toLowerCase())}`,
          10,
          15 * 60000,
        ),
      );
      return await transaction(async (store) => {
        const response = json({ ok: true });
        cookie(
          response,
          SESSION_COOKIE,
          await loginAccount(store, input.contact, input.password),
          604800,
        );
        return response;
      });
    }
    return await transaction(async (store) => {
      if (path === "auth/demo") {
        const response = json({ ok: true });
        cookie(response, SESSION_COOKIE, await instantDemo(store), 604800);
        return response;
      }
      if (path === "auth/start") {
        const input = registrationSchema
          .extend({
            password: z
              .string()
              .min(10, "Use at least 10 characters for your password.")
              .max(128)
              .optional(),
          })
          .parse(body);
        const challenge = await startChallenge(store, request, input);
        const response = json({
          demoCode: challenge.code,
          message: "Demo inbox — no email or SMS sent.",
          expiresIn: 300,
        });
        cookie(response, CHALLENGE_COOKIE, challenge.token, 300);
        return response;
      }
      if (path === "auth/verify") {
        const { code } = z
          .object({ code: z.string().regex(/^\d{6}$/) })
          .parse(body);
        const result = await verifyChallenge(store, request, code);
        if (result.error) return json({ error: result.error }, 400);
        const response = json({ ok: true });
        cookie(response, SESSION_COOKIE, result.token!, 604800);
        cookie(response, CHALLENGE_COOKIE, "", 0);
        return response;
      }
      if (path === "auth/join") {
        const { token, userId } = z
          .object({
            token: z.string().min(20).max(100),
            userId: z.string().uuid(),
          })
          .parse(body);
        const invite = await store.get<{ roomId: string }>(
          "invite",
          hash(token),
        );
        const room = invite
          ? await store.get<Room>("room", invite.roomId)
          : null;
        if (!room?.users.some((u) => u.id === userId))
          throw new AppError("Invitation or persona unavailable.", 403);
        const response = json({ ok: true });
        cookie(
          response,
          SESSION_COOKIE,
          await issueSession(store, room, userId),
          604800,
        );
        return response;
      }
      const { room, user, token } = await requireSession(store, request);
      if (path === "auth/logout") {
        await store.remove("session", hash(token));
        const r = json({ ok: true });
        cookie(r, SESSION_COOKIE, "", 0);
        return r;
      }
      if (path === "auth/switch") {
        const { userId } = z.object({ userId: z.string().uuid() }).parse(body);
        if (!room.users.some((u) => u.id === userId))
          throw new AppError("Persona not in this demo workspace.", 403);
        await store.remove("session", hash(token));
        const r = json({ ok: true });
        cookie(
          r,
          SESSION_COOKIE,
          await issueSession(store, room, userId),
          604800,
        );
        return r;
      }
      if (path === "invite") {
        const inviteToken = secret();
        await store.put(
          "invite",
          hash(inviteToken),
          { roomId: room.id },
          Date.now() + 3600000,
        );
        return json({ token: inviteToken, expiresIn: 3600 });
      }
      if (path === "actions") {
        const result = applyAction(room, user, actionSchema.parse(body));
        await store.put("room", room.id, room, Date.now() + 14 * 86400000);
        return json(result);
      }
      throw new AppError("Not found.", 404);
    });
  } catch (error) {
    return failure(error);
  }
}
