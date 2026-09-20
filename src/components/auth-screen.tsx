"use client";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Globe2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { api, Field, Logo, Submit } from "./ui";
import { COUNTRIES } from "@/lib/types";

export default function AuthScreen({
  onReady,
  initialError,
  invite,
}: {
  onReady: () => Promise<void>;
  initialError?: string;
  invite?: string;
}) {
  const [register, setRegister] = useState(false);
  const [phone, setPhone] = useState(false);
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [personas, setPersonas] = useState<
    { id: string; name: string; username: string }[]
  >([]);
  const [inviteLoaded, setInviteLoaded] = useState(false);
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
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await run(async () => {
      if (demoCode) {
        await api("auth/verify", { code });
        await onReady();
      } else if (!register) {
        await api("auth/login", {
          contact: form.get("contact"),
          password: form.get("password"),
        });
        await onReady();
      } else {
        const result = await api<{ demoCode: string }>("auth/start", {
          name: form.get("name"),
          dob: form.get("dob"),
          contact: form.get("contact"),
          country: form.get("country"),
          password: form.get("password"),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setDemoCode(result.demoCode);
      }
    });
  }
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Logo />
        <span className="muted-link">Learn. Share. Repeat.</span>
      </header>
      <main className="auth-layout">
        <section className="auth-story">
          <div className="eyebrow">
            <span className="pulse-dot" /> A skill shared. A new door opened.
          </div>
          <h1>
            A little give.
            <br />A <span>lot to learn.</span>
          </h1>
          <p>
            Share what you know. Find someone who can teach you something new.
          </p>
          <div className="auth-perks">
            <span>
              <HeartHandshake size={18} /> Trade skills and learn together
            </span>
            <span>
              <Globe2 size={18} /> Find your people, anywhere
            </span>
            <span>
              <ShieldCheck size={18} /> Learn with a clear outcome
            </span>
          </div>
          <div className="orbit-art">
            <div className="orbit-circle one" />
            <div className="orbit-circle two" />
            <div className="orbit-core">
              <img src="/icon.svg" width="70" height="70" alt="SkillLoop" />
            </div>
            <div className="floating-card fc-code">
              <span>⌘</span>
              <div>
                Python<small>Something to teach</small>
              </div>
            </div>
            <div className="floating-card fc-music">
              <span>♫</span>
              <div>
                Guitar<small>Something to learn</small>
              </div>
            </div>
            <div className="floating-card fc-design">
              <span>✦</span>
              <div>
                Design<small>A new connection</small>
              </div>
            </div>
            <span className="orbit-spark">
              <Sparkles size={25} />
            </span>
          </div>
        </section>
        <section className="auth-card">
          {!invite && !demoCode && (
            <div className="segmented auth-tabs" aria-label="Account access">
              {[false, true].map((isRegister) => (
                <button
                  key={String(isRegister)}
                  type="button"
                  className={register === isRegister ? "active" : ""}
                  aria-pressed={register === isRegister}
                  disabled={busy}
                  onClick={() => {
                    setRegister(isRegister);
                    setError("");
                  }}
                >
                  {isRegister ? "Register" : "Login"}
                </button>
              ))}
            </div>
          )}
          <h2>
            {invite
              ? "You're invited into the loop."
              : demoCode
                ? "One last step."
                : register
                  ? "Find your people."
                  : "Welcome back."}
          </h2>
          <p className="muted">
            {invite
              ? "Choose a participant to join this shared demo."
              : demoCode
                ? "Use the code below. No email or SMS is sent."
                : register
                  ? "One account to teach, learn and connect."
                  : "Log in to your learning space, or take a look around."}
          </p>
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          {invite ? (
            <div className="stack">
              {!inviteLoaded ? (
                <button
                  disabled={busy}
                  className="button primary full"
                  onClick={() =>
                    run(async () => {
                      const result = await api<{
                        participants: typeof personas;
                      }>(`invite?token=${encodeURIComponent(invite)}`);
                      setPersonas(result.participants);
                      setInviteLoaded(true);
                    })
                  }
                >
                  <Users size={17} /> See demo participants
                </button>
              ) : (
                <div className="persona-list">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        run(async () => {
                          await api("auth/join", {
                            token: invite,
                            userId: p.id,
                          });
                          history.replaceState({}, "", "/");
                          await onReady();
                        })
                      }
                      disabled={busy}
                    >
                      <span>
                        {p.name}
                        <small>@{p.username}</small>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              )}
              <small className="muted">
                Anyone with this one-hour invitation can play these fictional
                personas. Do not add private information.
              </small>
            </div>
          ) : (
            <form
              key={
                demoCode ? "verification" : register ? "registration" : "login"
              }
              onSubmit={submit}
              className="stack"
            >
              {demoCode ? (
                <>
                  <div className="demo-inbox">
                    <small>DEMO INBOX · NO MESSAGE SENT</small>
                    <strong>{demoCode}</strong>
                    <span>Expires in 5 minutes · single use</span>
                  </div>
                  <Field label="Enter your 6-digit code">
                    <input
                      autoFocus
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      required
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      autoComplete="one-time-code"
                    />
                  </Field>
                  <Submit busy={busy}>Complete registration</Submit>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setDemoCode("");
                      setCode("");
                    }}
                  >
                    Change details or request a new code
                  </button>
                </>
              ) : register ? (
                <>
                  <div className="segmented">
                    <button
                      type="button"
                      className={!phone ? "active" : ""}
                      onClick={() => setPhone(false)}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      className={phone ? "active" : ""}
                      onClick={() => setPhone(true)}
                    >
                      Phone
                    </button>
                  </div>
                  <Field label="Your name">
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={60}
                      placeholder="What should we call you?"
                      autoComplete="name"
                    />
                  </Field>
                  <div className="form-grid">
                    <Field label="Date of birth · private">
                      <input
                        name="dob"
                        type="date"
                        required
                        max={new Date(
                          new Date().setFullYear(new Date().getFullYear() - 18),
                        )
                          .toISOString()
                          .slice(0, 10)}
                      />
                    </Field>
                    <Field label="Country / region">
                      <select name="country" defaultValue="IN">
                        {COUNTRIES.map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label={phone ? "Phone number" : "Email address"}>
                    <input
                      key={String(phone)}
                      name="contact"
                      type={phone ? "tel" : "email"}
                      pattern={phone ? "[0-9]{10}" : undefined}
                      maxLength={phone ? 10 : 180}
                      required
                      placeholder={phone ? "Any 10 digits" : "you@example.test"}
                    />
                  </Field>
                  <Field
                    label="Password"
                    hint="At least 10 characters. Use a password you don't use elsewhere."
                  >
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={10}
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="Create a password"
                    />
                  </Field>
                  <label className="check">
                    <input type="checkbox" required /> I'm 18 or older and
                    understand this is a fictional demo.
                  </label>
                  <Submit busy={busy}>Create account</Submit>
                </>
              ) : (
                <>
                  <Field label="Email or phone">
                    <input
                      name="contact"
                      required
                      maxLength={180}
                      autoComplete="username"
                      placeholder="you@example.test"
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      name="password"
                      type="password"
                      required
                      maxLength={128}
                      autoComplete="current-password"
                      placeholder="Your password"
                    />
                  </Field>
                  <Submit busy={busy} showArrow={false}>
                    Log in
                  </Submit>
                  <div className="divider">
                    <span>or explore first</span>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    className="button secondary full large"
                    onClick={() =>
                      run(async () => {
                        await api("auth/demo", {});
                        await onReady();
                      })
                    }
                  >
                    <Sparkles size={18} /> One-click demo login
                  </button>
                </>
              )}
            </form>
          )}
          <div className="auth-disclaimer">
            <ShieldCheck size={15} />
            <span>
              Demo access only. Use fictional details. No real payments.
            </span>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <span>© 2026 SkillLoop · Built for the curious.</span>
        <span>Education. Connection. Opportunity.</span>
      </footer>
    </div>
  );
}
