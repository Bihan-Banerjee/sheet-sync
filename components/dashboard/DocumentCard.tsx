"use client";

import { useState, useRef, useEffect } from "react";
import type { SpreadsheetDocument } from "@/types";

interface DocumentCardProps {
  document: SpreadsheetDocument;
  isDeleting: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void; // <-- New prop added
}

export default function DocumentCard({
  document,
  isDeleting,
  onOpen,
  onDelete,
  onRename,
}: DocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editTitle, setEditTitle] = useState(document.title);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const lastModified = document.updatedAt
    ? formatRelativeTime(document.updatedAt.toDate())
    : "Just now";

  // Focus the input automatically when rename is clicked
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    setIsRenaming(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== document.title) {
      onRename(trimmed);
    } else {
      setEditTitle(document.title); // reset if empty or unchanged
    }
  };

  return (
    <div
      className={`group relative rounded-2xl bg-surface border border-border shadow-sm hover:shadow-2xl hover:shadow-accent/5 hover:border-border-bright hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-visible ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* ── Preview Area ── */}
      <div 
        onClick={onOpen}
        className="h-36 bg-surface-2 p-4 flex items-start justify-center border-b border-border relative overflow-hidden rounded-t-2xl cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="w-full h-full bg-surface rounded-md border border-border shadow-sm flex flex-col overflow-hidden relative z-10 group-hover:scale-[1.03] group-hover:-translate-y-1 transition-all duration-500 ease-out">
          <div className="h-4 bg-surface-3 flex border-b border-border">
            <div className="w-6 border-r border-border bg-surface-2" />
            <div className="flex-1 border-r border-border" />
            <div className="flex-1 border-r border-border" />
            <div className="flex-1" />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="h-5 flex border-b border-border">
              <div className="w-6 border-r border-border bg-surface-3" />
              <div className="flex-1 border-r border-border bg-surface" />
              <div className="flex-1 border-r border-accent bg-accent/10 relative">
                <div className="absolute inset-0 border-2 border-accent/80" />
              </div>
              <div className="flex-1 bg-surface" />
            </div>
            <div className="h-5 flex border-b border-border">
              <div className="w-6 border-r border-border bg-surface-3" />
              <div className="flex-1 border-r border-border bg-surface" />
              <div className="flex-1 border-r border-border bg-surface" />
              <div className="flex-1 bg-surface" />
            </div>
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
      <div className="p-5 bg-surface rounded-b-2xl flex-1 flex flex-col justify-between z-20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            
            {/* INLINE RENAME INPUT OR TITLE */}
            {isRenaming ? (
              <input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") {
                    setIsRenaming(false);
                    setEditTitle(document.title);
                  }
                }}
                className="text-base font-semibold text-text-primary bg-surface-2 border border-accent rounded px-1 -ml-1 outline-none w-full shadow-inner"
              />
            ) : (
              <h3 
                onClick={onOpen}
                className="text-base font-semibold text-text-primary truncate group-hover:text-accent transition-colors cursor-pointer"
              >
                {document.title}
              </h3>
            )}

            <p className="text-xs text-text-secondary mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lastModified}
            </p>
          </div>

          <div className="relative">
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
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-40 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => { setMenuOpen(false); onOpen(); }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors"
                  >
                    Open Sheet
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setIsRenaming(true);
                      setEditTitle(document.title);
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors"
                  >
                    Rename
                  </button>
                  <div className="h-px bg-border my-1 mx-2" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-error hover:bg-error/10 transition-colors"
                  >
                    Delete File
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Owner Tag */}
        <div className="mt-5 flex items-center gap-2 pt-4 border-t border-border/60">
          <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
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