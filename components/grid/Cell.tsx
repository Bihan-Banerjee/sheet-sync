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
  presence: PresenceData | null; // another user on this cell
  onSelect: (cellId: CellId, e: React.MouseEvent) => void;
  onStartEdit: (cellId: CellId) => void;
  onCommitEdit: (cellId: CellId, value: string) => void;
  onCancelEdit: (cellId: CellId) => void;
  onNavigate: (direction: "up" | "down" | "left" | "right" | "tab" | "enter") => void;
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
}: CellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(rawValue);

  // Sync edit value when editing starts
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
    (e: React.MouseEvent) => {
      onSelect(cellId, e);
    },
    [cellId, onSelect]
  );

  const handleDoubleClick = useCallback(() => {
    onStartEdit(cellId);
  }, [cellId, onStartEdit]);

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

  // Cell container style
  const containerStyle: React.CSSProperties = {
    width,
    minWidth: width,
    maxWidth: width,
    height,
    minHeight: height,
    position: "relative",
    backgroundColor: format.bgColor ?? undefined,
  };

  // Text style from format
  const textStyle: React.CSSProperties = {
    fontWeight: format.bold ? 600 : 400,
    fontStyle: format.italic ? "italic" : "normal",
    color: format.textColor ?? undefined,
    fontSize: format.fontSize ?? 13,
    textAlign: format.align ?? "left",
  };

  // Presence border color
  const presenceBorder = presence
    ? `2px solid ${presence.color}`
    : undefined;

  const cellClass = [
    "grid-cell",
    isSelected ? "cell-selected" : "",
    isInSelection && !isSelected ? "bg-accent-dim" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cellClass}
      style={{
        ...containerStyle,
        outline: presenceBorder ? presenceBorder : undefined,
        outlineOffset: "-2px",
        zIndex: isSelected || presence ? 1 : 0,
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
          className="w-full overflow-hidden text-ellipsis whitespace-nowrap px-1.5 select-none pointer-events-none"
          style={{
            ...textStyle,
            color: displayValue.startsWith("#") && displayValue.endsWith("!")
              ? "#EF4444"
              : textStyle.color,
            fontStyle: displayValue.startsWith("#") && displayValue.endsWith("!")
              ? "italic"
              : textStyle.fontStyle,
          }}
        >
          {displayValue}
        </span>
      )}
    </div>
  );
});

export default Cell;