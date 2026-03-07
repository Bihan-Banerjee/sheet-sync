"use client";
import ExportMenu from "@/components/editor/ExportMenu";
import { memo, useCallback } from "react";
import type { CellFormat, CellId } from "@/types";

interface FormattingToolbarProps {
  activeCellId: CellId | null;
  format: CellFormat;
  onFormat: (cellId: CellId, format: Partial<CellFormat>) => void;
}

const TEXT_COLORS = [
  "#F1F1F5", "#EF4444", "#F59E0B", "#22C55E",
  "#22D3EE", "#6366F1", "#EC4899", "#8B5CF6",
] as const;

const BG_COLORS = [
  "transparent", "#EF444420", "#F59E0B20", "#22C55E20",
  "#22D3EE20", "#6366F120", "#EC489920", "#8B5CF620",
] as const;

const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24] as const;

const FormattingToolbar = memo(function FormattingToolbar({
  activeCellId,
  format,
  onFormat,
}: FormattingToolbarProps) {
  const apply = useCallback(
    (patch: Partial<CellFormat>) => {
      if (!activeCellId) return;
      onFormat(activeCellId, patch);
    },
    [activeCellId, onFormat]
  );

  const disabled = !activeCellId;

  return (

    <div className="flex items-center gap-1 px-3 h-9 border-b border-border bg-surface flex-shrink-0 overflow-x-auto">
      {/* Bold */}
      <ToolButton
        active={!!format.bold}
        disabled={disabled}
        title="Bold (Ctrl+B)"
        onClick={() => apply({ bold: !format.bold })}
      >
        <span className="font-bold text-sm leading-none">B</span>
      </ToolButton>

      {/* Italic */}
      <ToolButton
        active={!!format.italic}
        disabled={disabled}
        title="Italic (Ctrl+I)"
        onClick={() => apply({ italic: !format.italic })}
      >
        <span className="italic text-sm leading-none">I</span>
      </ToolButton>

      <Divider />

      {/* Align left */}
      <ToolButton
        active={!format.align || format.align === "left"}
        disabled={disabled}
        title="Align left"
        onClick={() => apply({ align: "left" })}
      >
        <AlignLeftIcon />
      </ToolButton>

      {/* Align center */}
      <ToolButton
        active={format.align === "center"}
        disabled={disabled}
        title="Align center"
        onClick={() => apply({ align: "center" })}
      >
        <AlignCenterIcon />
      </ToolButton>

      {/* Align right */}
      <ToolButton
        active={format.align === "right"}
        disabled={disabled}
        title="Align right"
        onClick={() => apply({ align: "right" })}
      >
        <AlignRightIcon />
      </ToolButton>

      <Divider />

      {/* Font size */}
      <select
        disabled={disabled}
        value={format.fontSize ?? 13}
        onChange={(e) => apply({ fontSize: Number(e.target.value) })}
        className="h-6 px-1 rounded text-xs font-mono bg-surface-2 border border-border text-text-secondary hover:border-border-bright disabled:opacity-40 disabled:cursor-not-allowed outline-none focus:border-accent transition-colors"
        title="Font size"
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <Divider />

      {/* Text color */}
      <div className="flex items-center gap-0.5" title="Text color">
        <span className="text-[10px] text-text-dim font-mono mr-0.5">A</span>
        {TEXT_COLORS.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            isActive={format.textColor === color}
            disabled={disabled}
            onClick={() => apply({ textColor: color })}
            border
          />
        ))}
      </div>

      <Divider />

      {/* Background color */}
      <div className="flex items-center gap-0.5" title="Background color">
        <span className="text-[10px] text-text-dim font-mono mr-0.5">bg</span>
        {BG_COLORS.map((color) => (
          <ColorSwatch
            key={color}
            color={color === "transparent" ? "#1A1A24" : color}
            isActive={
              color === "transparent"
                ? !format.bgColor
                : format.bgColor === color
            }
            disabled={disabled}
            onClick={() =>
              apply({ bgColor: color === "transparent" ? undefined : color })
            }
          />
        ))}
      </div>

      <Divider />

      {/* Clear formatting */}
      <ToolButton
        active={false}
        disabled={disabled}
        title="Clear formatting"
        onClick={() =>
          apply({
            bold: false,
            italic: false,
            textColor: undefined,
            bgColor: undefined,
            fontSize: 13,
            align: "left",
          })
        }
      >
        <ClearIcon />
      </ToolButton>
    </div>
  );
});

export default FormattingToolbar;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-100 flex-shrink-0
        disabled:opacity-40 disabled:cursor-not-allowed
        ${
          active
            ? "bg-accent text-white"
            : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
        }`}
    >
      {children}
    </button>
  );
}

function ColorSwatch({
  color,
  isActive,
  disabled,
  onClick,
  border = false,
}: {
  color: string;
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
  border?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-4 h-4 rounded-sm flex-shrink-0 transition-all duration-100
        disabled:opacity-40 disabled:cursor-not-allowed
        ${isActive ? "ring-2 ring-offset-1 ring-offset-surface ring-accent scale-110" : "hover:scale-110"}`}
      style={{
        backgroundColor: color,
        border: border ? "1px solid #2A2A3A" : undefined,
      }}
    />
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border flex-shrink-0 mx-1" />;
}

function AlignLeftIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="8" x2="10" y2="8" />
      <line x1="2" y1="12" x2="12" y2="12" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="4" y1="8" x2="12" y2="8" />
      <line x1="3" y1="12" x2="13" y2="12" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="6" y1="8" x2="14" y2="8" />
      <line x1="4" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" d="M3 13L13 3M6 13h7M3 3l10 10" />
    </svg>
  );
}