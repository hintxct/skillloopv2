"use client";
import {
  Award,
  GraduationCap,
  BookOpen,
  Users,
  Layers,
  ArrowLeftRight,
  Orbit,
  MessageCircle,
  FileCheck,
  MessageSquare,
  Star,
  Sparkles,
  Trophy,
  Lock,
  Flame,
  Crown,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { BadgeProgress, PublicUser } from "@/lib/types";

const iconMap: Record<string, typeof Award> = {
  Sparkles,
  GraduationCap,
  BookOpen,
  Users,
  Layers,
  ArrowLeftRight,
  Orbit,
  MessageCircle,
  FileCheck,
  MessageSquare,
  Star,
  Award,
  Flame,
  Crown,
  Trophy,
  Zap,
  ShieldCheck,
};

function BadgeIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = iconMap[name] ?? Award;
  return <Icon size={size} />;
}

function tierStyle(tier: string) {
  if (tier === "legendary") return "tier-legendary";
  if (tier === "epic") return "tier-epic";
  if (tier === "rare") return "tier-rare";
  return "tier-common";
}

export function BadgeGrid({
  badges,
  compact = false,
}: {
  badges: BadgeProgress[];
  compact?: boolean;
}) {
  return (
    <div className={`badge-grid ${compact ? "compact" : ""}`}>
      {badges.map((b) => (
        <div
          key={b.id}
          className={`badge-card ${tierStyle(b.tier)} ${b.earned ? "earned" : "locked"}`}
        >
          <div className="badge-icon-wrap">
            <BadgeIcon name={b.icon} size={compact ? 20 : 28} />
            {b.earned ? (
              <span className="badge-check">
                <Star size={10} fill="currentColor" />
              </span>
            ) : (
              <span className="badge-lock">
                <Lock size={10} />
              </span>
            )}
            <span className={`tier-dot ${b.tier}`} />
          </div>
          <div className="badge-info">
            <strong>{b.name}</strong>
            <p>{b.description}</p>
            <small className="how">
              <Zap size={11} /> {b.howToEarn}
            </small>
            {!b.earned ? (
              <div className="badge-progress">
                <div className="badge-progress-track">
                  <span style={{ width: `${(b.progress / b.total) * 100}%` }} />
                </div>
                <span className="badge-progress-text">
                  {b.progress}/{b.total}
                </span>
              </div>
            ) : (
              <span className="badge-xp">+{b.xp} XP</span>
            )}
          </div>
          <span className={`tier-badge ${b.tier}`}>{b.tier}</span>
          {!compact && b.earned && b.earnedAt && (
            <span className="earned-date">
              Earned{" "}
              {new Date(b.earnedAt).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function BadgeShowcase({
  badges,
  xp,
  level,
  nextLevelXp,
  compact = false,
}: {
  badges: BadgeProgress[];
  xp: number;
  level: number;
  nextLevelXp: number;
  compact?: boolean;
}) {
  const earned = badges.filter((b) => b.earned);
  const total = badges.length;
  const percent = (earned.length / total) * 100;
  const levelProgress = level > 0 ? ((xp - (level - 1) * 200) / 200) * 100 : 0;
  const xpToNext = nextLevelXp - xp;

  return (
    <div className="badge-showcase">
      <div className="showcase-hero">
        <div className="showcase-level">
          <div className="level-ring">
            <span className="level-num">{level}</span>
            <small>LEVEL</small>
          </div>
          <div className="level-meta">
            <strong>{xp.toLocaleString()} XP</strong>
            <span>
              {earned.length} / {total} badges · {xpToNext} XP to Level{" "}
              {level + 1}
            </span>
            <div className="level-bar">
              <span style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
        </div>
        <div className="showcase-stats">
          <div>
            <strong>{earned.length}</strong>
            <span>Earned</span>
          </div>
          <div>
            <strong>{total - earned.length}</strong>
            <span>To unlock</span>
          </div>
          <div>
            <strong>{Math.round(percent)}%</strong>
            <span>Complete</span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="showcase-collection-bar">
          <div className="collection-track">
            <span style={{ width: `${percent}%` }} />
          </div>
          <span>
            {earned.length} of {total} collected
          </span>
        </div>
      )}

      <BadgeGrid badges={badges} compact={compact} />
    </div>
  );
}

export function ProfileBadgesMini({ user }: { user: PublicUser }) {
  const earned = user.badges.filter((b: BadgeProgress) => b.earned);
  const recent = [...earned]
    .sort((a: BadgeProgress, b: BadgeProgress) =>
      (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""),
    )
    .slice(0, 3);
  const nextToEarn = user.badges
    .filter((b: BadgeProgress) => !b.earned)
    .sort(
      (a: BadgeProgress, b: BadgeProgress) =>
        b.progress / b.total - a.progress / a.total,
    )
    .slice(-2)
    .reverse();

  return (
    <div className="profile-badges-mini">
      <div className="mini-header">
        <h3>
          <Trophy size={16} /> Badges{" "}
          <span>
            {earned.length}/{user.badges.length}
          </span>
        </h3>
        <span className="xp-pill">
          Lvl {user.level} · {user.xp} XP
        </span>
      </div>

      {recent.length > 0 ? (
        <div className="mini-recent">
          {recent.map((b) => (
            <div
              key={b.id}
              className={`mini-badge ${tierStyle(b.tier)} earned`}
            >
              <BadgeIcon name={b.icon} size={18} />
              <span>{b.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted small" style={{ margin: "10px 0" }}>
          Complete your first session to earn your debut badge.
        </p>
      )}

      {nextToEarn.length > 0 && (
        <div className="mini-next">
          <small>Next up</small>
          {nextToEarn.map((b) => (
            <div key={b.id} className="mini-next-row">
              <span>
                <BadgeIcon name={b.icon} size={14} /> {b.name}
              </span>
              <span className="badge-progress-text">
                {b.progress}/{b.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompactBadgeStrip({ badges }: { badges: BadgeProgress[] }) {
  const earned = badges.filter((b: BadgeProgress) => b.earned).slice(0, 6);
  if (!earned.length) return null;
  return (
    <div className="compact-badge-strip">
      {earned.map((b) => (
        <span
          key={b.id}
          className={`strip-badge ${tierStyle(b.tier)}`}
          title={`${b.name} · +${b.xp} XP`}
        >
          <BadgeIcon name={b.icon} size={14} />
        </span>
      ))}
      {badges.length > earned.length && (
        <span className="strip-more">+{badges.length - earned.length}</span>
      )}
    </div>
  );
}
