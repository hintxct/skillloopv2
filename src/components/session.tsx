"use client";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  ExternalLink,
  FileCheck2,
  MessageCircle,
  ShieldCheck,
  Coins,
  Video,
} from "lucide-react";
import type { Booking, Snapshot } from "@/lib/types";
import { money } from "@/lib/types";
import { Avatar, dateTime, Field, localDate, Modal } from "./ui";
import { VideoCallButton, ScreenShareButton } from "./video-call";
import type { Mutate } from "./forms";

export function Session({
  booking: original,
  state,
  act,
  close,
  openChat,
}: {
  booking: Booking;
  state: Snapshot;
  act: Mutate;
  close: () => void;
  openChat: (id: string) => void;
}) {
  const b = state.bookings.find((b) => b.id === original.id) ?? original;
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [field, setField] = useState("");
  const [value, setValue] = useState("");
  const provider = state.users.find((u) => u.id === b.providerId)!,
    learner = state.users.find((u) => u.id === b.learnerId)!;
  const isProvider = state.me.id === b.providerId;
  const other = isProvider ? learner : provider;
  const canAccept =
    (b.status === "pending" && isProvider) ||
    (b.status === "countered" && b.counterBy !== state.me.id);
  async function operation(operation: string, input?: string) {
    setError("");
    setBusy(true);
    try {
      await act({
        action: "booking",
        bookingId: b.id,
        operation,
        value: input,
      });
      setField("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(operation: string, initial = "") {
    setField(operation);
    setValue(initial);
  }
  return (
    <Modal
      title="Your learning workspace"
      subtitle={b.title}
      onClose={close}
      wide
    >
      <div className="session-head">
        <div className="person-row">
          <Avatar user={other} size={48} />
          <span>
            <strong>{other.name}</strong>
            <small>
              {isProvider ? "Your learner" : "Your mentor"} · @{other.username}
            </small>
          </span>
        </div>
        <span
          className={`badge ${b.status === "completed" ? "green" : "purple"}`}
        >
          {b.status.replaceAll("-", " ")}
        </span>
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      <div className="session-facts">
        <div>
          <CalendarDays size={18} />
          <small>YOUR LOCAL TIME</small>
          <strong>{dateTime(b.startsAt, state.me.timezone)}</strong>
          <span>{state.me.timezone}</span>
        </div>
        <div>
          <Clock3 size={18} />
          <small>ONE FOCUSED SESSION</small>
          <strong>{b.duration} minutes</strong>
          <span>
            {b.kind === "paid"
              ? money(b.price)
              : b.kind === "trade"
                ? "Skill exchange"
                : "Free community session"}
          </span>
        </div>
      </div>
      <div className="outcome">
        <FileCheck2 size={22} />
        <div>
          <small>WHAT YOU'RE WORKING TOWARDS</small>
          <p>{b.outcome}</p>
        </div>
      </div>
      {b.note && (
        <div className="session-note">
          <small>INTRODUCTION</small>
          <p>{b.note}</p>
        </div>
      )}
      {b.exchangeTitle && (
        <div className="session-note">
          <small>THE OTHER HALF OF YOUR TRADE</small>
          <strong>{b.exchangeTitle}</strong>
          <p>{b.exchangeOutcome}</p>
          <span className="muted">
            {b.exchangeStartsAt &&
              dateTime(b.exchangeStartsAt, state.me.timezone)}{" "}
            · {b.exchangeDuration} min
          </span>
        </div>
      )}
      <div className="video-call-section">
        <h3>
          <Video size={18} /> Video call & screen share
        </h3>
        <p className="muted small">
          Real-time video like Zoom — camera, mic and screen share in browser, no install. Same link for all
          participants. Screen share via Jitsi toolbar.
        </p>
        <div className="row">
          <VideoCallButton
            roomName={`SkillLoop-${b.circleId || b.id}`}
            displayName={state.me.name}
            label={b.circleId ? "Join group video" : "Join video call"}
          />
          <ScreenShareButton />
          {b.meeting ? (
            <a
              className="button secondary"
              href={b.meeting}
              target="_blank"
              rel="noopener noreferrer"
            >
              External link <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
        <small className="muted small">
          Tip: Allow camera/mic when prompted. Use Jitsi&apos;s bottom bar → Share screen. Works for 1-to-1 and group (up to 3 in circle).
        </small>
      </div>
      <div className="session-actions">
        {canAccept && (
          <>
            <button
              disabled={busy}
              className="button primary"
              onClick={() => operation("accept")}
            >
              <Check size={16} /> Accept request
            </button>
            <button
              disabled={busy}
              className="button secondary"
              onClick={() => operation("decline")}
            >
              Decline
            </button>
            <button
              className="button secondary"
              onClick={() => edit("counter", localDate(48))}
            >
              Suggest a time
            </button>
          </>
        )}
        {b.status === "awaiting-payment" && !isProvider && (
          <button
            disabled={busy}
            className="button primary"
            onClick={() => operation("pay")}
          >
            <Coins size={17} /> Use {money(b.price)}
          </button>
        )}
        {["scheduled", "completed"].includes(b.status) && (
          <button
            className="button secondary"
            onClick={() => {
              const c = state.conversations.find(
                (c) => c.bookingId === b.id || c.members.includes(other.id),
              );
              if (c) openChat(c.id);
            }}
          >
            <MessageCircle size={17} /> Open chat
          </button>
        )}
        {b.meeting && (
          <a
            className="button primary"
            href={b.meeting}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join meeting <ExternalLink size={15} />
          </a>
        )}
        {b.status === "scheduled" && isProvider && (
          <button
            className="button secondary"
            onClick={() => edit("meeting", b.meeting)}
          >
            Set meeting link
          </button>
        )}
        {b.status === "scheduled" && !b.circleId && !b.confirmations.length && (
          <button
            className="button secondary"
            onClick={() => edit("propose-time", localDate(48))}
          >
            Reschedule
          </button>
        )}
        {!["cancelled", "declined", "expired", "completed"].includes(
          b.status,
        ) &&
          !b.circleId &&
          !b.confirmations.length &&
          !b.exchangeConfirmations.length && (
            <button
              disabled={busy}
              className="button danger-quiet"
              onClick={() => {
                if (
                  window.confirm(
                    "Cancel this session? Eligible credits will be returned.",
                  )
                )
                  operation("cancel");
              }}
            >
              Cancel session
            </button>
          )}
      </div>
      {b.proposedAt && (
        <div className="alert">
          <span>
            Proposed new time: {dateTime(b.proposedAt, state.me.timezone)}.
            Original time remains agreed until accepted.
          </span>
          {b.rescheduleBy !== state.me.id && (
            <button
              className="button primary"
              disabled={busy}
              onClick={() => operation("accept-time")}
            >
              Accept new time
            </button>
          )}
        </div>
      )}
      {["scheduled", "completed"].includes(b.status) && (
        <>
          <section className="workspace-section">
            <h3>
              <CheckCheck size={18} /> Attendance & completion
            </h3>
            <p className="muted small">
              Each person confirms separately. In this demo, you can try this
              before the scheduled time.
            </p>
            <div className="confirmation-row">
              <span>
                {b.confirmations.length}/2 confirmations · {b.title}
              </span>
              <button
                className="button secondary"
                disabled={busy || b.confirmations.includes(state.me.id)}
                onClick={() => operation("confirm")}
              >
                {b.confirmations.includes(state.me.id)
                  ? "You've confirmed"
                  : "Confirm attendance"}
              </button>
            </div>
            {b.exchangeSkillId && (
              <div className="confirmation-row">
                <span>
                  {b.exchangeConfirmations.length}/2 confirmations ·{" "}
                  {b.exchangeTitle}
                </span>
                <button
                  className="button secondary"
                  disabled={
                    busy || b.exchangeConfirmations.includes(state.me.id)
                  }
                  onClick={() => operation("confirm-exchange")}
                >
                  {b.exchangeConfirmations.includes(state.me.id)
                    ? "You've confirmed"
                    : "Confirm return lesson"}
                </button>
              </div>
            )}
          </section>
          <section className="workspace-section">
            <h3>
              <FileCheck2 size={18} /> A little proof of progress
            </h3>
            <p className="muted small">
              Share what you made or explain what you can do. Peer feedback is
              not an accredited qualification.
            </p>
            {b.evidence && <blockquote>{b.evidence}</blockquote>}
            {b.feedback && (
              <div className="review-result">
                <ShieldCheck size={17} />
                <span>
                  <strong>Peer-reviewed task</strong>
                  {b.feedback}
                </span>
              </div>
            )}
            <div className="row">
              {!isProvider && (
                <button
                  className="button secondary"
                  onClick={() => edit("evidence", b.evidence)}
                >
                  {b.evidence ? "Update my work" : "Share my work"}
                </button>
              )}
              {isProvider && b.evidence && (
                <button
                  className="button secondary"
                  onClick={() => edit("feedback", b.feedback)}
                >
                  Review submitted work
                </button>
              )}
            </div>
          </section>
        </>
      )}
      {b.status === "completed" &&
        !state.reviews.some(
          (r) => r.bookingId === b.id && r.authorId === state.me.id,
        ) && (
          <section className="workspace-section">
            <h3>How was the session?</h3>
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                setBusy(true);
                try {
                  await act({
                    action: "review",
                    bookingId: b.id,
                    rating: Number(f.get("rating")),
                    text: f.get("review"),
                  });
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <select aria-label="Session rating" name="rating">
                <option value="5">5 — Loved it</option>
                <option value="4">4 — Really good</option>
                <option value="3">3 — Okay</option>
                <option value="2">2 — Could be better</option>
                <option value="1">1 — Difficult experience</option>
              </select>
              <textarea
                name="review"
                required
                minLength={5}
                maxLength={700}
                placeholder="Share thoughtful, specific feedback…"
                rows={2}
              />
              <button disabled={busy} className="button primary" type="submit">
                Publish review
              </button>
            </form>
          </section>
        )}
      {field && (
        <form
          className="inline-editor stack"
          onSubmit={(e) => {
            e.preventDefault();
            const isTime = field.includes("time") || field === "counter";
            if (isTime && !Number.isFinite(+new Date(value))) {
              setError("Choose a valid date and time.");
              return;
            }
            void operation(
              field,
              isTime ? new Date(value).toISOString() : value,
            );
          }}
        >
          <Field
            label={
              field.includes("time") || field === "counter"
                ? "New date and time · device local time"
                : field === "meeting"
                  ? "Secure meeting link"
                  : field === "dispute"
                    ? "Describe what happened"
                    : field === "feedback"
                      ? "What did the learner demonstrate? Be specific."
                      : "Describe your result, including any relevant public links"
            }
          >
            {field.includes("time") || field === "counter" ? (
              <input
                type="datetime-local"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : field === "meeting" ? (
              <input
                type="url"
                required
                placeholder="https://…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : (
              <textarea
                required
                minLength={10}
                maxLength={field === "dispute" ? 1000 : 2000}
                rows={3}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </Field>
          <div className="row">
            <button type="submit" className="button primary" disabled={busy}>
              Save
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setField("")}
            >
              Close
            </button>
          </div>
        </form>
      )}
      {b.dispute && (
        <div className="alert">
          Issue reported: {b.dispute}
          <small>
            Your report is saved. There is no staffed support service.
          </small>
        </div>
      )}
      <div className="workspace-footer">
        <span className="muted small">
          Agreement captured when requested · {dateTime(b.createdAt)}
        </span>
        <button className="text-button" onClick={() => edit("dispute")}>
          Report an issue
        </button>
      </div>
    </Modal>
  );
}
