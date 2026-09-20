"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  House,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  Users,
  Coins,
  X,
  Code2,
  Palette,
  Languages,
  Music2,
  BriefcaseBusiness,
  Leaf,
  Link2,
  Globe2,
} from "lucide-react";
import type { Booking, PublicUser, Skill, Snapshot } from "@/lib/types";
import { CATEGORIES, LANGUAGES, money } from "@/lib/types";
import { api, Avatar, Empty, Flag, Logo, Modal, timeAgo } from "./ui";
import AuthScreen from "./auth-screen";
import { AccountMenu } from "./account-menu";
import { ShareSkill, DeleteSkill } from "./share-skill";
import {
  PostForm,
  ProfileForm,
  SkillDetail,
  SkillForm,
  type Mutate,
} from "./forms";
import { Session } from "./session";
import {
  ChatPanel,
  ProfilePanel,
  RequestsPanel,
  TradePanel,
  CreditsPanel,
} from "./panels";
import { BadgeShowcase } from "./badges";
import { LeaderboardPanel } from "./leaderboard";

type Panel =
  | "home"
  | "requests"
  | "trade"
  | "chat"
  | "profile"
  | "saved"
  | "learning"
  | "teaching"
  | "calendar"
  | "wallet"
  | "leaderboard"
  | "badges";
type Dialog =
  | { kind: "skill-form"; skill?: Skill; publish?: boolean }
  | { kind: "share-skill" }
  | { kind: "delete-skill"; skill: Skill }
  | { kind: "skill"; skill: Skill }
  | { kind: "profile-form" }
  | { kind: "post" }
  | { kind: "session"; booking: Booking }
  | { kind: "demo" }
  | { kind: "help" }
  | { kind: "report"; target: string }
  | null;
const icons = {
  Development: Code2,
  Design: Palette,
  Languages,
  Music: Music2,
  Business: BriefcaseBusiness,
  Lifestyle: Leaf,
  Other: LayoutGrid,
};

