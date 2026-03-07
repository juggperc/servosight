import * as cheerio from "cheerio";
import type { FuelTypeId } from "@/lib/types";

export type WaStation = {
    id: string;
    name: string;
    brand: string;
    address: string;
    suburb: string;
    lat: number;
    lng: number;
};

export type WaPrice = {
    stationId: string;
    fuelType: FuelTypeId;
    price: number;
    reportedAt: string;
};

export type WaPricesResponse = {
    stations: WaStation[];
    prices: WaPrice[];
};

const WA_PRODUCTS: { id: number; fuelType: FuelTypeId }[] = [
    { id: 1, fuelType: "u91" },
    { id: 2, fuelType: "p95" },
    { id: 6, fuelType: "p98" },
    { id: 4, fuelType: "diesel" },
    { id: 5, fuelType: "lpg" },
];

export const fetchWaPricesBundle = async (): Promise<WaPricesResponse> => {
    const stationsMap = new Map<string, WaStation>();
    const prices: WaPrice[] = [];
    const reportedAt = new Date().toISOString();

    console.log(`[WA API] Fetching prices from FuelWatch...`);

    await Promise.all(
        WA_PRODUCTS.map(async ({ id, fuelType }) => {
            try {
                const url = `https://www.fuelwatch.wa.gov.au/fuelwatch/fuelWatchRSS?Product=${id}`;
                // Not using nextjs cache aggressively so we get real live data when needed
                const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
                if (!res.ok) return;
                const xml = await res.text();
                const $ = cheerio.load(xml, { xmlMode: true });

                $("item").each((_, el) => {
                    const item = $(el);
                    const priceText = item.find("price").text();
                    if (!priceText) return;
                    const price = Math.round(parseFloat(priceText) * 10);

                    const title = item.find("title").text() || "";
                    const name = item.find("trading-name").text() || title.split(":")[1]?.trim() || "Unknown";
                    const brand = item.find("brand").text() || "Unknown";
                    const address = item.find("address").text() || "";
                    const suburb = item.find("location").text() || "";
                    const lat = parseFloat(item.find("latitude").text());
                    const lng = parseFloat(item.find("longitude").text());

                    if (isNaN(lat) || isNaN(lng)) return;

                    // Unique ID based on name and roughly location to avoid duplicates
                    // Replacing spaces and removing non alpha
                    const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    const stationId = `wa-${cleanName}-${suburb.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;

                    if (!stationsMap.has(stationId)) {
                        stationsMap.set(stationId, {
                            id: stationId,
                            name,
                            brand,
                            address,
                            suburb,
                            lat,
                            lng,
                        });
                    }

                    prices.push({
                        stationId,
                        fuelType,
                        price,
                        reportedAt,
                    });
                });
            } catch (e) {
                console.error(`[WA API] Failed to fetch product ${id}`, e);
            }
        })
    );

    const stations = Array.from(stationsMap.values());
    console.log(`[WA API] Built bundle with ${stations.length} stations and ${prices.length} prices`);

    return { stations, prices };
};
