"use client";

import { useState, useCallback, use } from "react"; // <-- Added `use` here
import { useRouter } from "next/navigation";
import Grid from "@/components/grid/Grid";
import FormattingToolbar from "@/components/editor/FormattingToolbar";
import ExportMenu from "@/components/editor/ExportMenu";
import SyncIndicator from "@/components/editor/SyncIndicator";
import { ThemeToggle } from "@/components/ThemeToggle"; // <-- Added ThemeToggle here
import { useSpreadsheet } from "@/hooks/useSpreadsheet";
import { usePresence } from "@/hooks/usePresence";
import { useAppUser } from "@/hooks/useAuth";
import type { CellId, CellFormat } from "@/types";

// Update the props type to expect a Promise for Next.js 15
export default function DocumentPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { appUser, loading } = useAppUser();
  
  // Unwrap the params Promise safely
  const params = use(props.params);
  const docId = params.id;

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
  } = useSpreadsheet(docId);

  const { presenceMap, otherUsers, updateActiveCell } = usePresence(docId, appUser);

  const [activeCellId, setActiveCellId] = useState<CellId | null>("A1");

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

  if (loading) return null;
  if (!appUser) {
    router.push("/");
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
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
          <h1 className="font-medium text-text-primary truncate max-w-[200px] sm:max-w-xs">
            {docMeta?.title || "Loading..."}
          </h1>
          <SyncIndicator state={writeState} />
        </div>

        {/* Active cell address pill */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-2 border border-border flex-shrink-0">
          <span className="text-[10px] font-mono text-text-dim">cell</span>
          <span className="text-xs font-mono font-medium text-accent">
            {activeCellId}
          </span>
        </div>
        <div className="w-px h-4 bg-border flex-shrink-0" />

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
    </div>
  );
}