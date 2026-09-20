"use client";
import { useState } from "react";
import { ArrowRight, Library, Plus, Trash2 } from "lucide-react";
import type { Skill } from "@/lib/types";
import type { Mutate } from "./forms";
import { Modal } from "./ui";

export function ShareSkill({
  skills,
  onNew,
  onExisting,
  close,
}: {
  skills: Skill[];
  onNew: () => void;
  onExisting: (skill: Skill) => void;
  close: () => void;
}) {
  const [existing, setExisting] = useState(false);
  return (
    <Modal
      title="Share a skill"
      subtitle="Start something new or reuse a skill you've already shared."
      onClose={close}
      wide
    >
      <div className="share-options">
        <button className="share-option" onClick={onNew}>
          <Plus size={28} />
          <strong>Create a new skill</strong>
          <span>Add a new lesson, its outcome and search tags.</span>
          <ArrowRight size={20} />
        </button>
        <button
          className={`share-option ${existing ? "selected" : ""}`}
          aria-expanded={existing}
          aria-controls="existing-skill-list"
          onClick={() => setExisting(!existing)}
        >
          <Library size={28} />
          <strong>Use an existing skill</strong>
          <span>
            Choose from your {skills.length} saved listing
            {skills.length === 1 ? "" : "s"}. Edit or republish without
            retyping.
          </span>
          <ArrowRight size={20} />
        </button>
      </div>
      {existing && (
        <section
          id="existing-skill-list"
          className="existing-skill-list"
          aria-label="Your existing skills"
        >
          <h3>Your existing skills</h3>
          <p className="muted small">
            Choosing a skill updates the original listing, not a duplicate.
          </p>
          {skills.length ? (
            skills.map((skill) => (
              <button
                key={skill.id}
                className="existing-skill"
                onClick={() => onExisting(skill)}
              >
                <span>
                  <strong>{skill.title}</strong>
                  <small>
                    {skill.category} · {skill.status} · {skill.duration} min
                  </small>
                </span>
                <ArrowRight size={20} />
              </button>
            ))
          ) : (
            <p className="info-note">
              No existing skills yet. Choose “Create a new skill” above to
              publish your first one.
            </p>
          )}
        </section>
      )}
    </Modal>
  );
}

export function DeleteSkill({
  skill,
  act,
  close,
}: {
  skill: Skill;
  act: Mutate;
  close: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title="Delete this skill?"
      subtitle={skill.title}
      onClose={() => {
        if (!busy) close();
      }}
    >
      <div className="stack">
        <p>
          This removes the skill from discovery, your profile, saved lists and
          your existing-skill picker. You cannot restore the listing.
        </p>
        <p className="muted">
          Past sessions, credit activity and feedback stay recorded. Complete or
          cancel open bookings and Trade Circles before deleting; pause the
          listing if you only want to stop new requests.
        </p>
        {error && (
          <div role="alert" className="alert error">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button className="button secondary" disabled={busy} onClick={close}>
            Keep skill
          </button>
          <button
            className="button secondary danger-quiet"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await act({ action: "delete-skill", skillId: skill.id });
                close();
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Trash2 size={18} />
            {busy ? "Deleting…" : "Delete skill"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
