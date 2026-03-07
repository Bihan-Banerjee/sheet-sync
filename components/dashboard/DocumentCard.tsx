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
      className={`group relative rounded-2xl bg-surface border border-border shadow-sm hover:shadow-xl hover:border-border-bright hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
      onClick={onOpen}
    >
      {/* ── Preview Area (Realistic Mini Grid) ── */}
      <div className="h-32 bg-surface-2 p-3 flex items-start justify-center border-b border-border relative overflow-hidden">
        {/* Accent glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* The Mini Spreadsheet */}
        <div className="w-full h-full bg-surface rounded-md border border-border shadow-sm flex flex-col overflow-hidden relative z-10">
          {/* Header Row */}
          <div className="h-4 bg-surface-3 flex border-b border-border">
            <div className="w-6 border-r border-border bg-surface-2" />
            <div className="flex-1 border-r border-border" />
            <div className="flex-1 border-r border-border" />
            <div className="flex-1" />
          </div>
          {/* Grid Body */}
          <div className="flex-1 flex flex-col">
            {/* Row 1 with an "active" cell */}
            <div className="h-5 flex border-b border-border">
              <div className="w-6 border-r border-border bg-surface-3" />
              <div className="flex-1 border-r border-border bg-surface" />
              <div className="flex-1 border-r border-accent bg-accent/10 relative">
                <div className="absolute inset-0 border-2 border-accent" />
              </div>
              <div className="flex-1 bg-surface" />
            </div>
            {/* Row 2 */}
            <div className="h-5 flex border-b border-border">
              <div className="w-6 border-r border-border bg-surface-3" />
              <div className="flex-1 border-r border-border bg-surface" />
              <div className="flex-1 border-r border-border bg-surface" />
              <div className="flex-1 bg-surface" />
            </div>
             {/* Row 3 */}
             <div className="h-5 flex">
              <div className="w-6 border-r border-border bg-surface-3" />
              <div className="flex-1 border-r border-border bg-surface" />
              <div className="flex-1 border-r border-border bg-surface" />
              <div className="flex-1 bg-surface" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card Info Body ── */}
      <div className="p-4 bg-surface flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-text-primary truncate">
              {document.title}
            </h3>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lastModified}
            </p>
          </div>

          {/* Context Menu Button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="12" cy="19" r="1.75" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-36 rounded-xl border border-border bg-surface shadow-xl overflow-hidden py-1 transform origin-top-right transition-all">
                  <button
                    onClick={() => { setMenuOpen(false); onOpen(); }}
                    className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-2 transition-colors flex items-center gap-2"
                  >
                    Open
                  </button>
                  <div className="h-px bg-border my-1 mx-2" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Owner Tag */}
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
            <span className="text-[10px] text-accent font-bold">
              {document.ownerName?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <span className="text-xs font-medium text-text-dim truncate">
            {document.ownerName ?? "Unknown User"}
          </span>
        </div>
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}