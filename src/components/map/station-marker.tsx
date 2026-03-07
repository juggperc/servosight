"use client";

import { useEffect, useMemo, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
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

export const StationMarker = ({
  station,
  selectedFuel,
  cheapThreshold,
  expensiveThreshold,
  onSelect,
  priceAlert,
  onSaveAlert,
  onRemoveAlert,
}: StationMarkerProps) => {
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
    if (Number.isNaN(parsed) || parsed <= 0) return;
    onSaveAlert?.(station, selectedFuel, Math.round(parsed * 10));
  };

  return (
    <Marker
      position={[station.lat, station.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect?.(station),
      }}
    >
      <Popup>
        <div className="min-w-[230px] p-4">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <p className="text-sm font-semibold tracking-tight text-foreground">{station.name}</p>
          </div>
          <p className="ml-4 mt-0.5 text-[11px] text-muted-foreground">
            {station.address}, {station.suburb}
          </p>

          <div className="mt-3 flex items-end gap-2">
            <span
              className="font-price text-[26px] font-extrabold leading-none"
              style={{ color: accentColor }}
            >
              {formatPriceCents(priceData.price)}
            </span>
            <span className="pb-0.5 text-[11px] text-muted-foreground">{fuelInfo.label}/L</span>
          </div>

          <div className="mt-1 text-[10px] text-muted-foreground">
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

          <div className="mt-4 rounded-2xl border border-border/50 bg-background/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {priceAlert ? (
                  <BellRing className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <BellPlus className="h-3.5 w-3.5 text-blue-500" />
                )}
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Price alert
                </p>
              </div>
              {priceAlert && onRemoveAlert ? (
                <button
                  onClick={() => onRemoveAlert(priceAlert.id)}
                  aria-label="Remove price alert"
                  tabIndex={0}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                value={alertValue}
                onChange={(event) => setAlertValue(event.target.value)}
                type="number"
                step="0.1"
                min="0"
                aria-label="Alert threshold in cents per litre"
                className="h-9 w-full rounded-xl border border-border/60 bg-background px-3 text-sm outline-none transition-colors focus:border-blue-500"
              />
              <button
                onClick={handleSaveAlert}
                aria-label="Save price alert"
                tabIndex={0}
                className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
              >
                {priceAlert ? "Update" : "Set"}
              </button>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Alert me when this station drops to {alertValue || "0.0"}c/L or less.
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
