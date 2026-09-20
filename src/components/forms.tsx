"use client";
import { useState, type FormEvent } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  Link2,
  ShieldCheck,
  Sparkles,
  Upload,
  Coins,
} from "lucide-react";
import {
  CATEGORIES,
  COUNTRIES,
  LANGUAGES,
  money,
  type Skill,
  type Snapshot,
  type PublicUser,
  type OfferMode,
} from "@/lib/types";
import { Avatar, Field, Flag, localDate, Modal, Submit } from "./ui";
import { TagInput } from "./tag-input";

export type Mutate = (
  action: Record<string, unknown>,
) => Promise<Record<string, unknown>>;
export function SkillForm({
  skill,
  publish = false,
  act,
  close,
}: {
  skill?: Skill;
  publish?: boolean;
  act: Mutate;
  close: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [tags, setTags] = useState<string[]>(skill?.tags ?? []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tags.length) {
      setError("Add at least one search tag using + or Enter.");
      return;
    }
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await act({
        action: "skill",
        skillId: skill?.id,
        publish,
        data: {
          title: f.get("title"),
          category: f.get("category"),
          description: f.get("description"),
          outcome: f.get("outcome"),
          tags,
          language: f.get("language"),
          level: f.get("level"),
          duration: Number(f.get("duration")),
          modes: f.getAll("modes"),
          price: Math.round(Number(f.get("price") || 0) * 100),
          delivery: f.get("delivery"),
          proof: f.get("proof"),
        },
      });
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        skill
          ? "Make your skill shine"
          : "Something you know. Someone's next step."
      }
      subtitle={
        publish
          ? "Reuse your saved details. This updates and publishes the same skill, without creating a duplicate."
          : "Register a skill · you don't need to be an expert to help a beginner."
      }
      onClose={close}
      wide
    >
      <form className="stack" onSubmit={submit}>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <Field label="Skill title">
          <input
            name="title"
            required
            minLength={5}
            maxLength={90}
            defaultValue={skill?.title}
            placeholder="e.g. Python, from zero to your first project"
          />
        </Field>
        <div className="form-grid">
          <Field label="Category">
            <select name="category" defaultValue={skill?.category}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Level you teach">
            <select name="level" defaultValue={skill?.level ?? "Beginner"}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </Field>
        </div>
        <Field label="Tell learners what to expect">
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={2000}
            rows={3}
            defaultValue={skill?.description}
            placeholder="Your approach, who this is for, and anything to bring…"
          />
        </Field>
        <Field
          label="By the end, you can…"
          hint="A small, practical outcome is better than a big promise."
        >
          <input
            name="outcome"
            required
            minLength={10}
            maxLength={300}
            defaultValue={skill?.outcome}
            placeholder="Build and explain a simple Python calculator"
          />
        </Field>
        <TagInput
          tags={tags}
          onChange={(next) => {
            setTags(next);
            setError("");
          }}
        />
        <div className="form-grid three">
          <Field label="Teaching language">
            <select name="language" defaultValue={skill?.language ?? "English"}>
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Session duration">
            <select name="duration" defaultValue={skill?.duration ?? 45}>
              {[15, 30, 45, 60, 90, 120].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </Field>
          <Field label="Where">
            <select name="delivery" defaultValue={skill?.delivery ?? "online"}>
              <option value="online">Online</option>
              <option value="in-person">In person</option>
            </select>
          </Field>
        </div>
        <fieldset>
          <legend>How would you like to share?</legend>
          <div className="offer-options">
            {[
              ["trade", "Skill exchange"],
              ["paid", "Paid mentorship"],
              ["free", "Free community session"],
            ].map(([value, label]) => (
              <label className="check-card" key={value}>
                <input
                  name="modes"
                  type="checkbox"
                  value={value}
                  defaultChecked={
                    skill
                      ? skill.modes.includes(value as OfferMode)
                      : value === "trade"
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="form-grid">
          <Field label="Credits per session">
            <input
              name="price"
              type="number"
              min="0"
              max="1000"
              step="0.01"
              defaultValue={(skill?.price ?? 1500) / 100}
            />
          </Field>
          <Field label="Proof or portfolio link · optional">
            <input
              name="proof"
              type="url"
              defaultValue={skill?.proof}
              placeholder="https://your-portfolio.com"
            />
          </Field>
        </div>
        <div className="info-note">
          <ShieldCheck size={17} />
          <span>
            Portfolio links are self-reported. Sessions use demo credits, not
            real money.
          </span>
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <Submit busy={busy}>
            {publish
              ? "Save and publish skill"
              : skill
                ? "Save skill"
                : "Publish my skill"}
          </Submit>
        </div>
      </form>
    </Modal>
  );
}

export function ProfileForm({
  state,
  act,
  close,
}: {
  state: Snapshot;
  act: Mutate;
  close: () => void;
}) {
  const me = state.me;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [avatar, setAvatar] = useState(me.avatar);
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 512 * 1024
    ) {
      setError("Use a JPEG, PNG or WebP image under 512 KB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const f = new FormData();
      f.set("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: f });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAvatar(result.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const socials = [
        "LinkedIn",
        "GitHub",
        "Instagram",
        "YouTube",
        "X",
        "Discord",
        "Website",
      ]
        .map((label) => ({
          label,
          url: String(f.get(`social-${label}`) ?? "").trim(),
        }))
        .filter((s) => s.url);
      await act({
        action: "profile",
        name: f.get("name"),
        username: f.get("username"),
        bio: f.get("bio"),
        country: f.get("country"),
        city: f.get("city"),
        timezone: f.get("timezone"),
        languages: String(f.get("languages"))
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        wants: String(f.get("wants"))
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        avatar,
        available: f.get("available") === "on",
        socials,
      });
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Your corner of the world"
      subtitle="Tell people a little about you. These details are visible to others in your workspace."
      onClose={close}
      wide
    >
      <form className="stack" onSubmit={submit}>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <div className="profile-upload">
          <Avatar user={{ ...me, avatar }} size={72} />
          <label className="button secondary">
            <Upload size={16} /> Change photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          {avatar && (
            <button
              type="button"
              className="text-button"
              onClick={() => setAvatar("")}
            >
              Remove
            </button>
          )}
        </div>
        <div className="form-grid">
          <Field label="Display name">
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              defaultValue={me.name}
            />
          </Field>
          <Field label="@username">
            <input
              name="username"
              required
              pattern="[A-Za-z0-9_]{3,24}"
              defaultValue={me.username}
            />
          </Field>
        </div>
        <Field label="A little about you">
          <textarea name="bio" rows={3} maxLength={500} defaultValue={me.bio} />
        </Field>
        <div className="form-grid">
          <Field label="Country / region">
            <select name="country" defaultValue={me.country}>
              {COUNTRIES.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City / campus · optional">
            <input
              name="city"
              maxLength={80}
              defaultValue={me.city}
              placeholder="General area only, never your home address"
            />
          </Field>
          <Field label="Time zone">
            <input
              name="timezone"
              required
              defaultValue={me.timezone}
              list="timezones"
            />
            <datalist id="timezones">
              {Intl.supportedValuesOf("timeZone").map((z) => (
                <option key={z}>{z}</option>
              ))}
            </datalist>
          </Field>
          <Field label="Languages · comma separated">
            <input
              name="languages"
              required
              defaultValue={me.languages.join(", ")}
            />
          </Field>
        </div>
        <Field
          label="I want to learn · comma separated"
          hint="Use specific skill tags, such as Python, Guitar or Design. These power Trade Circle suggestions."
        >
          <input name="wants" defaultValue={me.wants.join(", ")} />
        </Field>
        <label className="check">
          <input
            name="available"
            type="checkbox"
            defaultChecked={me.available}
          />{" "}
          Accept new learning requests
        </label>
        <details className="details">
          <summary>
            <Link2 size={16} /> Social links
          </summary>
          <div className="form-grid">
            {[
              "LinkedIn",
              "GitHub",
              "Instagram",
              "YouTube",
              "X",
              "Discord",
              "Website",
            ].map((label) => (
              <Field key={label} label={label}>
                <input
                  name={`social-${label}`}
                  type="url"
                  defaultValue={me.socials.find((s) => s.label === label)?.url}
                  placeholder="https://…"
                />
              </Field>
            ))}
          </div>
        </details>
        <div className="info-note">
          <ShieldCheck size={17} />
          <span>
            DOB and contact details are private and never included in public
            profile responses. Demo identities cannot verify account ownership.
          </span>
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            Cancel
          </button>
          <Submit busy={busy} />
        </div>
      </form>
    </Modal>
  );
}

export function SkillDetail({
  skill,
  owner,
  state,
  act,
  close,
  showProfile,
}: {
  skill: Skill;
  owner: PublicUser;
  state: Snapshot;
  act: Mutate;
  close: () => void;
  showProfile: () => void;
}) {
  const [mode, setMode] = useState<OfferMode>(skill.modes[0]);
  const [booking, setBooking] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const mine = state.skills.filter(
    (s) =>
      s.ownerId === state.me.id &&
      s.status === "published" &&
      s.modes.includes("trade"),
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await act({
        action: "request",
        skillId: skill.id,
        kind: mode,
        startsAt: new Date(String(f.get("startsAt"))).toISOString(),
        exchangeSkillId: mode === "trade" ? f.get("exchange") : undefined,
        exchangeStartsAt:
          mode === "trade"
            ? new Date(String(f.get("exchangeStartsAt"))).toISOString()
            : undefined,
        note: f.get("note"),
      });
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={booking ? "Make your next connection" : skill.title}
      subtitle={
        booking
          ? "Propose a time. Nothing is confirmed until both people agree."
          : `${skill.category} · ${skill.level}`
      }
      onClose={close}
      wide
    >
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {!booking ? (
        <>
          <img className="detail-cover" src={skill.image} alt="" />
          <button className="person-row profile-link" onClick={showProfile}>
            <Avatar user={owner} size={42} />
            <span>
              <strong>{owner.name}</strong>
              <small>
                @{owner.username} · <Flag code={owner.country} />{" "}
                {owner.country}
              </small>
            </span>
            <span className="badge">View profile</span>
          </button>
          <p className="detail-description">{skill.description}</p>
          <div className="outcome">
            <Sparkles size={20} />
            <div>
              <small>YOUR SMALL, MEANINGFUL OUTCOME</small>
              <p>{skill.outcome}</p>
            </div>
          </div>
          <div className="detail-meta">
            <span>
              <Clock3 size={16} /> {skill.duration} minutes
            </span>
            <span>
              <Globe2 size={16} /> {skill.language}
            </span>
            <span>
              <CalendarDays size={16} />{" "}
              {skill.delivery === "online"
                ? "Online session"
                : "In-person session"}
            </span>
          </div>
          {skill.proof && (
            <a
              className="text-button"
              href={skill.proof}
              target="_blank"
              rel="noopener noreferrer"
            >
              View provider-submitted proof <Link2 size={14} />
            </a>
          )}
          <div className="detail-bottom">
            <div className="tags">
              {skill.modes.map((m) => (
                <span
                  className={`badge ${m === "free" ? "green" : "purple"}`}
                  key={m}
                >
                  {m === "paid"
                    ? `${money(skill.price)} / session`
                    : m === "free"
                      ? "Free community session"
                      : "Open to skill trades"}
                </span>
              ))}
            </div>
            {owner.id !== state.me.id && (
              <button
                className="button primary"
                onClick={() => setBooking(true)}
              >
                Let's learn together <ArrowLeftRight size={17} />
              </button>
            )}
          </div>
        </>
      ) : (
        <form className="stack" onSubmit={submit}>
          <div className="segmented">
            {skill.modes.map((m) => (
              <button
                type="button"
                className={mode === m ? "active" : ""}
                key={m}
                onClick={() => setMode(m)}
              >
                {m === "trade"
                  ? "Skill trade"
                  : m === "paid"
                    ? "Paid mentorship"
                    : "Free session"}
              </button>
            ))}
          </div>
          <div className="outcome">
            <Check size={19} />
            <p>{skill.outcome}</p>
          </div>
          {mode === "trade" && (
            <>
              <Field label="The skill you'll teach in return">
                <select name="exchange" required disabled={!mine.length}>
                  {!mine.length ? (
                    <option value="">
                      Register a trade skill in your profile first
                    </option>
                  ) : (
                    mine.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.title}
                      </option>
                    ))
                  )}
                </select>
              </Field>
              <Field label="When you'll teach your lesson · your device's local time">
                <input
                  name="exchangeStartsAt"
                  type="datetime-local"
                  defaultValue={localDate(27)}
                  required
                />
              </Field>
            </>
          )}
          <Field
            label={`When you'd like to learn · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}
          >
            <input
              name="startsAt"
              type="datetime-local"
              defaultValue={localDate()}
              required
            />
          </Field>
          <Field label="Say hello and share your learning goal">
            <textarea
              name="note"
              rows={3}
              maxLength={800}
              placeholder="Hi! I'd love to learn…"
              defaultValue=""
            />
          </Field>
          {mode === "paid" && (
            <div className="info-note">
              <Coins size={18} />
              <span>
                {money(skill.price)} per {skill.duration}-minute session.
                Credits are used only after the mentor accepts. Demo credits
                have no monetary value.
              </span>
            </div>
          )}
          <p className="muted small">
            Your mentor will confirm the time or suggest another.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setBooking(false)}
            >
              Back
            </button>
            <Submit busy={busy || (mode === "trade" && !mine.length)}>
              Send learning request
            </Submit>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function PostForm({ act, close }: { act: Mutate; close: () => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await act({
        action: "post",
        title: f.get("title"),
        description: f.get("description"),
        category: f.get("category"),
        language: f.get("language"),
        delivery: f.get("delivery"),
      });
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="What would you love to learn?"
      subtitle="Tell the community what you'd like to learn."
      onClose={close}
    >
      <form className="stack" onSubmit={submit}>
        {error && (
          <div role="alert" className="alert error">
            {error}
          </div>
        )}
        <Field label="A short title">
          <input
            name="title"
            required
            minLength={5}
            maxLength={100}
            placeholder="Help me get started with Python"
          />
        </Field>
        <Field label="Your learning goal">
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={600}
            rows={3}
            placeholder="What would you like to do? What can you offer in return?"
          />
        </Field>
        <Field label="Category">
          <select name="category">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Language">
            <select name="language">
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Session mode">
            <select name="delivery">
              <option value="online">Online</option>
              <option value="in-person">In person</option>
            </select>
          </Field>
        </div>
        <Submit busy={busy}>Publish request</Submit>
      </form>
    </Modal>
  );
}
