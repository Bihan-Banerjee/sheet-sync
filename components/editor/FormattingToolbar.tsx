"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import type { CellFormat, CellId } from "@/types";

interface FormattingToolbarProps {
  activeCellId: CellId | null;
  format: CellFormat;
  onFormat: (cellId: CellId, format: Partial<CellFormat>) => void;
}

const TEXT_COLORS = [
  { color: "#F1F1F5", label: "White" },
  { color: "#0A0A0F", label: "Black" },
  { color: "#EF4444", label: "Red" },
  { color: "#F97316", label: "Orange" },
  { color: "#F59E0B", label: "Amber" },
  { color: "#22C55E", label: "Green" },
  { color: "#22D3EE", label: "Cyan" },
  { color: "#3B82F6", label: "Blue" },
  { color: "#6366F1", label: "Indigo" },
  { color: "#8B5CF6", label: "Violet" },
  { color: "#EC4899", label: "Pink" },
  { color: "#8B8BA7", label: "Gray" },
] as const;

const BG_COLORS = [
  { color: "transparent", label: "None" },
  { color: "#EF444425", label: "Red" },
  { color: "#F97316255", label: "Orange" },
  { color: "#F59E0B25", label: "Amber" },
  { color: "#22C55E25", label: "Green" },
  { color: "#22D3EE25", label: "Cyan" },
  { color: "#3B82F625", label: "Blue" },
  { color: "#6366F125", label: "Indigo" },
  { color: "#8B5CF625", label: "Violet" },
  { color: "#EC489925", label: "Pink" },
  { color: "#FFFFFF08", label: "Light" },
  { color: "#1A1A2E", label: "Dark" },
] as const;

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36] as const;

// ─── Main component ───────────────────────────────────────────────────────────

const FormattingToolbar = memo(function FormattingToolbar({
  activeCellId,
  format = {},
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
    <div className="relative border-b border-border bg-surface flex-shrink-0 select-none">
    <div className="flex items-center gap-0.5 px-2 h-9 overflow-x-auto scrollbar-none">


      {/* ── Font size ──────────────────────────────────────────────────── */}
      <FontSizeControl
        value={format.fontSize ?? 13}
        disabled={disabled}
        onChange={(size) => apply({ fontSize: size })}
      />

      <ToolbarDivider />

      {/* ── Bold ──────────────────────────────────────────────────────── */}
      <ToolButton
        active={!!format.bold}
        disabled={disabled}
        title="Bold (Ctrl+B)"
        onClick={() => apply({ bold: !format.bold })}
      >
        <span className="font-bold text-[13px] leading-none font-mono">B</span>
      </ToolButton>

      {/* ── Italic ────────────────────────────────────────────────────── */}
      <ToolButton
        active={!!format.italic}
        disabled={disabled}
        title="Italic (Ctrl+I)"
        onClick={() => apply({ italic: !format.italic })}
      >
        <span className="italic text-[13px] leading-none font-serif">I</span>
      </ToolButton>

      {/* ── Strikethrough ─────────────────────────────────────────────── */}
      <ToolButton
        active={!!format.strikethrough}
        disabled={disabled}
        title="Strikethrough"
        onClick={() => apply({ strikethrough: !format.strikethrough })}
      >
        <StrikethroughIcon />
      </ToolButton>

      <ToolbarDivider />

      {/* ── Text color ────────────────────────────────────────────────── */}
      <ColorPickerButton
        label="A"
        labelStyle={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}
        activeColor={format.textColor ?? "#F1F1F5"}
        colors={TEXT_COLORS}
        disabled={disabled}
        title="Text color"
        onSelect={(color) => apply({ textColor: color === "#F1F1F5" ? undefined : color })}
        showUnderline
      />

      {/* ── Background color ──────────────────────────────────────────── */}
      <ColorPickerButton
        label="◻"
        labelStyle={{ fontSize: 11 }}
        activeColor={format.bgColor ?? "transparent"}
        colors={BG_COLORS}
        disabled={disabled}
        title="Fill color"
        onSelect={(color) => apply({ bgColor: color === "transparent" ? undefined : color })}
      />

      <ToolbarDivider />

      {/* ── Borders ───────────────────────────────────────────────────── */}
      <BorderMenu
        disabled={disabled}
        activeBorder={format.border}
        onSelect={(border) => apply({ border })}
      />

      <ToolbarDivider />

      {/* ── Alignment ─────────────────────────────────────────────────── */}
      <ToolButton
        active={!format.align || format.align === "left"}
        disabled={disabled}
        title="Align left"
        onClick={() => apply({ align: "left" })}
      >
        <AlignLeftIcon />
      </ToolButton>

      <ToolButton
        active={format.align === "center"}
        disabled={disabled}
        title="Align center"
        onClick={() => apply({ align: "center" })}
      >
        <AlignCenterIcon />
      </ToolButton>

      <ToolButton
        active={format.align === "right"}
        disabled={disabled}
        title="Align right"
        onClick={() => apply({ align: "right" })}
      >
        <AlignRightIcon />
      </ToolButton>

      <ToolbarDivider />

      {/* ── Wrap ──────────────────────────────────────────────────────── */}
      <ToolButton
        active={!!format.wrap}
        disabled={disabled}
        title="Wrap text"
        onClick={() => apply({ wrap: !format.wrap })}
      >
        <WrapIcon />
      </ToolButton>

      {/* ── Vertical align ────────────────────────────────────────────── */}
      <VerticalAlignMenu
        disabled={disabled}
        activeAlign={format.verticalAlign ?? "middle"}
        onSelect={(va) => apply({ verticalAlign: va })}
      />

      <ToolbarDivider />

      {/* ── Number format ─────────────────────────────────────────────── */}
      <NumberFormatMenu
        disabled={disabled}
        activeFormat={format.numberFormat}
        onSelect={(nf) => apply({ numberFormat: nf })}
      />

      <ToolbarDivider />

      {/* ── Clear formatting ──────────────────────────────────────────── */}
      <ToolButton
        active={false}
        disabled={disabled}
        title="Clear formatting"
        onClick={() =>
          apply({
            bold: false,
            italic: false,
            strikethrough: false,
            textColor: undefined,
            bgColor: undefined,
            fontSize: 13,
            align: "left",
            verticalAlign: "middle",
            wrap: false,
            border: undefined,
            numberFormat: undefined,
          })
        }
      >
        <ClearIcon />
      </ToolButton>
    </div>
    </div>
  );
});

