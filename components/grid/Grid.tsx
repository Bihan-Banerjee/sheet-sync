"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import Cell from "./Cell";
import ColumnHeader from "./ColumnHeader";
import RowHeader from "./RowHeader";
import {
  toCellId,
  colNumberToLetter,
  colLetterToNumber,
  parseCellId,
  GRID_CONSTANTS,
} from "@/types";
import type {
  CellId,
  CellMap,
  CellFormat,
  PresenceMap,
  CellPosition,
  SelectionRange,
} from "@/types";

interface GridProps {
  cells: CellMap;
  presenceMap: PresenceMap;
  ownUid: string;
  columnWidths: Record<string, number>;
  rowHeights: Record<string, number>;
  onCellChange: (cellId: CellId, raw: string) => void;
  onCellFormat: (cellId: CellId, format: Partial<CellFormat>) => void;
  onColumnResize: (letter: string, width: number) => void;
  onRowResize: (row: number, height: number) => void;
  onActiveCellChange: (cellId: CellId | null) => void;
  onSelectionChange?: (cellId: CellId, raw: string) => void;
  // Reorder callbacks — Grid manages visual order, parent persists
  onColumnsReorder?: (from: number, to: number) => void;
  onRowsReorder?: (from: number, to: number) => void;
}

export default function Grid({
  cells,
  presenceMap,
  ownUid,
  columnWidths,
  rowHeights,
  onCellChange,
  onCellFormat,
  onColumnResize,
  onRowResize,
  onActiveCellChange,
  onSelectionChange,
  onColumnsReorder,
  onRowsReorder,
}: GridProps) {
  const { TOTAL_COLS, TOTAL_ROWS, DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } =
    GRID_CONSTANTS;

  const [activeCell, setActiveCell] = useState<CellId>("A1");
  const [editingCell, setEditingCell] = useState<CellId | null>(null);
  const [selection, setSelection] = useState<SelectionRange>({
    start: { row: 1, col: 1 },
    end: { row: 1, col: 1 },
  });
  const [selectedCol, setSelectedCol] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Column/row order — arrays of indices (1-based)
  const [colOrder, setColOrder] = useState<number[]>(() =>
    Array.from({ length: TOTAL_COLS }, (_, i) => i + 1)
  );
  const [rowOrder, setRowOrder] = useState<number[]>(() =>
    Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1)
  );

  // Drag state
  const [draggingCol, setDraggingCol] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [draggingRow, setDraggingRow] = useState<number | null>(null);
  const [dragOverRow, setDragOverRow] = useState<number | null>(null);

  const isDragging = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getColWidth = useCallback(
    (letter: string) => columnWidths[letter] ?? DEFAULT_COL_WIDTH,
    [columnWidths, DEFAULT_COL_WIDTH]
  );

  const getRowHeight = useCallback(
    (row: number) => rowHeights[String(row)] ?? DEFAULT_ROW_HEIGHT,
    [rowHeights, DEFAULT_ROW_HEIGHT]
  );

  const presenceCellMap = useMemo(() => {
    const map: Record<CellId, (typeof presenceMap)[string]> = {};
    Object.values(presenceMap).forEach((p) => {
      if (p.uid !== ownUid && p.activeCellId) {
        map[p.activeCellId] = p;
      }
    });
    return map;
  }, [presenceMap, ownUid]);

  const isInSelection = useCallback(
    (row: number, col: number): boolean => {
      const minR = Math.min(selection.start.row, selection.end.row);
      const maxR = Math.max(selection.start.row, selection.end.row);
      const minC = Math.min(selection.start.col, selection.end.col);
      const maxC = Math.max(selection.start.col, selection.end.col);
      return row >= minR && row <= maxR && col >= minC && col <= maxC;
    },
    [selection]
  );

  // ── Cell selection ────────────────────────────────────────────────────────

  const selectCell = useCallback(
    (cellId: CellId, extendSelection = false) => {
      const pos = parseCellId(cellId);
      if (extendSelection) {
        setSelection((prev) => ({ ...prev, end: pos }));
      } else {
        setSelection({ start: pos, end: pos });
      }
      setActiveCell(cellId);
      setSelectedCol(null);
      setSelectedRow(null);
      onActiveCellChange(cellId);
      onSelectionChange?.(cellId, cells[cellId]?.raw ?? "");
    },
    [cells, onActiveCellChange, onSelectionChange]
  );

  const navigate = useCallback(
    (direction: "up" | "down" | "left" | "right" | "tab" | "enter") => {
      const pos = parseCellId(activeCell);
      let { row, col } = pos;
      switch (direction) {
        case "up":    row = Math.max(1, row - 1); break;
        case "down":
        case "enter": row = Math.min(TOTAL_ROWS, row + 1); break;
        case "left":  col = Math.max(1, col - 1); break;
        case "right":
        case "tab":   col = Math.min(TOTAL_COLS, col + 1); break;
      }
      setEditingCell(null);
      selectCell(toCellId(row, col));
    },
    [activeCell, TOTAL_ROWS, TOTAL_COLS, selectCell]
  );

  const handleCellSelect = useCallback(
    (cellId: CellId, e: React.MouseEvent) => {
      if (editingCell && editingCell !== cellId) setEditingCell(null);
      selectCell(cellId, e.shiftKey);
    },
    [editingCell, selectCell]
  );

  const handleStartEdit = useCallback((cellId: CellId) => {
    setEditingCell(cellId);
    setActiveCell(cellId);
  }, []);

  const handleCommitEdit = useCallback(
    (cellId: CellId, value: string) => {
      onCellChange(cellId, value);
      setEditingCell(null);
    },
    [onCellChange]
  );

  const handleCancelEdit = useCallback((cellId: CellId) => {
    setEditingCell(null);
    selectCell(cellId);
  }, [selectCell]);

  // ── Corner resize ─────────────────────────────────────────────────────────

  const handleCornerResize = useCallback(
    (cellId: CellId, dx: number, dy: number) => {
      const pos = parseCellId(cellId);
      const letter = colNumberToLetter(pos.col);
      const currentW = columnWidths[letter] ?? DEFAULT_COL_WIDTH;
      const currentH = rowHeights[String(pos.row)] ?? DEFAULT_ROW_HEIGHT;
      if (Math.abs(dx) > 1) onColumnResize(letter, Math.max(40, currentW + dx));
      if (Math.abs(dy) > 1) onRowResize(pos.row, Math.max(18, currentH + dy));
    },
    [columnWidths, rowHeights, DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT, onColumnResize, onRowResize]
  );

  // ── Column reorder ────────────────────────────────────────────────────────

  const handleColDragStart = useCallback((colIndex: number) => {
    setDraggingCol(colIndex);
    isDragging.current = true;
  }, []);

  const handleColDragOver = useCallback((colIndex: number) => {
    setDragOverCol(colIndex);
  }, []);

  const handleColDragEnd = useCallback(() => {
    if (draggingCol !== null && dragOverCol !== null && draggingCol !== dragOverCol) {
      setColOrder((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(draggingCol);
        const toIdx = next.indexOf(dragOverCol);
        if (fromIdx === -1 || toIdx === -1) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, draggingCol);
        return next;
      });
      onColumnsReorder?.(draggingCol, dragOverCol);
    }
    setDraggingCol(null);
    setDragOverCol(null);
    isDragging.current = false;
  }, [draggingCol, dragOverCol, onColumnsReorder]);

  // ── Row reorder ───────────────────────────────────────────────────────────

  const handleRowDragStart = useCallback((rowIndex: number) => {
    setDraggingRow(rowIndex);
    isDragging.current = true;
  }, []);

  const handleRowDragOver = useCallback((rowIndex: number) => {
    setDragOverRow(rowIndex);
  }, []);

  const handleRowDragEnd = useCallback(() => {
    if (draggingRow !== null && dragOverRow !== null && draggingRow !== dragOverRow) {
      setRowOrder((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(draggingRow);
        const toIdx = next.indexOf(dragOverRow);
        if (fromIdx === -1 || toIdx === -1) return prev;
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, draggingRow);
        return next;
      });
      onRowsReorder?.(draggingRow, dragOverRow);
    }
    setDraggingRow(null);
    setDragOverRow(null);
    isDragging.current = false;
  }, [draggingRow, dragOverRow, onRowsReorder]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const pos = parseCellId(activeCell);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          selectCell(toCellId(Math.max(1, pos.row - 1), pos.col), e.shiftKey);
          break;
        case "ArrowDown":
          e.preventDefault();
          selectCell(toCellId(Math.min(TOTAL_ROWS, pos.row + 1), pos.col), e.shiftKey);
          break;
        case "ArrowLeft":
          e.preventDefault();
          selectCell(toCellId(pos.row, Math.max(1, pos.col - 1)), e.shiftKey);
          break;
        case "ArrowRight":
          e.preventDefault();
          selectCell(toCellId(pos.row, Math.min(TOTAL_COLS, pos.col + 1)), e.shiftKey);
          break;
        case "Tab":
          e.preventDefault();
          navigate("tab");
          break;
        case "Enter":
          e.preventDefault();
          e.shiftKey
            ? selectCell(toCellId(Math.max(1, pos.row - 1), pos.col))
            : navigate("enter");
          break;
        case "Escape":
          setEditingCell(null);
          break;
        case "Delete":
        case "Backspace":
          if (cells[activeCell]?.raw) onCellChange(activeCell, "");
          break;
        case "F2":
          e.preventDefault();
          handleStartEdit(activeCell);
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            handleStartEdit(activeCell);
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCell, editingCell, cells, TOTAL_ROWS, TOTAL_COLS, selectCell, navigate, handleStartEdit, onCellChange]);

  // ── Column / row select ───────────────────────────────────────────────────

  const handleSelectColumn = useCallback((letter: string) => {
    setSelectedCol(letter);
    setSelectedRow(null);
  }, []);

  const handleSelectRow = useCallback((row: number) => {
    setSelectedRow(row);
    setSelectedCol(null);
  }, []);

  // ── Derived column/row arrays from order ──────────────────────────────────

  const orderedColumns = useMemo(
    () => colOrder.map((n) => colNumberToLetter(n)),
    [colOrder]
  );

  const orderedRows = useMemo(() => rowOrder, [rowOrder]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={gridRef}
      className="overflow-auto flex-1 relative"
      style={{ backgroundColor: "#0A0A0F" }}
    >
      {/* Sticky top row: corner + column headers */}
      <div className="sticky top-0 z-30 flex">
        {/* Corner */}
        <div
          className="flex-shrink-0 bg-surface border-r border-b border-border sticky left-0 z-30 flex items-center justify-center"
          style={{
            width: GRID_CONSTANTS.HEADER_COL_WIDTH,
            height: GRID_CONSTANTS.HEADER_ROW_HEIGHT,
          }}
        >
          <div className="w-2 h-2 rounded-sm bg-border-bright" />
        </div>

        {/* Column headers */}
        <div className="flex sticky top-0 z-20">
          {orderedColumns.map((letter, displayIdx) => {
            const originalColNum = colLetterToNumber(letter);
            return (
              <ColumnHeader
                key={letter}
                letter={letter}
                colIndex={originalColNum}
                width={getColWidth(letter)}
                isSelected={selectedCol === letter}
                isDragging={draggingCol === originalColNum}
                isDragOver={dragOverCol === originalColNum}
                onResize={onColumnResize}
                onSelectColumn={handleSelectColumn}
                onDragStart={handleColDragStart}
                onDragOver={handleColDragOver}
                onDragEnd={handleColDragEnd}
              />
            );
          })}
        </div>
      </div>

      {/* Grid body */}
      <div className="flex">
        {/* Row headers */}
        <div className="sticky left-0 z-10 flex flex-col flex-shrink-0">
          {orderedRows.map((rowNum) => (
            <RowHeader
              key={rowNum}
              rowIndex={rowNum}
              height={getRowHeight(rowNum)}
              isSelected={selectedRow === rowNum}
              isDragging={draggingRow === rowNum}
              isDragOver={dragOverRow === rowNum}
              onResize={onRowResize}
              onSelectRow={handleSelectRow}
              onDragStart={handleRowDragStart}
              onDragOver={handleRowDragOver}
              onDragEnd={handleRowDragEnd}
            />
          ))}
        </div>

        {/* Cells */}
        <div className="flex flex-col">
          {orderedRows.map((rowNum) => (
            <div key={rowNum} className="flex flex-row">
              {orderedColumns.map((letter, colIdx) => {
                const col = colLetterToNumber(letter);
                const cellId = toCellId(rowNum, col);
                const isActive = activeCell === cellId;
                const isEdit = editingCell === cellId;
                const inSel = isInSelection(rowNum, col);
                const presenceUser = presenceCellMap[cellId] ?? null;

                return (
                  <Cell
                    key={cellId}
                    cellId={cellId}
                    displayValue={cells[cellId]?.computed ?? ""}
                    rawValue={cells[cellId]?.raw ?? ""}
                    format={cells[cellId]?.format ?? {}}
                    width={getColWidth(letter)}
                    height={getRowHeight(rowNum)}
                    isSelected={isActive}
                    isEditing={isEdit}
                    isInSelection={inSel && !isActive}
                    presence={presenceUser}
                    onSelect={handleCellSelect}
                    onStartEdit={handleStartEdit}
                    onCommitEdit={handleCommitEdit}
                    onCancelEdit={handleCancelEdit}
                    onNavigate={navigate}
                    onCornerResize={handleCornerResize}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}