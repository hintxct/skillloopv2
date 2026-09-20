"use client";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { X, ArrowUpRight, LoaderCircle, Globe2 } from "lucide-react";
import type { User, PublicUser } from "@/lib/types";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? "small" : ""}`}>
      <img
        src="/icon.svg"
        width={small ? 32 : 38}
        height={small ? 32 : 38}
        alt=""
      />
      <span>
        skillloop<span className="logo-dot">.</span>
      </span>
    </div>
  );
}
export function Avatar({
  user,
  size = 36,
}: {
  user?: Pick<User | PublicUser, "name" | "avatar" | "color">;
  size?: number;
}) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: `${user?.color ?? "#8b5cf6"}25`,
        color: user?.color ?? "#ad91ff",
        fontSize: size * 0.33,
      }}
    >
      {user?.avatar ? (
        <img src={user.avatar} alt="" />
      ) : (
        (user?.name ?? "?")
          .split(" ")
          .slice(0, 2)
          .map((s) => s[0])
          .join("")
      )}
    </span>
  );
}
export function Flag({ code }: { code: string }) {
  return (
    <img
      className="flag"
      src={`/flags/${code.toLowerCase()}.svg`}
      alt={`${code} flag`}
      width={18}
      height={18}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      d?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Globe2 size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Submit({
  busy,
  children = "Save changes",
  showArrow = true,
}: {
  busy?: boolean;
  children?: ReactNode;
  showArrow?: boolean;
}) {
  return (
    <button disabled={busy} className="button primary" type="submit">
      {busy ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
      {!busy && showArrow && <ArrowUpRight size={17} />}
    </button>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, (child) => {
        if (
          !isValidElement(child) ||
          !["input", "select", "textarea"].includes(String(child.type))
        )
          return child;
        return cloneElement(
          child as ReactElement<{ id?: string; "aria-describedby"?: string }>,
          { id, "aria-describedby": hint ? `${id}-hint` : undefined },
        );
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function timeAgo(value: string) {
  const h = Math.floor((Date.now() - +new Date(value)) / 3600000);
  return h < 1
    ? "Just now"
    : h < 24
      ? `${h}h ago`
      : `${Math.floor(h / 24)}d ago`;
}
export function dateTime(value: string, zone?: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: zone,
  }).format(new Date(value));
}
export function localDate(offsetHours = 24) {
  const d = new Date(Date.now() + offsetHours * 3600000);
  d.setMinutes(0, 0, 0);
  return new Date(+d - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data as T;
}
