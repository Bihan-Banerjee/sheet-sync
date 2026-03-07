"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { CellMap, SpreadsheetDocument } from "@/types";
import { GRID_CONSTANTS, toCellId, colNumberToLetter } from "@/types";

interface ExportMenuProps {
  cells: CellMap;
  docMeta: SpreadsheetDocument | null;
}

export default function ExportMenu({ cells, docMeta }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Build 2D grid array from CellMap ─────────────────────────────────────
  const buildGrid = useCallback((): string[][] => {
    const { TOTAL_ROWS, TOTAL_COLS } = GRID_CONSTANTS;
    const grid: string[][] = [];

    // Header row
    const header = ["", ...Array.from({ length: TOTAL_COLS }, (_, i) =>
      colNumberToLetter(i + 1)
    )];
    grid.push(header);

    for (let row = 1; row <= TOTAL_ROWS; row++) {
      const rowData: string[] = [String(row)];
      let hasData = false;

      for (let col = 1; col <= TOTAL_COLS; col++) {
        const cellId = toCellId(row, col);
        const value = cells[cellId]?.computed ?? "";
        rowData.push(value);
        if (value) hasData = true;
      }

      // Only include rows that have at least one non-empty cell
      if (hasData) grid.push(rowData);
    }

    return grid;
  }, [cells]);

  // ── Find last used row/col for trimmed export ────────────────────────────
  const getUsedRange = useCallback((): { maxRow: number; maxCol: number } => {
    const { TOTAL_ROWS, TOTAL_COLS } = GRID_CONSTANTS;
    let maxRow = 1;
    let maxCol = 1;

    for (let row = 1; row <= TOTAL_ROWS; row++) {
      for (let col = 1; col <= TOTAL_COLS; col++) {
        const cellId = toCellId(row, col);
        if (cells[cellId]?.raw) {
          if (row > maxRow) maxRow = row;
          if (col > maxCol) maxCol = col;
        }
      }
    }

    return { maxRow, maxCol };
  }, [cells]);

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCSV = useCallback(async () => {
    setExporting("csv");
    try {
      const { maxRow, maxCol } = getUsedRange();
      const rows: string[] = [];

      // Column header row
      const headers = Array.from({ length: maxCol }, (_, i) =>
        colNumberToLetter(i + 1)
      );
      rows.push(["", ...headers].map(csvEscape).join(","));

      for (let row = 1; row <= maxRow; row++) {
        const rowData = [String(row)];
        for (let col = 1; col <= maxCol; col++) {
          const cellId = toCellId(row, col);
          rowData.push(cells[cellId]?.computed ?? "");
        }
        rows.push(rowData.map(csvEscape).join(","));
      }

      const csvContent = rows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      triggerDownload(blob, `${docMeta?.title ?? "spreadsheet"}.csv`);
    } finally {
      setExporting(null);
      setOpen(false);
    }
  }, [cells, docMeta, getUsedRange]);

  // ── XLSX export ───────────────────────────────────────────────────────────
  const exportXLSX = useCallback(async () => {
    setExporting("xlsx");
    try {
      const XLSX = await import("xlsx");
      const { maxRow, maxCol } = getUsedRange();

      // Build array-of-arrays (no row/col headers for XLSX — cleaner)
      const data: string[][] = [];

      // Column letters as header
      const header = Array.from({ length: maxCol }, (_, i) =>
        colNumberToLetter(i + 1)
      );
      data.push(header);

      for (let row = 1; row <= maxRow; row++) {
        const rowData: string[] = [];
        for (let col = 1; col <= maxCol; col++) {
          const cellId = toCellId(row, col);
          const val = cells[cellId]?.computed ?? "";
          // Preserve numbers as numbers in XLSX
          rowData.push(val);
        }
        data.push(rowData);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(data);

      // Auto column widths
      const colWidths = Array.from({ length: maxCol }, (_, colIdx) => {
        let maxLen = 4;
        for (let row = 0; row < data.length; row++) {
          const val = data[row]?.[colIdx] ?? "";
          if (val.length > maxLen) maxLen = val.length;
        }
        return { wch: Math.min(maxLen + 2, 40) };
      });
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        docMeta?.title?.slice(0, 31) ?? "Sheet1"
      );

      XLSX.writeFile(workbook, `${docMeta?.title ?? "spreadsheet"}.xlsx`);
    } catch {
      console.error("XLSX export failed");
    } finally {
      setExporting(null);
      setOpen(false);
    }
  }, [cells, docMeta, getUsedRange]);

  return (
    <div ref={menuRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all duration-150 ${
          open
            ? "border-accent bg-accent-dim text-accent"
            : "border-border bg-surface-2 text-text-secondary hover:border-border-bright hover:text-text-primary"
        }`}
      >
        <ExportIcon />
        <span className="hidden sm:block">Export</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-border bg-surface shadow-glass overflow-hidden"
          style={{ animation: "fadeUp 0.15s ease forwards" }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
              Export as
            </span>
          </div>

          {/* CSV */}
          <button
            onClick={exportCSV}
            disabled={exporting !== null}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors disabled:opacity-50 group"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-3 border border-border flex items-center justify-center flex-shrink-0 group-hover:border-border-bright transition-colors">
              <span className="text-[9px] font-mono font-bold text-success">CSV</span>
            </div>
            <div>
              <div className="text-xs font-medium text-text-primary">
                CSV
              </div>
              <div className="text-[10px] text-text-dim">
                Comma separated
              </div>
            </div>
            {exporting === "csv" && <Spinner />}
          </button>

          {/* XLSX */}
          <button
            onClick={exportXLSX}
            disabled={exporting !== null}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors disabled:opacity-50 group"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-3 border border-border flex items-center justify-center flex-shrink-0 group-hover:border-border-bright transition-colors">
              <span className="text-[9px] font-mono font-bold text-success">XLS</span>
            </div>
            <div>
              <div className="text-xs font-medium text-text-primary">
                Excel
              </div>
              <div className="text-[10px] text-text-dim">
                .xlsx workbook
              </div>
            </div>
            {exporting === "xlsx" && <Spinner />}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ExportIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin text-accent ml-auto" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}