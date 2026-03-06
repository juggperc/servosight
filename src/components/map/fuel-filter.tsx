"use client";

import { STANDARD_FUEL_TYPES } from "@/lib/data/fuel-types";
import type { FuelTypeId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Zap, Atom } from "lucide-react";

type FuelFilterProps = {
  selectedFuel: FuelTypeId;
  onFuelChange: (fuel: FuelTypeId) => void;
  showHydrogen: boolean;
  onHydrogenChange: (show: boolean) => void;
  showEv: boolean;
  onEvChange: (show: boolean) => void;
};

export const FuelFilter = ({
  selectedFuel,
  onFuelChange,
  showHydrogen,
  onHydrogenChange,
  showEv,
  onEvChange,
}: FuelFilterProps) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2 overflow-x-auto pb-1 md:left-auto md:right-4 md:max-w-md">
      {STANDARD_FUEL_TYPES.map((fuel) => (
        <button
          key={fuel.id}
          onClick={() => onFuelChange(fuel.id)}
          aria-label={`Filter by ${fuel.label}`}
          aria-pressed={selectedFuel === fuel.id}
          tabIndex={0}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-all active:scale-95",
            selectedFuel === fuel.id
              ? "bg-foreground text-background"
              : "bg-background/90 text-foreground backdrop-blur-sm ring-1 ring-border"
          )}
        >
          {fuel.shortLabel}
        </button>
      ))}

      <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />

      <button
        onClick={() => onEvChange(!showEv)}
        aria-label="Toggle EV charging stations"
        aria-pressed={showEv}
        tabIndex={0}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-all active:scale-95",
          showEv
            ? "bg-green-500 text-white"
            : "bg-background/90 text-foreground backdrop-blur-sm ring-1 ring-border"
        )}
      >
        <Zap className="h-3 w-3" />
        EV
      </button>

      <button
        onClick={() => onHydrogenChange(!showHydrogen)}
        aria-label="Toggle hydrogen stations"
        aria-pressed={showHydrogen}
        tabIndex={0}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md transition-all active:scale-95",
          showHydrogen
            ? "bg-blue-500 text-white"
            : "bg-background/90 text-foreground backdrop-blur-sm ring-1 ring-border"
        )}
      >
        <Atom className="h-3 w-3" />
        H₂
      </button>
    </div>
  );
};
