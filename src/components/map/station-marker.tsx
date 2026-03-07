"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { StationWithPrices, FuelTypeId } from "@/lib/types";
import { formatPriceCents, timeAgo } from "@/lib/utils";
import { getFuelType } from "@/lib/data/fuel-types";

type StationMarkerProps = {
  station: StationWithPrices;
  selectedFuel: FuelTypeId;
  cheapThreshold: number;
  expensiveThreshold: number;
  onSelect?: (station: StationWithPrices) => void;
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
}: StationMarkerProps) => {
  const priceData = station.prices[selectedFuel];
  if (!priceData) return null;

  const tier = getPriceTier(priceData.price, cheapThreshold, expensiveThreshold);
  const fuelInfo = getFuelType(selectedFuel);
  const accentColor = tierColors[tier] ?? "#888";

  const icon = L.divIcon({
    className: "price-marker",
    html: `<div class="price-badge price-badge-${tier}">${formatPriceCents(priceData.price)}</div>`,
    iconSize: [64, 30],
    iconAnchor: [32, 15],
  });

  const evBadge = station.hasEv
    ? `<span style="display:inline-flex;align-items:center;gap:2px;background:rgba(34,197,94,0.12);color:#16a34a;font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;">&#9889; EV</span>`
    : "";
  const h2Badge = station.hasHydrogen
    ? `<span style="display:inline-flex;align-items:center;gap:2px;background:rgba(59,130,246,0.12);color:#2563eb;font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;">H&#8322;</span>`
    : "";
  const altBadges = evBadge || h2Badge
    ? `<div style="display:flex;gap:4px;margin-top:8px;">${evBadge}${h2Badge}</div>`
    : "";

  const popupHtml = `
    <div style="padding:14px 16px 12px;min-width:200px;font-family:inherit;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${accentColor};flex-shrink:0;"></div>
        <span style="font-size:14px;font-weight:700;letter-spacing:-0.01em;">${station.name}</span>
      </div>
      <div style="font-size:11px;opacity:0.55;margin-left:16px;">${station.address}, ${station.suburb}</div>
      <div style="margin-top:12px;display:flex;align-items:baseline;gap:6px;">
        <span style="font-size:26px;font-weight:800;letter-spacing:0.04em;font-family:var(--font-geist-pixel-square),var(--font-geist-mono),monospace;color:${accentColor};">${formatPriceCents(priceData.price)}</span>
        <span style="font-size:11px;opacity:0.5;">${fuelInfo.label}/L</span>
      </div>
      <div style="margin-top:6px;font-size:10px;opacity:0.45;">Updated ${timeAgo(priceData.reportedAt)}</div>
      ${altBadges}
    </div>
  `;

  return (
    <Marker
      position={[station.lat, station.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect?.(station),
      }}
    >
      <Popup>
        <div dangerouslySetInnerHTML={{ __html: popupHtml }} />
      </Popup>
    </Marker>
  );
};
