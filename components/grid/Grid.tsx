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
  const [isDragging, setIsDragging] = useState(false);
  const dragStartCell = useRef<CellPosition | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Derived helpers ────────────────────────────────────────────────────
  const getColWidth = useCallback(
    (letter: string) =>
      columnWidths[letter] ?? DEFAULT_COL_WIDTH,
    [columnWidths, DEFAULT_COL_WIDTH]
  );

  const getRowHeight = useCallback(
    (row: number) =>
      rowHeights[String(row)] ?? DEFAULT_ROW_HEIGHT,
    [rowHeights, DEFAULT_ROW_HEIGHT]
  );

  // ── Presence cell map — other users only ──────────────────────────────
  const presenceCellMap = useMemo(() => {
    const map: Record<CellId, (typeof presenceMap)[string]> = {};
    Object.values(presenceMap).forEach((p) => {
      if (p.uid !== ownUid && p.activeCellId) {
        map[p.activeCellId] = p;
      }
    });
    return map;
  }, [presenceMap, ownUid]);

  // ── Is cell in selection range ─────────────────────────────────────────
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

  // ── Select a cell ─────────────────────────────────────────────────────
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

      const raw = cells[cellId]?.raw ?? "";
      onSelectionChange?.(cellId, raw);
    },
    [cells, onActiveCellChange, onSelectionChange]
  );

  // ── Navigate from active cell ──────────────────────────────────────────
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

      const newId = toCellId(row, col);
      setEditingCell(null);
      selectCell(newId);
    },
    [activeCell, TOTAL_ROWS, TOTAL_COLS, selectCell]
  );

  // ── Handle cell select (mouse) ─────────────────────────────────────────
  const handleCellSelect = useCallback(
    (cellId: CellId, e: React.MouseEvent) => {
      if (editingCell && editingCell !== cellId) {
        setEditingCell(null);
      }
      selectCell(cellId, e.shiftKey);
    },
    [editingCell, selectCell]
  );

  // ── Start editing ──────────────────────────────────────────────────────
  const handleStartEdit = useCallback((cellId: CellId) => {
    setEditingCell(cellId);
    setActiveCell(cellId);
  }, []);

  // ── Commit edit ────────────────────────────────────────────────────────
  const handleCommitEdit = useCallback(
    (cellId: CellId, value: string) => {
      onCellChange(cellId, value);
      setEditingCell(null);
    },
    [onCellChange]
  );

  // ── Cancel edit ────────────────────────────────────────────────────────
  const handleCancelEdit = useCallback((cellId: CellId) => {
    setEditingCell(null);
    selectCell(cellId);
  }, [selectCell]);

  // ── Keyboard navigation on grid (not editing) ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;

      // Ignore if focus is inside an input/textarea elsewhere
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const pos = parseCellId(activeCell);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          selectCell(
            toCellId(Math.max(1, pos.row - 1), pos.col),
            e.shiftKey
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          selectCell(
            toCellId(Math.min(TOTAL_ROWS, pos.row + 1), pos.col),
            e.shiftKey
          );
          break;
        case "ArrowLeft":
          e.preventDefault();
          selectCell(
            toCellId(pos.row, Math.max(1, pos.col - 1)),
            e.shiftKey
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          selectCell(
            toCellId(pos.row, Math.min(TOTAL_COLS, pos.col + 1)),
            e.shiftKey
          );
          break;
        case "Tab":
          e.preventDefault();
          navigate("tab");
          break;
        case "Enter":
          e.preventDefault();
          if (e.shiftKey) {
            selectCell(toCellId(Math.max(1, pos.row - 1), pos.col));
          } else {
            navigate("enter");
          }
          break;
        case "Escape":
          setEditingCell(null);
          break;
        case "Delete":
        case "Backspace":
          if (cells[activeCell]?.raw) {
            onCellChange(activeCell, "");
          }
          break;
        case "F2":
          e.preventDefault();
          handleStartEdit(activeCell);
          break;
        default:
          // Start typing → enter edit mode
          if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            handleStartEdit(activeCell);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeCell,
    editingCell,
    cells,
    TOTAL_ROWS,
    TOTAL_COLS,
    selectCell,
    navigate,
    handleStartEdit,
    onCellChange,
  ]);

  // ── Mouse drag selection ───────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (cellId: CellId, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      dragStartCell.current = parseCellId(cellId);
      setIsDragging(true);
    },
    []
  );

  const handleMouseEnter = useCallback(
    (cellId: CellId) => {
      if (!isDragging || !dragStartCell.current) return;
      const pos = parseCellId(cellId);
      setSelection({ start: dragStartCell.current, end: pos });
      setActiveCell(toCellId(dragStartCell.current.row, dragStartCell.current.col));
    },
    [isDragging]
  );

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartCell.current = null;
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // ── Column / row select ────────────────────────────────────────────────
  const handleSelectColumn = useCallback((letter: string) => {
    setSelectedCol(letter);
    setSelectedRow(null);
  }, []);

  const handleSelectRow = useCallback((row: number) => {
    setSelectedRow(row);
    setSelectedCol(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      Array.from({ length: TOTAL_COLS }, (_, i) =>
        colNumberToLetter(i + 1)
      ),
    [TOTAL_COLS]
  );

  const rows = useMemo(
    () => Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1),
    [TOTAL_ROWS]
  );

  return (
    <div
      ref={gridRef}
      className="overflow-auto flex-1 relative"
      style={{ backgroundColor: "#0A0A0F" }}
    >
      {/* Sticky top-left corner */}
      <div className="sticky top-0 left-0 z-30 flex">
        {/* Corner cell */}
        <div
          className="flex-shrink-0 bg-surface border-r border-b border-border sticky left-0 z-30"
          style={{
            width: GRID_CONSTANTS.HEADER_COL_WIDTH,
            height: GRID_CONSTANTS.HEADER_ROW_HEIGHT,
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-sm bg-border-bright" />
          </div>
        </div>

        {/* Column headers */}
        <div className="flex sticky top-0 z-20">
          {columns.map((letter) => (
            <ColumnHeader
              key={letter}
              letter={letter}
              width={getColWidth(letter)}
              isSelected={selectedCol === letter}
              onResize={onColumnResize}
              onSelectColumn={handleSelectColumn}
            />
          ))}
        </div>
      </div>

      {/* Grid body */}
      <div className="flex">
        {/* Row headers — sticky left */}
        <div className="sticky left-0 z-10 flex flex-col flex-shrink-0">
          {rows.map((row) => (
            <RowHeader
              key={row}
              rowIndex={row}
              height={getRowHeight(row)}
              isSelected={selectedRow === row}
              onResize={onRowResize}
              onSelectRow={handleSelectRow}
            />
          ))}
        </div>

        {/* Cells */}
        <div className="flex flex-col">
          {rows.map((row) => (
            <div key={row} className="flex flex-row">
              {columns.map((letter, colIdx) => {
                const col = colIdx + 1;
                const cellId = toCellId(row, col);
                const isActive = activeCell === cellId;
                const isEdit = editingCell === cellId;
                const inSel = isInSelection(row, col);
                const presenceUser = presenceCellMap[cellId] ?? null;

                return (
                  <Cell
                    key={cellId}
                    cellId={cellId}
                    displayValue={cells[cellId]?.computed ?? ""}
                    rawValue={cells[cellId]?.raw ?? ""}
                    format={cells[cellId]?.format ?? {}}
                    width={getColWidth(letter)}
                    height={getRowHeight(row)}
                    isSelected={isActive}
                    isEditing={isEdit}
                    isInSelection={inSel && !isActive}
                    presence={presenceUser}
                    onSelect={handleCellSelect}
                    onStartEdit={handleStartEdit}
                    onCommitEdit={handleCommitEdit}
                    onCancelEdit={handleCancelEdit}
                    onNavigate={navigate}
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