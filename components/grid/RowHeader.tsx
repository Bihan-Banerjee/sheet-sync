"use client";

import { useRef, useCallback, memo, useState } from "react";
import { GRID_CONSTANTS } from "@/types";

interface RowHeaderProps {
  rowIndex: number;
  height: number;
  isSelected: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onResize: (row: number, newHeight: number) => void;
  onSelectRow: (row: number) => void;
  onDragStart: (rowIndex: number) => void;
  onDragOver: (rowIndex: number) => void;
  onDragEnd: () => void;
}

const RowHeader = memo(function RowHeader({
  rowIndex,
  height,
  isSelected,
  isDragOver,
  isDragging,
  onResize,
  onSelectRow,
  onDragStart,
  onDragOver,
  onDragEnd,
}: RowHeaderProps) {
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(height);
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      dragStartY.current = e.clientY;
      dragStartHeight.current = height;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (dragStartY.current === null) return;
        const delta = moveEvent.clientY - dragStartY.current;
        const newHeight = Math.max(18, Math.min(200, dragStartHeight.current + delta));
        onResize(rowIndex, newHeight);
      };

      const onMouseUp = () => {
        dragStartY.current = null;
        setIsResizing(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [rowIndex, height, onResize]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(rowIndex));
      onDragStart(rowIndex);
    },
    [rowIndex, onDragStart]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      onDragOver(rowIndex);
    },
    [rowIndex, onDragOver]
  );

  return (
    <div
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDragEnd}
      className="relative flex items-center justify-center select-none group flex-shrink-0 transition-colors"
      style={{
        // FIX: Using the fixed constant for width, and dynamic 'height' prop for height
        width: GRID_CONSTANTS.HEADER_COL_WIDTH,
        minWidth: GRID_CONSTANTS.HEADER_COL_WIDTH,
        height, 
        
        // Dynamic Theme Colors
        backgroundColor: isDragOver
          ? "hsl(var(--accent) / 0.3)"
          : isDragging
          ? "hsl(var(--accent) / 0.1)"
          : isSelected
          ? "hsl(var(--accent) / 0.15)"
          : "hsl(var(--surface-2))",
        borderRight: "1px solid hsl(var(--border-bright))",
        borderBottom: isDragOver ? "2px solid hsl(var(--accent))" : "1px solid hsl(var(--border-bright))",
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.7 : 1,
        transition: "background-color 0.15s, border-color 0.15s",
      }}
      onClick={() => onSelectRow(rowIndex)}
    >
      {/* Drag dots */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
        <div className="w-0.5 h-0.5 rounded-full bg-text-dim" />
        <div className="w-0.5 h-0.5 rounded-full bg-text-dim" />
        <div className="w-0.5 h-0.5 rounded-full bg-text-dim" />
      </div>

      <span
        className="font-mono text-[11px] font-semibold pointer-events-none transition-colors"
        style={{ color: isSelected || isDragOver ? "hsl(var(--accent))" : "hsl(var(--text-dim))" }}
      >
        {rowIndex}
      </span>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onMouseDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      >
        <div className="h-px w-3 bg-accent opacity-70" />
      </div>
    </div>
  );
});

export default RowHeader;