"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recomputeAllCells, computeCellValue } from "@/lib/formulaParser";
import { GRID_CONSTANTS, toCellId } from "@/types";
import type {
  CellMap,
  CellData,
  CellId,
  CellFormat,
  WriteState,
  SpreadsheetDocument,
} from "@/types";

interface UseSpreadsheetReturn {
  cells: CellMap;
  docMeta: SpreadsheetDocument | null;
  writeState: WriteState;
  columnWidths: Record<string, number>;
  rowHeights: Record<string, number>;
  getCellDisplay: (cellId: CellId) => string;
  getCellRaw: (cellId: CellId) => string;
  getCellFormat: (cellId: CellId) => CellFormat;
  setCellRaw: (cellId: CellId, raw: string, uid: string) => void;
  setCellFormat: (cellId: CellId, format: Partial<CellFormat>, uid: string) => void;
  setColumnWidth: (letter: string, width: number) => void;
  setRowHeight: (row: number, height: number) => void;
  updateTitle: (title: string) => Promise<void>;
}

export function useSpreadsheet(docId: string): UseSpreadsheetReturn {
  const [cells, setCells] = useState<CellMap>({});
  const [docMeta, setDocMeta] = useState<SpreadsheetDocument | null>(null);
  const [writeState, setWriteState] = useState<WriteState>("idle");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

  // Pending writes queue — batched by cellId
  const pendingWrites = useRef<Map<CellId, CellData>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localCells = useRef<CellMap>({});

  // ── Listen to document metadata ──────────────────────────────────────────
  useEffect(() => {
    if (!docId) return;
    const docRef = doc(db, "documents", docId);

    const unsub = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Omit<SpreadsheetDocument, "id">;
      setDocMeta({ id: snap.id, ...data });
      setColumnWidths(data.columnWidths ?? {});
      setRowHeights(data.rowHeights ?? {});
    });

    return () => unsub();
  }, [docId]);

  // ── Listen to cells subcollection ────────────────────────────────────────
  useEffect(() => {
    if (!docId) return;
    const cellsRef = collection(db, "documents", docId, "cells");

    const unsub = onSnapshot(cellsRef, (snap) => {
      snap.docChanges().forEach((change) => {
        const cellId = change.doc.id as CellId;
        if (change.type === "removed") {
          const updatedCells = { ...localCells.current };
          delete updatedCells[cellId];
          localCells.current = updatedCells;
        } else {
          const data = change.doc.data() as CellData;
          localCells.current = {
            ...localCells.current,
            [cellId]: data,
          };
        }
      });

      // Recompute all formulas after any remote change
      const recomputed = recomputeAllCells(localCells.current);
      localCells.current = recomputed;
      setCells({ ...recomputed });
    });

    return () => unsub();
  }, [docId]);

  // ── Flush pending writes to Firestore ────────────────────────────────────
  const flushWrites = useCallback(async () => {
    if (pendingWrites.current.size === 0) return;

    const toWrite = new Map(pendingWrites.current);
    pendingWrites.current.clear();
    setWriteState("saving");

    try {
      await Promise.all(
        Array.from(toWrite.entries()).map(([cellId, cellData]) => {
          const cellRef = doc(db, "documents", docId, "cells", cellId);
          return setDoc(cellRef, {
            ...cellData,
            updatedAt: serverTimestamp(),
          });
        })
      );

      // Update document's updatedAt
      await updateDoc(doc(db, "documents", docId), {
        updatedAt: serverTimestamp(),
      });

      setWriteState("saved");

      // Reset to idle after 2s
      setTimeout(() => setWriteState("idle"), 2000);
    } catch {
      setWriteState("error");
      // Re-queue failed writes
      toWrite.forEach((v, k) => pendingWrites.current.set(k, v));
    }
  }, [docId]);

  // ── Set cell raw value ───────────────────────────────────────────────────
  const setCellRaw = useCallback(
    (cellId: CellId, raw: string, uid: string) => {
      const existingFormat = localCells.current[cellId]?.format;

      // Compute display value immediately for optimistic UI
      const tempCells: CellMap = {
        ...localCells.current,
        [cellId]: {
          raw,
          computed: "",
          format: existingFormat,
          lastEditedBy: uid,
        },
      };
      const result = computeCellValue(cellId, tempCells);

      const newCell: CellData = {
        raw,
        computed: result.value,
        format: existingFormat,
        lastEditedBy: uid,
      };

      // Optimistic local update
      localCells.current = {
        ...localCells.current,
        [cellId]: newCell,
      };

      // Recompute all cells that depend on this one
      const recomputed = recomputeAllCells(localCells.current);
      localCells.current = recomputed;
      setCells({ ...recomputed });

      // Queue write
      pendingWrites.current.set(cellId, recomputed[cellId] ?? newCell);
      setWriteState("saving");

      // Debounce flush
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void flushWrites();
      }, GRID_CONSTANTS.DEBOUNCE_WRITE_MS);
    },
    [flushWrites]
  );

  // ── Set cell format ──────────────────────────────────────────────────────
  const setCellFormat = useCallback(
    (cellId: CellId, format: Partial<CellFormat>, uid: string) => {
      const existing = localCells.current[cellId];
      const updatedCell: CellData = {
        raw: existing?.raw ?? "",
        computed: existing?.computed ?? "",
        format: { ...(existing?.format ?? {}), ...format },
        lastEditedBy: uid,
      };

      localCells.current = {
        ...localCells.current,
        [cellId]: updatedCell,
      };
      setCells({ ...localCells.current });

      pendingWrites.current.set(cellId, updatedCell);
      setWriteState("saving");

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void flushWrites();
      }, GRID_CONSTANTS.DEBOUNCE_WRITE_MS);
    },
    [flushWrites]
  );

    // ── Column width (DEBOUNCED) ─────────────────────────────────────────────
    const colTimer = useRef<NodeJS.Timeout | null>(null);
    const setColumnWidth = useCallback(
      (letter: string, width: number) => {
        setColumnWidths((prev) => {
          const updated = { ...prev, [letter]: width };
          
          // Clear previous timer
          if (colTimer.current) clearTimeout(colTimer.current);
          
          // Debounce Firestore write
          colTimer.current = setTimeout(() => {
            void updateDoc(doc(db, "documents", docId), {
              columnWidths: updated,
              updatedAt: serverTimestamp(),
            });
          }, 300); // Waits 300ms after you stop dragging
          
          return updated;
        });
      },
      [docId]
    );
  
    // ── Row height (DEBOUNCED) ───────────────────────────────────────────────
    const rowTimer = useRef<NodeJS.Timeout | null>(null);
    const setRowHeight = useCallback(
      (row: number, height: number) => {
        setRowHeights((prev) => {
          const updated = { ...prev, [String(row)]: height };
          
          if (rowTimer.current) clearTimeout(rowTimer.current);
          
          rowTimer.current = setTimeout(() => {
            void updateDoc(doc(db, "documents", docId), {
              rowHeights: updated,
              updatedAt: serverTimestamp(),
            });
          }, 300);
          
          return updated;
        });
      },
      [docId]
    );

  // ── Update title ─────────────────────────────────────────────────────────
  const updateTitle = useCallback(
    async (title: string) => {
      await updateDoc(doc(db, "documents", docId), {
        title,
        updatedAt: serverTimestamp(),
      });
    },
    [docId]
  );

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getCellDisplay = useCallback(
    (cellId: CellId): string => cells[cellId]?.computed ?? "",
    [cells]
  );

  const getCellRaw = useCallback(
    (cellId: CellId): string => cells[cellId]?.raw ?? "",
    [cells]
  );

  const getCellFormat = useCallback(
    (cellId: CellId): CellFormat => cells[cellId]?.format ?? {},
    [cells]
  );

  // ── Cleanup debounce on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      // Flush any remaining writes on unmount
      if (pendingWrites.current.size > 0) void flushWrites();
    };
  }, [flushWrites]);

  return {
    cells,
    docMeta,
    writeState,
    columnWidths,
    rowHeights,
    getCellDisplay,
    getCellRaw,
    getCellFormat,
    setCellRaw,
    setCellFormat,
    setColumnWidth,
    setRowHeight,
    updateTitle,
  };
}