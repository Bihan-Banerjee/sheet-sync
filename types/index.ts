import type { Timestamp } from "firebase/firestore";

// ─── Cell ────────────────────────────────────────────────────────────────────

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;                               
  textColor?: string;
  bgColor?: string;
  fontSize?: number;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";      
  wrap?: boolean;                                   
  border?: "all" | "outer" | "bottom" | "top" | "left" | "right"; 
  numberFormat?: "number" | "integer" | "percent" | "currency" | "scientific"; 
}
export interface CellData {
  /** Raw user input — could be a formula like =SUM(A1:A3) or plain text */
  raw: string;
  /** Computed display value after formula evaluation */
  computed: string;
  /** Formatting metadata */
  format?: CellFormat;
  /** UID of the last user who edited this cell */
  lastEditedBy?: string;
  /** Firestore server timestamp of last edit */
  updatedAt?: Timestamp;
}

/** Key format: "A1", "B3", "Z26" */
export type CellId = string;

/** In-memory map of all cells for a document */
export type CellMap = Record<CellId, CellData>;

// ─── Column / Row sizing ─────────────────────────────────────────────────────

export interface ColumnMeta {
  /** Column letter: "A", "B", … "Z" */
  letter: string;
  /** Width in pixels */
  width: number;
}

export interface RowMeta {
  /** 1-indexed row number */
  index: number;
  /** Height in pixels */
  height: number;
}

// ─── Spreadsheet Document ────────────────────────────────────────────────────

export interface SpreadsheetDocument {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  /** Column widths keyed by letter */
  columnWidths?: Record<string, number>;
  /** Row heights keyed by 1-indexed row number string */
  rowHeights?: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Shape stored in Firestore under documents/{id} */
export type SpreadsheetDocumentWrite = Omit<SpreadsheetDocument, "id">;

// ─── Presence ────────────────────────────────────────────────────────────────

export interface PresenceData {
  uid: string;
  displayName: string;
  color: string;
  /** Currently focused cell, e.g. "B4". Null if no cell selected. */
  activeCellId: CellId | null;
  /** Used to detect stale presence entries (15s timeout) */
  lastSeen: Timestamp;
}

/** Presence keyed by uid */
export type PresenceMap = Record<string, PresenceData>;

// ─── Auth / User ─────────────────────────────────────────────────────────────

export interface AppUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  /** Whether this is an anonymous/guest session */
  isAnonymous: boolean;
  presenceColor: string;
}

// ─── Formula Parser ──────────────────────────────────────────────────────────

export type FormulaErrorCode =
  | "#REF!"
  | "#DIV/0!"
  | "#ERR!"
  | "#CIRC!"
  | "#NAME?"
  | "#NUM!";

export interface FormulaResult {
  value: string;
  isError: boolean;
  errorCode?: FormulaErrorCode;
}

// ─── Grid Selection ──────────────────────────────────────────────────────────

export interface CellPosition {
  row: number;   // 1-indexed
  col: number;   // 1-indexed (1 = A)
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

// ─── Write State (sync indicator) ────────────────────────────────────────────

export type WriteState = "idle" | "saving" | "saved" | "error";

// ─── Toast Notifications ─────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  durationMs?: number;
}

// ─── Grid Constants ──────────────────────────────────────────────────────────

export const GRID_CONSTANTS = {
  DEFAULT_COL_WIDTH: 100,
  DEFAULT_ROW_HEIGHT: 24,
  HEADER_COL_WIDTH: 48,
  HEADER_ROW_HEIGHT: 24,
  TOTAL_COLS: 26,
  TOTAL_ROWS: 100,
  PRESENCE_TIMEOUT_MS: 15_000,
  HEARTBEAT_INTERVAL_MS: 5_000,
  DEBOUNCE_WRITE_MS: 300,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert 1-indexed column number to letter: 1 → "A", 26 → "Z" */
export function colNumberToLetter(col: number): string {
  return String.fromCharCode(64 + col);
}

/** Convert column letter to 1-indexed number: "A" → 1, "Z" → 26 */
export function colLetterToNumber(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 64;
}

/** Build a CellId from row + col numbers: (1, 1) → "A1" */
export function toCellId(row: number, col: number): CellId {
  return `${colNumberToLetter(col)}${row}`;
}

/** Parse a CellId into row + col position: "B3" → { row: 3, col: 2 } */
export function parseCellId(cellId: CellId): CellPosition {
  const match = /^([A-Z]+)(\d+)$/.exec(cellId.toUpperCase());
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid cellId: ${cellId}`);
  }
  const col = colLetterToNumber(match![1]!);
  const row = parseInt(match![2]!, 10);
  return { row, col };
}

/** Check whether a CellId string is syntactically valid */
export function isValidCellId(cellId: string): boolean {
  return /^[A-Z]{1,2}\d{1,3}$/.test(cellId.toUpperCase());
}

/** Expand a range like "A1:C3" into all CellIds within it */
export function expandRange(range: string): CellId[] {
  const parts = range.toUpperCase().split(":");
  if (parts.length !== 2) return [];
  const [startId, endId] = parts as [string, string];
  const start = parseCellId(startId);
  const end = parseCellId(endId);

  const cells: CellId[] = [];
  for (let r = start.row; r <= end.row; r++) {
    for (let c = start.col; c <= end.col; c++) {
      cells.push(toCellId(r, c));
    }
  }
  return cells;
}