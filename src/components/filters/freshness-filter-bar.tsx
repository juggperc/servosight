"use client";

import type { FreshnessFilterId } from "@/lib/types";
import { useAppHaptics } from "@/components/haptics-provider";
import { FRESHNESS_OPTIONS } from "@/lib/freshness";
import { cn } from "@/lib/utils";

type FreshnessFilterBarProps = {
  value: FreshnessFilterId;
  onChange: (value: FreshnessFilterId) => void;
  className?: string;
};

export const FreshnessFilterBar = ({
  value,
  onChange,
  className,
}: FreshnessFilterBarProps) => {
  const haptics = useAppHaptics();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Freshness
      </span>
      {FRESHNESS_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => {
            if (value === option.id) return;
            haptics.toggleChange(true);
            onChange(option.id);
          }}
          aria-label={`Show ${option.label} updates`}
          aria-pressed={value === option.id}
          tabIndex={0}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-all ring-1",
            value === option.id
              ? "bg-zinc-950 text-white shadow-lg ring-zinc-800"
              : "bg-black/30 text-zinc-300 ring-white/10 backdrop-blur-md hover:bg-black/40"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
