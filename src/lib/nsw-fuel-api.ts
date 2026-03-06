import type { FuelTypeId } from "@/lib/types";

const API_BASE = "https://api.onegov.nsw.gov.au";
const TOKEN_URL = `${API_BASE}/oauth/client_credential/accesstoken?grant_type=client_credentials`;
const REF_DATA_URL = `${API_BASE}/FuelPriceCheck/v2/fuel/prices/reference`;
const ALL_PRICES_URL = `${API_BASE}/FuelPriceCheck/v2/fuel/prices`;
const NEW_PRICES_URL = `${API_BASE}/FuelPriceCheck/v2/fuel/prices/new`;

const PRICE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const REF_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

// NSW API fuel code → our FuelTypeId mapping
const FUEL_CODE_MAP: Record<string, FuelTypeId> = {
  E10: "e10",
  U91: "u91",
  P95: "p95",
  P98: "p98",
  DL: "diesel",
  PDL: "premium_diesel",
  LPG: "lpg",
};

export type NswStation = {
  code: string;
  name: string;
  address: string;
  brand: string;
  location: { latitude: number; longitude: number };
  state: string;
};

export type NswPrice = {
  stationcode: string;
  fueltype: string;
  price: number;
  lastupdated: string;
};

type NswReferenceData = {
  stations: { stations: NswStation[] };
  fueltypes: { fueltypes: { code: string; name: string }[] };
  brands: { brands: { code: string; name: string }[] };
};

// ── In-memory state ──

let accessToken: string | null = null;
let tokenExpiresAt = 0;

let cachedRefData: NswReferenceData | null = null;
let refDataFetchedAt = 0;

let cachedPrices: NswPrice[] = [];
let pricesFetchedAt = 0;

let apiCallCount = 0;
let apiCallCountResetAt = Date.now();

const MONTHLY_LIMIT = 2400; // stay under 2500 with buffer

// ── Helpers ──

const getApiCredentials = (): { key: string; secret: string } | null => {
  const key = process.env.NSW_FUEL_API_KEY;
  const secret = process.env.NSW_FUEL_API_SECRET;
  if (!key || !secret) return null;
  return { key, secret };
};

const isConfigured = (): boolean => {
  return getApiCredentials() !== null;
};

const checkRateLimit = (): boolean => {
  const now = Date.now();
  // Reset counter every ~30 days
  if (now - apiCallCountResetAt > 30 * 24 * 60 * 60 * 1000) {
    apiCallCount = 0;
    apiCallCountResetAt = now;
  }
  return apiCallCount < MONTHLY_LIMIT;
};

const incrementCallCount = () => {
  apiCallCount++;
};

// ── OAuth ──

const getAccessToken = async (): Promise<string | null> => {
  const creds = getApiCredentials();
  if (!creds) return null;

  if (accessToken && Date.now() < tokenExpiresAt - TOKEN_BUFFER_MS) {
    return accessToken;
  }

  if (!checkRateLimit()) {
    console.warn("[NSW API] Monthly rate limit approaching, skipping token refresh");
    return accessToken;
  }

  const basic = Buffer.from(`${creds.key}:${creds.secret}`).toString("base64");

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
      },
    });

    const text = await res.text();

    if (!res.ok) {
      console.error(`[NSW API] OAuth failed: ${res.status} ${res.statusText}`, text.slice(0, 200));
      return null;
    }

    if (!text) {
      console.error("[NSW API] OAuth returned empty response");
      return null;
    }

    incrementCallCount();
    const data = JSON.parse(text);
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (parseInt(data.expires_in, 10) || 43200) * 1000;

    console.log("[NSW API] OAuth token acquired, expires in", data.expires_in, "seconds");
    return accessToken;
  } catch (err) {
    console.error("[NSW API] OAuth error:", err);
    return null;
  }
};

const apiGet = async (url: string): Promise<Response | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  if (!checkRateLimit()) {
    console.warn("[NSW API] Rate limit reached, skipping request");
    return null;
  }

  try {
    const creds = getApiCredentials();
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: creds!.key,
        "Content-Type": "application/json",
        transactionid: crypto.randomUUID(),
        requesttimestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      },
    });

    incrementCallCount();

    if (!res.ok) {
      console.error(`[NSW API] ${url}: ${res.status} ${res.statusText}`);
      return null;
    }

    return res;
  } catch (err) {
    console.error(`[NSW API] Request error for ${url}:`, err);
    return null;
  }
};

// ── Reference Data (stations, fuel types, brands) ──

export const fetchReferenceData = async (): Promise<NswReferenceData | null> => {
  const now = Date.now();
  if (cachedRefData && now - refDataFetchedAt < REF_CACHE_TTL_MS) {
    return cachedRefData;
  }

  console.log("[NSW API] Fetching reference data...");
  const res = await apiGet(REF_DATA_URL);
  if (!res) return cachedRefData;

  try {
    const data = await res.json();
    cachedRefData = data;
    refDataFetchedAt = now;
    console.log(`[NSW API] Reference data loaded: ${data.stations?.stations?.length ?? 0} stations`);
    return data;
  } catch (err) {
    console.error("[NSW API] Failed to parse reference data:", err);
    return cachedRefData;
  }
};

// ── Prices ──

export const fetchAllPrices = async (): Promise<NswPrice[]> => {
  const now = Date.now();
  if (cachedPrices.length > 0 && now - pricesFetchedAt < PRICE_CACHE_TTL_MS) {
    return cachedPrices;
  }

  // Use "new prices" endpoint if we have a recent cache, full fetch otherwise
  const url = cachedPrices.length > 0 && pricesFetchedAt > 0 ? NEW_PRICES_URL : ALL_PRICES_URL;
  const isIncremental = url === NEW_PRICES_URL;

  console.log(`[NSW API] Fetching ${isIncremental ? "new" : "all"} prices...`);
  const res = await apiGet(url);
  if (!res) return cachedPrices;

  try {
    const data = await res.json();
    const prices: NswPrice[] = data.prices ?? [];

    if (isIncremental && prices.length > 0) {
      // Merge new prices into cache
      const priceMap = new Map<string, NswPrice>();
      for (const p of cachedPrices) {
        priceMap.set(`${p.stationcode}-${p.fueltype}`, p);
      }
      for (const p of prices) {
        priceMap.set(`${p.stationcode}-${p.fueltype}`, p);
      }
      cachedPrices = Array.from(priceMap.values());
      console.log(`[NSW API] Merged ${prices.length} new prices (total: ${cachedPrices.length})`);
    } else if (!isIncremental) {
      cachedPrices = prices;
      console.log(`[NSW API] Loaded ${prices.length} prices`);
    }

    pricesFetchedAt = now;
    return cachedPrices;
  } catch (err) {
    console.error("[NSW API] Failed to parse prices:", err);
    return cachedPrices;
  }
};

// ── Public: Converted to our app types ──

export const mapNswFuelCode = (code: string): FuelTypeId | null => {
  return FUEL_CODE_MAP[code] ?? null;
};

export const getNswApiStatus = () => ({
  configured: isConfigured(),
  hasToken: !!accessToken,
  stationCount: cachedRefData?.stations?.stations?.length ?? 0,
  priceCount: cachedPrices.length,
  apiCallsThisMonth: apiCallCount,
  pricesCachedAt: pricesFetchedAt ? new Date(pricesFetchedAt).toISOString() : null,
  refDataCachedAt: refDataFetchedAt ? new Date(refDataFetchedAt).toISOString() : null,
});
