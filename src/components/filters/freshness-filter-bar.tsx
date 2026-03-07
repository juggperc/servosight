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
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            value === option.id
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "glass-pill text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
