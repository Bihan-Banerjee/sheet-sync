"use client";

import { useState, useEffect, useRef } from "react";

interface NewDocModalProps {
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  creating: boolean;
}

const TEMPLATES = [
  { label: "Blank", icon: "⬜" },
  { label: "Budget", icon: "💰" },
  { label: "Tracker", icon: "📊" },
  { label: "Planner", icon: "📅" },
] as const;

export default function NewDocModal({
  onClose,
  onCreate,
  creating,
}: NewDocModalProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCreate = async () => {
    await onCreate(title || "Untitled Spreadsheet");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-border-bright bg-surface shadow-glass overflow-hidden"
        style={{ animation: "fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}
      >
        {/* Accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent" />

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              New Spreadsheet
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Give it a name to get started
            </p>
          </div>

          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
              Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creating) void handleCreate();
              }}
              placeholder="Untitled Spreadsheet"
              maxLength={80}
              className="formula-bar w-full px-3 py-2.5 rounded-xl text-sm placeholder:text-text-dim"
            />
          </div>

          {/* Template picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
              Start from
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => {
                    if (t.label !== "Blank") setTitle(t.label);
                  }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-all ${
                    (t.label === "Blank" && !title) ||
                    title === t.label
                      ? "border-accent bg-accent-dim text-accent"
                      : "border-border bg-surface-2 text-text-secondary hover:border-border-bright"
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={creating}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}