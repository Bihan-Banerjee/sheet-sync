"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppUser } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import AuthModal from "@/components/auth/AuthModal";
import DocumentCard from "@/components/dashboard/DocumentCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SpreadsheetDocument } from "@/types";
import Loader from "@/components/ui/Loader";
import { TEMPLATE_REGISTRY } from "@/lib/templates";

// Professional SVG Icons instead of Emojis
import { FileSpreadsheet, PieChart, KanbanSquare, CalendarDays, Plus, Search, FileText } from "lucide-react";

const TEMPLATES = [
  { label: "Blank Spreadsheet", icon: FileSpreadsheet, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  { label: "Monthly Budget", icon: PieChart, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  { label: "Project Tracker", icon: KanbanSquare, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  { label: "Habit Planner", icon: CalendarDays, color: "text-error", bg: "bg-error/10", border: "border-error/20" },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { appUser, loading, signOut } = useAppUser();
  const { addToast } = useToast();

  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    if (!appUser) return;
    const q = query(
      collection(db, "documents"), 
      where("accessedBy", "array-contains", appUser.uid), 
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SpreadsheetDocument[]);
      setDocsLoading(false);
    });
    return () => unsub();
  }, [appUser]);

  const handleRename = useCallback(async (docId: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, "documents", docId), {
        title: newTitle,
        updatedAt: serverTimestamp(),
      });
      addToast("Document renamed", "success");
    } catch {
      addToast("Failed to rename document", "error");
    }
  }, [addToast]);

  const handleCreate = useCallback(async (title: string) => {
    if (!appUser) return;
    setCreating(true);
    
    try {
      // 1. Initialize a Batch
      const batch = writeBatch(db);
      
      // 2. Generate a new document reference explicitly
      const docRef = doc(collection(db, "documents"));
      
      // 3. Check if the user selected a known template
      const templateData = TEMPLATE_REGISTRY[title];

      // 4. Create the main document
      batch.set(docRef, {
        title, 
        ownerId: appUser.uid, 
        ownerName: appUser.displayName || "Unknown User", 
        accessedBy: [appUser.uid], 
        columnWidths: templateData?.columnWidths || {}, 
        rowHeights: {}, 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp(),
      });

      // 5. If it's a template, populate the cells subcollection
      if (templateData) {
        Object.entries(templateData.cells).forEach(([cellId, cellData]) => {
          const cellRef = doc(db, "documents", docRef.id, "cells", cellId);
          batch.set(cellRef, {
            raw: cellData.raw,
            computed: "", // The spreadsheet's formula parser will handle this on load
            format: cellData.format || {},
            lastEditedBy: appUser.uid,
            updatedAt: serverTimestamp(),
          });
        });
      }

      // 6. Commit the entire batch to Firebase simultaneously
      await batch.commit();

      addToast(`Created "${title}"`, "success");
      router.push(`/doc/${docRef.id}`);
    } catch (err) {
      console.error("Template creation failed:", err);
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

  if (loading) return <Loader fullScreen text="Loading workspace..." />;
  if (!appUser) return <AuthModal />;

  return (
    <div className="min-h-screen relative font-sans text-text-primary overflow-x-hidden selection:bg-accent/30 bg-background flex flex-col">
      
      {/* Advanced Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay" />
      </div>

      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-2xl transition-all supports-[backdrop-filter]:bg-background/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg shadow-accent/20 border border-white/10">
              <FileSpreadsheet className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary">
              SheetSync
            </span>
          </div>

          <div className="flex items-center gap-5">
            <ThemeToggle />
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-text-primary leading-none">
                  {appUser.displayName?.split(" ")[0] || "User"}
                </span>
                <span className="text-[10px] text-text-dim mt-0.5">Free Plan</span>
              </div>
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-background cursor-pointer hover:scale-105 transition-transform" 
                style={{ backgroundColor: appUser.presenceColor }}
                onClick={() => { signOut(); addToast("Signed out", "info"); }}
                title="Click to sign out"
              >
                {appUser.displayName?.charAt(0).toUpperCase() || "?"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 sm:py-16 space-y-16 z-10 relative">
        
        {/* Dynamic Hero Section */}
        <section className="space-y-10 animate-fadeUp">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary">
              {greeting},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover">
                {appUser.displayName?.split(" ")[0] || "Creator"}
              </span>
            </h1>
            <p className="text-text-secondary text-lg font-medium tracking-wide">
              Create a new sophisticated workspace or jump back into recent edits.
            </p>
          </div>

          {/* SaaS-Grade Templates Bento Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((t, i) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.label}
                  onClick={() => handleCreate(t.label === "Blank Spreadsheet" ? "Untitled Spreadsheet" : t.label)}
                  disabled={creating}
                  className="group relative isolate flex flex-col justify-between p-6 h-[160px] w-full rounded-2xl bg-surface/40 backdrop-blur-md border border-border/60 hover:border-border transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-1 overflow-hidden disabled:opacity-50 disabled:hover:translate-y-0"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Subtle Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent z-0" />
                  
                  {/* Top row: Icon and CTA Arrow */}
                  <div className="flex justify-between items-start w-full z-10">
                    <div className={`w-12 h-12 rounded-xl ${t.bg} ${t.color} border ${t.border} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out`}>
                      <Icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <Plus className="w-4 h-4 text-text-primary" />
                    </div>
                  </div>

                  {/* Bottom row: Text */}
                  <div className="text-left w-full z-10">
                    <h3 className="font-semibold text-text-primary text-[15px] tracking-tight">{t.label}</h3>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Documents Grid Section */}
        <section className="space-y-6 animate-fadeUp" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-text-primary">
              <FileText className="w-5 h-5 text-accent" />
              Recent Files
            </h2>
            {documents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wider bg-surface-2 px-2.5 py-1 rounded-md border border-border">
                  {documents.length} Item{documents.length !== 1 && 's'}
                </span>
              </div>
            )}
          </div>

          {docsLoading ? (
            // Premium Skeleton Loader
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[240px] rounded-2xl bg-surface/40 animate-pulse border border-border shadow-sm" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            // Pro Empty State (Dropzone style)
            <div className="relative group overflow-hidden w-full rounded-3xl border border-dashed border-border hover:border-accent/40 bg-surface-2/30 hover:bg-surface-2/60 transition-colors duration-500">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTI4LCAxMjgsIDEyOCwgMC4xKSIvPjwvc3ZnPg==')] opacity-50" />
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center relative z-10">
                <div className="w-20 h-20 mb-6 rounded-2xl bg-surface border border-border flex items-center justify-center shadow-xl shadow-black/5 group-hover:scale-105 transition-transform duration-500 ease-out">
                  <Search className="w-8 h-8 text-text-dim group-hover:text-accent transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No spreadsheets yet</h3>
                <p className="text-text-secondary text-sm max-w-[280px]">
                  Your digital workspace is waiting. Create a blank sheet or pick a template to get started.
                </p>
                <button 
                  onClick={() => handleCreate("Untitled Spreadsheet")}
                  className="mt-6 px-6 py-2.5 bg-text-primary text-background rounded-lg text-sm font-semibold hover:bg-text-secondary transition-colors"
                >
                  Create Blank Sheet
                </button>
              </div>
            </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((doc, i) => (
                <div key={doc.id} className="animate-fadeUp" style={{ animationDelay: `${(i % 4) * 50 + 100}ms` }}>
                  <DocumentCard
                    document={doc}
                    isDeleting={deletingId === doc.id}
                    onOpen={() => router.push(`/doc/${doc.id}`)}
                    onDelete={() => handleDelete(doc.id)}
                    onRename={(newTitle) => handleRename(doc.id, newTitle)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {creating && <Loader fullScreen text="Provisioning workspace..." />}
    </div>
  );
}