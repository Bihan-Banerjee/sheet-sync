"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppUser } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import AuthModal from "@/components/auth/AuthModal";
import DocumentCard from "@/components/dashboard/DocumentCard";
import NewDocModal from "@/components/dashboard/NewDocModal";
import type { SpreadsheetDocument } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { appUser, loading, signOut } = useAppUser();
  const { addToast } = useToast();

  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Real-time listener for user's documents
  useEffect(() => {
    if (!appUser) return;

    const q = query(
      collection(db, "documents"),
      where("ownerId", "==", appUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SpreadsheetDocument[];
      setDocuments(docs);
      setDocsLoading(false);
    });

    return () => unsub();
  }, [appUser]);

  const handleCreate = useCallback(
    async (title: string) => {
      if (!appUser) return;
      setCreating(true);
      try {
        const docRef = await addDoc(collection(db, "documents"), {
          title: title.trim() || "Untitled Spreadsheet",
          ownerId: appUser.uid,
          ownerName: appUser.displayName,
          columnWidths: {},
          rowHeights: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addToast("Document created", "success");
        setShowNewDoc(false);
        router.push(`/doc/${docRef.id}`);
      } catch {
        addToast("Failed to create document", "error");
      } finally {
        setCreating(false);
      }
    },
    [appUser, addToast, router]
  );

  const handleDelete = useCallback(
    async (docId: string) => {
      setDeletingId(docId);
      try {
        await deleteDoc(doc(db, "documents", docId));
        addToast("Document deleted", "info");
      } catch {
        addToast("Failed to delete document", "error");
      } finally {
        setDeletingId(null);
      }
    },
    [addToast]
  );

  const handleSignOut = async () => {
    await signOut();
    addToast("Signed out", "info");
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (loading) return <FullScreenLoader />;
  if (!appUser) return <AuthModal />;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </div>
            <span className="font-mono font-medium text-text-primary tracking-tight">
              SheetSync
            </span>
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{ backgroundColor: appUser.presenceColor }}
              >
                {appUser.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-text-secondary hidden sm:block">
                {appUser.displayName}
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={handleSignOut}
              className="text-xs text-text-dim hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-surface-3"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page heading */}
        <div
          className="flex items-center justify-between mb-8"
          style={{ animation: "fadeUp 0.4s ease forwards" }}
        >
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Your Documents
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {documents.length === 0
                ? "No documents yet — create your first one"
                : `${documents.length} document${documents.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            onClick={() => setShowNewDoc(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Spreadsheet
          </button>
        </div>

        {/* Documents grid */}
        {docsLoading ? (
          <DocumentsSkeleton />
        ) : documents.length === 0 ? (
          <EmptyState onCreate={() => setShowNewDoc(true)} />
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children"
          >
            {documents.map((spreadsheetDoc, i) => (
              <div
                key={spreadsheetDoc.id}
                style={{
                  animation: "fadeUp 0.4s ease forwards",
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                }}
              >
                <DocumentCard
                  document={spreadsheetDoc}
                  isDeleting={deletingId === spreadsheetDoc.id}
                  onOpen={() => router.push(`/doc/${spreadsheetDoc.id}`)}
                  onDelete={() => handleDelete(spreadsheetDoc.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New doc modal */}
      {showNewDoc && (
        <NewDocModal
          onClose={() => setShowNewDoc(false)}
          onCreate={handleCreate}
          creating={creating}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center animate-pulse-slow">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
        </div>
        <span className="text-sm text-text-dim font-mono">Loading…</span>
      </div>
    </div>
  );
}

function DocumentsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-36 rounded-xl border border-border bg-surface animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-6"
      style={{ animation: "fadeUp 0.5s ease forwards" }}
    >
      {/* Illustrated grid */}
      <div className="relative">
        <div className="w-24 h-24 rounded-2xl border-2 border-border bg-surface-2 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-1 p-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm bg-surface-3 border border-border"
                style={{
                  opacity: i === 4 ? 1 : 0.4,
                  backgroundColor: i === 4 ? "#6366F1" : undefined,
                }}
              />
            ))}
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-lg font-medium text-text-primary">
          No spreadsheets yet
        </h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Create your first document and start collaborating in real time.
        </p>
      </div>

      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all duration-200 hover:-translate-y-px"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create Spreadsheet
      </button>
    </div>
  );
}