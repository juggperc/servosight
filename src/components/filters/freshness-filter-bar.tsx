"use client";

import type { FreshnessFilterId } from "@/lib/types";
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
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Freshness
      </span>
      {FRESHNESS_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          aria-label={`Show ${option.label} updates`}
          aria-pressed={value === option.id}
          tabIndex={0}
          className={cn(
            "glass-pill rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            value === option.id
              ? "bg-foreground text-background dark:bg-white dark:text-black"
              : "text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