export default FormattingToolbar;

// ─── Font size control ────────────────────────────────────────────────────────

function FontSizeControl({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= 6 && n <= 96) onChange(n);
    else setDraft(String(value));
  };

  return (
    <div className="flex items-center gap-0 flex-shrink-0">
      {/* Decrease */}
      <button
        disabled={disabled || value <= 6}
        onClick={() => onChange(Math.max(6, value - 1))}
        className="w-5 h-6 flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-surface-3 rounded-l transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Decrease font size"
      >
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2}>
          <line x1="2" y1="5" x2="8" y2="5" />
        </svg>
      </button>

      {/* Size input */}
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setEditing(false); setDraft(String(value)); }
          }}
          className="w-8 h-6 text-center text-xs font-mono bg-surface border border-accent text-text-primary outline-none"
        />
      ) : (
        <button
          disabled={disabled}
          onClick={() => setEditing(true)}
          className="w-8 h-6 text-center text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-surface-3 border-x border-border transition-colors disabled:opacity-40"
          title="Font size"
        >
          {value}
        </button>
      )}

      {/* Increase */}
      <button
        disabled={disabled || value >= 96}
        onClick={() => onChange(Math.min(96, value + 1))}
        className="w-5 h-6 flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-surface-3 rounded-r transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Increase font size"
      >
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2}>
          <line x1="5" y1="2" x2="5" y2="8" />
          <line x1="2" y1="5" x2="8" y2="5" />
        </svg>
      </button>
    </div>
  );
}

// ─── Color picker button ──────────────────────────────────────────────────────

