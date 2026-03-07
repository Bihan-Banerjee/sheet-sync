"use client";

import { useRef, useCallback, memo } from "react";
import { GRID_CONSTANTS } from "@/types";

interface RowHeaderProps {
  rowIndex: number;
  height: number;
  isSelected: boolean;
  onResize: (row: number, newHeight: number) => void;
  onSelectRow: (row: number) => void;
}

const RowHeader = memo(function RowHeader({
  rowIndex,
  height,
  isSelected,
  onResize,
  onSelectRow,
}: RowHeaderProps) {
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(height);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragStartY.current = e.clientY;
      dragStartHeight.current = height;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (dragStartY.current === null) return;
        const delta = moveEvent.clientY - dragStartY.current;
        const newHeight = Math.max(
          18,
          Math.min(200, dragStartHeight.current + delta)
        );
        onResize(rowIndex, newHeight);
      };

      const onMouseUp = () => {
        dragStartY.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [rowIndex, height, onResize]
  );

  return (
    <div
      className="relative flex items-center justify-center select-none cursor-pointer group flex-shrink-0"
      style={{
        width: GRID_CONSTANTS.HEADER_COL_WIDTH,
        minWidth: GRID_CONSTANTS.HEADER_COL_WIDTH,
        height,
        backgroundColor: isSelected ? "#6366F118" : "#111118",
        borderRight: "1px solid #2A2A3A",
        borderBottom: "1px solid #2A2A3A",
      }}
      onClick={() => onSelectRow(rowIndex)}
    >
      <span
        className="font-mono text-[11px]"
        style={{ color: isSelected ? "#6366F1" : "#8B8BA7" }}
      >
        {rowIndex}
      </span>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onMouseDown={handleDragStart}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-px w-3 bg-accent opacity-70" />
      </div>
    </div>
  );
});

export default RowHeader;