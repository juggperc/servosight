// @ts-check
import { NextRequest, NextResponse } from "next/server";
import type { FuelTypeId, StationWithPrices } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const PETROLSPY_JSON_API = "https://petrolspy.com.au/webservice-1/station/box";

const FUEL_TYPE_MAP: Record<string, FuelTypeId> = {
  U91: "u91",
  E10: "e10",
  U95: "p95",
  U98: "p98",
  PremDSL: "premium_diesel",
  DIESEL: "diesel",
  LPG: "lpg",
};

const MAX_RETRIES = 3;

const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

async function fetchWithRetry(url: string, baseInit: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Rotate headers per attempt to avoid fingerprint bans
      const init: RequestInit = {
        ...baseInit,
        headers: {
          ...baseInit.headers,
          "User-Agent": getRandomUserAgent(),
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-AU,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        }
      };

      const res = await fetch(url, init);
      if (res.ok) return res;

      // If we are rate limited or server error, backoff and try again.
      if (attempt < retries && (res.status >= 500 || res.status === 429 || res.status === 403)) {
        // Exponential backoff: 500ms, 1500ms, 3500ms
        const backoffDelay = 500 * Math.pow(attempt + 1, 2);
        await new Promise((r) => setTimeout(r, backoffDelay));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        const backoffDelay = 500 * Math.pow(attempt + 1, 2);
        await new Promise((r) => setTimeout(r, backoffDelay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Exhausted retries");
}

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 }
    );
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return NextResponse.json({ error: "Invalid lat or lng" }, { status: 400 });
  }

  const offset = 0.5;
  const neLat = latNum + offset;
  const swLat = latNum - offset;
  const neLng = lngNum + offset;
  const swLng = lngNum - offset;

  const url = `${PETROLSPY_JSON_API}?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`;

  try {
    const res = await fetchWithRetry(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-AU,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: `https://petrolspy.com.au/map/latlng/${lat}/${lng}`,
        Origin: "https://petrolspy.com.au",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { stations: [], error: `PetrolSpy returned ${res.status}` },
        { status: 200 }
      );
    }

    const data = await res.json();

    if (!data?.message?.list || !Array.isArray(data.message.list)) {
      return NextResponse.json({
        stations: [],
        error: "PetrolSpy format changed. No list found.",
      });
    }

    const rawStations: any[] = data.message.list;
    const stations: StationWithPrices[] = [];

    rawStations.forEach((raw) => {
      if (!raw.prices || !raw.location || !raw.location.y || !raw.location.x) return;

      const prices: Record<FuelTypeId, { price: number; reportedAt: string } | undefined> = {} as any;
      let minPrice = Infinity;

      for (const [psType, priceData] of Object.entries(raw.prices)) {
        if (priceData && typeof priceData === "object" && "amount" in priceData) {
          const mappedId = FUEL_TYPE_MAP[psType];
          if (mappedId) {
            const amt = Number(priceData.amount);
            prices[mappedId] = {
              price: amt * 10,
              reportedAt: new Date((priceData as any).updated || Date.now()).toISOString(),
            };
            const cPrice = amt * 10;
            if (cPrice < minPrice) minPrice = cPrice;
          }
        }
      }

      const fuelTypes = Object.keys(prices) as FuelTypeId[];
      if (fuelTypes.length === 0) return;

      stations.push({
        id: `petrolspy-${raw.id}`,
        name: raw.name || "Station",
        brand: raw.brand || "Unknown",
        address: raw.address || "",
        suburb: raw.suburb || "",
        state: raw.state || "VIC",
        lat: raw.location.y,
        lng: raw.location.x,
        fuelTypes,
        hasHydrogen: false,
        hasEv: false,
        prices,
        cheapestPrice: minPrice === Infinity ? undefined : minPrice,
      });
    });

    return NextResponse.json({
      stations,
      error: stations.length === 0 ? "No stations found for this area" : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch PetrolSpy data";
    return NextResponse.json({ stations: [], error: message }, { status: 200 });
  }
};
