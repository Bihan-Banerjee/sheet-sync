"use client";

import { useState, useEffect, useRef } from "react";
import { useAppUser } from "@/hooks/useAuth";

interface AuthModalProps {
  onSuccess?: () => void;
}

type Tab = "google" | "guest";

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const { signInWithGoogle, signInAsGuest, loading } = useAppUser();
  const [tab, setTab] = useState<Tab>("google");
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (tab === "guest") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [tab]);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    const name = guestName.trim();
    if (!name) {
      setError("Please enter a display name.");
      inputRef.current?.focus();
      return;
    }
    if (name.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signInAsGuest(name);
      onSuccess?.();
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-border-bright bg-surface shadow-glass overflow-hidden"
        style={{ animation: "fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
      >
        {/* Top accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          {/* Logo mark */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <GridIcon />
            </div>
            <span className="font-mono text-lg font-medium text-text-primary tracking-tight">
              SheetSync
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-text-primary leading-tight">
            Welcome
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in to create and collaborate on spreadsheets in real time.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="px-8">
          <div className="flex gap-1 p-1 rounded-lg bg-surface-3 border border-border">
            <TabButton
              active={tab === "google"}
              onClick={() => { setTab("google"); setError(null); }}
              label="Google"
            />
            <TabButton
              active={tab === "guest"}
              onClick={() => { setTab("guest"); setError(null); }}
              label="Continue as Guest"
            />
          </div>
        </div>

        {/* Tab content */}
        <div className="px-8 pt-5 pb-8">
          {tab === "google" ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                Sign in with your Google account. Your name and profile picture
                will be visible to collaborators.
              </p>
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border-bright bg-surface-2 hover:bg-surface-3 hover:border-accent text-text-primary font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {busy ? (
                  <Spinner />
                ) : (
                  <GoogleIcon />
                )}
                <span>
                  {busy ? "Signing in…" : "Continue with Google"}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                Choose a display name. It will be shown to other collaborators
                while you&apos;re editing.
              </p>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-widest">
                  Display Name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleGuest();
                  }}
                  placeholder="e.g. Priya, Alex…"
                  maxLength={32}
                  className="formula-bar w-full px-4 py-3 rounded-xl text-sm placeholder:text-text-dim"
                />
                <div className="flex justify-between">
                  <span className="text-xs text-text-dim">
                    Press Enter to continue
                  </span>
                  <span className="text-xs text-text-dim">
                    {guestName.length}/32
                  </span>
                </div>
              </div>
              <button
                onClick={handleGuest}
                disabled={busy || guestName.trim().length < 2}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? <Spinner light /> : null}
                {busy ? "Joining…" : "Join as Guest"}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-error/10 border border-error/30 text-error text-xs">
              {error}
            </div>
          )}

          {/* Footer note */}
          <p className="mt-6 text-xs text-text-dim text-center">
            Your identity and colour are visible to collaborators in the same document.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-accent text-white shadow-sm"
          : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg
      className={`w-4 h-4 animate-spin ${light ? "text-white" : "text-accent"}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}