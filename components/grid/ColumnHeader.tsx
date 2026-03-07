"use client";

import { useRef, useCallback, memo, useState } from "react";
import { GRID_CONSTANTS } from "@/types";

interface ColumnHeaderProps {
  letter: string;
  colIndex: number;       
  width: number;
  isSelected: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onResize: (letter: string, newWidth: number) => void;
  onSelectColumn: (letter: string) => void;
  onDragStart: (colIndex: number) => void;
  onDragOver: (colIndex: number) => void;
  onDragEnd: () => void;
}

const ColumnHeader = memo(function ColumnHeader({
  letter,
  colIndex,
  width,
  isSelected,
  isDragOver,
  isDragging,
  onResize,
  onSelectColumn,
  onDragStart,
  onDragOver,
  onDragEnd,
}: ColumnHeaderProps) {
  const dragStartX = useRef<number | null>(null);
  const dragStartWidth = useRef<number>(width);
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (dragStartX.current === null) return;
        const delta = moveEvent.clientX - dragStartX.current;
        const newWidth = Math.max(40, Math.min(400, dragStartWidth.current + delta));
        onResize(letter, newWidth);
      };

      const onMouseUp = () => {
        dragStartX.current = null;
        setIsResizing(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [letter, width, onResize]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(colIndex));
      onDragStart(colIndex);
    },
    [colIndex, onDragStart]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      onDragOver(colIndex);
    },
    [colIndex, onDragOver]
  );

  return (
    <div
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDragEnd}
      className="relative flex items-center justify-center select-none group transition-colors"
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        height: GRID_CONSTANTS.HEADER_ROW_HEIGHT,
        backgroundColor: isDragOver
          ? "hsl(var(--accent) / 0.3)"
          : isDragging
          ? "hsl(var(--accent) / 0.1)"
          : isSelected
          ? "hsl(var(--accent) / 0.15)"
          : "hsl(var(--surface-2))",
        borderRight: isDragOver ? "2px solid hsl(var(--accent))" : "1px solid hsl(var(--border-bright))",
        borderBottom: "1px solid hsl(var(--border-bright))",
        flexShrink: 0,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.7 : 1,
        transition: "background-color 0.15s, border-color 0.15s",
      }}
      onClick={() => onSelectColumn(letter)}
    >
      {/* Drag indicator dots */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
        <div className="w-0.5 h-0.5 rounded-full bg-text-dim" />
        <div className="w-0.5 h-0.5 rounded-full bg-text-dim" />
        <div className="w-0.5 h-0.5 rounded-full bg-text-dim" />
      </div>

      <span
        className="font-mono text-[11px] font-semibold pointer-events-none transition-colors"
        style={{ color: isSelected || isDragOver ? "hsl(var(--accent))" : "hsl(var(--text-dim))" }}
      >
        {letter}
      </span>

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onMouseDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="w-px h-3 bg-accent opacity-70" />
      </div>
    </div>
  );
});

export default ColumnHeader;