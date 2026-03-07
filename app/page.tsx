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
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SpreadsheetDocument } from "@/types";

const TEMPLATES = [
  { label: "Blank Spreadsheet", icon: "⬜", color: "bg-accent", desc: "Start from scratch" },
  { label: "Monthly Budget", icon: "💰", color: "bg-success", desc: "Track your expenses" },
  { label: "Project Tracker", icon: "📊", color: "bg-warning", desc: "Manage your tasks" },
  { label: "Habit Planner", icon: "📅", color: "bg-error", desc: "Build good routines" },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { appUser, loading, signOut } = useAppUser();
  const { addToast } = useToast();

  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) return;
    const q = query(
      collection(db, "documents"),
      where("ownerId", "==", appUser.uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SpreadsheetDocument[];
      setDocuments(docs);
      setDocsLoading(false);
    });
    return () => unsub();
  }, [appUser]);

  const handleCreate = useCallback(async (title: string) => {
    if (!appUser) return;
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, "documents"), {
        title: title,
        ownerId: appUser.uid,
        ownerName: appUser.displayName,
        columnWidths: {},
        rowHeights: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addToast(`Created "${title}"`, "success");
      router.push(`/doc/${docRef.id}`);
    } catch {
      addToast("Failed to create document", "error");
      setCreating(false);
    }
  }, [appUser, addToast, router]);

  const handleDelete = useCallback(async (docId: string) => {
    setDeletingId(docId);
    try {
      await deleteDoc(doc(db, "documents", docId));
      addToast("Document moved to trash", "info");
    } catch {
      addToast("Failed to delete document", "error");
    } finally {
      setDeletingId(null);
    }
  }, [addToast]);

  if (loading) return <FullScreenLoader />;
  if (!appUser) return <AuthModal />;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-md shadow-accent/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </div>
            <span className="font-mono text-lg font-semibold text-text-primary tracking-tight">
              SheetSync
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-surface"
                style={{ backgroundColor: appUser.presenceColor }}
              >
                {appUser.displayName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => { signOut(); addToast("Signed out", "info"); }}
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-12">
        
        {/* Hero Section */}
        <section className="space-y-6" style={{ animation: "fadeUp 0.4s ease forwards" }}>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              Welcome back, {appUser.displayName.split(" ")[0]}
            </h1>
            <p className="text-text-secondary mt-2 text-lg">
              What are we working on today?
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.label}
                onClick={() => handleCreate(t.label === "Blank Spreadsheet" ? "Untitled Spreadsheet" : t.label)}
                disabled={creating}
                className="group relative flex flex-col items-start p-5 rounded-2xl border border-border bg-surface hover:border-accent hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-left overflow-hidden"
                style={{ animation: `fadeUp 0.4s ease forwards ${i * 0.1}s`, opacity: 0 }}
              >
                <div className={`w-10 h-10 rounded-xl ${t.color} flex items-center justify-center text-lg mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {t.icon}
                </div>
                <h3 className="font-semibold text-text-primary">{t.label}</h3>
                <p className="text-xs text-text-secondary mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Documents Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-xl font-semibold text-text-primary">Recent Documents</h2>
            <span className="text-sm text-text-dim bg-surface-2 px-3 py-1 rounded-full font-mono">
              {documents.length} File{documents.length !== 1 && 's'}
            </span>
          </div>

          {docsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-surface-2 animate-pulse border border-border" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 bg-surface border border-border rounded-3xl border-dashed">
              <div className="text-4xl mb-4">📂</div>
              <h3 className="text-lg font-medium text-text-primary">No documents yet</h3>
              <p className="text-sm text-text-secondary mt-1">Select a template above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((doc, i) => (
                <div key={doc.id} style={{ animation: `fadeUp 0.4s ease forwards ${i * 0.05}s`, opacity: 0 }}>
                  <DocumentCard
                    document={doc}
                    isDeleting={deletingId === doc.id}
                    onOpen={() => router.push(`/doc/${doc.id}`)}
                    onDelete={() => handleDelete(doc.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-surface-3 border-t-accent rounded-full animate-spin" />
    </div>
  );
}