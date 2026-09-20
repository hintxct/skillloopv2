import { z } from "zod";
import { AppError } from "./auth";
import { uid, now, IMAGES } from "./seed";
import {
  CATEGORIES,
  type BadgeDefinition,
  type BadgeProgress,
  type Booking,
  type Leaderboard,
  type LeaderboardEntry,
  type Room,
  type Skill,
  type User,
  type PublicUser,
  type Snapshot,
} from "./types";

const text = (min = 1, max = 500) => z.string().trim().min(min).max(max);
const id = text(1, 80);
const https = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (value) =>
      !value ||
      value.startsWith("/api/files/") ||
      (() => {
        try {
          const u = new URL(value);
          return u.protocol === "https:" && !u.username && !u.password;
        } catch {
          return false;
        }
      })(),
    "Use a valid HTTPS link.",
  );
export const registrationSchema = z.object({
  name: text(2, 60),
  dob: text(10, 10).refine((value) => {
    const birth = new Date(`${value}T00:00:00Z`);
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !isNaN(+birth) &&
      birth.toISOString().slice(0, 10) === value &&
      birth <= cutoff &&
      birth.getUTCFullYear() >= 1900
    );
  }, "This demo is for adults 18 and over. Use a valid date."),
  contact: text(3, 180).refine(
    (v) => /^\d{10}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Enter a sample email or a 10-digit demo phone number.",
  ),
  country: text(2, 2).regex(/^[A-Z]{2}$/),
  timezone: text(1, 80).refine(validZone, "Choose a valid time zone."),
});
function validZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-skill",
    name: "Trailblazer",
    description: "Published your first skill",
    howToEarn: "Publish a skill listing via Share a skill",
    icon: "Sparkles",
    tier: "common",
    category: "onboarding",
    xp: 50,
  },
  {
    id: "skill-collector",
    name: "Skill Collector",
    description: "Published 3 different skills",
    howToEarn: "Share 3 separate skill listings",
    icon: "Layers",
    tier: "rare",
    category: "onboarding",
    xp: 120,
  },
  {
    id: "first-session",
    name: "First Spark",
    description: "Completed your first session",
    howToEarn: "Both participants confirm attendance for any lesson",
    icon: "GraduationCap",
    tier: "common",
    category: "learning",
    xp: 80,
  },
  {
    id: "curious-3",
    name: "Curious Mind",
    description: "Learned 3 sessions",
    howToEarn: "Complete 3 sessions as the learner",
    icon: "BookOpen",
    tier: "rare",
    category: "learning",
    xp: 150,
  },
  {
    id: "mentor-3",
    name: "Generous Mentor",
    description: "Taught 3 sessions",
    howToEarn: "Complete 3 sessions as the teacher",
    icon: "Users",
    tier: "rare",
    category: "teaching",
    xp: 150,
  },
  {
    id: "dedicated-5",
    name: "Dedicated Sage",
    description: "Taught 5 sessions",
    howToEarn: "Complete 5 sessions as the teacher",
    icon: "Award",
    tier: "epic",
    category: "mastery",
    xp: 250,
  },
  {
    id: "swap-master",
    name: "Swap Champion",
    description: "Completed a skill swap",
    howToEarn: "Finish a direct two-person trade (both lessons confirmed)",
    icon: "ArrowLeftRight",
    tier: "rare",
    category: "community",
    xp: 100,
  },
  {
    id: "circle-closer",
    name: "Loop Closer",
    description: "Closed a Trade Circle",
    howToEarn: "Complete a three-person Trade Circle (all 3 lessons)",
    icon: "Orbit",
    tier: "epic",
    category: "community",
    xp: 200,
  },
  {
    id: "communicator",
    name: "Conversation Starter",
    description: "Started 3 conversations",
    howToEarn: "Send messages in 3 different chats",
    icon: "MessageCircle",
    tier: "common",
    category: "community",
    xp: 60,
  },
  {
    id: "scholar",
    name: "Show & Tell",
    description: "Shared learning evidence",
    howToEarn: "Submit work evidence as the learner",
    icon: "FileCheck",
    tier: "common",
    category: "learning",
    xp: 40,
  },
  {
    id: "reviewer",
    name: "Sharp Reviewer",
    description: "Gave peer feedback",
    howToEarn: "Submit feedback on a learner's work as the teacher",
    icon: "MessageSquare",
    tier: "common",
    category: "teaching",
    xp: 40,
  },
  {
    id: "five-star",
    name: "Crowd Favorite",
    description: "Earned a 5-star review",
    howToEarn: "Receive a 5★ rating from a session partner",
    icon: "Star",
    tier: "epic",
    category: "mastery",
    xp: 180,
  },
];
export function getLevel(xp: number) {
  const level = Math.floor(xp / 200) + 1;
  const xpForCurrent = (level - 1) * 200;
  const xpForNext = level * 200;
  const progress = xp - xpForCurrent;
  const needed = xpForNext - xpForCurrent;
  return { level, xpForCurrent, xpForNext, progress, needed };
}
export function computeBadges(room: Room, userId: string): BadgeProgress[] {
  const userSkills = room.skills.filter(
    (s) => s.ownerId === userId && s.status !== "deleted",
  );
  const completed = room.bookings.filter(
    (b) =>
      b.status === "completed" &&
      (b.providerId === userId || b.learnerId === userId),
  );
  const taught = room.bookings.filter(
    (b) =>
      (b.providerId === userId && b.confirmations.length === 2) ||
      (b.learnerId === userId && b.exchangeConfirmations.length === 2),
  );
  const learned = room.bookings.filter(
    (b) =>
      (b.learnerId === userId && b.confirmations.length === 2) ||
      (b.providerId === userId && b.exchangeConfirmations.length === 2),
  );
  const trades = room.bookings.filter(
    (b) =>
      b.kind === "trade" &&
      b.status === "completed" &&
      [b.providerId, b.learnerId].includes(userId),
  );
  const circlesCompleted = room.circles.filter(
    (c) => c.status === "completed" && c.members.includes(userId),
  );
  const conversationsWithMessages = room.conversations.filter((c) =>
    c.messages.some((m) => m.senderId === userId),
  ).length;
  const scholarCount = room.bookings.filter(
    (b) => b.learnerId === userId && !!b.evidence,
  ).length;
  const reviewerCount = room.bookings.filter(
    (b) => b.providerId === userId && !!b.feedback,
  ).length;
  const fiveStarCount = room.reviews.filter(
    (r) => r.subjectId === userId && r.rating === 5,
  ).length;

  const map: Record<
    string,
    { progress: number; total: number; earnedAt?: string }
  > = {
    "first-skill": {
      progress: Math.min(userSkills.length, 1),
      total: 1,
      earnedAt: userSkills[0]?.createdAt,
    },
    "skill-collector": {
      progress: Math.min(userSkills.length, 3),
      total: 3,
      earnedAt: userSkills[2]?.createdAt,
    },
    "first-session": {
      progress: Math.min(completed.length, 1),
      total: 1,
      earnedAt: completed[0]?.updatedAt,
    },
    "curious-3": {
      progress: Math.min(learned.length, 3),
      total: 3,
      earnedAt: learned[2]?.updatedAt,
    },
    "mentor-3": {
      progress: Math.min(taught.length, 3),
      total: 3,
      earnedAt: taught[2]?.updatedAt,
    },
    "dedicated-5": {
      progress: Math.min(taught.length, 5),
      total: 5,
      earnedAt: taught[4]?.updatedAt,
    },
    "swap-master": {
      progress: Math.min(trades.length, 1),
      total: 1,
      earnedAt: trades[0]?.updatedAt,
    },
    "circle-closer": {
      progress: Math.min(circlesCompleted.length, 1),
      total: 1,
      earnedAt: circlesCompleted[0]?.createdAt,
    },
    communicator: {
      progress: Math.min(conversationsWithMessages, 3),
      total: 3,
      earnedAt:
        conversationsWithMessages >= 3
          ? room.conversations
              .filter((c) => c.messages.some((m) => m.senderId === userId))
              .map(
                (c) =>
                  c.messages.find((m) => m.senderId === userId)?.createdAt ??
                  "",
              )
              .sort()[2]
          : undefined,
    },
    scholar: {
      progress: Math.min(scholarCount, 1),
      total: 1,
      earnedAt: room.bookings.find(
        (b) => b.learnerId === userId && !!b.evidence,
      )?.updatedAt,
    },
    reviewer: {
      progress: Math.min(reviewerCount, 1),
      total: 1,
      earnedAt: room.bookings.find(
        (b) => b.providerId === userId && !!b.feedback,
      )?.updatedAt,
    },
    "five-star": {
      progress: Math.min(fiveStarCount, 1),
      total: 1,
      earnedAt: room.reviews.find(
        (r) => r.subjectId === userId && r.rating === 5,
      )?.createdAt,
    },
  };
  return BADGE_DEFINITIONS.map((def) => {
    const m = map[def.id];
    const earned = m.progress >= m.total;
    return {
      ...def,
      earned,
      progress: m.progress,
      total: m.total,
      earnedAt: earned ? m.earnedAt : undefined,
    };
  });
}
export function computeXp(badges: BadgeProgress[]): number {
  return badges.filter((b) => b.earned).reduce((sum, b) => sum + b.xp, 0);
}
export function periodStart(
  period: "weekly" | "monthly" | "sevenDays",
): string {
  const nowMs = Date.now();
  if (period === "sevenDays")
    return new Date(nowMs - 7 * 24 * 3600 * 1000).toISOString();
  if (period === "weekly") {
    const d = new Date(nowMs);
    const day = d.getUTCDay();
    const diff = (day + 6) % 7;
    const monday = new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate() - diff,
        0,
        0,
        0,
        0,
      ),
    );
    return monday.toISOString();
  }
  const d = new Date(nowMs);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0),
  ).toISOString();
}
export function scoreForUser(room: Room, userId: string, since: string) {
  let points = 0;
  let completed = 0;
  let taught = 0;
  let learned = 0;
  for (const b of room.bookings) {
    if (b.status !== "completed" || b.updatedAt < since) continue;
    const isProvider = b.providerId === userId;
    const isLearner = b.learnerId === userId;
    const involved =
      isProvider ||
      isLearner ||
      b.confirmations.includes(userId) ||
      b.exchangeConfirmations.includes(userId);
    if (!involved) continue;
    // Count involvement
    if (involved) completed++;
    let base = 40;
    if (b.kind === "trade") base += 15;
    if (b.circleId) base += 20;
    // taught/learned in period
    if (
      (isProvider && b.confirmations.includes(userId)) ||
      (isLearner && b.exchangeConfirmations.includes(userId))
    )
      taught++;
    if (
      (isLearner && b.confirmations.includes(userId)) ||
      (isProvider && b.exchangeConfirmations.includes(userId))
    )
      learned++;
    // For direct pending but taught detection based on role + confirmations
    if ([b.providerId, b.learnerId].includes(userId)) points += base;
    else if (involved) points += 20;
  }
  // Published skills in period
  const skillsInPeriod = room.skills.filter(
    (s) =>
      s.ownerId === userId && s.status !== "deleted" && s.createdAt >= since,
  ).length;
  points += skillsInPeriod * 25;
  // Reviews received
  for (const r of room.reviews) {
    if (r.subjectId === userId && r.createdAt >= since) {
      points += 30;
      if (r.rating === 5) points += 20;
    }
    if (r.authorId === userId && r.createdAt >= since) points += 10;
  }
  // Messages sent (cap 20)
  let msgCount = 0;
  for (const c of room.conversations) {
    for (const m of c.messages) {
      if (m.senderId === userId && m.createdAt >= since) msgCount++;
    }
  }
  points += Math.min(msgCount * 2, 20);
  // Posts
  const postsInPeriod = room.posts.filter(
    (p) => p.userId === userId && p.createdAt >= since,
  ).length;
  points += postsInPeriod * 15;
  return { points, completed, taught, learned };
}
export function buildLeaderboard(
  room: Room,
  period: "weekly" | "monthly" | "sevenDays",
): LeaderboardEntry[] {
  const since = periodStart(period);
  const entries: LeaderboardEntry[] = room.users.map((u) => {
    const badges = computeBadges(room, u.id);
    const xp = computeXp(badges);
    const { level } = getLevel(xp);
    const { points, completed, taught, learned } = scoreForUser(
      room,
      u.id,
      since,
    );
    return {
      userId: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      color: u.color,
      country: u.country,
      points,
      xp,
      level,
      completed,
      taught,
      learned,
      rank: 0,
    };
  });
  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.xp !== a.xp) return b.xp - a.xp;
    return a.name.localeCompare(b.name);
  });
  entries.forEach((e, i) => (e.rank = i + 1));
  return entries;
}
const skillSchema = z.object({
  title: text(5, 90),
  category: z.enum(CATEGORIES),
  description: text(20, 2000),
  outcome: text(10, 300),
  tags: z
    .array(text(1, 30))
    .min(1)
    .max(8)
    .refine(
      (tags) =>
        new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length,
      "Each search tag must be unique.",
    ),
  language: text(2, 40),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.number().int().min(15).max(120),
  modes: z
    .array(z.enum(["trade", "paid", "free"]))
    .min(1)
    .max(3),
  price: z.number().int().min(0).max(100000),
  delivery: z.enum(["online", "in-person"]),
  proof: https,
});
export const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("profile"),
    name: text(2, 60),
    username: text(3, 24).regex(/^[a-zA-Z0-9_]+$/),
    bio: text(0, 500),
    country: text(2, 2),
    city: text(0, 80),
    languages: z.array(text(2, 40)).min(1).max(8),
    timezone: text(1, 80).refine(validZone),
    avatar: https,
    wants: z.array(text(1, 40)).max(10),
    available: z.boolean(),
    socials: z
      .array(
        z.object({
          label: text(1, 30),
          url: https.refine((v) => v.startsWith("https:")),
        }),
      )
      .max(7),
  }),
  z.object({
    action: z.literal("skill"),
    skillId: id.optional(),
    publish: z.boolean().optional(),
    data: skillSchema,
  }),
  z.object({ action: z.literal("pause"), skillId: id }),
  z.object({ action: z.literal("delete-skill"), skillId: id }),
  z.object({ action: z.literal("save"), skillId: id }),
  z.object({
    action: z.literal("post"),
    title: text(5, 100),
    description: text(10, 600),
    category: z.enum(CATEGORIES),
    language: text(2, 40),
    delivery: z.enum(["online", "in-person"]),
  }),
  z.object({
    action: z.literal("request"),
    skillId: id,
    kind: z.enum(["trade", "paid", "free"]),
    exchangeSkillId: id.optional(),
    startsAt: z.iso.datetime(),
    exchangeStartsAt: z.iso.datetime().optional(),
    note: text(0, 800),
  }),
  z.object({
    action: z.literal("booking"),
    bookingId: id,
    operation: z.enum([
      "accept",
      "decline",
      "cancel",
      "confirm",
      "confirm-exchange",
      "pay",
      "counter",
      "propose-time",
      "accept-time",
      "meeting",
      "evidence",
      "feedback",
      "dispute",
    ]),
    value: text(0, 2000).optional(),
  }),
  z.object({ action: z.literal("conversation"), userId: id }),
  z.object({ action: z.literal("accept-chat"), conversationId: id }),
  z.object({
    action: z.literal("message"),
    conversationId: id,
    text: text(1, 3000),
    clientId: id,
  }),
  z.object({ action: z.literal("read"), conversationId: id, messageId: id }),
  z.object({ action: z.literal("notifications") }),
  z.object({
    action: z.literal("review"),
    bookingId: id,
    rating: z.number().int().min(1).max(5),
    text: text(5, 700),
  }),
  z.object({ action: z.literal("block"), userId: id }),
  z.object({
    action: z.literal("report"),
    target: text(1, 150),
    reason: text(10, 1000),
  }),
  z.object({
    action: z.literal("circle"),
    members: z.array(id).length(3),
    skillIds: z.array(id).length(3),
    startsAt: z.array(z.iso.datetime()).length(3),
  }),
  z.object({
    action: z.literal("circle-response"),
    circleId: id,
    accept: z.boolean(),
  }),
  z.object({
    action: z.literal("call"),
    conversationId: id.optional(),
    bookingId: id.optional(),
  }),
  z.object({ action: z.literal("call-read") }),
]);
export type Action = z.infer<typeof actionSchema>;
export function assert(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new AppError(message, status);
}
export function blocked(room: Room, a: string, b: string) {
  return room.blocks.some(
    (block) =>
      (block.by === a && block.target === b) ||
      (block.by === b && block.target === a),
  );
}
function notice(
  room: Room,
  userId: string,
  title: string,
  body: string,
  target = "requests",
) {
  room.notifications.push({
    id: uid(),
    userId,
    title,
    body,
    target,
    read: false,
    createdAt: now(),
  });
  room.notifications = room.notifications.slice(-500);
}
export function expire(room: Room) {
  for (const b of room.bookings)
    if (
      b.status === "awaiting-payment" &&
      b.holdUntil &&
      +new Date(b.holdUntil) < Date.now()
    )
      b.status = "expired";
}
export function overlaps(
  start: string,
  duration: number,
  other: string,
  otherDuration: number,
) {
  return (
    +new Date(start) < +new Date(other) + otherDuration * 60000 &&
    +new Date(other) < +new Date(start) + duration * 60000
  );
}
function future(value: string) {
  assert(
    Number.isFinite(+new Date(value)) && +new Date(value) > Date.now() + 60000,
    "Choose a time at least one minute in the future.",
  );
}
export function checkSlot(
  room: Room,
  people: string[],
  start: string,
  duration: number,
  exclude?: string,
) {
  future(start);
  for (const b of room.bookings) {
    if (
      b.id === exclude ||
      !["scheduled", "awaiting-payment"].includes(b.status)
    )
      continue;
    if (
      b.status === "awaiting-payment" &&
      b.holdUntil &&
      +new Date(b.holdUntil) < Date.now()
    )
      continue;
    if (!people.some((p) => p === b.learnerId || p === b.providerId)) continue;
    assert(
      !overlaps(start, duration, b.startsAt, b.duration),
      "One participant already has a booking at that time.",
      409,
    );
    if (b.exchangeStartsAt)
      assert(
        !overlaps(
          start,
          duration,
          b.exchangeStartsAt,
          b.exchangeDuration ?? 45,
        ),
        "This time overlaps a trade commitment.",
        409,
      );
  }
}
function checkBooking(room: Room, b: Booking) {
  checkSlot(room, [b.providerId, b.learnerId], b.startsAt, b.duration, b.id);
  if (b.exchangeStartsAt) {
    checkSlot(
      room,
      [b.providerId, b.learnerId],
      b.exchangeStartsAt,
      b.exchangeDuration ?? 45,
      b.id,
    );
    assert(
      !overlaps(
        b.startsAt,
        b.duration,
        b.exchangeStartsAt,
        b.exchangeDuration ?? 45,
      ),
      "The two trade lessons must be at different times.",
    );
  }
}
function conversation(
  room: Room,
  members: string[],
  title: string,
  accepted: boolean,
  bookingId?: string,
) {
  let c = room.conversations.find(
    (c) =>
      !c.bookingId &&
      c.members.length === members.length &&
      members.every((id) => c.members.includes(id)),
  );
  if (!c) {
    c = {
      id: uid(),
      members,
      title,
      accepted,
      initiatedBy: members[0],
      messages: [],
      read: {},
      bookingId,
    };
    room.conversations.push(c);
  }
  if (accepted) c.accepted = true;
  return c;
}
function refund(room: Room, b: Booking) {
  const payment = room.payments.find(
    (p) => p.bookingId === b.id && p.status === "confirmed",
  );
  if (payment) {
    const payer = room.users.find((u) => u.id === payment.payerId)!;
    const recipient = room.users.find((u) => u.id === payment.recipientId)!;
    // This demo ledger allows cancellation before completion; refunds are simulated only.
    assert(
      recipient.balance >= payment.amount,
      "Refund needs review: the simulated recipient balance is too low.",
    );
    payer.balance += payment.amount;
    recipient.balance -= payment.amount;
    payment.status = "refunded";
  }
}
export function publicUser(room: Room, u: User): PublicUser {
  const taught = room.bookings.filter(
    (b) =>
      (b.providerId === u.id && b.confirmations.length === 2) ||
      (b.learnerId === u.id && b.exchangeConfirmations.length === 2),
  );
  const learned = room.bookings.filter(
    (b) =>
      (b.learnerId === u.id && b.confirmations.length === 2) ||
      (b.providerId === u.id && b.exchangeConfirmations.length === 2),
  );
  const reviews = room.reviews.filter((r) => r.subjectId === u.id);
  const badges = computeBadges(room, u.id);
  const xp = computeXp(badges);
  const { level, xpForNext } = getLevel(xp);
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    bio: u.bio,
    country: u.country,
    city: u.city,
    languages: u.languages,
    timezone: u.timezone,
    avatar: u.avatar,
    color: u.color,
    wants: u.wants,
    socials: u.socials,
    available: u.available,
    presence: false,
    createdAt: u.createdAt,
    stats: {
      taught: taught.length,
      learned: learned.length,
      trades: room.bookings.filter(
        (b) =>
          b.kind === "trade" &&
          b.status === "completed" &&
          [b.providerId, b.learnerId].includes(u.id),
      ).length,
      minutes: taught.reduce(
        (n, b) =>
          n + (b.providerId === u.id ? b.duration : (b.exchangeDuration ?? 45)),
        0,
      ),
      rating: reviews.length
        ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length
        : 0,
      reviews: reviews.length,
    },
    badges,
    xp,
    level,
    nextLevelXp: xpForNext,
  };
}
export function snapshot(room: Room, me: User, backend: string): Snapshot {
  expire(room);
  const myBadges = computeBadges(room, me.id);
  const myXp = computeXp(myBadges);
  const { level: myLevel, xpForNext: myNextLevelXp } = getLevel(myXp);
  const leaderboard: Leaderboard = {
    weekly: buildLeaderboard(room, "weekly"),
    monthly: buildLeaderboard(room, "monthly"),
    sevenDays: buildLeaderboard(room, "sevenDays"),
  };
  return {
    me,
    roomId: room.id,
    backend,
    users: room.users.map((u) => publicUser(room, u)),
    skills: room.skills.filter(
      (s) =>
        s.status !== "deleted" &&
        (s.status === "published" || s.ownerId === me.id),
    ),
    bookings: room.bookings.filter((b) =>
      [b.providerId, b.learnerId].includes(me.id),
    ),
    conversations: room.conversations
      .filter((c) => c.members.includes(me.id))
      .map(({ messages, ...c }) => ({
        ...c,
        unread: messages.filter(
          (m) => m.senderId !== me.id && m.createdAt > (c.read[me.id] ?? ""),
        ).length,
        lastMessage: messages.at(-1)?.text ?? "Start with a friendly hello",
        lastAt: messages.at(-1)?.createdAt,
      })),
    notifications: room.notifications
      .filter((n) => n.userId === me.id)
      .reverse(),
    payments: room.payments.filter(
      (p) => p.payerId === me.id || p.recipientId === me.id,
    ),
    reviews: room.reviews,
    circles: room.circles.filter((c) => c.members.includes(me.id)),
    posts: room.posts,
    saved: room.saved[me.id] ?? [],
    blocks: room.blocks.filter((b) => b.by === me.id).map((b) => b.target),
    reports: room.reports.filter((r) => r.authorId === me.id),
    badgeDefinitions: BADGE_DEFINITIONS,
    leaderboard,
    myBadges,
    myXp,
    myLevel,
    myNextLevelXp,
  };
}
export function findCircles(
  users: Pick<User, "id" | "wants" | "available">[],
  skills: Skill[],
  me: string,
) {
  const available = skills.filter(
    (s) =>
      s.status === "published" &&
      s.modes.includes("trade") &&
      users.find((u) => u.id === s.ownerId)?.available,
  );
  const wants = (learner: string, s: Skill) =>
    users
      .find((u) => u.id === learner)
      ?.wants.some((w) =>
        s.tags.some((t) => t.toLowerCase() === w.toLowerCase()),
      );
  const results: { members: string[]; skillIds: string[] }[] = [];
  for (const a of available.filter((s) => s.ownerId === me))
    for (const b of available.filter((s) => s.ownerId !== me))
      for (const c of available.filter(
        (s) => s.ownerId !== me && s.ownerId !== b.ownerId,
      )) {
        if (results.length >= 6) return results;
        if (
          a.delivery === "online" &&
          b.delivery === "online" &&
          c.delivery === "online" &&
          a.language === b.language &&
          b.language === c.language &&
          wants(b.ownerId, a) &&
          wants(c.ownerId, b) &&
          wants(a.ownerId, c) &&
          !results.some(
            (r) => r.members[1] === b.ownerId && r.members[2] === c.ownerId,
          )
        )
          results.push({
            members: [a.ownerId, b.ownerId, c.ownerId],
            skillIds: [a.id, b.id, c.id],
          });
      }
  return results;
}

