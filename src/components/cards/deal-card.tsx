"use client";

import type { StationWithPrices, FuelTypeId } from "@/lib/types";
import { formatPriceCents } from "@/lib/utils";
import { getFuelType } from "@/lib/data/fuel-types";
import { MapPin, TrendingDown, Trophy } from "lucide-react";

type DealCardProps = {
  station: StationWithPrices;
  fuelType: FuelTypeId;
  rank: number;
  averagePrice: number;
  index?: number;
};

export const DealCard = ({ station, fuelType, rank, averagePrice, index = 0 }: DealCardProps) => {
  const priceData = station.prices[fuelType];
  if (!priceData) return null;

  const fuelInfo = getFuelType(fuelType);
  const saving = averagePrice - priceData.price;
  const savingPerLitre = saving / 10;
  const isTopDeal = rank === 1;

  return (
    <div
      className={`animate-fade-in-up relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
        isTopDeal ? "border-green-500/30 ring-1 ring-green-500/10" : "border-border/60"
      }`}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
    >
      {rank <= 3 && (
        <div className={`absolute top-0 right-0 flex items-center gap-1 rounded-bl-xl px-3 py-1.5 ${
          isTopDeal ? "bg-green-500 text-white" : "bg-foreground text-background"
        }`}>
          {isTopDeal && <Trophy className="h-3 w-3" />}
          <span className="text-[11px] font-bold">#{rank}</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          isTopDeal ? "bg-green-500/15" : "bg-green-500/10"
        }`}>
          <TrendingDown className={`h-5 w-5 ${isTopDeal ? "text-green-500" : "text-green-600"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-card-foreground">{station.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 opacity-50" />
            <span className="truncate">{station.suburb}, {station.state}</span>
            {station.distance !== undefined && (
              <span className="opacity-60">· {station.distance.toFixed(1)} km</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between border-t border-border/40 pt-3">
        <div>
          <p className="text-2xl font-extrabold tabular-nums tracking-tighter text-card-foreground">
            {formatPriceCents(priceData.price)}
          </p>
          <p className="text-[11px] text-muted-foreground">{fuelInfo.label}</p>
        </div>
        {saving > 0 && (
          <div className={`rounded-full px-3 py-1.5 ${isTopDeal ? "bg-green-500/15" : "bg-green-500/10"}`}>
            <p className={`text-xs font-bold ${isTopDeal ? "text-green-500" : "text-green-600 dark:text-green-400"}`}>
              Save {savingPerLitre.toFixed(1)}¢/L
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