function ColorPickerButton({
  label,
  labelStyle,
  activeColor,
  colors,
  disabled,
  title,
  onSelect,
  showUnderline = false,
}: {
  label: string;
  labelStyle?: React.CSSProperties;
  activeColor: string;
  colors: readonly { color: string; label: string }[];
  disabled: boolean;
  title: string;
  onSelect: (color: string) => void;
  showUnderline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <div className="flex items-center">
        {/* Color preview + label */}
        <button
          disabled={disabled}
          onClick={() => onSelect(activeColor)}
          title={title}
          className="flex flex-col items-center justify-center w-6 h-6 rounded-l hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span style={labelStyle} className="leading-none text-text-primary">
            {label}
          </span>
          {showUnderline && (
            <div
              className="w-3.5 h-0.5 rounded-full mt-0.5"
              style={{
                backgroundColor:
                  activeColor === "transparent" ? "#4A4A6A" : activeColor,
              }}
            />
          )}
        </button>

        {/* Dropdown arrow */}
        <button
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="w-3.5 h-6 flex items-center justify-center hover:bg-surface-3 rounded-r border-l border-border/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-2 h-2 text-text-dim" fill="currentColor" viewBox="0 0 8 8">
            <path d="M0 2l4 4 4-4z" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="absolute left-0 z-50 p-2 rounded-xl border border-border bg-surface shadow-glass"
          style={{ top: "calc(100% + 4px)",animation: "fadeUp 0.15s ease forwards", minWidth: 160 }}
        >
          <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest mb-2 px-1">
            {title}
          </div>
          <div className="grid grid-cols-6 gap-1">
            {colors.map(({ color, label: colorLabel }) => (
              <button
                key={color}
                title={colorLabel}
                onClick={() => { onSelect(color); setOpen(false); }}
                className={`w-5 h-5 rounded transition-all hover:scale-110 ${
                  activeColor === color
                    ? "ring-2 ring-accent ring-offset-1 ring-offset-surface scale-110"
                    : ""
                }`}
                style={{
                  backgroundColor:
                    color === "transparent" ? "transparent" : color,
                  border:
                    color === "transparent"
                      ? "2px dashed #2A2A3A"
                      : "1px solid rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Border menu ─────────────────────────────────────────────────────────────

type BorderStyle = CellFormat["border"];

const BORDER_OPTIONS: { value: BorderStyle; label: string; icon: React.ReactNode }[] = [
  {
    value: undefined,
    label: "No border",
    icon: <NoBorderIcon />,
  },
  {
    value: "all",
    label: "All borders",
    icon: <AllBordersIcon />,
  },
  {
    value: "outer",
    label: "Outer border",
    icon: <OuterBorderIcon />,
  },
  {
    value: "bottom",
    label: "Bottom border",
    icon: <BottomBorderIcon />,
  },
  {
    value: "top",
    label: "Top border",
    icon: <TopBorderIcon />,
  },
  {
    value: "left",
    label: "Left border",
    icon: <LeftBorderIcon />,
  },
  {
    value: "right",
    label: "Right border",
    icon: <RightBorderIcon />,
  },
];

function BorderMenu({
  disabled,
  activeBorder,
  onSelect,
}: {
  disabled: boolean;
  activeBorder: BorderStyle;
  onSelect: (b: BorderStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title="Borders"
        className={`flex items-center gap-0.5 px-1.5 h-6 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          open
            ? "bg-accent-dim text-accent"
            : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
        }`}
      >
        <AllBordersIcon />
        <svg className="w-2 h-2 text-text-dim" fill="currentColor" viewBox="0 0 8 8">
          <path d="M0 2l4 4 4-4z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 z-50 w-40 rounded-xl border border-border bg-surface shadow-glass overflow-hidden"
          style={{ top: "calc(100% + 4px)", animation: "fadeUp 0.15s ease forwards" }}
        >
          <div className="px-3 py-1.5 border-b border-border">
            <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
              Border style
            </span>
          </div>
          {BORDER_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                activeBorder === opt.value
                  ? "bg-accent-dim text-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <span className="w-4 flex-shrink-0">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vertical align menu ──────────────────────────────────────────────────────

type VerticalAlign = NonNullable<CellFormat["verticalAlign"]>;

function VerticalAlignMenu({
  disabled,
  activeAlign,
  onSelect,
}: {
  disabled: boolean;
  activeAlign: VerticalAlign;
  onSelect: (va: VerticalAlign) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const options: { value: VerticalAlign; label: string; icon: React.ReactNode }[] = [
    { value: "top", label: "Top", icon: <VAlignTopIcon /> },
    { value: "middle", label: "Middle", icon: <VAlignMiddleIcon /> },
    { value: "bottom", label: "Bottom", icon: <VAlignBottomIcon /> },
  ];

  const current = options.find((o) => o.value === activeAlign) ?? options[1]!;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title="Vertical alignment"
        className={`flex items-center gap-0.5 px-1.5 h-6 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          open
            ? "bg-accent-dim text-accent"
            : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
        }`}
      >
        {current.icon}
        <svg className="w-2 h-2 text-text-dim" fill="currentColor" viewBox="0 0 8 8">
          <path d="M0 2l4 4 4-4z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 z-50 w-36 rounded-xl border border-border bg-surface shadow-glass overflow-hidden"
          style={{ top: "calc(100% + 4px)", animation: "fadeUp 0.15s ease forwards" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                activeAlign === opt.value
                  ? "bg-accent-dim text-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <span className="w-4 flex-shrink-0">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Number format menu ───────────────────────────────────────────────────────

type NumberFormat = NonNullable<CellFormat["numberFormat"]>;

const NUMBER_FORMATS: { value: NumberFormat | undefined; label: string; preview: string }[] = [
  { value: undefined, label: "Automatic", preview: "1234.5" },
  { value: "number", label: "Number", preview: "1,234.50" },
  { value: "integer", label: "Integer", preview: "1,235" },
  { value: "percent", label: "Percent", preview: "12.35%" },
  { value: "currency", label: "Currency", preview: "$1,234.50" },
  { value: "scientific", label: "Scientific", preview: "1.23E+3" },
];

function NumberFormatMenu({
  disabled,
  activeFormat,
  onSelect,
}: {
  disabled: boolean;
  activeFormat: NumberFormat | undefined;
  onSelect: (nf: NumberFormat | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title="Number format"
        className={`flex items-center gap-1 px-2 h-6 rounded text-xs font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          open
            ? "bg-accent-dim text-accent"
            : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
        }`}
      >
        <span>123</span>
        <svg className="w-2 h-2 text-text-dim" fill="currentColor" viewBox="0 0 8 8">
          <path d="M0 2l4 4 4-4z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 z-50 w-48 rounded-xl border border-border bg-surface shadow-glass overflow-hidden"
          style={{ top: "calc(100% + 4px)", animation: "fadeUp 0.15s ease forwards" }}
        >
          <div className="px-3 py-1.5 border-b border-border">
            <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
              Number format
            </span>
          </div>
          {NUMBER_FORMATS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                activeFormat === opt.value
                  ? "bg-accent-dim text-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              <span>{opt.label}</span>
              <span className="font-mono text-text-dim text-[10px]">
                {opt.preview}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared ToolButton ────────────────────────────────────────────────────────

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
            ? "bg-accent/20 text-accent ring-1 ring-accent/40"
            : "text-text-secondary hover:bg-surface-3 hover:text-text-primary"
        }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-border flex-shrink-0 mx-1" />;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function StrikethroughIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
      <line x1="2" y1="8" x2="14" y2="8" />
      <path strokeLinecap="round" d="M5 5.5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2s-.9 2-2 2H7c-1.1 0-2 .9-2 2s.9 2 2 2h2c1.1 0 2-.9 2-2" />
    </svg>
  );
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

function WrapIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
      <line x1="2" y1="4" x2="14" y2="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h8a2 2 0 010 4H6m0 0l2-2m-2 2l2 2" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" d="M4 12l8-8M4 4l8 8" />
    </svg>
  );
}

function NoBorderIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  );
}

function AllBordersIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1" y="1" width="10" height="10" />
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  );
}

function OuterBorderIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="10" height="10" />
    </svg>
  );
}

function BottomBorderIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="1" y1="11" x2="11" y2="11" />
    </svg>
  );
}

function TopBorderIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="1" y1="1" x2="11" y2="1" />
    </svg>
  );
}

function LeftBorderIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="1" y1="1" x2="1" y2="11" />
    </svg>
  );
}

function RightBorderIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="11" y1="1" x2="11" y2="11" />
    </svg>
  );
}

function VAlignTopIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="1" y1="1" x2="11" y2="1" />
      <line x1="4" y1="4" x2="4" y2="11" />
      <line x1="8" y1="4" x2="8" y2="11" />
      <line x1="4" y1="4" x2="8" y2="4" />
    </svg>
  );
}

function VAlignMiddleIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="1" y1="6" x2="11" y2="6" />
      <line x1="4" y1="2" x2="4" y2="10" />
      <line x1="8" y1="2" x2="8" y2="10" />
    </svg>
  );
}

function VAlignBottomIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="1" y1="11" x2="11" y2="11" />
      <line x1="4" y1="1" x2="4" y2="8" />
      <line x1="8" y1="1" x2="8" y2="8" />
      <line x1="4" y1="8" x2="8" y2="8" />
    </svg>
  );
}