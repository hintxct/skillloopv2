"use client";
import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import type { Snapshot } from "@/lib/types";
import { Avatar } from "./ui";
import { jitsiUrlFor } from "./video-call";
import type { Mutate } from "./forms";

function useRingtone(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        ctxRef.current?.close();
      } catch {}
      ctxRef.current = null;
      return;
    }
    let ctx: AudioContext | null = null;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new AC();
      ctxRef.current = ctx;
    } catch {
      return;
    }
    const ringOnce = () => {
      if (!ctx) return;
      const now = ctx.currentTime;
      for (const [offset, freq] of [
        [0, 440],
        [0.4, 480],
      ] as const) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.4);
      }
    };
    ringOnce();
    timerRef.current = window.setInterval(ringOnce, 1200);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      try {
        ctx?.close();
      } catch {}
    };
  }, [active]);
}

export function IncomingCallModal({
  state,
  act,
}: {
  state: Snapshot;
  act: Mutate;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  const incoming = state.notifications.filter(
    (n) =>
      !n.read &&
      n.target.startsWith("call:") &&
      !dismissed.includes(n.id) &&
      now - +new Date(n.createdAt) < 90000,
  );
  const current = incoming[0];
  useRingtone(!!current && !joinUrl);

  useEffect(() => {
    setJoinUrl(null);
  }, [current?.id]);

  if (!current) return null;

  const target = current.target; // call:<convId> or call:booking:<bookingId>
  let roomName = "SkillLoop";
  let title = current.title.replace("Incoming video call from ", "");
  if (target.startsWith("call:booking:")) {
    const bookingId = target.replace("call:booking:", "");
    const b = state.bookings.find((x) => x.id === bookingId);
    roomName = `SkillLoop-${b?.circleId || b?.id || bookingId}`;
  } else {
    const convId = target.replace("call:", "");
    roomName = `SkillLoop-${convId}`;
    const conv = state.conversations.find((c) => c.id === convId);
    if (conv && conv.members.length > 2)
      title += ` · group (${conv.members.length})`;
  }
  const caller = state.users.find((u) => u.name === title.split(" · ")[0]);

  async function markRead() {
    try {
      await act({ action: "call-read" });
    } catch {}
  }

  if (joinUrl) {
    return (
      <div
        className="incoming-call-overlay"
        role="dialog"
        aria-label="Video call"
      >
        <div className="incoming-call-card joining">
          <div className="video-iframe-wrap">
            <iframe
              src={joinUrl}
              allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write"
              title="Video call"
              style={{
                width: "min(860px, 92vw)",
                height: "min(560px, 70vh)",
                border: 0,
                borderRadius: 12,
              }}
            />
          </div>
          <div className="row" style={{ justifyContent: "center" }}>
            <button
              className="button secondary"
              onClick={() => {
                setJoinUrl(null);
                setDismissed((d) => [...d, current.id]);
                void markRead();
              }}
            >
              <PhoneOff size={16} /> Leave call
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="incoming-call-overlay"
      role="dialog"
      aria-label="Incoming call"
    >
      <div className="incoming-call-card">
        <div className="incoming-avatar">
          <Avatar user={caller} size={72} />
          <span className="ring-pulse" />
        </div>
        <h2>{current.title}</h2>
        <p className="muted">{current.body}</p>
        <small className="muted small">
          Same Jitsi room as the caller — camera, mic and screen share included.
        </small>
        <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
          <button
            className="button primary"
            onClick={() => {
              setJoinUrl(jitsiUrlFor(roomName, state.me.name));
              void markRead();
            }}
          >
            <Video size={16} /> Join now
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setDismissed((d) => [...d, current.id]);
              void markRead();
            }}
          >
            <PhoneOff size={16} /> Decline
          </button>
        </div>
        <button
          className="text-button"
          style={{ marginTop: 6 }}
          onClick={() => {
            // Mute ring but keep popup for 90s
            setDismissed((d) => [...d, current.id]);
          }}
        >
          <Phone size={14} /> Mute ring
        </button>
      </div>
    </div>
  );
}
