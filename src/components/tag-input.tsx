"use client";
import { useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

export function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  function add() {
    const tag = draft.trim();
    if (!tag) return;
    if (tags.some((value) => value.toLowerCase() === tag.toLowerCase())) {
      setError("That tag is already added.");
      return;
    }
    if (tags.length >= 8) {
      setError("You can add up to 8 tags. Remove one to add another.");
      return;
    }
    if (tag.includes(",")) {
      setError("Add one tag at a time using + or Enter.");
      return;
    }
    onChange([...tags, tag]);
    setDraft("");
    setError("");
    input.current?.setCustomValidity("");
    input.current?.focus();
  }
  return (
    <div className="field tag-editor">
      <label htmlFor={id}>Search tags</label>
      <div className="tag-entry">
        <input
          id={id}
          ref={input}
          value={draft}
          maxLength={30}
          placeholder="Type a tag, then press +"
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          aria-invalid={!!error}
          onChange={(event) => {
            setDraft(event.target.value);
            event.target.setCustomValidity(
              event.target.value.trim()
                ? "Press + or Enter to add this tag, or clear it before publishing."
                : "",
            );
            setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          className="button secondary"
          aria-label="Add tag"
          disabled={!draft.trim()}
          onClick={add}
        >
          <Plus size={20} />
        </button>
      </div>
      <small id={`${id}-hint`}>
        Add 1–8 tags, up to 30 characters each. Press + or Enter after each tag.
      </small>
      {error && (
        <p id={`${id}-error`} className="tag-error" role="alert">
          {error}
        </p>
      )}
      {!!draft.trim() && !error && (
        <small>Press + or Enter to include “{draft.trim()}”.</small>
      )}
      {!!tags.length && (
        <ul className="tag-chips" aria-label="Added search tags">
          {tags.map((tag) => (
            <li key={tag}>
              <span>{tag}</span>
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() => {
                  onChange(tags.filter((value) => value !== tag));
                  setError("");
                }}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
