"use client";

import { useRef, useCallback, memo } from "react";
import { GRID_CONSTANTS } from "@/types";

interface ColumnHeaderProps {
  letter: string;
  width: number;
  isSelected: boolean;
  onResize: (letter: string, newWidth: number) => void;
  onSelectColumn: (letter: string) => void;
}

const ColumnHeader = memo(function ColumnHeader({
  letter,
  width,
  isSelected,
  onResize,
  onSelectColumn,
}: ColumnHeaderProps) {
  const dragStartX = useRef<number | null>(null);
  const dragStartWidth = useRef<number>(width);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (dragStartX.current === null) return;
        const delta = moveEvent.clientX - dragStartX.current;
        const newWidth = Math.max(
          40,
          Math.min(400, dragStartWidth.current + delta)
        );
        onResize(letter, newWidth);
      };

      const onMouseUp = () => {
        dragStartX.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [letter, width, onResize]
  );

  return (
    <div
      className="relative flex items-center justify-center select-none cursor-pointer group"
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        height: GRID_CONSTANTS.HEADER_ROW_HEIGHT,
        backgroundColor: isSelected ? "#6366F118" : "#111118",
        borderRight: "1px solid #2A2A3A",
        borderBottom: "1px solid #2A2A3A",
        flexShrink: 0,
      }}
      onClick={() => onSelectColumn(letter)}
    >
      <span
        className="font-mono text-[11px] font-medium"
        style={{ color: isSelected ? "#6366F1" : "#8B8BA7" }}
      >
        {letter}
      </span>

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-10"
        onMouseDown={handleDragStart}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-px h-3 bg-accent opacity-70" />
      </div>
    </div>
  );
});

export default ColumnHeader;