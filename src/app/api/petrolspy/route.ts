import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { FuelTypeId, StationWithPrices } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PETROLSPY_BASE = "https://petrolspy.com.au";

const FUEL_PATTERNS: { pattern: RegExp; id: FuelTypeId }[] = [
  { pattern: /\bUnleaded\s*91\b|\bUnleaded\b|\bU91\b/i, id: "u91" },
  { pattern: /\bE10\b/i, id: "e10" },
  { pattern: /\bU95\b|\bPremium\s*95\b|\bP95\b/i, id: "p95" },
  { pattern: /\bU98\b|\bPremium\s*98\b|\bP98\b/i, id: "p98" },
  { pattern: /\bP\.?\s*Diesel\b|\bPremium\s*Diesel\b/i, id: "premium_diesel" },
  { pattern: /\bDiesel\b|\bP\s+Diesel\b/i, id: "diesel" },
  { pattern: /\bLPG\b/i, id: "lpg" },
];

function parsePrice(text: string): number | null {
  const match = text.match(/(\d+\.?\d*)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return Number.isNaN(val) ? null : Math.round(val * 10);
}

function parseStationLine(
  line: string,
  centerLat: number,
  centerLng: number,
  index: number
): StationWithPrices | null {
  const dash = line.indexOf("–") >= 0 ? line.indexOf("–") : line.indexOf("-");
  if (dash < 0) return null;

  const namePart = line.slice(0, dash).trim();
  const pricePart = line.slice(dash + 1).trim();
  if (!namePart || !pricePart) return null;

  const name = namePart.replace(/\s*–\s*$/, "").trim();
  if (!name) return null;

  const prices: Record<FuelTypeId, { price: number; reportedAt: string } | undefined> = {} as Record<
    FuelTypeId,
    { price: number; reportedAt: string } | undefined
  >;
  const reportedAt = new Date().toISOString();

  const segments = pricePart.split(/,\s*/);
  for (const seg of segments) {
    const trimmed = seg.trim();
    for (const { pattern, id } of FUEL_PATTERNS) {
      if (pattern.test(trimmed)) {
        const price = parsePrice(trimmed);
        if (price !== null) {
          prices[id] = { price, reportedAt };
        }
        break;
      }
    }
  }

  const fuelTypes = Object.keys(prices) as FuelTypeId[];
  if (fuelTypes.length === 0) return null;

  const allPrices = Object.values(prices)
    .filter((p): p is { price: number; reportedAt: string } => p != null)
    .map((p) => p.price);
  const cheapestPrice = allPrices.length > 0 ? Math.min(...allPrices) : undefined;

  const offset = 0.008;
  const angle = (index * 137.5 * (Math.PI / 180));
  const lat = centerLat + offset * Math.cos(angle);
  const lng = centerLng + offset * Math.sin(angle);

  return {
    id: `petrolspy-${name.replace(/\s+/g, "-").toLowerCase()}-${index}`,
    name,
    brand: name.split(/\s+/)[0] ?? "Unknown",
    address: "",
    suburb: "",
    state: "VIC",
    lat,
    lng,
    fuelTypes,
    hasHydrogen: false,
    hasEv: false,
    prices,
    cheapestPrice,
  };
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

  const url = `${PETROLSPY_BASE}/map/latlng/${latNum}/${lngNum}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
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

    const html = await res.text();
    const $ = cheerio.load(html);

    const stations: StationWithPrices[] = [];
    const seen = new Set<string>();

    const tryAddStation = (line: string, index: number): void => {
      const station = parseStationLine(line, latNum, lngNum, index);
      if (station && !seen.has(station.name)) {
        seen.add(station.name);
        stations.push(station);
      }
    };

    $("li, p").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length >= 10 && /[–-]\s*(Unleaded|U91|E10|U95|U98|Diesel|LPG)/i.test(text)) {
        tryAddStation(text, stations.length);
      }
    });

    if (stations.length === 0) {
      const rawText = $.text();
      const lines = rawText.split(/\n/).map((l) => l.replace(/\s+/g, " ").trim());
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.length >= 20 && /[–-]\s*(Unleaded|U91|E10|U95|U98|Diesel|LPG)/i.test(line)) {
          tryAddStation(line, stations.length);
        }
      }
    }

    if (stations.length === 0) {
      const stationRe = /([A-Za-z0-9\s\-&'\.]+?)\s*[–-]\s*((?:Unleaded|U91|E10|U95|U98|Diesel|LPG|P\.?\s*Diesel)[^<]+)/gi;
      let m: RegExpExecArray | null;
      while ((m = stationRe.exec(html)) !== null) {
        const line = `${m[1].trim()} – ${m[2].replace(/<[^>]+>/g, "").trim()}`;
        if (line.length >= 25) tryAddStation(line, stations.length);
      }
    }

    return NextResponse.json({
      stations,
      error: stations.length === 0 ? "No stations found for this area" : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch PetrolSpy data";
    return NextResponse.json({ stations: [], error: message }, { status: 200 });
  }
};
