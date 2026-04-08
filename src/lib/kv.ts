import { kv } from "@vercel/kv";
import type { FuelTypeId } from "@/lib/types";

export type DailyAverage = {
    date: string; // YYYY-MM-DD
    price: number; // in cents
};

const MAX_HISTORY_DAYS = 30;

// Helper to check if KV is configured
export const isKvConfigured = () => {
    return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
};

// Legacy key format: national:u91
const getLegacyHistoryKey = (fuelType: FuelTypeId) => `national:${fuelType}`;
// Current key format: national:v2:u91 (hash date -> price)
const getHistoryKey = (fuelType: FuelTypeId) => `national:v2:${fuelType}`;

const toSortedHistory = (entries: DailyAverage[]) => {
    return entries
        .filter((entry) => !!entry?.date && Number.isFinite(entry.price))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-MAX_HISTORY_DAYS);
};

export const getNationalHistory = async (fuelType: FuelTypeId): Promise<DailyAverage[]> => {
    if (!isKvConfigured()) {
        console.warn("[KV] Vercel KV is not configured. Returning empty history.");
        return [];
    }

    try {
        const key = getHistoryKey(fuelType);
        const hashHistory = await kv.hgetall<Record<string, number | string>>(key);
        if (hashHistory && Object.keys(hashHistory).length > 0) {
            const entries: DailyAverage[] = Object.entries(hashHistory).map(([date, value]) => ({
                date,
                price: typeof value === "number" ? value : Number.parseInt(value, 10),
            }));
            return toSortedHistory(entries);
        }

        const legacyKey = getLegacyHistoryKey(fuelType);
        const history = await kv.lrange<DailyAverage>(legacyKey, 0, -1);
        if (!history?.length) return [];

        const byDate = new Map<string, DailyAverage>();
        for (const entry of history) {
            if (entry?.date) byDate.set(entry.date, entry);
        }

        return toSortedHistory(Array.from(byDate.values()));
    } catch (err) {
        console.error(`[KV] Failed to fetch history for ${fuelType}:`, err);
        return [];
    }
};

export const appendDailyAverage = async (fuelType: FuelTypeId, price: number, dateStr: string): Promise<void> => {
    if (!isKvConfigured()) {
        console.warn(`[KV] Skipping append for ${fuelType} because KV is not configured.`);
        return;
    }

    try {
        const key = getHistoryKey(fuelType);

        await kv.hset(key, { [dateStr]: price });

        const dateKeys = await kv.hkeys(key);
        if (dateKeys.length > MAX_HISTORY_DAYS) {
            const overflowDates = [...dateKeys]
                .sort((a, b) => a.localeCompare(b))
                .slice(0, dateKeys.length - MAX_HISTORY_DAYS);
            if (overflowDates.length > 0) {
                await kv.hdel(key, ...overflowDates);
            }
        }

    } catch (err) {
        console.error(`[KV] Failed to append daily average for ${fuelType}:`, err);
    }
};
