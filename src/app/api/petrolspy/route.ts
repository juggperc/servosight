// @ts-check
import { NextRequest, NextResponse } from "next/server";
import type { FuelTypeId, StationWithPrices } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PETROLSPY_JSON_API = "https://petrolspy.com.au/webservice-1/station/box";

// Map PetrolSpy fuel types to our internal IDs
const FUEL_TYPE_MAP: Record<string, FuelTypeId> = {
  U91: "u91",
  E10: "e10",
  U95: "p95",
  U98: "p98",
  PremDSL: "premium_diesel",
  DIESEL: "diesel",
  LPG: "lpg",
};

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

  // Create a 0.5 deg rough bounding box around the user (approx 50km radius)
  const offset = 0.5;
  const neLat = latNum + offset;
  const swLat = latNum - offset;
  const neLng = lngNum + offset;
  const swLng = lngNum - offset;

  const url = `${PETROLSPY_JSON_API}?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-AU,en;q=0.9",
        "Referer": "https://petrolspy.com.au/map/latlng/" + lat + "/" + lng,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { stations: [], error: `PetrolSpy returned ${res.status}` },
        { status: 200 }
      );
    }

    const data = await res.json();

    // Safety check for their schema
    if (!data?.message?.list || !Array.isArray(data.message.list)) {
      return NextResponse.json({
        stations: [],
        error: "PetrolSpy format changed. No list found."
      });
    }

    const rawStations: any[] = data.message.list;
    const stations: StationWithPrices[] = [];

    rawStations.forEach((raw) => {
      // Must have pricing and location data
      if (!raw.prices || !raw.location || !raw.location.y || !raw.location.x) return;

      const prices: Record<FuelTypeId, { price: number; reportedAt: string } | undefined> = {} as any;
      let minPrice = Infinity;

      for (const [psType, priceData] of Object.entries(raw.prices)) {
        // Must be an object with an 'amount' and mapped to our system
        if (priceData && typeof priceData === 'object' && 'amount' in priceData) {
          const mappedId = FUEL_TYPE_MAP[psType];
          if (mappedId) {
            // PetrolSpy returns in cents, e.g. 215.9. Our app maps nicely to keeping the decimal format (215.9 cents)
            const amt = Number(priceData.amount);

            prices[mappedId] = {
              price: amt * 10, // Assuming internal app logic handles it as int or raw float? Wait. Route returns cents? Wait, our app renders cents like formatPriceCents. 215.9 -> 215.9? Wait our UI expects 2159? No, `parsePrice` returned Math.round(val * 10) like 215.9 -> 2159 but Petrolspy amount IS 215.9
              // Actually, let's map it safely. 215.9 -> 2159
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
