import type { FreshnessFilterId, FuelTypeId, StationWithPrices } from "@/lib/types";

export const FRESHNESS_OPTIONS: Array<{ id: FreshnessFilterId; label: string }> = [
  { id: "any", label: "Any" },
  { id: "6h", label: "6h" },
  { id: "today", label: "Today" },
];

const isSameLocalDay = (left: Date, right: Date): boolean => {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

export const isFreshEnough = (reportedAt: string, freshness: FreshnessFilterId): boolean => {
  if (freshness === "any") return true;

  const reportedDate = new Date(reportedAt);
  const now = new Date();

  if (Number.isNaN(reportedDate.getTime())) {
    return false;
  }

  if (freshness === "6h") {
    return now.getTime() - reportedDate.getTime() <= 6 * 60 * 60 * 1000;
  }

  return isSameLocalDay(reportedDate, now);
};

export const filterStationsByFreshness = (
  stations: StationWithPrices[],
  fuelType: FuelTypeId,
  freshness: FreshnessFilterId
): StationWithPrices[] => {
  if (freshness === "any") {
    return stations;
  }

  return stations.filter((station) => {
    const reportedAt = station.prices[fuelType]?.reportedAt;
    if (!reportedAt) return false;
    return isFreshEnough(reportedAt, freshness);
  });
};
