"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useAppHaptics } from "@/components/haptics-provider";
import type { StationWithPrices, FuelTypeId, PriceAlert } from "@/lib/types";
import { formatPriceCents, timeAgo } from "@/lib/utils";
import { getFuelType } from "@/lib/data/fuel-types";
import { BellPlus, BellRing, X } from "lucide-react";

type StationMarkerProps = {
  station: StationWithPrices;
  selectedFuel: FuelTypeId;
  cheapThreshold: number;
  expensiveThreshold: number;
  onSelect?: (station: StationWithPrices) => void;
  priceAlert?: PriceAlert;
  onSaveAlert?: (station: StationWithPrices, fuelType: FuelTypeId, threshold: number) => void;
  onRemoveAlert?: (alertId: string) => void;
  compactPopup?: boolean;
};

const getPriceTier = (price: number, cheap: number, expensive: number): string => {
  if (price <= cheap) return "cheap";
  if (price >= expensive) return "expensive";
  return "mid";
};

const tierColors: Record<string, string> = {
  cheap: "#16a34a",
  mid: "#d97706",
  expensive: "#dc2626",
};

export const StationMarker = memo(({
  station,
  selectedFuel,
  cheapThreshold,
  expensiveThreshold,
  onSelect,
  priceAlert,
  onSaveAlert,
  onRemoveAlert,
  compactPopup = false,
}: StationMarkerProps) => {
  const haptics = useAppHaptics();
  const priceData = station.prices[selectedFuel];
  if (!priceData) return null;

  const tier = getPriceTier(priceData.price, cheapThreshold, expensiveThreshold);
  const fuelInfo = getFuelType(selectedFuel);
  const accentColor = tierColors[tier] ?? "#888";
  const defaultAlertValue = useMemo(
    () => ((priceAlert?.threshold ?? Math.max(priceData.price - 50, 1)) / 10).toFixed(1),
    [priceAlert?.threshold, priceData.price]
  );
  const [alertValue, setAlertValue] = useState(defaultAlertValue);

  useEffect(() => {
    setAlertValue(defaultAlertValue);
  }, [defaultAlertValue]);

  const icon = L.divIcon({
    className: "price-marker",
    html: `<div class="price-badge price-badge-${tier}">${formatPriceCents(priceData.price)}</div>`,
    iconSize: [64, 30],
    iconAnchor: [32, 15],
  });

  const handleSaveAlert = () => {
    const parsed = Number.parseFloat(alertValue);
    if (Number.isNaN(parsed) || parsed <= 0) {
      haptics.warning();
      return;
    }
    haptics.success();
    onSaveAlert?.(station, selectedFuel, Math.round(parsed * 10));
  };

  return (
    <Marker
      position={[station.lat, station.lng]}
      icon={icon}
      eventHandlers={{
        click: () => {
          haptics.stationSelect();
          onSelect?.(station);
        },
      }}
    >
      <Popup>
        <div className={compactPopup ? "min-w-[210px] max-w-[260px] p-3" : "min-w-[230px] max-w-[280px] p-4"}>
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <p className="text-sm font-semibold leading-tight tracking-tight text-foreground">
              {station.name}
            </p>
          </div>
          <p className="ml-4 mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {station.address}, {station.suburb}
          </p>

          <div className="mt-3 flex items-end gap-2">
            <span
              className="font-price text-[26px] font-extrabold leading-none"
              style={{ color: accentColor }}
            >
              {formatPriceCents(priceData.price)}
            </span>
            <span className="pb-0.5 text-[11px] font-medium text-muted-foreground">
              {fuelInfo.label}/L
            </span>
          </div>

          <div className="mt-1 text-[10px] font-medium text-muted-foreground">
            Updated {timeAgo(priceData.reportedAt)}
          </div>

          {(station.hasEv || station.hasHydrogen) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {station.hasEv && (
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                  EV
                </span>
              )}
              {station.hasHydrogen && (
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  H₂
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-1.5 rounded-[18px] bg-zinc-950/80 p-1.5 ring-1 ring-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between px-1.5 pt-0.5">
              <div className="flex items-center gap-1.5">
                {priceAlert ? (
                  <BellRing className="h-[13px] w-[13px] text-blue-400" />
                ) : (
                  <BellPlus className="h-[13px] w-[13px] text-zinc-400" />
                )}
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                  Price Alert
                </span>
              </div>
              {priceAlert && onRemoveAlert && (
                <button
                  onClick={() => {
                    haptics.dismiss();
                    onRemoveAlert(priceAlert.id);
                  }}
                  aria-label="Remove price alert"
                  className="rounded-full bg-white/10 p-0.5 text-zinc-400 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  value={alertValue}
                  onChange={(event) => setAlertValue(event.target.value)}
                  type="number"
                  step="0.1"
                  min="0"
                  aria-label="Alert threshold in cents per litre"
                  className="h-7 w-full rounded-[12px] bg-white/5 pl-2 pr-6 text-[11px] font-medium text-white outline-none ring-1 ring-white/10 transition-colors focus:ring-blue-500/50"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500">
                  c/L
                </span>
              </div>
              <button
                onClick={handleSaveAlert}
                aria-label="Save price alert"
                className="flex h-7 items-center justify-center rounded-[12px] bg-blue-500/20 px-3 text-[10px] font-bold text-blue-400 transition-colors hover:bg-blue-500/30"
              >
                {priceAlert ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}, (prev, next) => {
  return prev.station.id === next.station.id &&
    prev.selectedFuel === next.selectedFuel &&
    prev.cheapThreshold === next.cheapThreshold &&
    prev.compactPopup === next.compactPopup;
});

StationMarker.displayName = "StationMarker";
