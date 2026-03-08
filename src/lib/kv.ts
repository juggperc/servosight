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
        return history || [];
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

        // Create new entry
        const entry: DailyAverage = { date: dateStr, price };

        // Atomically push to the right (end) of the list
        await kv.rpush(key, entry);

        // Keep only the last MAX_HISTORY_DAYS items (LTRIM offsets are start, stop. We want the last 30 items)
        await kv.ltrim(key, -MAX_HISTORY_DAYS, -1);

    } catch (err) {
        console.error(`[KV] Failed to append daily average for ${fuelType}:`, err);
    }
};
