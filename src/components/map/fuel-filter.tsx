"use client";

import { STANDARD_FUEL_TYPES } from "@/lib/data/fuel-types";
import { useAppHaptics } from "@/components/haptics-provider";
import type { FuelTypeId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Zap, Atom } from "lucide-react";
import { motion } from "motion/react";
import { softSpring } from "@/lib/motion";

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
  const haptics = useAppHaptics();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {STANDARD_FUEL_TYPES.map((fuel) => (
        <motion.button
          key={fuel.id}
          onClick={() => {
            if (selectedFuel === fuel.id) return;
            haptics.toggleChange(true);
            onFuelChange(fuel.id);
          }}
          aria-label={`Filter by ${fuel.label}`}
          aria-pressed={selectedFuel === fuel.id}
          tabIndex={0}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={softSpring}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all",
            selectedFuel === fuel.id
              ? "bg-zinc-950 text-white shadow-lg ring-1 ring-zinc-800"
              : "bg-black/40 text-zinc-300 ring-1 ring-white/10 backdrop-blur-md"
          )}
        >
          {fuel.shortLabel}
        </motion.button>
      ))}

      <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />

      <motion.button
        onClick={() => {
          const nextValue = !showEv;
          haptics.toggleChange(nextValue);
          onEvChange(nextValue);
        }}
        aria-label="Toggle EV charging stations"
        aria-pressed={showEv}
        tabIndex={0}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.96 }}
        transition={softSpring}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all ring-1 backdrop-blur-md",
          showEv
            ? "bg-green-500 text-white ring-green-600 shadow-lg"
            : "bg-black/40 text-zinc-300 ring-white/10"
        )}
      >
        <Zap className="h-3 w-3" />
        EV
      </motion.button>

      <motion.button
        onClick={() => {
          const nextValue = !showHydrogen;
          haptics.toggleChange(nextValue);
          onHydrogenChange(nextValue);
        }}
        aria-label="Toggle hydrogen stations"
        aria-pressed={showHydrogen}
        tabIndex={0}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.96 }}
        transition={softSpring}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all ring-1 backdrop-blur-md",
          showHydrogen
            ? "bg-blue-500 text-white ring-blue-600 shadow-lg"
            : "bg-black/40 text-zinc-300 ring-white/10"
        )}
      >
        <Atom className="h-3 w-3" />
        H₂
      </motion.button>
    </div>
  );
};
