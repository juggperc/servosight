import type { Station, PriceReport, FuelTypeId, StationWithPrices } from "@/lib/types";
import { SEED_STATIONS, generateSeedPrices } from "@/lib/data/stations";
import { haversineDistance } from "@/lib/utils";

let stations: Station[] = [...SEED_STATIONS];
let priceReports: PriceReport[] = generateSeedPrices();

export const getAllStations = (): Station[] => {
  return stations;
};

export const getStation = (id: string): Station | undefined => {
  return stations.find((s) => s.id === id);
};

export const getLatestPrices = (stationId: string): Record<FuelTypeId, { price: number; reportedAt: string } | undefined> => {
  const stationPrices = priceReports
    .filter((p) => p.stationId === stationId)
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  const latest: Record<string, { price: number; reportedAt: string } | undefined> = {};

  for (const report of stationPrices) {
    if (!latest[report.fuelType]) {
      latest[report.fuelType] = {
        price: report.price,
        reportedAt: report.reportedAt,
      };
    }
  }

  return latest as Record<FuelTypeId, { price: number; reportedAt: string } | undefined>;
};

export type StationQueryParams = {
  fuelType?: FuelTypeId;
  lat?: number;
  lng?: number;
  radius?: number; // km
  hasHydrogen?: boolean;
  hasEv?: boolean;
};

export const queryStations = (params: StationQueryParams): StationWithPrices[] => {
  let filtered = [...stations];

  if (params.hasHydrogen) {
    filtered = filtered.filter((s) => s.hasHydrogen);
  }

  if (params.hasEv) {
    filtered = filtered.filter((s) => s.hasEv);
  }

  if (params.fuelType) {
    filtered = filtered.filter((s) => s.fuelTypes.includes(params.fuelType!));
  }

  let result: StationWithPrices[] = filtered.map((station) => {
    const prices = getLatestPrices(station.id);
    const targetPrice = params.fuelType ? prices[params.fuelType]?.price : prices["u91"]?.price;
    const distance =
      params.lat !== undefined && params.lng !== undefined
        ? haversineDistance(params.lat, params.lng, station.lat, station.lng)
        : undefined;

    return {
      ...station,
      prices,
      cheapestPrice: targetPrice,
      distance,
    };
  });

  if (params.lat !== undefined && params.lng !== undefined && params.radius) {
    result = result.filter((s) => s.distance !== undefined && s.distance <= params.radius!);
  }

  return result;
};

export const addPriceReport = (report: Omit<PriceReport, "id" | "reportedAt">): PriceReport => {
  const newReport: PriceReport = {
    ...report,
    id: `pr${Date.now()}`,
    reportedAt: new Date().toISOString(),
  };
  priceReports.push(newReport);
  return newReport;
};

export const getBestDeals = (
  lat: number,
  lng: number,
  radius: number,
  fuelType: FuelTypeId = "u91"
): StationWithPrices[] => {
  const results = queryStations({ lat, lng, radius, fuelType });

  return results
    .filter((s) => s.cheapestPrice !== undefined)
    .sort((a, b) => (a.cheapestPrice ?? Infinity) - (b.cheapestPrice ?? Infinity))
    .slice(0, 20);
};
