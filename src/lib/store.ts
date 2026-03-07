import type { Station, PriceReport, FuelTypeId, StationWithPrices } from "@/lib/types";
import { haversineDistance } from "@/lib/utils";
import {
  fetchPricesBundle,
  mapNswFuelCode,
  type NswStation,
} from "@/lib/nsw-fuel-api";
import { fetchWaPricesBundle, type WaStation } from "@/lib/wa-fuel-api";

// User-submitted prices overlay
let userPriceReports: PriceReport[] = [];
let userStations: Station[] = [];

// Cached converted live data
let nswStations: Station[] = [];
let nswPricesMap: Map<string, { fuelType: FuelTypeId; price: number; reportedAt: string }[]> = new Map();
let lastNswSync = 0;

let waStations: Station[] = [];
let waPricesMap: Map<string, { fuelType: FuelTypeId; price: number; reportedAt: string }[]> = new Map();
let lastWaSync = 0;

let liveDataAvailable = false;

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

  const bundle = await fetchPricesBundle();

  if (!bundle?.stations?.length || !bundle.prices?.length) {
    lastNswSync = now;
    return;
  }

  const stationMap = new Map<string, Station>();
  for (const s of bundle.stations) {
    stationMap.set(String(s.code), convertNswStation(s));
  }

  const pMap = new Map<string, { fuelType: FuelTypeId; price: number; reportedAt: string }[]>();

  for (const p of bundle.prices) {
    const fuelType = mapNswFuelCode(p.fueltype);
    if (!fuelType) continue;

    const stationCode = String(p.stationcode);
    const stationKey = `nsw-${stationCode}`;
    const station = stationMap.get(stationCode);
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

  nswStations = Array.from(stationMap.values()).filter((s) => s.fuelTypes.length > 0);
  nswPricesMap = pMap;
  liveDataAvailable = nswStations.length > 0 || waStations.length > 0;
  lastNswSync = now;

  console.log(`[Store] NSW live sync: ${nswStations.length} stations, ${bundle.prices.length} prices`);
};

const WA_SYNC_INTERVAL_MS = 60 * 60 * 1000;

const convertWaStation = (s: WaStation, pMap: Map<string, { fuelType: FuelTypeId; price: number; reportedAt: string }[]>): Station => {
  const prices = pMap.get(s.id) || [];
  const fuelTypes = Array.from(new Set(prices.map(p => p.fuelType)));
  return {
    ...s,
    state: "WA",
    fuelTypes,
    hasHydrogen: false,
    hasEv: false,
  };
};

const syncWaData = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastWaSync < WA_SYNC_INTERVAL_MS) return;

  const bundle = await fetchWaPricesBundle();

  if (!bundle?.stations?.length || !bundle.prices?.length) {
    lastWaSync = now;
    return;
  }

  const pMap = new Map<string, { fuelType: FuelTypeId; price: number; reportedAt: string }[]>();

  for (const p of bundle.prices) {
    const existing = pMap.get(p.stationId) ?? [];
    existing.push({
      fuelType: p.fuelType,
      price: p.price,
      reportedAt: p.reportedAt,
    });
    pMap.set(p.stationId, existing);
  }

  const stationMap = new Map<string, Station>();
  for (const s of bundle.stations) {
    stationMap.set(s.id, convertWaStation(s, pMap));
  }

  waStations = Array.from(stationMap.values()).filter((s) => s.fuelTypes.length > 0);
  waPricesMap = pMap;
  liveDataAvailable = nswStations.length > 0 || waStations.length > 0;
  lastWaSync = now;
};

// ── Public API ──

const getAllStations = async (): Promise<Station[]> => {
  await Promise.all([syncNswData(), syncWaData()]);
  return [...nswStations, ...waStations, ...userStations];
};

export const getStation = async (id: string): Promise<Station | undefined> => {
  const all = await getAllStations();
  return all.find((s) => s.id === id);
};

const getLatestPrices = (
  stationId: string
): Record<FuelTypeId, { price: number; reportedAt: string } | undefined> => {
  const latest: Record<string, { price: number; reportedAt: string } | undefined> = {};

  const stationPrices = nswPricesMap.get(stationId) || waPricesMap.get(stationId);
  if (stationPrices) {
    for (const p of stationPrices) {
      if (!latest[p.fuelType] || new Date(p.reportedAt) > new Date(latest[p.fuelType]!.reportedAt)) {
        latest[p.fuelType] = { price: p.price, reportedAt: p.reportedAt };
      }
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

export const addUserStation = (
  stationInfo: { name: string; lat: number; lng: number }
): Station => {
  const newStation: Station = {
    id: `user-stn-${Date.now()}`,
    name: stationInfo.name,
    brand: "Independent",
    address: "User Reported Location",
    suburb: "Unknown",
    state: "Unknown",
    lat: stationInfo.lat,
    lng: stationInfo.lng,
    fuelTypes: [],
    hasHydrogen: false,
    hasEv: false,
  };
  userStations.push(newStation);
  return newStation;
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

export const isLiveDataAvailable = (): boolean => liveDataAvailable;
