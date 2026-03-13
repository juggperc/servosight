import type { FuelTypeId } from "@/lib/types";

const API_BASE = "https://api.fuel.service.vic.gov.au/open-data/v1";
const PRICES_URL = `${API_BASE}/fuel/prices`;
const STATIONS_URL = `${API_BASE}/fuel/reference-data/stations`;
const BRANDS_URL = `${API_BASE}/fuel/reference-data/brands`;

const PRICE_CACHE_TTL_MS = 60 * 60 * 1000;

const FUEL_CODE_MAP: Record<string, FuelTypeId> = {
  U91: "u91",
  E10: "e10",
  P95: "p95",
  P98: "p98",
  DSL: "diesel",
  PDSL: "premium_diesel",
  LPG: "lpg",
  E85: "e10",
  B20: "diesel",
};

export type VicStation = {
  id: string;
  name: string;
  brandId: string;
  address: string;
  contactPhone: string | null;
  location: { latitude: number | null; longitude: number | null };
};

export type VicPrice = {
  fuelType: string;
  price: number;
  isAvailable: boolean;
  updatedAt: string;
};

export type VicFuelStation = {
  fuelStation: VicStation;
  fuelPrices: VicPrice[];
  updatedAt: string;
};

export type VicPricesResponse = {
  fuelPriceDetails: VicFuelStation[];
};

export type VicBrandsResponse = {
  brands: { id: string; name: string; type: string }[];
};

let cachedPrices: VicPricesResponse | null = null;
let pricesFetchedAt = 0;

let brandMap: Map<string, string> = new Map();

const getApiCredentials = (): { consumerId: string } | null => {
  const consumerId = process.env.VIC_FUEL_API_KEY;
  if (!consumerId) return null;
  return { consumerId };
};

const isConfigured = (): boolean => {
  return getApiCredentials() !== null;
};

const buildRequestHeaders = () => {
  const creds = getApiCredentials();
  return {
    "User-Agent": "ServoSight/1.0",
    "x-consumer-id": creds?.consumerId ?? "",
    "x-transactionid": crypto.randomUUID(),
  };
};

export const fetchVicPricesBundle = async (): Promise<VicPricesResponse | null> => {
  const now = Date.now();
  if (cachedPrices && now - pricesFetchedAt < PRICE_CACHE_TTL_MS) {
    return cachedPrices;
  }

  const creds = getApiCredentials();
  if (!creds) {
    console.warn("[VIC API] Not configured - missing API key");
    return cachedPrices;
  }

  console.log("[VIC API] Fetching fuel prices from Fair Fuel Open Data API...");
  
  try {
    const headers = buildRequestHeaders();
    const res = await fetch(PRICES_URL, {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[VIC API] Failed to fetch prices: ${res.status} ${res.statusText}`, text.slice(0, 200));
      return cachedPrices;
    }

    const data = (await res.json()) as VicPricesResponse;
    cachedPrices = data;
    pricesFetchedAt = now;

    console.log(`[VIC API] Loaded ${data.fuelPriceDetails?.length ?? 0} stations with prices`);
    return cachedPrices;
  } catch (err) {
    console.error("[VIC API] Error fetching prices:", err);
    return cachedPrices;
  }
};

export const fetchVicBrands = async (): Promise<void> => {
  const creds = getApiCredentials();
  if (!creds) return;

  try {
    const headers = buildRequestHeaders();
    const res = await fetch(BRANDS_URL, {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`[VIC API] Failed to fetch brands: ${res.status}`);
      return;
    }

    const data = (await res.json()) as VicBrandsResponse;
    brandMap = new Map();
    for (const brand of data.brands ?? []) {
      brandMap.set(brand.id, brand.name);
    }
    console.log(`[VIC API] Loaded ${brandMap.size} brands`);
  } catch (err) {
    console.error("[VIC API] Error fetching brands:", err);
  }
};

export const mapVicFuelCode = (code: string): FuelTypeId | null => {
  return FUEL_CODE_MAP[code] ?? null;
};

export const getVicBrandName = (brandId: string): string => {
  return brandMap.get(brandId) ?? "Unknown";
};

export const getVicApiStatus = () => ({
  configured: isConfigured(),
  stationCount: cachedPrices?.fuelPriceDetails?.length ?? 0,
  pricesCachedAt: pricesFetchedAt ? new Date(pricesFetchedAt).toISOString() : null,
});
