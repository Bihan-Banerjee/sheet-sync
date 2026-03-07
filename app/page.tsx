"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppUser } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import AuthModal from "@/components/auth/AuthModal";
import DocumentCard from "@/components/dashboard/DocumentCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SpreadsheetDocument } from "@/types";

const TEMPLATES = [
  { label: "Blank Spreadsheet", icon: "✨", color: "text-accent", bg: "bg-accent/10" },
  { label: "Monthly Budget", icon: "💰", color: "text-success", bg: "bg-success/10" },
  { label: "Project Tracker", icon: "📊", color: "text-warning", bg: "bg-warning/10" },
  { label: "Habit Planner", icon: "📅", color: "text-error", bg: "bg-error/10" },
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
    const q = query(collection(db, "documents"), where("ownerId", "==", appUser.uid), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SpreadsheetDocument[]);
      setDocsLoading(false);
    });
    return () => unsub();
  }, [appUser]);

  const handleCreate = useCallback(async (title: string) => {
    if (!appUser) return;
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, "documents"), {
        title, ownerId: appUser.uid, ownerName: appUser.displayName, columnWidths: {}, rowHeights: {}, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
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
    <div className="min-h-screen relative font-sans text-text-primary overflow-x-hidden selection:bg-accent/30">
      {/* Premium Ambient Background Glow */}
      <div className="fixed inset-0 z-[-1] bg-background">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[100px] animate-pulseGlow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="9" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="9" width="5" height="5" rx="1" />
              </svg>
            </div>
            <span className="font-mono text-lg font-bold tracking-tight">SheetSync</span>
          </div>

          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <ThemeToggle />
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-background" style={{ backgroundColor: appUser.presenceColor }}>
                {appUser.displayName.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => { signOut(); addToast("Signed out", "info"); }} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 py-12 space-y-16">
        
        {/* Hero Section */}
        <section className="space-y-8 animate-fadeUp">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">{appUser.displayName.split(" ")[0]}</span>
            </h1>
            <p className="text-text-secondary text-lg font-medium">Create a new spreadsheet or continue where you left off.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.label}
                onClick={() => handleCreate(t.label === "Blank Spreadsheet" ? "Untitled Spreadsheet" : t.label)}
                disabled={creating}
                className="group relative p-6 rounded-2xl border border-border bg-surface hover:border-accent/50 shadow-sm hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 disabled:opacity-50 text-left overflow-hidden flex flex-col justify-between min-h-[140px]"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl ${t.bg} ${t.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {t.icon}
                </div>
                <h3 className="font-semibold text-text-primary text-base">{t.label}</h3>
              </button>
            ))}
          </div>
        </section>

        {/* Documents Grid */}
        <section className="space-y-6 animate-fadeUp" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Files</h2>
            <span className="text-sm text-text-dim bg-surface px-3 py-1 rounded-full font-mono border border-border">
              {documents.length} File{documents.length !== 1 && 's'}
            </span>
          </div>

          {docsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[220px] rounded-2xl bg-surface animate-pulse border border-border" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-24 bg-surface/50 border border-border rounded-3xl border-dashed backdrop-blur-sm">
              <div className="text-5xl mb-4 opacity-50">📂</div>
              <h3 className="text-lg font-semibold">No documents yet</h3>
              <p className="text-sm text-text-secondary mt-1">Select a template above to get started.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((doc, i) => (
                <div key={doc.id} className="animate-fadeUp" style={{ animationDelay: `${(i % 4) * 100 + 300}ms` }}>
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
      <div className="w-10 h-10 border-4 border-surface-3 border-t-accent rounded-full animate-spin shadow-lg shadow-accent/20" />
    </div>
  );
}