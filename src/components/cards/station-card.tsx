"use client";

import type { StationWithPrices, FuelTypeId } from "@/lib/types";
import { formatPriceCents, timeAgo } from "@/lib/utils";
import { getFuelType } from "@/lib/data/fuel-types";
import { MapPin, Clock, Zap, Atom } from "lucide-react";

type StationCardProps = {
  station: StationWithPrices;
  fuelType: FuelTypeId;
  showDistance?: boolean;
  index?: number;
};

export const StationCard = ({ station, fuelType, showDistance, index = 0 }: StationCardProps) => {
  const priceData = station.prices[fuelType];
  const fuelInfo = getFuelType(fuelType);

  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:border-border active:scale-[0.98]"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-card-foreground">{station.name}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 opacity-60" />
            <span className="truncate">{station.suburb}, {station.state}</span>
          </div>
        </div>
        {priceData && (
          <div className="ml-3 text-right">
            <p className="text-xl font-extrabold tabular-nums tracking-tighter text-card-foreground">
              {formatPriceCents(priceData.price)}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground">{fuelInfo.shortLabel}/L</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-border/40 pt-2.5">
        {priceData && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 opacity-50" />
            <span>{timeAgo(priceData.reportedAt)}</span>
          </div>
        )}
        {showDistance && station.distance !== undefined && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 opacity-50" />
            <span>{station.distance.toFixed(1)} km</span>
          </div>
        )}
        <div className="flex-1" />
        {station.hasEv && (
          <span className="flex items-center gap-0.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
            <Zap className="h-2.5 w-2.5" /> EV
          </span>
        )}
        {station.hasHydrogen && (
          <span className="flex items-center gap-0.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            <Atom className="h-2.5 w-2.5" /> H₂
          </span>
        )}
      </div>
    </div>
  );
};
