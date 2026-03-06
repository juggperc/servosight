import type { Station, PriceReport, FuelTypeId, StationWithPrices } from "@/lib/types";
import { SEED_STATIONS, generateSeedPrices } from "@/lib/data/stations";
import { haversineDistance } from "@/lib/utils";
import {
  fetchReferenceData,
  fetchAllPrices,
  mapNswFuelCode,
  type NswStation,
} from "@/lib/nsw-fuel-api";

// Full seed data as fallback
const allSeedStations: Station[] = [...SEED_STATIONS];
const allSeedPrices: PriceReport[] = generateSeedPrices();

// User-submitted prices overlay
let userPriceReports: PriceReport[] = [];

// Cached converted NSW live data
let nswLiveStations: Station[] = [];
let nswPricesMap: Map<string, { fuelType: FuelTypeId; price: number; reportedAt: string }[]> = new Map();
let lastNswSync = 0;
let nswLiveAvailable = false;

const NSW_SYNC_INTERVAL_MS = 60 * 60 * 1000;

// ── NSW data conversion ──

const convertNswStation = (s: NswStation): Station => ({
  id: `nsw-${s.code}`,
  name: s.name,
  brand: s.brand ?? "Unknown",
  address: s.address,
  suburb: extractSuburb(s.address),
  state: s.state === "TAS" ? "TAS" : "NSW",
  lat: s.location.latitude,
  lng: s.location.longitude,
  fuelTypes: [],
  hasHydrogen: false,
  hasEv: false,
});

const extractSuburb = (address: string): string => {
  const parts = address.split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : address;
};

const syncNswData = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastNswSync < NSW_SYNC_INTERVAL_MS) return;

  const [refData, prices] = await Promise.all([
    fetchReferenceData(),
    fetchAllPrices(),
  ]);

  if (!refData?.stations?.stations || prices.length === 0) {
    lastNswSync = now;
    return;
  }

  const stationMap = new Map<string, Station>();
  for (const s of refData.stations.stations) {
    stationMap.set(s.code, convertNswStation(s));
  }

  const pMap = new Map<string, { fuelType: FuelTypeId; price: number; reportedAt: string }[]>();

  for (const p of prices) {
    const fuelType = mapNswFuelCode(p.fueltype);
    if (!fuelType) continue;

    const stationKey = `nsw-${p.stationcode}`;
    const station = stationMap.get(p.stationcode);
    if (station && !station.fuelTypes.includes(fuelType)) {
      station.fuelTypes.push(fuelType);
    }

    const existing = pMap.get(stationKey) ?? [];
    existing.push({
      fuelType,
      price: Math.round(p.price * 10),
      reportedAt: p.lastupdated ?? new Date().toISOString(),
    });
    pMap.set(stationKey, existing);
  }

  nswLiveStations = Array.from(stationMap.values()).filter((s) => s.fuelTypes.length > 0);
  nswPricesMap = pMap;
  nswLiveAvailable = nswLiveStations.length > 0;
  lastNswSync = now;

  console.log(`[Store] NSW live sync: ${nswLiveStations.length} stations, ${prices.length} prices`);
};

// ── Public API ──

const getAllStations = async (): Promise<Station[]> => {
  await syncNswData();

  if (nswLiveAvailable) {
    // Live NSW data + seed for non-NSW/TAS states
    const nonLiveSeeds = allSeedStations.filter(
      (s) => s.state !== "NSW" && s.state !== "TAS"
    );
    return [...nswLiveStations, ...nonLiveSeeds];
  }

  // No live data — use all seed stations
  return allSeedStations;
};

export const getStation = async (id: string): Promise<Station | undefined> => {
  const all = await getAllStations();
  return all.find((s) => s.id === id);
};

const getLatestPrices = (stationId: string): Record<FuelTypeId, { price: number; reportedAt: string } | undefined> => {
  const latest: Record<string, { price: number; reportedAt: string } | undefined> = {};

  // NSW live prices
  const nswPrices = nswPricesMap.get(stationId);
  if (nswPrices) {
    for (const p of nswPrices) {
      if (!latest[p.fuelType] || new Date(p.reportedAt) > new Date(latest[p.fuelType]!.reportedAt)) {
        latest[p.fuelType] = { price: p.price, reportedAt: p.reportedAt };
      }
    }
  }

  // Seed prices fallback
  const seedStationPrices = allSeedPrices
    .filter((p) => p.stationId === stationId)
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  for (const report of seedStationPrices) {
    if (!latest[report.fuelType]) {
      latest[report.fuelType] = { price: report.price, reportedAt: report.reportedAt };
    }
  }

  // User-submitted prices take priority
  const userPrices = userPriceReports
    .filter((p) => p.stationId === stationId)
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  for (const report of userPrices) {
    if (!latest[report.fuelType] || new Date(report.reportedAt) > new Date(latest[report.fuelType]!.reportedAt)) {
      latest[report.fuelType] = { price: report.price, reportedAt: report.reportedAt };
    }
  }

  return latest as Record<FuelTypeId, { price: number; reportedAt: string } | undefined>;
};

export type StationQueryParams = {
  fuelType?: FuelTypeId;
  lat?: number;
  lng?: number;
  radius?: number;
  hasHydrogen?: boolean;
  hasEv?: boolean;
};

export const queryStations = async (params: StationQueryParams): Promise<StationWithPrices[]> => {
  let filtered = await getAllStations();

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

    return { ...station, prices, cheapestPrice: targetPrice, distance };
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
  userPriceReports.push(newReport);
  return newReport;
};

export const getBestDeals = async (
  lat: number,
  lng: number,
  radius: number,
  fuelType: FuelTypeId = "u91"
): Promise<StationWithPrices[]> => {
  const results = await queryStations({ lat, lng, radius, fuelType });

  return results
    .filter((s) => s.cheapestPrice !== undefined)
    .sort((a, b) => (a.cheapestPrice ?? Infinity) - (b.cheapestPrice ?? Infinity))
    .slice(0, 20);
};

export const isLiveDataAvailable = (): boolean => nswLiveAvailable;
