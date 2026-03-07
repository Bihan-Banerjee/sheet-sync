"use client";

import { useState, useCallback, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Loader from "@/components/ui/Loader";
import Grid from "@/components/grid/Grid";
import FormattingToolbar from "@/components/editor/FormattingToolbar";
import ExportMenu from "@/components/editor/ExportMenu";
import SyncIndicator from "@/components/editor/SyncIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import ShareButton from "@/components/editor/ShareButton";
import AuthModal from "@/components/auth/AuthModal";

import { useSpreadsheet } from "@/hooks/useSpreadsheet";
import { usePresence } from "@/hooks/usePresence";
import { useAppUser } from "@/hooks/useAuth";
import type { CellId, CellFormat } from "@/types";

export default function DocumentPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { appUser, loading } = useAppUser();
  
  // 1. Unwrap params FIRST
  const params = use(props.params);
  const docId = params.id;

  // 2. Call ALL Hooks unconditionally before any early returns
  const {
    cells,
    docMeta,
    writeState,
    columnWidths,
    rowHeights,
    setCellRaw,
    setCellFormat,
    setColumnWidth,
    setRowHeight,
    getCellFormat,
    updateTitle,
  } = useSpreadsheet(docId);

  const { presenceMap, otherUsers, updateActiveCell } = usePresence(docId, appUser);

  const [activeCellId, setActiveCellId] = useState<CellId | null>("A1");
  
  // State for inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const activeFormat = activeCellId ? getCellFormat(activeCellId) : {};

  const handleActiveCellChange = useCallback((cellId: CellId | null) => {
    setActiveCellId(cellId);
    updateActiveCell(cellId);
  }, [updateActiveCell]);

  const handleFormatChange = useCallback((cellId: CellId, formatPatch: Partial<CellFormat>) => {
    if (appUser) setCellFormat(cellId, formatPatch, appUser.uid);
  }, [appUser, setCellFormat]);

  const handleCellChange = useCallback((cellId: CellId, raw: string) => {
    if (appUser) setCellRaw(cellId, raw, appUser.uid);
  }, [appUser, setCellRaw]);

  // Track access for shared users
  useEffect(() => {
    if (appUser && docMeta && (!docMeta.accessedBy || !docMeta.accessedBy.includes(appUser.uid))) {
      updateDoc(doc(db, "documents", docId), {
        accessedBy: arrayUnion(appUser.uid)
      }).catch(console.error);
    }
  }, [appUser, docMeta, docId]);

  // 3. EARLY RETURNS GO HERE (After all hooks have safely executed)
  
  // Wait for Firebase Auth to initialize
  if (loading) return <Loader fullScreen text="Authenticating..." />;
  
  // Block unauthenticated users
  if (!appUser) return <AuthModal />;
  
  // Wait for the document data to be pulled from Firestore
  if (!docMeta) return <Loader fullScreen text="Opening Spreadsheet..." />;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* Header */}
      <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            &larr; Dashboard
          </button>
          <div className="w-px h-4 bg-border" />
          
          {/* Inline Title Editor */}
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                const trimmed = titleInput.trim();
                if (trimmed && trimmed !== docMeta?.title) {
                  updateTitle(trimmed);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingTitle(false);
                  const trimmed = titleInput.trim();
                  if (trimmed && trimmed !== docMeta?.title) updateTitle(trimmed);
                }
                if (e.key === "Escape") {
                  setIsEditingTitle(false);
                }
              }}
              className="font-medium text-text-primary bg-surface-2 border border-accent rounded px-2 outline-none w-[200px] sm:w-[300px] h-7 shadow-inner"
            />
          ) : (
            <h1
              onClick={() => {
                setTitleInput(docMeta?.title || "");
                setIsEditingTitle(true);
              }}
              className="font-medium text-text-primary truncate max-w-[200px] sm:max-w-xs cursor-text hover:bg-surface-2 px-2 py-0.5 -ml-2 rounded transition-colors border border-transparent hover:border-border"
              title="Click to rename"
            >
              {docMeta?.title || "Loading..."}
            </h1>
          )}

          <SyncIndicator state={writeState} />
        </div>

        <div className="flex items-center gap-3">
          {/* Active Collaborators */}
          <div className="flex items-center -space-x-2 mr-2">
            {otherUsers.map((u) => (
              <div
                key={u.uid}
                className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white relative group cursor-pointer"
                style={{ backgroundColor: u.color }}
              >
                {u.displayName.charAt(0).toUpperCase()}
                <div className="absolute top-full mt-1 px-2 py-1 bg-surface-3 text-text-primary text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {u.displayName}
                </div>
              </div>
            ))}
          </div>
          
          {/* Action Buttons */}
          <ThemeToggle />
          <ExportMenu cells={cells} docMeta={docMeta} />
          <div className="w-px h-5 bg-border mx-1" />
          <ShareButton />
        </div>
      </header>

      {/* Formatting Toolbar */}
      <FormattingToolbar
        activeCellId={activeCellId}
        format={activeFormat}
        onFormat={handleFormatChange}
      />

      {/* Grid */}
      <Grid
        cells={cells}
        presenceMap={presenceMap}
        ownUid={appUser.uid}
        columnWidths={columnWidths}
        rowHeights={rowHeights}
        onCellChange={handleCellChange}
        onCellFormat={handleFormatChange}
        onColumnResize={setColumnWidth}
        onRowResize={setRowHeight}
        onActiveCellChange={handleActiveCellChange}
      />

      {/* ── Floating Active Cell Indicator ── */}
      <div className="fixed bottom-6 right-8 z-50 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-2xl transition-all duration-200 hover:scale-105 select-none">
        <div className="relative flex items-center justify-center w-2 h-2">
          <div className="absolute w-full h-full rounded-full bg-accent opacity-40 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-accent" />
        </div>
        <span className="text-[11px] font-semibold text-text-dim uppercase tracking-wider">
          Current Cell
        </span>
        <div className="h-4 w-px bg-border mx-1" />
        <span className="text-sm font-mono font-bold text-accent min-w-[28px] text-center">
          {activeCellId || "—"}
        </span>
      </div>
    </div>
  );
}