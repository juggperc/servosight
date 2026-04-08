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

// Key format: national:u91
const getHistoryKey = (fuelType: FuelTypeId) => `national:${fuelType}`;

export const getNationalHistory = async (fuelType: FuelTypeId): Promise<DailyAverage[]> => {
    if (!isKvConfigured()) {
        console.warn("[KV] Vercel KV is not configured. Returning empty history.");
        return [];
    }

    try {
        const key = getHistoryKey(fuelType);
        // Returns an array from list, left to right 
        const history = await kv.lrange<DailyAverage>(key, 0, -1);
        if (!history?.length) return [];

        const byDate = new Map<string, DailyAverage>();
        for (const entry of history) {
            if (entry?.date) {
                byDate.set(entry.date, entry);
            }
        }

        return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
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

        const entry: DailyAverage = { date: dateStr, price };
        const history = await kv.lrange<DailyAverage>(key, 0, -1);
        const withoutToday = (history || []).filter((item) => item?.date && item.date !== dateStr);
        const nextHistory = [...withoutToday, entry].slice(-MAX_HISTORY_DAYS);

        await kv.del(key);
        if (nextHistory.length > 0) {
            await kv.rpush(key, ...nextHistory);
        }

    } catch (err) {
        console.error(`[KV] Failed to append daily average for ${fuelType}:`, err);
    }
};