export default function SkillLoop() {
  const [state, setState] = useState<Snapshot | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [panel, setPanel] = useState<Panel>("home"),
    [dialog, setDialog] = useState<Dialog>(null),
    [profileId, setProfileId] = useState("");
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All skills"),
    [feed, setFeed] = useState("Discover");
  const [filters, setFilters] = useState(false),
    [language, setLanguage] = useState(""),
    [offer, setOffer] = useState(""),
    [delivery, setDelivery] = useState("");
  const [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [chatId, setChatId] = useState("");
  const [invite, setInvite] = useState<string | undefined>(),
    [shareLink, setShareLink] = useState(""),
    [demoBusy, setDemoBusy] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const sessionVersion = useRef(0);
  const [logoutBusy, setLogoutBusy] = useState(false);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (document.querySelector("dialog[open]")) return;
        event.preventDefault();
        setPanel("home");
        requestAnimationFrame(() => searchInput.current?.focus());
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [panel, profileId]);
  const refresh = useCallback(async () => {
    const version = sessionVersion.current;
    try {
      const next = await api<Snapshot>("state");
      if (version !== sessionVersion.current) return;
      setState(next);
      setError("");
    } catch (e) {
      if (version !== sessionVersion.current) return;
      const message = (e as Error).message;
      if (message.includes("sign in") || message.includes("expired"))
        setState(null);
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite");
    if (token) {
      setInvite(token);
      setLoading(false);
    } else {
      void refresh();
    }
  }, [refresh]);
  const activeUserId = state?.me.id;
  useEffect(() => {
    if (!activeUserId) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeUserId, refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const act: Mutate = async (action) => {
    const result = await api("actions", action);
    await refresh();
    return result;
  };
  async function safe(work: () => Promise<unknown>, message?: string) {
    try {
      await work();
      if (message) setToast(message);
    } catch (e) {
      setToast((e as Error).message);
    }
  }
  function go(next: Panel) {
    setPanel(next);
    setMobile(false);
    setQuery("");
    setNotifications(false);
    if (next === "profile") setProfileId("");
  }
  async function logout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    await safe(async () => {
      await api("auth/logout", {});
      sessionVersion.current += 1;
      setState(null);
      setDialog(null);
      setInvite(undefined);
      setShareLink("");
      setChatId("");
      setProfileId("");
      setCategory("All skills");
      setFeed("Discover");
      setFilters(false);
      setLanguage("");
      setOffer("");
      setDelivery("");
      setError("");
      go("home");
    });
    setLogoutBusy(false);
  }
  function showProfile(id: string) {
    setProfileId(id);
    setPanel("profile");
    setDialog(null);
    setQuery("");
  }
  function openChat(id: string) {
    setChatId(id);
    setPanel("chat");
    setDialog(null);
  }
  async function message(userId: string) {
    await safe(async () => {
      const result = await act({ action: "conversation", userId });
      openChat(String(result.conversationId));
    });
  }
  if (loading)
    return (
      <div className="boot">
        <Logo />
        <div className="boot-line" />
        <p>Finding your next connection…</p>
      </div>
    );
  if (!state)
    return (
      <AuthScreen
        initialError={error}
        invite={invite}
        onReady={async () => {
          setInvite(undefined);
          await refresh();
        }}
      />
    );
  const me = state.me;
  const mePublic = state.users.find((u) => u.id === me.id)!;
  const unread = state.notifications.filter((n) => !n.read).length;
  const pending = state.bookings.filter(
    (b) =>
      (b.status === "pending" && b.providerId === me.id) ||
      (b.status === "countered" && b.counterBy !== me.id),
  ).length;
  const mainNav: {
    id: Panel;
    label: string;
    icon: typeof House;
    count?: number;
  }[] = [
    { id: "home", label: "Home", icon: House },
    { id: "requests", label: "Requests", icon: Inbox, count: pending },
    { id: "trade", label: "Trade", icon: ArrowLeftRight },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "profile", label: "My profile", icon: Users },
  ];
  const filtered = state.skills.filter(
    (s) =>
      s.status === "published" &&
      !state.blocks.includes(s.ownerId) &&
      (panel !== "saved" || state.saved.includes(s.id)) &&
      (category === "All skills" || s.category === category) &&
      (!language || s.language === language) &&
      (!offer || s.modes.includes(offer as "trade")) &&
      (!delivery || s.delivery === delivery) &&
      (feed !== "Free sessions" || s.modes.includes("free")) &&
      (feed !== "Skill trades" || s.modes.includes("trade")) &&
      (!query ||
        [
          s.title,
          s.description,
          ...s.tags,
          state.users.find((u) => u.id === s.ownerId)?.username ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase().replace(/^@/, ""))),
  );
  const people = query
    ? state.users.filter((u) =>
        `${u.username} ${u.name}`
          .toLowerCase()
          .includes(query.toLowerCase().replace(/^@/, "")),
      )
    : [];
  const titles: Record<Panel, string> = {
    home: "Find your next spark",
    requests: "Your connections",
    trade: "Better, together",
    chat: "A conversation away",
    profile: "Your learning identity",
    saved: "Your little collection",
    learning: "Keep your curiosity going",
    teaching: "Knowledge worth sharing",
    calendar: "Make time to grow",
    wallet: "Learning credits",
    leaderboard: "Where momentum lives",
    badges: "Collect your moments",
  };
  const title = titles[panel];
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <button className="brand-button" onClick={() => go("home")}>
          <Logo />
        </button>
        <nav aria-label="Main navigation">
          {mainNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${panel === item.id ? "active" : ""}`}
              aria-current={panel === item.id ? "page" : undefined}
              onClick={() => go(item.id)}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {!!item.count && <span className="nav-count">{item.count}</span>}
              {panel === item.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="nav-section-label">Your learning</div>
        <nav aria-label="Your journey">
          {[
            { id: "learning", label: "My learning", icon: GraduationCap },
            { id: "teaching", label: "My teaching", icon: Sparkles },
            { id: "calendar", label: "My schedule", icon: CalendarDays },
            { id: "saved", label: "Saved skills", icon: Bookmark },
            { id: "wallet", label: "Learning credits", icon: Coins },
            { id: "badges", label: "Badges", icon: Award },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id as Panel)}
              aria-current={panel === item.id ? "page" : undefined}
              className={`nav-item secondary-nav ${panel === item.id ? "active" : ""}`}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.id === "badges" && (
                <span className="nav-badge-count">
                  {state.myBadges.filter((b) => b.earned).length}/
                  {state.badgeDefinitions.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-grow" />

        <button
          className="nav-item secondary-nav"
          onClick={() => setDialog({ kind: "help" })}
        >
          <CircleHelp size={17} /> Help & safety <ArrowUpRight size={14} />
        </button>
        <button className="sidebar-profile" onClick={() => go("profile")}>
          <Avatar user={me} size={36} />
          <span>
            <strong>{me.name}</strong>
            <small>@{me.username}</small>
          </span>
          <ChevronDown size={15} />
        </button>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {panel === "home"
                ? "Discover"
                : panel === "wallet"
                  ? "Credits"
                  : panel[0].toUpperCase() + panel.slice(1)}
            </strong>
          </div>
          <div className="header-actions">
            <button
              className="demo-pill"
              onClick={() => {
                setDialog({ kind: "demo" });
                setShareLink("");
              }}
            >
              <span className="pulse-dot" /> Demo <ChevronDown size={13} />
            </button>
            <span className="header-divider" />
            <div className="notification-wrap">
              <button
                className={`icon-button ${unread ? "has-dot" : ""}`}
                aria-label="Notifications"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
              </button>
              {notifications && (
                <div className="notification-popover">
                  <div className="section-line">
                    <h3>Notifications</h3>
                    <button
                      className="text-button"
                      onClick={() =>
                        safe(() => act({ action: "notifications" }))
                      }
                    >
                      Mark read
                    </button>
                  </div>
                  {state.notifications.length ? (
                    state.notifications.slice(0, 15).map((n) => (
                      <button
                        className={`notification-item ${n.read ? "" : "unread"}`}
                        key={n.id}
                        onClick={() => {
                          go(n.target as Panel);
                          void safe(() => act({ action: "notifications" }));
                        }}
                      >
                        <strong>{n.title}</strong>
                        <span>{n.body}</span>
                        <small>{timeAgo(n.createdAt)}</small>
                      </button>
                    ))
                  ) : (
                    <p className="muted small">You're all caught up.</p>
                  )}
                </div>
              )}
            </div>
            <AccountMenu
              user={me}
              onProfile={() => go("profile")}
              onLogout={logout}
              busy={logoutBusy}
            />
          </div>
        </header>
        <main
          className={`main-content ${panel === "chat" ? "chat-content" : ""}`}
        >
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button className="text-button" onClick={() => refresh()}>
                Retry
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <h1>
                {title}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {panel === "home"
                  ? "A new skill. A new friend. A whole new possibility."
                  : panel === "trade"
                    ? "Exchange what you know for something you've always wanted to learn."
                    : panel === "chat"
                      ? "Good learning starts with a hello."
                      : panel === "wallet"
                        ? "More learning. Less to keep track of."
                        : panel === "leaderboard"
                          ? "Climb by learning, teaching and sharing."
                          : panel === "badges"
                            ? "Earn proof of your curiosity and generosity."
                            : "Your next step, all in one place."}
              </p>
            </div>
            <button
              className="button primary add-skill"
              onClick={() => setDialog({ kind: "share-skill" })}
            >
              <Plus size={17} /> Share a skill
            </button>
          </div>
          {panel === "home" || panel === "saved" ? (
            <>
              <div className="home-columns">
                <section className="discovery">
                  <section className="hero-banner">
                    <div>
                      <h2>
                        You teach me.
                        <br />
                        <span>I teach you.</span>
                      </h2>
                      <p>
                        Swap a skill. Make a connection. Learn something new.
                      </p>
                      <button
                        className="button hero-button"
                        onClick={() => go("trade")}
                      >
                        Find my skill swap <ArrowUpRight size={17} />
                      </button>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <div className="hero-orbit" />
                      <div className="hero-orbit inner" />
                      <div className="hero-sticker coding">
                        <Code2 size={26} />
                        <span>Teach Python</span>
                      </div>
                      <div className="hero-loop">
                        <ArrowLeftRight size={34} />
                      </div>
                      <div className="hero-sticker guitar">
                        <Music2 size={27} />
                        <span>Learn guitar</span>
                      </div>
                      <span className="star s1">✦</span>
                      <span className="star s2">✳</span>
                      <span className="star s3">✧</span>
                    </div>
                  </section>
                  <div className="momentum-strip">
                    <button
                      className="momentum-card level"
                      onClick={() => go("badges")}
                    >
                      <div className="momentum-icon">
                        <Award size={20} />
                      </div>
                      <div className="momentum-text">
                        <strong>
                          Level {state.myLevel} · {state.myXp} XP
                        </strong>
                        <small>
                          {state.myBadges.filter((b) => b.earned).length}/
                          {state.badgeDefinitions.length} badges ·{" "}
                          {state.myNextLevelXp - state.myXp} XP to next
                        </small>
                        <div className="mini-bar">
                          <span
                            style={{
                              width: `${((state.myXp - (state.myLevel - 1) * 200) / 200) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                    <button
                      className="momentum-card board"
                      onClick={() => go("leaderboard")}
                    >
                      <div className="momentum-icon trophy">
                        <Trophy size={20} />
                      </div>
                      <div className="momentum-text">
                        <strong>
                          #
                          {state.leaderboard.sevenDays.find(
                            (e) => e.userId === state.me.id,
                          )?.rank ?? "-"}{" "}
                          · Last 7 days
                        </strong>
                        <small>
                          {state.leaderboard.sevenDays
                            .slice(0, 3)
                            .map((e) => e.name.split(" ")[0])
                            .join(" · ")}
                          {state.leaderboard.sevenDays.length > 3
                            ? " · +" + (state.leaderboard.sevenDays.length - 3)
                            : ""}
                        </small>
                        <div className="momentum-avatars">
                          {state.leaderboard.sevenDays.slice(0, 4).map((e) => {
                            const u = state.users.find(
                              (x) => x.id === e.userId,
                            );
                            return <Avatar key={e.userId} user={u} size={22} />;
                          })}
                          <span className="pulse-dot" />
                        </div>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                    <button
                      className="momentum-card next-badge"
                      onClick={() => go("badges")}
                    >
                      <div className="momentum-icon spark">
                        <Sparkles size={20} />
                      </div>
                      <div className="momentum-text">
                        <strong>
                          {state.myBadges.find((b) => !b.earned)?.name ??
                            "All badges earned!"}
                        </strong>
                        <small>
                          {state.myBadges.find((b) => !b.earned)?.howToEarn ??
                            "You are a legend. Keep shining."}
                        </small>
                        {state.myBadges.find((b) => !b.earned) && (
                          <div className="mini-bar">
                            <span
                              style={{
                                width: `${(state.myBadges.find((b) => !b.earned)!.progress / state.myBadges.find((b) => !b.earned)!.total) * 100}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="search-row">
                    <div className="search-box">
                      <Search size={19} />
                      <input
                        ref={searchInput}
                        aria-label="Search skills or people"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search skills or people"
                      />
                      {query ? (
                        <button
                          className="icon-button"
                          aria-label="Clear search"
                          onClick={() => setQuery("")}
                        >
                          <X size={15} />
                        </button>
                      ) : (
                        <kbd>⌘ K</kbd>
                      )}
                    </div>
                    <button
                      className={`button filter-button ${filters ? "selected" : ""}`}
                      aria-label="Filters"
                      aria-expanded={filters}
                      onClick={() => setFilters(!filters)}
                    >
                      <SlidersHorizontal size={17} />
                      <span>Filters</span>
                    </button>
                  </div>
                  {filters && (
                    <div className="filter-panel">
                      <select
                        aria-label="Filter by language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="">All languages</option>
                        {LANGUAGES.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter by offer"
                        value={offer}
                        onChange={(e) => setOffer(e.target.value)}
                      >
                        <option value="">All ways to learn</option>
                        <option value="trade">Skill trades</option>
                        <option value="paid">Paid mentorship</option>
                        <option value="free">Free sessions</option>
                      </select>
                      <select
                        aria-label="Filter by delivery"
                        value={delivery}
                        onChange={(e) => setDelivery(e.target.value)}
                      >
                        <option value="">All session modes</option>
                        <option value="online">Online</option>
                        <option value="in-person">In person</option>
                      </select>
                      <button
                        className="text-button"
                        onClick={() => {
                          setLanguage("");
                          setOffer("");
                          setDelivery("");
                          setCategory("All skills");
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <div className="category-row">
                    <button
                      className={category === "All skills" ? "selected" : ""}
                      onClick={() => setCategory("All skills")}
                    >
                      <LayoutGrid size={15} /> All skills
                    </button>
                    {CATEGORIES.map((c) => {
                      const Icon = icons[c];
                      return (
                        <button
                          key={c}
                          className={category === c ? "selected" : ""}
                          onClick={() => setCategory(c)}
                        >
                          <Icon size={15} />
                          {c}
                        </button>
                      );
                    })}
                  </div>
                  {people.length > 0 && (
                    <div className="people-results">
                      <h3>People matching “{query}”</h3>
                      <div className="people-grid">
                        {people.slice(0, 6).map((u) => (
                          <button
                            className="person-result"
                            key={u.id}
                            onClick={() => showProfile(u.id)}
                          >
                            <Avatar user={u} />
                            <span>
                              <strong>{u.name}</strong>
                              <small>@{u.username}</small>
                            </span>
                            <Flag code={u.country} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="feed-heading">
                    <div className="feed-tabs">
                      {[
                        "Discover",
                        "Skill trades",
                        "Free sessions",
                        "Learning requests",
                      ].map((f) => (
                        <button
                          key={f}
                          className={feed === f ? "active" : ""}
                          onClick={() => setFeed(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <span className="sort-label">
                      <ArrowDownUp size={13} /> Recently shared
                    </span>
                  </div>
                  {feed === "Learning requests" ? (
                    <div className="learning-posts">
                      {state.posts
                        .filter(
                          (p) =>
                            !query ||
                            `${p.title} ${p.description}`
                              .toLowerCase()
                              .includes(query.toLowerCase()),
                        )
                        .map((p) => {
                          const u = state.users.find((u) => u.id === p.userId)!;
                          return (
                            <article className="learning-post" key={p.id}>
                              <div className="section-line">
                                <button
                                  className="person-row profile-link"
                                  onClick={() => showProfile(u.id)}
                                >
                                  <Avatar user={u} />
                                  <span>
                                    <strong>{u.name}</strong>
                                    <small>
                                      @{u.username} · {timeAgo(p.createdAt)}
                                    </small>
                                  </span>
                                </button>
                                <span className="badge purple">
                                  Wants to learn
                                </span>
                              </div>
                              <h3>{p.title}</h3>
                              <p>{p.description}</p>
                              <div className="section-line">
                                <span className="muted small">
                                  {p.category} · {p.language} · {p.delivery}
                                </span>
                                {p.userId !== me.id && (
                                  <button
                                    className="button secondary"
                                    onClick={() => message(p.userId)}
                                  >
                                    Let's connect <ArrowUpRight size={15} />
                                  </button>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      <button
                        className="button secondary"
                        onClick={() => setDialog({ kind: "post" })}
                      >
                        <Plus size={16} /> Post what you want to learn
                      </button>
                    </div>
                  ) : filtered.length ? (
                    <div className="skill-grid">
                      {filtered.map((s) => (
                        <SkillCard
                          key={s.id}
                          skill={s}
                          owner={state.users.find((u) => u.id === s.ownerId)!}
                          saved={state.saved.includes(s.id)}
                          onOpen={() => setDialog({ kind: "skill", skill: s })}
                          onSave={() =>
                            safe(() => act({ action: "save", skillId: s.id }))
                          }
                          onProfile={() => showProfile(s.ownerId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title={
                        panel === "saved"
                          ? "A place for your next possibilities"
                          : "No exact match. Yet."
                      }
                      description="Try another keyword or fewer filters, or ask the community for what you want to learn."
                      action={
                        <button
                          className="button primary"
                          onClick={() => setDialog({ kind: "post" })}
                        >
                          Post a learning request
                        </button>
                      }
                    />
                  )}
                </section>
              </div>
            </>
          ) : panel === "requests" ||
            panel === "learning" ||
            panel === "teaching" ||
            panel === "calendar" ? (
            <RequestsPanel
              state={state}
              mode={panel}
              onOpen={(b) => setDialog({ kind: "session", booking: b })}
              onDiscover={() => go("home")}
            />
          ) : panel === "trade" ? (
            <TradePanel
              state={state}
              act={act}
              onSkill={() => setDialog({ kind: "skill-form" })}
              onSession={(b) => setDialog({ kind: "session", booking: b })}
              onDemo={() => setDialog({ kind: "demo" })}
            />
          ) : panel === "chat" ? (
            <ChatPanel
              state={state}
              act={act}
              selected={chatId}
              setSelected={setChatId}
            />
          ) : panel === "profile" ? (
            <ProfilePanel
              state={state}
              user={
                state.users.find((u) => u.id === (profileId || me.id)) ??
                mePublic
              }
              onEdit={() => setDialog({ kind: "profile-form" })}
              onSkill={() => setDialog({ kind: "skill-form" })}
              onOpen={(s) => setDialog({ kind: "skill", skill: s })}
              onEditSkill={(s) => setDialog({ kind: "skill-form", skill: s })}
              onDeleteSkill={(s) =>
                setDialog({ kind: "delete-skill", skill: s })
              }
              onLogout={logout}
              logoutBusy={logoutBusy}
              act={act}
              onMessage={message}
              onReport={(id) =>
                setDialog({ kind: "report", target: `user:${id}` })
              }
            />
          ) : panel === "wallet" ? (
            <CreditsPanel state={state} />
          ) : panel === "leaderboard" ? (
            <LeaderboardPanel
              snapshot={state}
              onProfile={(id) => showProfile(id)}
            />
          ) : panel === "badges" ? (
            <section className="badges-page">
              <div className="badges-hero">
                <div>
                  <span className="badge purple">
                    <Award size={12} /> BADGE COLLECTION
                  </span>
                  <h2>
                    Small wins,
                    <br />
                    <span>lasting proof.</span>
                  </h2>
                  <p>
                    Every lesson, message and kind review unlocks a new badge.
                    Tap any badge to see how to earn it.
                  </p>
                </div>
                <div className="badges-hero-art" aria-hidden="true">
                  <div className="badge-orbit" />
                  <div className="badge-orbit inner" />
                  <div className="badge-hero-main">
                    <Award size={36} />
                  </div>
                  <span className="hero-badge b1">
                    <Sparkles size={12} /> Trailblazer
                  </span>
                  <span className="hero-badge b2">
                    <Trophy size={12} /> #1
                  </span>
                </div>
              </div>
              <BadgeShowcase
                badges={state.myBadges}
                xp={state.myXp}
                level={state.myLevel}
                nextLevelXp={state.myNextLevelXp}
              />
              <div className="info-note" style={{ marginTop: 22 }}>
                <ShieldCheck size={18} />
                <span>
                  Badges are platform recognition, not accredited
                  qualifications. They reflect your activity inside this demo
                  workspace.
                </span>
              </div>
            </section>
          ) : null}
        </main>
        <footer className="app-footer">
          <span>© 2026 SkillLoop</span>
          <span>Learn something. Share something.</span>
          <button onClick={() => setDialog({ kind: "help" })}>
            Help & privacy
          </button>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {mainNav.map((item) => (
          <button
            key={item.id}
            className={panel === item.id ? "active" : ""}
            onClick={() => go(item.id)}
          >
            <item.icon size={20} />
            <span>
              {item.id === "profile"
                ? "Profile"
                : item.label.replace("My ", "")}
            </span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {dialog?.kind === "share-skill" && (
        <ShareSkill
          skills={state.skills.filter((skill) => skill.ownerId === me.id)}
          onNew={() => setDialog({ kind: "skill-form" })}
          onExisting={(skill) =>
            setDialog({ kind: "skill-form", skill, publish: true })
          }
          close={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "delete-skill" && (
        <DeleteSkill
          skill={dialog.skill}
          act={act}
          close={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "skill-form" && (
        <SkillForm
          key={dialog.skill?.id ?? "new"}
          skill={dialog.skill}
          publish={dialog.publish}
          act={act}
          close={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "profile-form" && (
        <ProfileForm state={state} act={act} close={() => setDialog(null)} />
      )}
      {dialog?.kind === "post" && (
        <PostForm act={act} close={() => setDialog(null)} />
      )}
      {dialog?.kind === "skill" && (
        <SkillDetail
          skill={
            state.skills.find((s) => s.id === dialog.skill.id) ?? dialog.skill
          }
          owner={state.users.find((u) => u.id === dialog.skill.ownerId)!}
          state={state}
          act={act}
          close={() => setDialog(null)}
          showProfile={() => showProfile(dialog.skill.ownerId)}
        />
      )}
      {dialog?.kind === "session" && (
        <Session
          booking={dialog.booking}
          state={state}
          act={act}
          close={() => setDialog(null)}
          openChat={openChat}
        />
      )}
      {dialog?.kind === "demo" && (
        <Modal
          title="Try another perspective"
          subtitle="Switch demo participants or invite someone to your workspace."
          onClose={() => setDialog(null)}
        >
          <div className="info-note">
            <ShieldCheck size={18} />
            <span>
              These are fictional participants. Switch to one to respond to a
              request.
            </span>
          </div>
          <div className="persona-list">
            {state.users.map((u) => (
              <button
                key={u.id}
                disabled={demoBusy || u.id === me.id}
                onClick={async () => {
                  setDemoBusy(true);
                  await safe(async () => {
                    await api("auth/switch", { userId: u.id });
                    setChatId("");
                    setProfileId("");
                    await refresh();
                    setDialog(null);
                    go("home");
                  });
                  setDemoBusy(false);
                }}
              >
                <Avatar user={u} size={34} />
                <span>
                  <strong>{u.name}</strong>
                  <small>
                    @{u.username}
                    {u.id === me.id ? " · You" : ""}
                  </small>
                </span>
                <Flag code={u.country} />
                {u.id === me.id ? (
                  <Check size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
              </button>
            ))}
          </div>
          <div className="workspace-section">
            <h3>Try it on another device</h3>
            <p className="muted small">
              A one-hour invitation lets anyone holding the link play these demo
              personas. Never use sensitive information.
            </p>
            <button
              className="button secondary"
              onClick={() =>
                safe(async () => {
                  const result = await api<{ token: string }>("invite", {});
                  setShareLink(
                    `${window.location.origin}/?invite=${encodeURIComponent(result.token)}`,
                  );
                })
              }
            >
              <Link2 size={16} /> Generate shared workspace link
            </button>
            {shareLink && (
              <div className="share-link">
                <input
                  aria-label="Shared demo invitation"
                  value={shareLink}
                  readOnly
                />
                <button
                  className="button primary"
                  onClick={() =>
                    safe(
                      () => navigator.clipboard.writeText(shareLink),
                      "Invitation copied",
                    )
                  }
                >
                  Copy
                </button>
              </div>
            )}
          </div>
          <button
            className="text-button"
            disabled={logoutBusy}
            onClick={() => void logout()}
          >
            <LogOut size={15} /> Log out
          </button>
        </Modal>
      )}
      {dialog?.kind === "help" && (
        <Modal
          title="A safe space to try something new"
          subtitle="A few things to know before you connect."
          onClose={() => setDialog(null)}
        >
          <div className="help-content">
            <h3>Demo, not a live marketplace</h3>
            <p>
              Profiles are fictional. Registration codes appear on screen and do
              not verify a real email or phone. Learning credits are simulated
              and have no monetary value.
            </p>
            <h3>Teach with care</h3>
            <p>
              Agree on a small outcome, meet in public for in-person sessions,
              and never share passwords, financial details or private documents.
              Do not use this service for graded assignment completion.
            </p>
            <h3>Evidence, not accreditation</h3>
            <p>
              Attendance and peer-reviewed work are separate. Neither is an
              accredited qualification or an employment guarantee.
            </p>
            <h3>Privacy & limitations</h3>
            <p>
              Data is persisted server-side inside isolated demo workspaces.
              Anyone with a shared workspace invitation can access its personas.
              Workspaces expire after inactivity. Interface language is English;
              teaching-language and time-zone matching are supported.
            </p>
            <h3>Reporting</h3>
            <p>
              Report a participant from their profile or a session from its
              workspace. Reports are stored, but this demo does not have a
              staffed moderation service.
            </p>
            <h3>Connection</h3>
            <p>{state.backend}</p>
          </div>
        </Modal>
      )}
      {dialog?.kind === "report" && (
        <Modal
          title="Report a concern"
          subtitle="Describe the issue without sharing sensitive information."
          onClose={() => setDialog(null)}
        >
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void safe(async () => {
                await act({
                  action: "report",
                  target: dialog.target,
                  reason: f.get("reason"),
                });
                setDialog(null);
              }, "Report saved");
            }}
          >
            <textarea
              name="reason"
              aria-label="Report reason"
              required
              minLength={10}
              maxLength={1000}
              rows={4}
            />
            <p className="muted small">
              Reports are saved, but there is no staffed support team.
            </p>
            <button className="button primary">Submit report</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SkillCard({
  skill: s,
  owner,
  saved,
  onOpen,
  onSave,
  onProfile,
}: {
  skill: Skill;
  owner: PublicUser;
  saved: boolean;
  onOpen: () => void;
  onSave: () => void;
  onProfile: () => void;
}) {
  return (
    <article className="skill-card">
      <div className="skill-image">
        <button
          className="image-open"
          onClick={onOpen}
          aria-label={`View ${s.title}`}
        >
          <img src={s.image} alt="" loading="lazy" />
        </button>
        <span className="image-category">{s.category}</span>
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          aria-label={saved ? `Unsave ${s.title}` : `Save ${s.title}`}
          onClick={onSave}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        </button>
        {s.modes.includes("trade") && (
          <span className="image-trade">
            <ArrowLeftRight size={11} /> OPEN TO TRADE
          </span>
        )}
      </div>
      <div className="skill-card-body">
        <button className="card-person" onClick={onProfile}>
          <Avatar user={owner} size={27} />
          <span>{owner.name}</span>
          <Flag code={owner.country} />
          <span className="card-time">{timeAgo(s.createdAt)}</span>
        </button>
        <button className="skill-title" onClick={onOpen}>
          {s.title}
        </button>
        <p className="skill-description">{s.description}</p>
        <div className="skill-tags">
          {s.tags.slice(0, 2).map((t) => (
            <span key={t}>{t}</span>
          ))}
          <span>{s.level}</span>
        </div>
        <div className="card-bottom">
          <div>
            <span className="card-price">
              {s.modes.includes("free")
                ? "Free to learn"
                : s.modes.includes("trade")
                  ? "Let's swap"
                  : money(s.price)}
            </span>
            <small>
              {s.modes.includes("paid")
                ? `or ${money(s.price)} / session`
                : `${s.duration} min · ${s.language}`}
            </small>
          </div>
          <button
            className="card-arrow"
            aria-label={`Explore ${s.title}`}
            onClick={onOpen}
          >
            <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="card-meta">
          <span>
            <Globe2 size={12} />
            {s.delivery === "online" ? "Online" : "In person"}
          </span>
          <span>
            {owner.stats.reviews ? (
              <>
                <Star size={11} />
                {owner.stats.rating.toFixed(1)} ({owner.stats.reviews})
              </>
            ) : (
              "New connection"
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
