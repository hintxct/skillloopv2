"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  FileCheck,
  Flag as FlagIcon,
  Globe2,
  GraduationCap,
  Layers,
  Link2,
  MessageCircle,
  MessageSquare,
  Orbit,
  Pause,
  Pencil,
  Play,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Coins,
  Trash2,
  LogOut,
} from "lucide-react";
import type {
  Booking,
  Message,
  PublicUser,
  Skill,
  Snapshot,
} from "@/lib/types";
import { COUNTRIES, money } from "@/lib/types";
import {
  api,
  Avatar,
  dateTime,
  Empty,
  Field,
  Flag,
  localDate,
  Modal,
} from "./ui";
import type { Mutate } from "./forms";

export function RequestsPanel({
  state,
  mode,
  onOpen,
  onDiscover,
}: {
  state: Snapshot;
  mode: string;
  onOpen: (b: Booking) => void;
  onDiscover: () => void;
}) {
  const [tab, setTab] = useState("All");
  const bookings = state.bookings
    .filter(
      (b) =>
        (mode !== "learning" || b.learnerId === state.me.id) &&
        (mode !== "teaching" || b.providerId === state.me.id) &&
        (mode !== "calendar" || b.status === "scheduled") &&
        (tab === "All" ||
          (tab === "Incoming" &&
            b.providerId === state.me.id &&
            ["pending", "countered"].includes(b.status)) ||
          (tab === "Sent" &&
            b.learnerId === state.me.id &&
            ["pending", "countered"].includes(b.status)) ||
          (tab === "Upcoming" &&
            ["scheduled", "awaiting-payment"].includes(b.status)) ||
          (tab === "Completed" && b.status === "completed") ||
          (tab === "Closed" &&
            ["cancelled", "expired", "declined"].includes(b.status))),
    )
    .sort((a, b) =>
      mode === "calendar"
        ? a.startsAt.localeCompare(b.startsAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <section>
      <div className="summary-grid">
        <div>
          <span className="summary-icon purple">
            <InboxIcon />
          </span>
          <span>
            <strong>
              {state.bookings.filter((b) => b.status === "pending").length}
            </strong>
            <small>Open requests</small>
          </span>
        </div>
        <div>
          <span className="summary-icon mint">
            <CalendarDays size={22} />
          </span>
          <span>
            <strong>
              {state.bookings.filter((b) => b.status === "scheduled").length}
            </strong>
            <small>Upcoming connections</small>
          </span>
        </div>
        <div>
          <span className="summary-icon amber">
            <CheckCheck size={22} />
          </span>
          <span>
            <strong>
              {state.bookings.filter((b) => b.status === "completed").length}
            </strong>
            <small>Completed sessions</small>
          </span>
        </div>
      </div>
      {mode !== "calendar" && (
        <div className="feed-tabs standalone">
          {["All", "Incoming", "Sent", "Upcoming", "Completed", "Closed"].map(
            (t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ),
          )}
        </div>
      )}
      {bookings.length ? (
        <div className="booking-list">
          {bookings.map((b) => {
            const other = state.users.find(
              (u) =>
                u.id ===
                (b.providerId === state.me.id ? b.learnerId : b.providerId),
            )!;
            return (
              <button
                key={b.id}
                className="booking-card"
                onClick={() => onOpen(b)}
              >
                <div className="booking-date">
                  <strong>{new Date(b.startsAt).getDate()}</strong>
                  <span>
                    {new Date(b.startsAt).toLocaleString("en", {
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="booking-info">
                  <div className="row">
                    <span
                      className={`badge ${b.kind === "free" ? "green" : "purple"}`}
                    >
                      {b.circleId
                        ? "Trade Circle"
                        : b.kind === "paid"
                          ? "Mentorship"
                          : b.kind === "free"
                            ? "Community"
                            : "Skill trade"}
                    </span>
                    <span className="muted small">
                      {b.providerId === state.me.id
                        ? "You're teaching"
                        : "You're learning"}
                    </span>
                  </div>
                  <h3>{b.title}</h3>
                  <div className="booking-meta">
                    <Avatar user={other} size={23} />
                    <span>{other.name}</span>
                    <span>·</span>
                    <span>{dateTime(b.startsAt, state.me.timezone)}</span>
                    <span>· {b.duration} min</span>
                  </div>
                </div>
                <div className="booking-end">
                  <span className={`status status-${b.status}`}>
                    {b.status.replaceAll("-", " ")}
                  </span>
                  <ArrowUpRight size={19} />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <Empty
          title="Your next connection is out there"
          description="Discover a skill, send a request, and agree on a time together. Your sessions will appear here."
          action={
            <button className="button primary" onClick={onDiscover}>
              Explore skills <ArrowRight size={16} />
            </button>
          }
        />
      )}
    </section>
  );
}
function InboxIcon() {
  return <GraduationCap size={22} />;
}

export function ProfilePanel({
  state,
  user,
  onEdit,
  onSkill,
  onOpen,
  onEditSkill,
  onDeleteSkill,
  onLogout,
  logoutBusy,
  act,
  onMessage,
  onReport,
}: {
  state: Snapshot;
  user: PublicUser;
  onEdit: () => void;
  onSkill: () => void;
  onOpen: (s: Skill) => void;
  onEditSkill: (s: Skill) => void;
  onDeleteSkill: (s: Skill) => void;
  onLogout: () => Promise<void>;
  logoutBusy: boolean;
  act: Mutate;
  onMessage: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const own = user.id === state.me.id;
  const [error, setError] = useState("");
  const skills = state.skills.filter((s) => s.ownerId === user.id);
  const reviews = state.reviews.filter((r) => r.subjectId === user.id);
  async function toggle(action: Record<string, unknown>) {
    try {
      await act(action);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="profile-page">
      <section className="profile-cover">
        <div className="profile-cover-pattern">✳</div>
        <span className="badge">
          <Globe2 size={13} /> A WORLD OF SHARED KNOWLEDGE
        </span>
      </section>
      <section className="profile-overview">
        <Avatar user={user} size={100} />
        <div className="profile-identity">
          <h2>
            {user.name}
            <span>
              <Flag code={user.country} />
            </span>
          </h2>
          <p>@{user.username}</p>
          <div className="profile-locations">
            <span>
              <Globe2 size={14} />
              {COUNTRIES.find(([c]) => c === user.country)?.[1] ?? user.country}
              {user.city ? ` · ${user.city}` : ""}
            </span>
            <span>{user.languages.join(" · ")}</span>
          </div>
        </div>
        <div className="profile-actions">
          {own ? (
            <>
              <button className="button secondary" onClick={onEdit}>
                <Pencil size={15} /> Edit profile
              </button>
              <button
                className="button secondary"
                disabled={logoutBusy}
                onClick={() => void onLogout()}
              >
                <LogOut size={16} /> Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="button primary"
                onClick={() => onMessage(user.id)}
              >
                <MessageCircle size={16} /> Say hello
              </button>
              <button
                className="icon-button"
                aria-label="Report participant"
                onClick={() => onReport(user.id)}
              >
                <FlagIcon size={17} />
              </button>
            </>
          )}
        </div>
      </section>
      {error && <div className="alert error">{error}</div>}
      <div className="profile-body">
        <div>
          <section className="content-card">
            <h3>A little about {own ? "me" : user.name.split(" ")[0]}</h3>
            <p>{user.bio || "A curious mind with something to share."}</p>
            <div className="tags">
              {user.available ? (
                <span className="badge green">
                  <span className="pulse-dot" /> Open to new connections
                </span>
              ) : (
                <span className="badge">Not accepting new requests</span>
              )}
              <span className="badge">{user.timezone}</span>
            </div>
            {user.socials.length > 0 && (
              <div className="social-links">
                {user.socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Link2 size={14} />
                    {s.label}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            )}
          </section>
          <div className="section-line section-spaced">
            <div>
              <h2>
                Skills worth sharing{" "}
                <span className="count-bubble">{skills.length}</span>
              </h2>
              <p className="muted small">
                A little of what {own ? "I know" : "they know"}. A lot of
                possibility.
              </p>
            </div>
            {own && (
              <button className="button primary" onClick={onSkill}>
                <Plus size={16} /> Register new skill
              </button>
            )}
          </div>
          {skills.length ? (
            <div className="profile-skills">
              {skills.map((s) => (
                <article className="profile-skill" key={s.id}>
                  <img src={s.image} alt="" />
                  <div>
                    <span className="badge">{s.category}</span>
                    <button className="skill-title" onClick={() => onOpen(s)}>
                      {s.title}
                    </button>
                    <p>{s.outcome}</p>
                    <small className="muted">
                      {s.duration} min · {s.language} · {s.status}
                    </small>
                  </div>
                  {own && (
                    <div className="profile-skill-actions">
                      <button
                        className="icon-button"
                        aria-label={`Edit ${s.title}`}
                        onClick={() => onEditSkill(s)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={
                          s.status === "published"
                            ? `Pause ${s.title}`
                            : `Publish ${s.title}`
                        }
                        onClick={() =>
                          toggle({ action: "pause", skillId: s.id })
                        }
                      >
                        {s.status === "published" ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                      </button>
                      <button
                        className="icon-button danger-quiet"
                        aria-label={`Delete ${s.title}`}
                        title="Delete skill"
                        onClick={() => onDeleteSkill(s)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Everyone starts somewhere"
              description={
                own
                  ? "Your first skill card could be someone's first step. Share something you enjoy teaching."
                  : "This participant hasn't shared a skill yet."
              }
              action={
                own ? (
                  <button className="button primary" onClick={onSkill}>
                    Register new skill
                  </button>
                ) : undefined
              }
            />
          )}
          <section className="content-card section-spaced">
            <h3>Words from the community</h3>
            {reviews.length ? (
              reviews.map((r) => (
                <div className="profile-review" key={r.id}>
                  <div className="row">
                    <Avatar
                      user={state.users.find((u) => u.id === r.authorId)}
                    />
                    <strong>
                      {state.users.find((u) => u.id === r.authorId)?.name}
                    </strong>
                    <span className="stars">{"★".repeat(r.rating)}</span>
                  </div>
                  <p>{r.text}</p>
                </div>
              ))
            ) : (
              <p className="muted">
                No reviews yet. Reviews unlock after a completed session.
              </p>
            )}
          </section>
        </div>
        <aside>
          <section className="content-card">
            <h3>Small steps, real progress</h3>
            <div className="profile-stat">
              <GraduationCap size={18} />
              <span>Sessions learned</span>
              <strong>{user.stats.learned}</strong>
            </div>
            <div className="profile-stat">
              <Sparkles size={18} />
              <span>Sessions taught</span>
              <strong>{user.stats.taught}</strong>
            </div>
            <div className="profile-stat">
              <ArrowLeftRight size={18} />
              <span>Completed trades</span>
              <strong>{user.stats.trades}</strong>
            </div>
            <div className="profile-stat">
              <Clock3 size={18} />
              <span>Teaching minutes</span>
              <strong>{user.stats.minutes}</strong>
            </div>
            <div className="profile-stat">
              <Star size={18} />
              <span>Reviews</span>
              <strong>
                {user.stats.reviews ? user.stats.rating.toFixed(1) : "New"}
              </strong>
            </div>
          </section>
          <section className="content-card">
            <h3>Curious about</h3>
            <div className="tags">
              {user.wants.length ? (
                user.wants.map((w) => (
                  <span className="interest-tag" key={w}>
                    {w}
                    <Sparkles size={12} />
                  </span>
                ))
              ) : (
                <span className="muted small">A world of possibilities.</span>
              )}
            </div>
          </section>
          <section className="content-card badge-profile-card">
            <div className="section-line">
              <h3>
                <Trophy size={16} /> Badges
              </h3>
              <span className="badge purple">
                {user.badges.filter((b) => b.earned).length}/
                {user.badges.length}
              </span>
            </div>
            <div className="profile-level">
              <div className="level-ring small">
                <span className="level-num">{user.level}</span>
                <small>LVL</small>
              </div>
              <div className="level-meta">
                <strong>
                  {user.xp} XP
                  <span className="muted">
                    {" "}
                    · {user.xp} / {user.nextLevelXp}
                  </span>
                </strong>
                <div className="level-bar">
                  <span
                    style={{
                      width: `${((user.xp - (user.level - 1) * 200) / 200) * 100}%`,
                    }}
                  />
                </div>
                <small className="muted">
                  {user.nextLevelXp - user.xp} XP to level {user.level + 1}
                </small>
              </div>
            </div>
            <div className="profile-badge-grid">
              {user.badges.map((b) => {
                const Icon =
                  b.icon === "Sparkles"
                    ? Sparkles
                    : b.icon === "GraduationCap"
                      ? GraduationCap
                      : b.icon === "BookOpen"
                        ? BookOpen
                        : b.icon === "Users"
                          ? Users
                          : b.icon === "Layers"
                            ? Layers
                            : b.icon === "ArrowLeftRight"
                              ? ArrowLeftRight
                              : b.icon === "Orbit"
                                ? Orbit
                                : b.icon === "MessageCircle"
                                  ? MessageCircle
                                  : b.icon === "FileCheck"
                                    ? FileCheck
                                    : b.icon === "MessageSquare"
                                      ? MessageSquare
                                      : b.icon === "Star"
                                        ? Star
                                        : Award;
                const tierClass =
                  b.tier === "legendary"
                    ? "tier-legendary"
                    : b.tier === "epic"
                      ? "tier-epic"
                      : b.tier === "rare"
                        ? "tier-rare"
                        : "tier-common";
                return (
                  <div
                    key={b.id}
                    className={`profile-badge ${tierClass} ${b.earned ? "earned" : "locked"}`}
                    title={`${b.name}: ${b.howToEarn} (${b.progress}/${b.total})`}
                  >
                    <Icon size={18} />
                    <span>{b.name}</span>
                    {b.earned ? (
                      <Star size={10} fill="currentColor" />
                    ) : (
                      <span className="badge-progress-text">
                        {b.progress}/{b.total}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <details className="badge-details">
              <summary>How to earn each badge</summary>
              <div className="badge-how-list">
                {user.badges.map((b) => (
                  <div
                    key={b.id}
                    className={`how-row ${b.earned ? "earned" : ""}`}
                  >
                    <strong>{b.name}</strong>
                    <span>{b.howToEarn}</span>
                    <small>
                      {b.earned
                        ? `✓ Earned +${b.xp} XP`
                        : `${b.progress}/${b.total} · ${b.xp} XP when earned`}
                    </small>
                  </div>
                ))}
              </div>
            </details>
            <p className="muted tiny">
              Platform recognition, not an accredited qualification. Keep
              learning to unlock more.
            </p>
          </section>
          {!own && (
            <button
              className="text-button danger-quiet"
              onClick={() => toggle({ action: "block", userId: user.id })}
            >
              {state.blocks.includes(user.id)
                ? "Unblock participant"
                : "Block participant"}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

type ChatSummary = Snapshot["conversations"][number] & {
  unread?: number;
  lastMessage?: string;
  lastAt?: string;
};
export function ChatPanel({
  state,
  act,
  selected,
  setSelected,
}: {
  state: Snapshot;
  act: Mutate;
  selected: string;
  setSelected: (id: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [error, setError] = useState(""),
    [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);
  const clientId = useRef("");
  const lastRead = useRef("");
  const loadedFor = useRef("");
  const c = state.conversations.find((c) => c.id === selected);
  useEffect(() => {
    selectedRef.current = selected;
    loadedFor.current = "";
    setMessages([]);
    setError("");
    setDraft("");
    clientId.current = "";
    if (!selected) return;
    let active = true;
    let loading = false;
    async function load() {
      if (loading) return;
      loading = true;
      try {
        const result = await api<{ messages: Message[] }>(
          `messages?id=${encodeURIComponent(selected)}`,
        );
        if (active) {
          loadedFor.current = selected;
          setMessages(result.messages);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        loading = false;
      }
    }
    void load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selected, state.me.id]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);
  useEffect(() => {
    const message = messages.at(-1);
    const target = bottom.current;
    if (!message || !target || !selected || loadedFor.current !== selected)
      return;
    const key = `${state.me.id}:${selected}:${message.id}`;
    let visible = false;
    let active = true;
    const markRead = () => {
      if (
        !active ||
        !visible ||
        document.visibilityState !== "visible" ||
        lastRead.current === key
      )
        return;
      lastRead.current = key;
      void act({
        action: "read",
        conversationId: selected,
        messageId: message.id,
      }).catch((e) => {
        if (lastRead.current === key) lastRead.current = "";
        if (active) setError((e as Error).message);
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      markRead();
    });
    observer.observe(target);
    document.addEventListener("visibilitychange", markRead);
    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", markRead);
    };
  }, [messages, selected, state.me.id, act]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !c) return;
    setSending(true);
    setError("");
    const current = selected;
    clientId.current ||= crypto.randomUUID();
    try {
      await act({
        action: "message",
        conversationId: current,
        text: draft,
        clientId: clientId.current,
      });
      if (selectedRef.current === current) {
        setDraft("");
        clientId.current = "";
        const result = await api<{ messages: Message[] }>(
          `messages?id=${current}`,
        );
        if (selectedRef.current === current) {
          loadedFor.current = current;
          setMessages(result.messages);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  const other = c
    ? state.users.find((u) => c.members.includes(u.id) && u.id !== state.me.id)
    : undefined;
  return (
    <div className={`chat-layout ${c ? "has-selection" : ""}`}>
      <aside className="chat-sidebar">
        <div className="chat-list-heading">
          <h3>Your conversations</h3>
          <span>{state.conversations.length}</span>
        </div>
        {state.conversations.length ? (
          state.conversations.map((item: ChatSummary) => {
            const person = state.users.find(
              (u) => item.members.includes(u.id) && u.id !== state.me.id,
            )!;
            return (
              <button
                className={`chat-list-item ${selected === item.id ? "active" : ""}`}
                key={item.id}
                onClick={() => setSelected(item.id)}
              >
                <Avatar user={person} size={40} />
                <span>
                  <strong>{person.name}</strong>
                  <small>{item.lastMessage}</small>
                </span>
                {!!item.unread && <i>{item.unread}</i>}
              </button>
            );
          })
        ) : (
          <div className="chat-list-empty">
            <MessageCircle size={27} />
            <p>
              Your next conversation starts with a profile or a learning
              request.
            </p>
          </div>
        )}
      </aside>
      <section className="chat-main">
        {c ? (
          <>
            <div className="chat-heading">
              <button
                className="icon-button chat-back"
                aria-label="Back to conversations"
                onClick={() => setSelected("")}
              >
                <ArrowLeft size={18} />
              </button>
              <Avatar user={other} size={40} />
              <div>
                <h3>{other?.name}</h3>
                <span>
                  {c.accepted ? "Learning connection" : "Message request"} ·{" "}
                  {other?.timezone}
                </span>
              </div>
              <span className="badge purple">DEMO</span>
            </div>
            {!c.accepted && (
              <div className="chat-request">
                <p>
                  {c.initiatedBy === state.me.id
                    ? "You may send one introduction. Wait for the recipient to accept before sending more."
                    : "This participant would like to connect. Accept to start chatting."}
                </p>
                {c.initiatedBy !== state.me.id && (
                  <button
                    className="button primary"
                    onClick={() =>
                      act({
                        action: "accept-chat",
                        conversationId: c.id,
                      }).catch((e) => setError((e as Error).message))
                    }
                  >
                    Accept message request
                  </button>
                )}
              </div>
            )}
            <div className="messages">
              <div className="chat-safety">
                <ShieldCheck size={13} /> Keep it kind. Never share passwords or
                financial information.
              </div>
              {messages.map((m) => (
                <div
                  className={`message ${m.senderId === state.me.id ? "mine" : ""}`}
                  key={m.id}
                >
                  <p>{m.text}</p>
                  <small>
                    {new Date(m.createdAt).toLocaleTimeString("en", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
              ))}
              {!messages.length && (
                <div className="conversation-start">
                  <span>👋</span>
                  <h3>A simple hello can go a long way.</h3>
                  <p>Share what you'd love to learn or teach.</p>
                </div>
              )}
              <div ref={bottom} style={{ minHeight: 1 }} aria-hidden="true" />
            </div>
            {error && (
              <div className="alert error" role="alert">
                {error}
              </div>
            )}
            <form className="message-composer" onSubmit={send}>
              <input
                aria-label="Your message"
                placeholder="A little hello, a big possibility…"
                value={draft}
                maxLength={3000}
                onChange={(e) => {
                  setDraft(e.target.value);
                  clientId.current = "";
                }}
                disabled={sending}
              />
              <button
                className="button primary"
                disabled={sending || !draft.trim()}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
            <div className="chat-footnote">
              Messages refresh while open · persisted server-side · not
              end-to-end encrypted
            </div>
          </>
        ) : (
          <Empty
            title="Good things start with hello"
            description="Choose a conversation or connect with someone from their profile."
          />
        )}
      </section>
    </div>
  );
}

export function TradePanel({
  state,
  act,
  onSkill,
  onSession,
  onDemo,
}: {
  state: Snapshot;
  act: Mutate;
  onSkill: () => void;
  onSession: (b: Booking) => void;
  onDemo: () => void;
}) {
  const [candidate, setCandidate] = useState<{
      members: string[];
      skillIds: string[];
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("Trade Circles");
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const direct = state.bookings.filter(
    (b) => b.kind === "trade" && !b.circleId,
  );
  return (
    <section>
      <div className="trade-hero">
        <div>
          <span className="badge purple">
            <Sparkles size={12} /> SMALL CIRCLES, BIG POSSIBILITIES
          </span>
          <h2>
            When two don't match,
            <br />
            <span>three might click.</span>
          </h2>
          <p>
            You teach Python. They teach guitar. Someone else teaches design.
            <br />A Trade Circle connects the dots, so everyone gets to grow.
          </p>
          <div className="row">
            <span className="badge">No tuition payment</span>
            <span className="badge">Everyone agrees</span>
            <span className="badge">Three focused lessons</span>
          </div>
        </div>
        <div className="trade-triangle">
          <div>
            <span>A</span>
            <small>Python</small>
          </div>
          <ArrowRight className="triangle-arrow ta1" />
          <div>
            <span>B</span>
            <small>Design</small>
          </div>
          <ArrowRight className="triangle-arrow ta2" />
          <div>
            <span>C</span>
            <small>Guitar</small>
          </div>
          <ArrowRight className="triangle-arrow ta3" />
          <Sparkles className="triangle-centre" size={30} />
        </div>
      </div>
      <div className="feed-tabs standalone">
        {["Trade Circles", "Direct swaps"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {tab === "Direct swaps" ? (
        <>
          {direct.length ? (
            <div className="booking-list">
              {direct.map((b) => (
                <button
                  className="booking-card"
                  key={b.id}
                  onClick={() => onSession(b)}
                >
                  <ArrowLeftRight size={26} />
                  <div className="booking-info">
                    <h3>{b.title}</h3>
                    <p>in exchange for {b.exchangeTitle}</p>
                  </div>
                  <span className="badge purple">{b.status}</span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="Your first exchange is waiting"
              description="Open a skill that is available for trade, then offer one of your own. Both people agree on outcomes and times."
              action={
                <button className="button primary" onClick={onSkill}>
                  Register a trade skill
                </button>
              }
            />
          )}
        </>
      ) : (
        <>
          <div className="section-line section-spaced">
            <div>
              <h2>Possible learning loops</h2>
              <p className="muted">
                Matched by exact skill tags, shared language and online
                delivery. Times are agreed next.
              </p>
            </div>
            <button className="button secondary" onClick={onDemo}>
              <Users size={16} /> Try as Asha
            </button>
          </div>
          {state.matches?.length ? (
            <div className="circle-grid">
              {state.matches.map((match) => (
                <div className="circle-card" key={match.skillIds.join()}>
                  <span className="badge green">
                    <Check size={12} /> COMPATIBLE SKILL LOOP
                  </span>
                  <CirclePeople
                    state={state}
                    members={match.members}
                    skillIds={match.skillIds}
                  />
                  <button
                    className="button primary full"
                    onClick={() => setCandidate(match)}
                  >
                    Propose this circle <ArrowUpRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="One more connection could close the loop"
              description="Register a trade skill and add learning interests to your profile. For a ready-to-try example, switch to Asha: Python → Design → Guitar → Python."
              action={
                <button className="button primary" onClick={onSkill}>
                  Share a trade skill
                </button>
              }
            />
          )}
          {state.circles.length > 0 && (
            <>
              <h2 className="section-spaced">Your circles</h2>
              <div className="circle-grid">
                {state.circles.map((c) => (
                  <div className="circle-card" key={c.id}>
                    <div className="section-line">
                      <span className="badge purple">{c.status}</span>
                      <small className="muted">
                        {c.accepted.length}/3 accepted
                      </small>
                    </div>
                    <CirclePeople
                      state={state}
                      members={c.members}
                      skillIds={c.skillIds}
                    />
                    <div className="circle-times">
                      {c.startsAt.map((time, i) => (
                        <span key={time}>
                          {
                            state.users
                              .find((u) => u.id === c.members[i])
                              ?.name.split(" ")[0]
                          }{" "}
                          teaches · {dateTime(time, state.me.timezone)}
                        </span>
                      ))}
                    </div>
                    {c.status === "inviting" &&
                      !c.accepted.includes(state.me.id) && (
                        <button
                          disabled={busy}
                          className="button primary full"
                          onClick={() =>
                            run(() =>
                              act({
                                action: "circle-response",
                                circleId: c.id,
                                accept: true,
                              }),
                            )
                          }
                        >
                          Accept my commitment
                        </button>
                      )}
                    {["inviting", "active"].includes(c.status) && (
                      <button
                        disabled={busy}
                        className="text-button danger-quiet"
                        onClick={() => {
                          if (
                            confirm(
                              "Withdraw from this circle? Completed lessons remain recorded; remaining sessions will close.",
                            )
                          )
                            void run(() =>
                              act({
                                action: "circle-response",
                                circleId: c.id,
                                accept: false,
                              }),
                            );
                        }}
                      >
                        Withdraw from circle
                      </button>
                    )}
                    {state.bookings
                      .filter((b) => b.circleId === c.id)
                      .map((b) => (
                        <button
                          key={b.id}
                          className="circle-session-link"
                          onClick={() => onSession(b)}
                        >
                          {b.title}
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <div className="info-note section-spaced">
        <ShieldCheck size={18} />
        <span>
          Trade Circles coordinate commitments; they cannot guarantee that
          someone will attend or teach well. Start small, agree clearly, and
          report issues.
        </span>
      </div>
      {candidate && (
        <Modal
          title="Close the learning loop"
          subtitle="Propose three separate lesson times. Everyone must accept before any booking is confirmed."
          onClose={() => setCandidate(null)}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run(async () => {
                await act({
                  action: "circle",
                  ...candidate,
                  startsAt: [0, 1, 2].map((i) =>
                    new Date(String(f.get(`time-${i}`))).toISOString(),
                  ),
                });
                setCandidate(null);
              });
            }}
          >
            {error && <div className="alert error">{error}</div>}
            {candidate.members.map((member, i) => (
              <Field
                key={member}
                label={`${state.users.find((u) => u.id === member)?.name} teaches ${state.skills.find((s) => s.id === candidate.skillIds[i])?.tags[0]}`}
              >
                <input
                  name={`time-${i}`}
                  type="datetime-local"
                  required
                  defaultValue={localDate(24 + i * 3)}
                />
              </Field>
            ))}
            <p className="muted small">
              Times above use your device's local time. Each session must fit
              without conflicts.
            </p>
            <button disabled={busy} className="button primary" type="submit">
              Invite the circle <ArrowRight size={16} />
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
function CirclePeople({
  state,
  members,
  skillIds,
}: {
  state: Snapshot;
  members: string[];
  skillIds: string[];
}) {
  return (
    <div className="circle-people">
      {members.map((member, i) => {
        const user = state.users.find((u) => u.id === member)!;
        const next = state.users.find((u) => u.id === members[(i + 1) % 3])!;
        return (
          <div key={member}>
            <Avatar user={user} size={42} />
            <span>
              <strong>{user.name}</strong>
              <small>
                Teaches{" "}
                {state.skills.find((s) => s.id === skillIds[i])?.tags[0] ??
                  "a previously listed skill"}{" "}
                to {next.name.split(" ")[0]}
              </small>
            </span>
            <ArrowRight size={16} />
          </div>
        );
      })}
    </div>
  );
}

export function CreditsPanel({ state }: { state: Snapshot }) {
  return (
    <section>
      <div className="credits-hero">
        <div>
          <span className="badge purple">
            <Coins size={16} /> Learning credits
          </span>
          <p>Ready for your next lesson</p>
          <h2>{money(state.me.balance)}</h2>
          <span>Use credits for mentoring. Skill swaps are always free.</span>
        </div>
        <div className="credits-illustration" aria-hidden="true">
          <Coins size={72} />
        </div>
      </div>
      <div className="info-note section-spaced">
        <ShieldCheck size={19} />
        <span>
          These are demo credits, not real money. You can't buy or withdraw
          them.
        </span>
      </div>
      <h2 className="section-spaced">Credit activity</h2>
      {state.payments.length ? (
        <div className="payment-table">
          <div className="payment-table-head">
            <span>Session / reference</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {state.payments.map((p) => (
            <div className="payment-row" key={p.id}>
              <span>
                <strong>
                  {state.bookings.find((b) => b.id === p.bookingId)?.title ??
                    "Learning session"}
                </strong>
                <small>SIM-{p.id.slice(0, 8).toUpperCase()}</small>
              </span>
              <span>{dateTime(p.createdAt, state.me.timezone)}</span>
              <strong
                className={p.recipientId === state.me.id ? "mint-text" : ""}
              >
                {p.recipientId === state.me.id ? "+" : "−"}
                {money(p.amount)}
              </strong>
              <span className="badge">
                {p.status === "refunded" ? "Returned" : "Completed"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Your next lesson starts here"
          description="When you use credits for a session, you'll see the activity here."
        />
      )}
    </section>
  );
}