export function applyAction(
  room: Room,
  me: User,
  a: Action,
): Record<string, unknown> {
  expire(room);
  if (a.action === "profile") {
    const username = a.username.toLowerCase();
    assert(
      !["admin", "support", "skillloop", "moderator"].includes(username),
      "That username is reserved.",
    );
    assert(
      !room.users.some(
        (u) => u.id !== me.id && u.username.toLowerCase() === username,
      ),
      "That username is taken.",
      409,
    );
    const { action: _action, ...data } = a;
    void _action;
    Object.assign(me, data, { username });
  } else if (a.action === "skill") {
    assert(
      a.data.price > 0 || !a.data.modes.includes("paid"),
      "Paid sessions need a positive price.",
    );
    if (a.skillId) {
      const s = room.skills.find(
        (s) =>
          s.id === a.skillId && s.ownerId === me.id && s.status !== "deleted",
      );
      assert(s, "Skill not found.", 404);
      Object.assign(s, a.data);
      if (a.publish) s.status = "published";
    } else {
      assert(
        room.skills.filter((s) => s.ownerId === me.id && s.status !== "deleted")
          .length < 20,
        "Demo limit: 20 skills per participant.",
      );
      const image =
        a.data.category === "Development"
          ? IMAGES.code
          : a.data.category === "Design"
            ? IMAGES.design
            : a.data.category === "Music"
              ? IMAGES.guitar
              : a.data.category === "Business"
                ? IMAGES.business
                : a.data.category === "Languages"
                  ? IMAGES.language
                  : IMAGES.camera;
      room.skills.unshift({
        ...a.data,
        id: uid(),
        ownerId: me.id,
        status: "published",
        createdAt: now(),
        image,
      });
    }
  } else if (a.action === "delete-skill") {
    const s = room.skills.find(
      (s) => s.id === a.skillId && s.ownerId === me.id,
    );
    assert(s, "Skill not found.", 404);
    if (s.status === "deleted") return { ok: true };
    assert(
      !room.bookings.some(
        (b) =>
          (b.skillId === s.id || b.exchangeSkillId === s.id) &&
          ["pending", "countered", "awaiting-payment", "scheduled"].includes(
            b.status,
          ),
      ) &&
        !room.circles.some(
          (c) =>
            c.skillIds.includes(s.id) &&
            ["inviting", "active"].includes(c.status),
        ),
      "This skill has an open booking or Trade Circle. Complete or cancel those commitments first. You can pause the listing meanwhile.",
      409,
    );
    // Remove the listing, not historical bookings, payments or peer feedback.
    s.status = "deleted";
    for (const userId of Object.keys(room.saved))
      room.saved[userId] = room.saved[userId].filter(
        (skillId) => skillId !== s.id,
      );
  } else if (a.action === "pause") {
    const s = room.skills.find(
      (s) =>
        s.id === a.skillId && s.ownerId === me.id && s.status !== "deleted",
    );
    assert(s, "Skill not found.", 404);
    s.status = s.status === "published" ? "paused" : "published";
  } else if (a.action === "save") {
    assert(
      room.skills.some((s) => s.id === a.skillId && s.status === "published"),
      "Skill not found.",
      404,
    );
    const list = room.saved[me.id] ?? [];
    room.saved[me.id] = list.includes(a.skillId)
      ? list.filter((s) => s !== a.skillId)
      : [...list, a.skillId];
  } else if (a.action === "post") {
    assert(
      room.posts.length < 150,
      "This demo workspace has reached its post limit.",
    );
    room.posts.unshift({
      id: uid(),
      userId: me.id,
      title: a.title,
      description: a.description,
      category: a.category,
      language: a.language,
      delivery: a.delivery,
      createdAt: now(),
    });
  } else if (a.action === "request") {
    const s = room.skills.find(
      (s) => s.id === a.skillId && s.status === "published",
    );
    assert(s, "This skill is no longer available.", 404);
    const provider = room.users.find((u) => u.id === s.ownerId)!;
    assert(
      s.ownerId !== me.id && !blocked(room, me.id, s.ownerId),
      "You cannot request this session.",
      403,
    );
    assert(
      provider.available && s.modes.includes(a.kind),
      "This booking option is unavailable.",
    );
    assert(room.bookings.length < 250, "Demo booking limit reached.");
    assert(
      !room.bookings.some(
        (b) =>
          b.learnerId === me.id &&
          b.skillId === s.id &&
          ["pending", "countered", "awaiting-payment", "scheduled"].includes(
            b.status,
          ),
      ),
      "You already have an active request for this skill.",
      409,
    );
    const exchange =
      a.kind === "trade"
        ? room.skills.find(
            (s) =>
              s.id === a.exchangeSkillId &&
              s.ownerId === me.id &&
              s.status === "published" &&
              s.modes.includes("trade"),
          )
        : undefined;
    if (a.kind === "trade")
      assert(
        exchange && a.exchangeStartsAt,
        "Choose your trade skill and the time for your lesson.",
      );
    const b: Booking = {
      id: uid(),
      learnerId: me.id,
      providerId: s.ownerId,
      skillId: s.id,
      kind: a.kind,
      title: s.title,
      outcome: s.outcome,
      duration: s.duration,
      price: a.kind === "paid" ? s.price : 0,
      startsAt: a.startsAt,
      exchangeSkillId: exchange?.id,
      exchangeTitle: exchange?.title,
      exchangeOutcome: exchange?.outcome,
      exchangeDuration: exchange?.duration,
      exchangeStartsAt: exchange ? a.exchangeStartsAt : undefined,
      note: a.note,
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
      meeting: "",
      confirmations: [],
      exchangeConfirmations: [],
      evidence: "",
      feedback: "",
      demonstrated: false,
      dispute: "",
    };
    checkBooking(room, b);
    room.bookings.unshift(b);
    notice(
      room,
      s.ownerId,
      "A new learning connection",
      `${me.name} requested ${s.title}.`,
    );
    return { bookingId: b.id };
  } else if (a.action === "booking") {
    const b = room.bookings.find((b) => b.id === a.bookingId);
    assert(
      b && [b.providerId, b.learnerId].includes(me.id),
      "Booking not found.",
      404,
    );
    const other = b.providerId === me.id ? b.learnerId : b.providerId;
    if (a.operation === "accept") {
      assert(
        (b.status === "pending" && me.id === b.providerId) ||
          (b.status === "countered" && b.counterBy !== me.id),
        "This request is not awaiting your acceptance.",
        409,
      );
      assert(!blocked(room, me.id, other), "This connection is blocked.", 403);
      checkBooking(room, b);
      b.status = b.kind === "paid" ? "awaiting-payment" : "scheduled";
      b.holdUntil = new Date(Date.now() + 15 * 60000).toISOString();
      conversation(room, [b.learnerId, b.providerId], b.title, true, b.id);
    } else if (a.operation === "decline") {
      assert(
        ["pending", "countered"].includes(b.status) &&
          (me.id === b.providerId || b.counterBy !== me.id),
        "This request cannot be declined.",
      );
      b.status = "declined";
    } else if (a.operation === "cancel") {
      assert(
        !["completed", "cancelled", "declined", "expired"].includes(b.status),
        "This session is already closed.",
      );
      assert(
        !b.circleId,
        "Cancel a Trade Circle from the Trade panel so all participants are informed.",
      );
      assert(
        b.confirmations.length === 0 && b.exchangeConfirmations.length === 0,
        "Partially completed sessions need a dispute review rather than automatic cancellation.",
      );
      refund(room, b);
      b.status = "cancelled";
    } else if (a.operation === "counter") {
      assert(
        ["pending", "countered"].includes(b.status),
        "This request can no longer be counter-proposed.",
      );
      assert(
        (b.status === "pending" && me.id === b.providerId) ||
          (b.status === "countered" && b.counterBy !== me.id),
        "Wait for the other participant's response.",
      );
      future(a.value ?? "");
      b.startsAt = new Date(a.value!).toISOString();
      checkBooking(room, b);
      b.status = "countered";
      b.counterBy = me.id;
    } else if (a.operation === "pay") {
      assert(me.id === b.learnerId, "Only the learner can pay.", 403);
      if (
        room.payments.some(
          (p) => p.bookingId === b.id && p.status === "confirmed",
        )
      )
        return { message: "Already paid." };
      assert(
        b.kind === "paid" && b.status === "awaiting-payment",
        "This payment hold expired or is not payable.",
        409,
      );
      checkBooking(room, b);
      assert(me.balance >= b.price, "Not enough simulated funds.");
      me.balance -= b.price;
      room.users.find((u) => u.id === b.providerId)!.balance += b.price;
      room.payments.push({
        id: uid(),
        bookingId: b.id,
        payerId: me.id,
        recipientId: b.providerId,
        amount: b.price,
        status: "confirmed",
        createdAt: now(),
      });
      b.status = "scheduled";
    } else if (
      a.operation === "confirm" ||
      a.operation === "confirm-exchange"
    ) {
      assert(
        ["scheduled", "completed"].includes(b.status),
        "Only a scheduled session can be confirmed.",
      );
      const exchange = a.operation === "confirm-exchange";
      assert(
        !exchange || b.exchangeSkillId,
        "This session has no exchange lesson.",
      );
      const list = exchange ? b.exchangeConfirmations : b.confirmations;
      if (!list.includes(me.id)) list.push(me.id);
      if (
        b.confirmations.length === 2 &&
        (!b.exchangeSkillId || b.exchangeConfirmations.length === 2)
      )
        b.status = "completed";
      if (b.circleId) {
        const c = room.circles.find((c) => c.id === b.circleId)!;
        if (
          room.bookings
            .filter((x) => x.circleId === c.id)
            .every((x) => x.status === "completed")
        )
          c.status = "completed";
      }
    } else if (a.operation === "propose-time") {
      assert(
        b.status === "scheduled" && !b.circleId && b.confirmations.length === 0,
        "This session cannot be rescheduled here.",
      );
      future(a.value ?? "");
      b.proposedAt = new Date(a.value!).toISOString();
      b.rescheduleBy = me.id;
    } else if (a.operation === "accept-time") {
      assert(
        b.status === "scheduled" && b.proposedAt && b.rescheduleBy !== me.id,
        "No reschedule proposal is awaiting your acceptance.",
      );
      const updated = { ...b, startsAt: b.proposedAt };
      checkBooking(room, updated);
      b.startsAt = b.proposedAt;
      delete b.proposedAt;
      delete b.rescheduleBy;
    } else if (a.operation === "meeting") {
      assert(
        me.id === b.providerId && b.status === "scheduled",
        "Only the provider can set a scheduled meeting link.",
      );
      b.meeting = https.parse(a.value ?? "");
    } else if (a.operation === "evidence") {
      assert(
        me.id === b.learnerId && ["scheduled", "completed"].includes(b.status),
        "Only the learner can submit work for this session.",
      );
      b.evidence = text(10, 2000).parse(a.value);
      b.demonstrated = false;
      b.feedback = "";
    } else if (a.operation === "feedback") {
      assert(
        me.id === b.providerId &&
          b.evidence &&
          ["scheduled", "completed"].includes(b.status),
        "Only the provider can review submitted evidence.",
      );
      b.feedback = text(10, 2000).parse(a.value);
      b.demonstrated = true;
    } else if (a.operation === "dispute") {
      b.dispute = text(10, 1000).parse(a.value);
      room.reports.push({
        id: uid(),
        authorId: me.id,
        target: `booking:${b.id}`,
        reason: b.dispute,
        createdAt: now(),
        status: "open",
      });
    }
    b.updatedAt = now();
    notice(room, other, "Session updated", `${me.name} updated ${b.title}.`);
  } else if (a.action === "conversation") {
    assert(
      a.userId !== me.id &&
        room.users.some((u) => u.id === a.userId) &&
        !blocked(room, me.id, a.userId),
      "You cannot message this participant.",
      403,
    );
    const c = conversation(
      room,
      [me.id, a.userId],
      "A new learning connection",
      false,
    );
    notice(
      room,
      a.userId,
      "Message request",
      `${me.name} would like to connect.`,
      "chat",
    );
    return { conversationId: c.id };
  } else if (["message", "read", "accept-chat"].includes(a.action)) {
    if (!("conversationId" in a)) return {};
    const c = room.conversations.find(
      (c) => c.id === a.conversationId && c.members.includes(me.id),
    );
    assert(c, "Conversation not found.", 404);
    assert(
      !c.members.some((u) => u !== me.id && blocked(room, me.id, u)),
      "This conversation is blocked.",
      403,
    );
    if (a.action === "accept-chat") {
      assert(c.initiatedBy !== me.id, "Only the recipient can accept.");
      c.accepted = true;
    }
    if (a.action === "read") {
      const message = c.messages.find((m) => m.id === a.messageId);
      assert(message, "Message not found.", 404);
      // A newer message may arrive between fetching the thread and this acknowledgement.
      // Only acknowledge what the browser actually displayed; never move backwards.
      if (message.createdAt > (c.read[me.id] ?? ""))
        c.read[me.id] = message.createdAt;
    }
    if (a.action === "message") {
      if (
        c.messages.some(
          (m) => m.clientId === a.clientId && m.senderId === me.id,
        )
      ) {
        return { ok: true };
      }
      assert(
        c.accepted || (c.initiatedBy === me.id && !c.messages.length),
        "Wait for the recipient to accept your message request.",
      );
      assert(
        c.messages.length < 500,
        "This demo conversation reached its message limit.",
      );
      c.messages.push({
        id: uid(),
        senderId: me.id,
        text: a.text,
        clientId: a.clientId,
        createdAt: now(),
      });
      c.read[me.id] = now();
    }
  } else if (a.action === "notifications")
    room.notifications
      .filter((n) => n.userId === me.id)
      .forEach((n) => (n.read = true));
  else if (a.action === "call-read")
    room.notifications
      .filter((n) => n.userId === me.id && n.target.startsWith("call:"))
      .forEach((n) => (n.read = true));
  else if (a.action === "call") {
    // Ring the other participant(s): creates an unread call notification.
    // Target format: call:<conversationId|booking:bookingId> so the client can join the same Jitsi room.
    assert(
      a.conversationId || a.bookingId,
      "Choose a conversation or session to call.",
    );
    if (a.conversationId) {
      const c = room.conversations.find(
        (c) => c.id === a.conversationId && c.members.includes(me.id),
      );
      assert(c, "Conversation not found.", 404);
      assert(
        !c.members.some((u) => u !== me.id && blocked(room, me.id, u)),
        "This conversation is blocked.",
        403,
      );
      const targets = c.members.filter((u) => u !== me.id);
      assert(targets.length > 0, "No one to call.", 400);
      // Avoid spam: one ringing notification per conversation per 30s per caller
      const recent = room.notifications.some(
        (n) =>
          n.target === `call:${c.id}` &&
          n.body.includes(me.name) &&
          Date.now() - +new Date(n.createdAt) < 30000,
      );
      if (!recent) {
        for (const target of targets) {
          notice(
            room,
            target,
            `Incoming video call from ${me.name}`,
            `${me.name} is calling you — tap to join the same video room.`,
            `call:${c.id}`,
          );
        }
      }
      return { callTarget: `call:${c.id}`, roomName: `SkillLoop-${c.id}` };
    }
    const b = room.bookings.find(
      (b) =>
        b.id === a.bookingId && [b.providerId, b.learnerId].includes(me.id),
    );
    assert(b, "Booking not found.", 404);
    const other = b.providerId === me.id ? b.learnerId : b.providerId;
    const recent = room.notifications.some(
      (n) =>
        n.target === `call:booking:${b.id}` &&
        n.body.includes(me.name) &&
        Date.now() - +new Date(n.createdAt) < 30000,
    );
    if (!recent) {
      notice(
        room,
        other,
        `Incoming video call from ${me.name}`,
        `${me.name} is calling about “${b.title}” — tap to join.`,
        `call:booking:${b.id}`,
      );
    }
    return {
      callTarget: `call:booking:${b.id}`,
      roomName: `SkillLoop-${b.circleId || b.id}`,
    };
  } else if (a.action === "review") {
    const b = room.bookings.find(
      (b) =>
        b.id === a.bookingId &&
        b.status === "completed" &&
        [b.providerId, b.learnerId].includes(me.id),
    );
    assert(b, "Complete a session before reviewing it.");
    assert(
      !room.reviews.some((r) => r.bookingId === b.id && r.authorId === me.id),
      "You already reviewed this session.",
      409,
    );
    room.reviews.push({
      id: uid(),
      bookingId: b.id,
      authorId: me.id,
      subjectId: b.providerId === me.id ? b.learnerId : b.providerId,
      rating: a.rating,
      text: a.text,
      createdAt: now(),
    });
  } else if (a.action === "block") {
    assert(
      a.userId !== me.id && room.users.some((u) => u.id === a.userId),
      "Invalid participant.",
    );
    const exists = room.blocks.some(
      (b) => b.by === me.id && b.target === a.userId,
    );
    room.blocks = room.blocks.filter(
      (b) => !(b.by === me.id && b.target === a.userId),
    );
    if (!exists) room.blocks.push({ by: me.id, target: a.userId });
  } else if (a.action === "report") {
    assert(room.reports.length < 100, "Demo report limit reached.");
    room.reports.push({
      id: uid(),
      authorId: me.id,
      target: a.target,
      reason: a.reason,
      createdAt: now(),
      status: "open",
    });
  } else if (a.action === "circle") {
    assert(
      a.members[0] === me.id && new Set(a.members).size === 3,
      "Start a circle with yourself and two different participants.",
    );
    assert(
      findCircles(room.users, room.skills, me.id).some(
        (c) =>
          c.skillIds.join() === a.skillIds.join() &&
          c.members.join() === a.members.join(),
      ),
      "This circle is no longer compatible.",
    );
    assert(
      !a.members.some((x) =>
        a.members.some((y) => x !== y && blocked(room, x, y)),
      ),
      "A participant is blocked.",
    );
    assert(
      !room.circles.some(
        (c) =>
          ["inviting", "active"].includes(c.status) &&
          c.members.every((x) => a.members.includes(x)),
      ),
      "This group already has an active circle.",
    );
    assert(room.circles.length < 30, "Demo circle limit reached.");
    a.startsAt.forEach((s, i) =>
      checkSlot(
        room,
        [a.members[i], a.members[(i + 1) % 3]],
        s,
        room.skills.find((s) => s.id === a.skillIds[i])!.duration,
      ),
    );
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++)
        assert(
          !overlaps(
            a.startsAt[i],
            room.skills.find((s) => s.id === a.skillIds[i])!.duration,
            a.startsAt[j],
            room.skills.find((s) => s.id === a.skillIds[j])!.duration,
          ),
          "Circle lessons must not overlap.",
        );
    room.circles.push({
      id: uid(),
      members: a.members,
      skillIds: a.skillIds,
      accepted: [me.id],
      status: "inviting",
      createdAt: now(),
      startsAt: a.startsAt,
    });
    a.members
      .filter((x) => x !== me.id)
      .forEach((x) =>
        notice(
          room,
          x,
          "You're invited to a Trade Circle",
          "Three people. Three skills. One learning loop.",
          "trade",
        ),
      );
  } else if (a.action === "circle-response") {
    const c = room.circles.find(
      (c) => c.id === a.circleId && c.members.includes(me.id),
    );
    assert(
      c && ["inviting", "active"].includes(c.status),
      "Circle is not awaiting a response.",
    );
    if (!a.accept) {
      c.status = "cancelled";
      room.bookings
        .filter((b) => b.circleId === c.id && b.status !== "completed")
        .forEach((b) => {
          b.status = "cancelled";
        });
    } else {
      assert(c.status === "inviting", "Circle is already active.");
      assert(
        !c.members.some((x) =>
          c.members.some((y) => x !== y && blocked(room, x, y)),
        ),
        "A participant is blocked.",
      );
      if (!c.accepted.includes(me.id)) c.accepted.push(me.id);
      if (c.accepted.length === 3) {
        for (let i = 0; i < 3; i++) {
          const s = room.skills.find((s) => s.id === c.skillIds[i]);
          assert(
            s?.status === "published" && s.modes.includes("trade"),
            "A skill is no longer offered for trade.",
          );
          const learner = c.members[(i + 1) % 3];
          checkSlot(room, [s.ownerId, learner], c.startsAt[i], s.duration);
          const b: Booking = {
            id: uid(),
            learnerId: learner,
            providerId: s.ownerId,
            skillId: s.id,
            kind: "trade",
            title: s.title,
            outcome: s.outcome,
            duration: s.duration,
            price: 0,
            startsAt: c.startsAt[i],
            note: "Part of a three-person Trade Circle",
            status: "scheduled",
            createdAt: now(),
            updatedAt: now(),
            meeting: "",
            confirmations: [],
            exchangeConfirmations: [],
            evidence: "",
            feedback: "",
            demonstrated: false,
            dispute: "",
            circleId: c.id,
          };
          room.bookings.push(b);
          conversation(room, [learner, s.ownerId], s.title, true, b.id);
        }
        // Group chat for the whole circle — 3 members together
        conversation(
          room,
          [...c.members].sort(),
          `Trade Circle • ${c.members.length} learners`,
          true,
        );
        c.status = "active";
      }
    }
    c.members
      .filter((x) => x !== me.id)
      .forEach((x) =>
        notice(
          room,
          x,
          "Trade Circle updated",
          `${me.name} ${a.accept ? "accepted the invitation" : "cancelled their participation"}.`,
          "trade",
        ),
      );
  }
  return { ok: true };
}
