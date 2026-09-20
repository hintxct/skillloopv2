"use client";
import { useState } from "react";
import {
  Video,
  MonitorUp,
  PhoneOff,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "./ui";

export function jitsiUrlFor(roomName: string, displayName: string) {
  const safeRoom =
    roomName.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 60) || "SkillLoop";
  return `https://meet.jit.si/${encodeURIComponent(safeRoom)}#config.prejoinConfig.enabled=false&userInfo.displayName="${encodeURIComponent(displayName)}"&config.startWithVideoMuted=false&config.startWithAudioMuted=false`;
}

export function VideoCallButton({
  roomName,
  displayName,
  label = "Join video",
  onRing,
}: {
  roomName: string;
  displayName: string;
  label?: string;
  onRing?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const jitsiUrl = jitsiUrlFor(roomName, displayName);

  return (
    <>
      <button
        className="button primary"
        onClick={() => {
          setOpen(true);
          try {
            onRing?.();
          } catch {}
        }}
      >
        <Video size={16} /> {label}
      </button>
      {open && (
        <Modal
          title="Video call — powered by Jitsi"
          subtitle="Video + audio + screen share. Works in browser, no install. Same link for all participants."
          onClose={() => setOpen(false)}
          wide
        >
          <div className="video-call-wrap">
            <div className="video-call-toolbar">
              <span className="badge purple">
                <ShieldCheck size={12} /> End-to-end encrypted by Jitsi
              </span>
              <a
                href={jitsiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button secondary"
              >
                Open in new tab <ExternalLink size={14} />
              </a>
              <button
                className="button secondary"
                onClick={() => setOpen(false)}
              >
                <PhoneOff size={14} /> Leave
              </button>
            </div>
            <div className="video-iframe-wrap">
              <iframe
                src={jitsiUrl}
                allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write"
                title="Video call"
                style={{
                  width: "100%",
                  height: "520px",
                  border: 0,
                  borderRadius: 12,
                }}
              />
            </div>
            <div className="video-hint">
              <MonitorUp size={14} /> In the call, click <b>Share screen</b>{" "}
              (bottom toolbar) to present. Works like Zoom — camera, mic, screen
              share, chat, raise hand.
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export function ScreenShareButton() {
  const [sharing, setSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  async function start() {
    try {
      const s = await (
        navigator.mediaDevices as unknown as {
          getDisplayMedia: (o: unknown) => Promise<MediaStream>;
        }
      ).getDisplayMedia({
        video: true,
        audio: true,
      });
      setStream(s);
      setSharing(true);
      s.getVideoTracks()[0].addEventListener("ended", () => stop());
    } catch (e) {
      alert((e as Error).message);
    }
  }
  function stop() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setSharing(false);
  }

  return (
    <div className="screen-share">
      {!sharing ? (
        <button className="button secondary" onClick={start}>
          <MonitorUp size={16} /> Share screen
        </button>
      ) : (
        <button className="button secondary" onClick={stop}>
          <PhoneOff size={16} /> Stop sharing
        </button>
      )}
      {sharing && stream && (
        <div className="screen-preview">
          <video
            autoPlay
            muted
            playsInline
            ref={(el) => {
              if (el && stream) el.srcObject = stream;
            }}
            style={{
              width: "100%",
              maxHeight: 240,
              borderRadius: 10,
              background: "#000",
            }}
          />
          <small className="muted small">
            Preview — others see via Jitsi screen share. Click Stop when done.
          </small>
        </div>
      )}
    </div>
  );
}
