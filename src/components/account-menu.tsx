"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import type { User } from "@/lib/types";
import { Avatar } from "./ui";

export function AccountMenu({
  user,
  onProfile,
  onLogout,
  busy,
}: {
  user: User;
  onProfile: () => void;
  onLogout: () => Promise<void>;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      className="account-menu"
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        className="avatar-button"
        ref={trigger}
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-controls="profile-options"
        onClick={() => setOpen(!open)}
      >
        <Avatar user={user} size={34} />
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          className="account-popover"
          id="profile-options"
          role="region"
          aria-label="Profile options"
        >
          <strong>{user.name}</strong>
          <small>@{user.username}</small>
          <button
            className="button secondary full"
            onClick={() => {
              setOpen(false);
              onProfile();
            }}
          >
            <UserRound size={18} /> My profile
          </button>
          <button
            className="button secondary full danger-quiet"
            disabled={busy}
            onClick={() => void onLogout()}
          >
            <LogOut size={18} /> {busy ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
