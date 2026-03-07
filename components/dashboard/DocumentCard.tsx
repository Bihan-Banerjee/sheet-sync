"use client";

import { useState } from "react";
import type { SpreadsheetDocument } from "@/types";

interface DocumentCardProps {
  document: SpreadsheetDocument;
  isDeleting: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export default function DocumentCard({
  document,
  isDeleting,
  onOpen,
  onDelete,
}: DocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const lastModified = document.updatedAt
    ? formatRelativeTime(document.updatedAt.toDate())
    : "Just now";

  return (
    <div
      className={`group relative rounded-xl border border-border bg-surface hover:border-border-bright hover:bg-surface-2 transition-all duration-200 hover:shadow-card-hover cursor-pointer overflow-hidden ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
      onClick={onOpen}
    >
      {/* Top accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Preview area */}
      <div className="h-20 bg-surface-2 border-b border-border flex items-center justify-center overflow-hidden">
        <MiniGridPreview />
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-text-primary truncate leading-tight">
              {document.title}
            </h3>
            <p className="text-xs text-text-dim mt-1 font-mono">
              {lastModified}
            </p>
          </div>

          {/* Menu button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-text-dim hover:text-text-secondary hover:bg-surface-3 transition-all opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-7 z-20 w-36 rounded-xl border border-border bg-surface shadow-glass overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); onOpen(); }}
                    className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
                  >
                    Open
                  </button>
                  <div className="h-px bg-border mx-2" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full px-3 py-2 text-left text-xs text-error hover:bg-error/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Owner badge */}
        <div className="mt-3 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-accent/30 flex items-center justify-center">
            <span className="text-[9px] text-accent font-semibold">
              {document.ownerName?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <span className="text-xs text-text-dim truncate">
            {document.ownerName ?? "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Mini grid preview ────────────────────────────────────────────────────────

function MiniGridPreview() {
  const cols = 5;
  const rows = 3;
  return (
    <div className="opacity-30 group-hover:opacity-50 transition-opacity duration-300">
      <div
        className="grid gap-px bg-border-bright"
        style={{
          gridTemplateColumns: `20px repeat(${cols}, 28px)`,
          border: "1px solid",
          borderColor: "inherit",
        }}
      >
        {/* Header row */}
        <div className="h-4 bg-surface-3" />
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            className="h-4 bg-surface-3 flex items-center justify-center"
          >
            <span className="text-[8px] font-mono text-text-dim">
              {String.fromCharCode(65 + c)}
            </span>
          </div>
        ))}
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols + 1 }).map((_, c) => (
            <div
              key={`${r}-${c}`}
              className="h-4 bg-surface"
              style={{
                backgroundColor:
                  c === 0
                    ? "#1A1A24"
                    : Math.random() > 0.6
                    ? "#6366F108"
                    : undefined,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}