"use client";

import { memo } from "react";
import type { WriteState } from "@/types";

interface SyncIndicatorProps {
  state: WriteState;
}

const SYNC_CONFIG = {
  idle: {
    label: "All saved",
    dotClass: "bg-success",
    textClass: "text-text-dim",
    animate: false,
  },
  saving: {
    label: "Saving…",
    dotClass: "bg-warning animate-breath",
    textClass: "text-warning",
    animate: true,
  },
  saved: {
    label: "Saved",
    dotClass: "bg-success",
    textClass: "text-success",
    animate: false,
  },
  error: {
    label: "Save failed",
    dotClass: "bg-error animate-pulse",
    textClass: "text-error",
    animate: true,
  },
} as const satisfies Record<WriteState, {
  label: string;
  dotClass: string;
  textClass: string;
  animate: boolean;
}>;

const SyncIndicator = memo(function SyncIndicator({
  state,
}: SyncIndicatorProps) {
  const config = SYNC_CONFIG[state];

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-mono transition-all duration-300 ${config.textClass}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${config.dotClass}`}
      />
      <span className="hidden sm:block">{config.label}</span>
    </div>
  );
});

export default SyncIndicator;