import {
  expandRange,
  isValidCellId,
  type CellId,
} from "@/types";
import type { CellMap, FormulaResult, FormulaErrorCode } from "@/types";

// ─── Tokeniser ────────────────────────────────────────────────────────────────

type TokenType =
  | "NUMBER"
  | "STRING"
  | "CELL_REF"
  | "RANGE"
  | "FUNCTION"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "CARET"
  | "LPAREN"
  | "RPAREN"
  | "COMMA"
  | "COLON"
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
}

function tokenise(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i]!;

    // Whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Number (integer or decimal)
    if (/\d/.test(ch) || (ch === "." && /\d/.test(input[i + 1] ?? ""))) {
      let num = "";
      while (i < input.length && /[\d.]/.test(input[i]!)) num += input[i++];
      tokens.push({ type: "NUMBER", value: num });
      continue;
    }

    // String literal
    if (ch === '"') {
      let str = "";
      i++; // skip opening quote
      while (i < input.length && input[i] !== '"') str += input[i++];
      i++; // skip closing quote
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    // Identifier: function name or cell reference
    if (/[A-Za-z]/.test(ch)) {
      let ident = "";
      while (i < input.length && /[A-Za-z0-9]/.test(input[i]!)) {
        ident += input[i++];
      }
      const upper = ident.toUpperCase();

      // Peek ahead for colon → range token like A1:B3
      if (
        isValidCellId(upper) &&
        input[i] === ":" &&
        i + 1 < input.length
      ) {
        let right = "";
        i++; // skip colon
        while (i < input.length && /[A-Za-z0-9]/.test(input[i]!)) {
          right += input[i++];
        }
        tokens.push({ type: "RANGE", value: `${upper}:${right.toUpperCase()}` });
        continue;
      }

      // Function call (identifier followed by open paren)
      if (input[i] === "(") {
        tokens.push({ type: "FUNCTION", value: upper });
        continue;
      }

      // Cell reference
      if (isValidCellId(upper)) {
        tokens.push({ type: "CELL_REF", value: upper });
        continue;
      }

      // Unknown identifier → name error
      tokens.push({ type: "FUNCTION", value: upper });
      continue;
    }

    // Operators and punctuation
    const single: Record<string, TokenType> = {
      "+": "PLUS",
      "-": "MINUS",
      "*": "STAR",
      "/": "SLASH",
      "^": "CARET",
      "(": "LPAREN",
      ")": "RPAREN",
      ",": "COMMA",
      ":": "COLON",
    };

    if (single[ch]) {
      tokens.push({ type: single[ch]!, value: ch });
      i++;
      continue;
    }

    // Unknown character — skip
    i++;
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Recursive descent parser.
 *
 * Grammar:
 *   expr     → term ((PLUS | MINUS) term)*
 *   term     → power ((STAR | SLASH) power)*
 *   power    → unary (CARET unary)*
 *   unary    → MINUS unary | primary
 *   primary  → NUMBER | STRING | CELL_REF | RANGE | func_call | LPAREN expr RPAREN
 *   func_call → FUNCTION LPAREN args RPAREN
 *   args     → (expr (COMMA expr)*)?
 */
class Parser {
  private tokens: Token[];
  private pos = 0;
  private cells: CellMap;
  private visitedCells: Set<CellId>;

  constructor(tokens: Token[], cells: CellMap, visitedCells: Set<CellId>) {
    this.tokens = tokens;
    this.cells = cells;
    this.visitedCells = visitedCells;
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: "EOF", value: "" };
  }

  private consume(): Token {
    return this.tokens[this.pos++] ?? { type: "EOF", value: "" };
  }

  private expect(type: TokenType): Token {
    const t = this.consume();
    if (t.type !== type) throw new FormulaError("#ERR!");
    return t;
  }

  parse(): number | string {
    const result = this.expr();
    if (this.peek().type !== "EOF") throw new FormulaError("#ERR!");
    return result;
  }

  // expr → term ((PLUS | MINUS) term)*
  private expr(): number | string {
    let left = this.term();

    while (
      this.peek().type === "PLUS" ||
      this.peek().type === "MINUS"
    ) {
      const op = this.consume().type;
      const right = this.term();
      left = applyArithmetic(op === "PLUS" ? "+" : "-", left, right);
    }

    return left;
  }

  // term → power ((STAR | SLASH) power)*
  private term(): number | string {
    let left = this.power();

    while (
      this.peek().type === "STAR" ||
      this.peek().type === "SLASH"
    ) {
      const op = this.consume().type;
      const right = this.power();
      if (op === "SLASH") {
        const r = toNumber(right);
        if (r === 0) throw new FormulaError("#DIV/0!");
        left = toNumber(left) / r;
      } else {
        left = applyArithmetic("*", left, right);
      }
    }

    return left;
  }

  // power → unary (CARET unary)*
  private power(): number | string {
    let base = this.unary();
    while (this.peek().type === "CARET") {
      this.consume();
      const exp = this.unary();
      base = Math.pow(toNumber(base), toNumber(exp));
    }
    return base;
  }

  // unary → MINUS unary | primary
  private unary(): number | string {
    if (this.peek().type === "MINUS") {
      this.consume();
      return -toNumber(this.unary());
    }
    return this.primary();
  }

  // primary
  private primary(): number | string {
    const t = this.peek();

    if (t.type === "NUMBER") {
      this.consume();
      return parseFloat(t.value);
    }

    if (t.type === "STRING") {
      this.consume();
      return t.value;
    }

    if (t.type === "CELL_REF") {
      this.consume();
      return this.resolveCellRef(t.value);
    }

    if (t.type === "RANGE") {
      // Bare range outside a function — treat as first cell value
      this.consume();
      const cells = expandRange(t.value);
      return cells.length > 0 ? this.resolveCellRef(cells[0]!) : 0;
    }

    if (t.type === "FUNCTION") {
      return this.funcCall();
    }

    if (t.type === "LPAREN") {
      this.consume();
      const val = this.expr();
      this.expect("RPAREN");
      return val;
    }

    throw new FormulaError("#ERR!");
  }

  // func_call → FUNCTION LPAREN args RPAREN
  private funcCall(): number | string {
    const name = this.consume().value; // FUNCTION token
    this.expect("LPAREN");
    const args = this.parseArgs();
    this.expect("RPAREN");
    return this.callFunction(name, args);
  }

  // args → (expr (COMMA expr)*)?
  private parseArgs(): Array<number | string> {
    const args: Array<number | string> = [];
    if (this.peek().type === "RPAREN") return args;

    // First arg may be a range token
    args.push(...this.argItem());

    while (this.peek().type === "COMMA") {
      this.consume();
      args.push(...this.argItem());
    }

    return args;
  }

  // argItem resolves RANGE tokens into multiple values
  private argItem(): Array<number | string> {
    if (this.peek().type === "RANGE") {
      const range = this.consume().value;
      return expandRange(range).map((id) => this.resolveCellRef(id));
    }
    return [this.expr()];
  }

  // ── Cell resolution ────────────────────────────────────────────────────────

  private resolveCellRef(cellId: CellId): number | string {
    if (this.visitedCells.has(cellId)) throw new FormulaError("#CIRC!");
    const cell = this.cells[cellId];
    if (!cell || cell.raw === "") return 0;

    if (cell.raw.startsWith("=")) {
      // Recursively evaluate with circular reference guard
      const childVisited = new Set(this.visitedCells);
      childVisited.add(cellId);
      const result = evaluateFormula(cell.raw.slice(1), this.cells, childVisited);
      if (result.isError) throw new FormulaError(result.errorCode ?? "#ERR!");
      return isNaN(Number(result.value)) ? result.value : Number(result.value);
    }

    const num = Number(cell.raw);
    return isNaN(num) ? cell.raw : num;
  }

  // ── Built-in functions ─────────────────────────────────────────────────────

  private callFunction(
    name: string,
    args: Array<number | string>
  ): number | string {
    const nums = args.map(toNumber);

    switch (name) {
      case "SUM":
        return nums.reduce((a, b) => a + b, 0);

      case "AVG":
      case "AVERAGE":
        if (nums.length === 0) throw new FormulaError("#DIV/0!");
        return nums.reduce((a, b) => a + b, 0) / nums.length;

      case "MIN":
        if (nums.length === 0) throw new FormulaError("#NUM!");
        return Math.min(...nums);

      case "MAX":
        if (nums.length === 0) throw new FormulaError("#NUM!");
        return Math.max(...nums);

      case "COUNT":
        return args.filter((a) => typeof a === "number" || !isNaN(Number(a))).length;

      case "COUNTA":
        return args.filter((a) => a !== "" && a !== 0).length;

      case "IF": {
        const [condition, ifTrue, ifFalse] = args;
        return toNumber(condition ?? 0) !== 0
          ? (ifTrue ?? 0)
          : (ifFalse ?? 0);
      }

      case "ROUND": {
        const [val, decimals] = nums;
        const d = Math.round(decimals ?? 0);
        return Math.round((val ?? 0) * Math.pow(10, d)) / Math.pow(10, d);
      }

      case "ABS":
        return Math.abs(nums[0] ?? 0);

      case "SQRT": {
        const val = nums[0] ?? 0;
        if (val < 0) throw new FormulaError("#NUM!");
        return Math.sqrt(val);
      }

      case "POWER":
        return Math.pow(nums[0] ?? 0, nums[1] ?? 1);

      case "CONCAT":
      case "CONCATENATE":
        return args.map(String).join("");

      case "LEN":
        return String(args[0] ?? "").length;

      case "UPPER":
        return String(args[0] ?? "").toUpperCase();

      case "LOWER":
        return String(args[0] ?? "").toLowerCase();

      case "TRIM":
        return String(args[0] ?? "").trim();

      case "NOW":
        return new Date().toLocaleString();

      case "TODAY":
        return new Date().toLocaleDateString();

      default:
        throw new FormulaError("#NAME?");
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

class FormulaError extends Error {
  constructor(public code: FormulaErrorCode) {
    super(code);
  }
}

function toNumber(val: number | string): number {
  if (typeof val === "number") return val;
  if (val === "" || val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function applyArithmetic(
  op: "+" | "-" | "*",
  a: number | string,
  b: number | string
): number {
  const na = toNumber(a);
  const nb = toNumber(b);
  switch (op) {
    case "+": return na + nb;
    case "-": return na - nb;
    case "*": return na * nb;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate a raw formula string (without the leading "=").
 * Pass a CellMap for cell reference resolution.
 * visitedCells tracks the call stack for circular reference detection.
 */
export function evaluateFormula(
  expression: string,
  cells: CellMap,
  visitedCells: Set<CellId> = new Set()
): FormulaResult {
  try {
    const tokens = tokenise(expression);
    const parser = new Parser(tokens, cells, visitedCells);
    const result = parser.parse();

    // Format numbers: drop unnecessary trailing zeros
    if (typeof result === "number") {
      const formatted = Number.isInteger(result)
        ? String(result)
        : parseFloat(result.toFixed(10)).toString();
      return { value: formatted, isError: false };
    }

    return { value: String(result), isError: false };
  } catch (err) {
    if (err instanceof FormulaError) {
      return { value: err.code, isError: true, errorCode: err.code };
    }
    return { value: "#ERR!", isError: true, errorCode: "#ERR!" };
  }
}

/**
 * Compute the display value of a single cell.
 * Returns the raw value if not a formula.
 */
export function computeCellValue(
  cellId: CellId,
  cells: CellMap
): FormulaResult {
  const cell = cells[cellId];
  if (!cell || cell.raw === "") return { value: "", isError: false };

  if (!cell.raw.startsWith("=")) {
    return { value: cell.raw, isError: false };
  }

  return evaluateFormula(
    cell.raw.slice(1),
    cells,
    new Set([cellId]) // seed with current cell to catch self-reference
  );
}

/**
 * Recompute all cells in the map and return an updated map
 * with computed values filled in. Call this after any cell edit.
 */
/**
 * Recompute all cells iteratively until values stabilize (to handle chained dependencies).
 */
export function recomputeAllCells(cells: CellMap): CellMap {
  let currentCells = { ...cells };
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 10; 

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;
    const nextCells: CellMap = {};

    for (const [id, cell] of Object.entries(currentCells)) {
      const result = computeCellValue(id, currentCells);
      nextCells[id] = {
        ...cell,
        computed: result.value,
      };

      if (nextCells[id].computed !== currentCells[id].computed) {
        changed = true;
      }
    }
    currentCells = nextCells;
  }

  return currentCells;
}