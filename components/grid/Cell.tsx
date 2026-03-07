"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
} from "react";
import type { CellFormat, CellId, PresenceData } from "@/types";

interface CellProps {
  cellId: CellId;
  displayValue: string;
  rawValue: string;
  format: CellFormat;
  width: number;
  height: number;
  isSelected: boolean;
  isEditing: boolean;
  isInSelection: boolean;
  presence: PresenceData | null;
  onSelect: (cellId: CellId, e: React.MouseEvent) => void;
  onStartEdit: (cellId: CellId) => void;
  onCommitEdit: (cellId: CellId, value: string) => void;
  onCancelEdit: (cellId: CellId) => void;
  onNavigate: (direction: "up" | "down" | "left" | "right" | "tab" | "enter") => void;
  onCornerResize?: (cellId: CellId, dx: number, dy: number) => void;
}

const Cell = memo(function Cell({
  cellId,
  displayValue,
  rawValue,
  format,
  width,
  height,
  isSelected,
  isEditing,
  isInSelection,
  presence,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onNavigate,
  onCornerResize,
}: CellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(rawValue);
  const cornerDragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(rawValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isEditing, rawValue]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => { onSelect(cellId, e); },
    [cellId, onSelect]
  );

  const handleDoubleClick = useCallback(
    () => { onStartEdit(cellId); },
    [cellId, onStartEdit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onCommitEdit(cellId, editValue);
        onNavigate("enter");
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancelEdit(cellId);
      } else if (e.key === "Tab") {
        e.preventDefault();
        onCommitEdit(cellId, editValue);
        onNavigate("tab");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onCommitEdit(cellId, editValue);
        onNavigate("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onCommitEdit(cellId, editValue);
        onNavigate("down");
      }
    },
    [cellId, editValue, onCommitEdit, onCancelEdit, onNavigate]
  );

  // Corner resize drag
  const handleCornerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      cornerDragStart.current = { x: e.clientX, y: e.clientY };

      const onMouseMove = (me: MouseEvent) => {
        if (!cornerDragStart.current) return;
        const dx = me.clientX - cornerDragStart.current.x;
        const dy = me.clientY - cornerDragStart.current.y;
        cornerDragStart.current = { x: me.clientX, y: me.clientY };
        onCornerResize?.(cellId, dx, dy);
      };

      const onMouseUp = () => {
        cornerDragStart.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [cellId, onCornerResize]
  );

  // Format number display
  const formattedDisplay = useCallback((): string => {
    if (!format.numberFormat || displayValue === "" || isNaN(Number(displayValue))) {
      return displayValue;
    }
    const n = Number(displayValue);
    switch (format.numberFormat) {
      case "number":    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case "integer":   return Math.round(n).toLocaleString("en-US");
      case "percent":   return (n / 100).toLocaleString("en-US", { style: "percent", minimumFractionDigits: 2 });
      case "currency":  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
      case "scientific":return n.toExponential(2).toUpperCase().replace("E+", "E+").replace("E-", "E-");
      default:          return displayValue;
    }
  }, [displayValue, format.numberFormat]);

  const isError = displayValue.startsWith("#") && displayValue.endsWith("!");

  const containerStyle: React.CSSProperties = {
    width,
    minWidth: width,
    maxWidth: width,
    height,
    minHeight: height,
    position: "relative",
    backgroundColor: format.bgColor ?? undefined,
    // Border styles
    ...(format.border === "all"    && { outline: "1px solid #3A3A50" }),
    ...(format.border === "outer"  && { outline: "1px solid #3A3A50" }),
    ...(format.border === "bottom" && { borderBottom: "1px solid #8B8BA7" }),
    ...(format.border === "top"    && { borderTop: "1px solid #8B8BA7" }),
    ...(format.border === "left"   && { borderLeft: "1px solid #8B8BA7" }),
    ...(format.border === "right"  && { borderRight: "1px solid #8B8BA7" }),
  };

  const textStyle: React.CSSProperties = {
    fontWeight: format.bold ? 600 : 400,
    fontStyle: format.italic ? "italic" : "normal",
    textDecoration: format.strikethrough ? "line-through" : "none",
    color: isError ? "#EF4444" : (format.textColor ?? undefined),
    fontSize: format.fontSize ?? 13,
    textAlign: format.align ?? "left",
    whiteSpace: format.wrap ? "normal" : "nowrap",
  };

  const cellClass = [
    "grid-cell",
    isSelected ? "cell-selected" : "",
    isInSelection && !isSelected ? "bg-accent-dim" : "",
  ].filter(Boolean).join(" ");

  const presenceBorder = presence ? `2px solid ${presence.color}` : undefined;

  return (
    <div
      className={cellClass}
      style={{
        ...containerStyle,
        outline: presenceBorder ?? containerStyle.outline,
        outlineOffset: "-2px",
        zIndex: isSelected || presence ? 1 : 0,
        alignItems:
          format.verticalAlign === "top" ? "flex-start" :
          format.verticalAlign === "bottom" ? "flex-end" : "center",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Presence name tag */}
      {presence && (
        <div
          className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-ui font-medium text-white rounded-sm whitespace-nowrap z-20 pointer-events-none"
          style={{ backgroundColor: presence.color }}
        >
          {presence.displayName}
        </div>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          className="absolute inset-0 w-full h-full px-1.5 bg-surface border-none outline-none font-mono text-[13px] text-text-primary z-10"
          style={textStyle}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCommitEdit(cellId, editValue)}
          spellCheck={false}
        />
      ) : (
        <span
          className="w-full overflow-hidden text-ellipsis px-1.5 select-none pointer-events-none"
          style={{
            ...textStyle,
            display: "block",
            lineHeight: `${height - 2}px`,
          }}
        >
          {formattedDisplay()}
        </span>
      )}

      {/* Corner resize handle — only on selected cell */}
      {isSelected && onCornerResize && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-20 group/corner"
          onMouseDown={handleCornerMouseDown}
        >
          <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-sm bg-accent opacity-80 group-hover/corner:opacity-100 group-hover/corner:scale-110 transition-all" />
        </div>
      )}
    </div>
  );
});

export default Cell;