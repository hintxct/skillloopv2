"use client";
import { useState } from "react";
import {
  Trophy,
  Crown,
  Medal,
  TrendingUp,
  Star,
  Award,
  Flame,
  Calendar,
  Clock3,
  Users,
  ArrowUpRight,
  Sparkles,
  Zap,
} from "lucide-react";
import type { Snapshot } from "@/lib/types";
import { Avatar, Flag } from "./ui";
import { CompactBadgeStrip } from "./badges";

type Period = "weekly" | "monthly" | "sevenDays";

const periodLabel: Record<Period, string> = {
  sevenDays: "Last 7 days",
  weekly: "Weekly",
  monthly: "Monthly",
};
const periodHint: Record<Period, string> = {
  sevenDays: "Rolling 7-day window · live",
  weekly: "Monday → Sunday · resets weekly",
  monthly: "Calendar month · resets monthly",
};

export function LeaderboardPanel({
  snapshot,
  onProfile,
}: {
  snapshot: Snapshot;
  onProfile: (id: string) => void;
}) {
  const [period, setPeriod] = useState<Period>("sevenDays");
  const list = snapshot.leaderboard[period];
  const meEntry = list.find((e) => e.userId === snapshot.me.id);
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);
  const isEmpty = list.every((e) => e.points === 0);

  return (
    <section className="leaderboard-page">
      <div className="leaderboard-hero">
        <div className="leaderboard-hero-text">
          <span className="badge purple">
            <Trophy size={12} /> COMMUNITY LEADERBOARD
          </span>
          <h2>
            Where curiosity
            <br />
            <span>becomes momentum.</span>
          </h2>
          <p>
            Every lesson, swap and circle counts. Climb the ranks by learning,
            teaching and helping others grow.
          </p>
          <div className="hero-stats">
            <span>
              <Users size={14} /> {snapshot.users.length} learners
            </span>
            <span>
              <Star size={14} /> {snapshot.reviews.length} reviews
            </span>
            <span>
              <Flame size={14} /> Live ranks
            </span>
          </div>
        </div>
        <div className="leaderboard-hero-art" aria-hidden="true">
          <div className="trophy-orbit" />
          <div className="trophy-orbit inner" />
          <div className="trophy-main">
            <Trophy size={42} />
          </div>
          <span className="float-badge b1">
            <Zap size={14} /> +40 XP
          </span>
          <span className="float-badge b2">
            <Crown size={14} /> #1
          </span>
          <span className="float-badge b3">
            <Medal size={14} /> Top 3
          </span>
        </div>
      </div>

      <div className="leaderboard-controls">
        <div className="segmented period-switch">
          {(["sevenDays", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              className={period === p ? "active" : ""}
              onClick={() => setPeriod(p)}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
        <span className="period-hint">
          <Clock3 size={13} /> {periodHint[period]}
        </span>
      </div>

      {meEntry && (
        <div className="me-rank-card">
          <div className="me-rank-left">
            <span className="rank-pill">You · #{meEntry.rank}</span>
            <Avatar
              user={snapshot.users.find((u) => u.id === meEntry.userId)}
              size={40}
            />
            <span>
              <strong>{meEntry.name}</strong>
              <small>
                {meEntry.points} pts · Lvl {meEntry.level} · {meEntry.xp} XP
              </small>
            </span>
          </div>
          <div className="me-rank-right">
            <span>
              <strong>{meEntry.completed}</strong> sessions
            </span>
            <span className="muted">·</span>
            <span>
              <Award size={14} />{" "}
              {snapshot.myBadges.filter((b) => b.earned).length} badges
            </span>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="empty leaderboard-empty">
          <Trophy size={28} />
          <h3>Be the first to light up the board</h3>
          <p>
            Complete a lesson, publish a skill, or help someone else. Your
            points appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="podium">
            {top3.map((entry, idx) => {
              const order = idx === 0 ? 1 : idx === 1 ? 0 : 2;
              const rank = entry.rank;
              const heights = ["podium-second", "podium-first", "podium-third"];
              const user = snapshot.users.find((u) => u.id === entry.userId);
              return (
                <div
                  key={entry.userId}
                  className={`podium-card ${heights[order]} ${entry.userId === snapshot.me.id ? "is-me" : ""}`}
                  style={{ order }}
                >
                  <div className="podium-rank">#{rank}</div>
                  <Avatar user={user} size={rank === 1 ? 62 : 52} />
                  <Flag code={entry.country} />
                  <strong>{entry.name.split(" ")[0]}</strong>
                  <small>@{entry.username}</small>
                  <span className="podium-points">
                    <Sparkles size={12} /> {entry.points} pts
                  </span>
                  <CompactBadgeStrip badges={user?.badges ?? []} />
                  <div className="podium-bar">
                    <span>
                      {rank === 1 ? <Crown size={14} /> : <Medal size={14} />}
                    </span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => onProfile(entry.userId)}
                  >
                    View profile <ArrowUpRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="leaderboard-table">
            <div className="leaderboard-head">
              <span>Rank</span>
              <span>Learner</span>
              <span>Points</span>
              <span>Sessions</span>
              <span>Level</span>
            </div>
            {rest.map((entry) => {
              const user = snapshot.users.find((u) => u.id === entry.userId);
              const isMe = entry.userId === snapshot.me.id;
              return (
                <button
                  key={entry.userId}
                  className={`leaderboard-row ${isMe ? "is-me" : ""}`}
                  onClick={() => onProfile(entry.userId)}
                >
                  <span className="rank-num">#{entry.rank}</span>
                  <span className="row-person">
                    <Avatar user={user} size={36} />
                    <span>
                      <strong>{entry.name}</strong>
                      <small>
                        @{entry.username} <Flag code={entry.country} />
                      </small>
                    </span>
                  </span>
                  <span className="row-points">
                    <TrendingUp size={12} /> {entry.points}
                  </span>
                  <span className="row-sessions">
                    {entry.completed} <small>· {entry.taught} taught</small>
                  </span>
                  <span className="row-level">
                    <span className="level-badge">Lvl {entry.level}</span>
                    <small>{entry.xp} XP</small>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="leaderboard-foot">
        <div className="info-note">
          <Calendar size={18} />
          <span>
            <strong>How points work:</strong> Completed lesson +40 (trade +15,
            circle +20) · Skill shared +25 · 5★ review +50 · Message +2 (cap 20)
            · Learning post +15. Points reset with each window; XP & badges are
            forever.
          </span>
        </div>
      </div>
    </section>
  );
}

export function LeaderboardTeaser({
  snapshot,
  onOpen,
}: {
  snapshot: Snapshot;
  onOpen: () => void;
}) {
  const top = snapshot.leaderboard.sevenDays.slice(0, 3);
  return (
    <div className="rail-card leaderboard-teaser">
      <div className="section-line">
        <h3>
          <Trophy size={16} /> Leaderboard
        </h3>
        <span className="badge purple">Live</span>
      </div>
      <p className="muted small">Top learners · Last 7 days</p>
      <div className="teaser-list">
        {top.map((entry) => {
          const user = snapshot.users.find((u) => u.id === entry.userId);
          return (
            <div key={entry.userId} className="teaser-row">
              <span className="teaser-rank">#{entry.rank}</span>
              <Avatar user={user} size={30} />
              <span>
                <strong>{entry.name.split(" ")[0]}</strong>
                <small>{entry.points} pts</small>
              </span>
              {entry.rank === 1 && <Crown size={14} className="crown" />}
            </div>
          );
        })}
      </div>
      <button className="button secondary full" onClick={onOpen}>
        View full board <ArrowUpRight size={14} />
      </button>
    </div>
  );
}
