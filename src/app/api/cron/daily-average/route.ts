import { NextResponse } from "next/server";
import { queryStations } from "@/lib/store";
import { STANDARD_FUEL_TYPES } from "@/lib/data/fuel-types";
import { appendDailyAverage, isKvConfigured } from "@/lib/kv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = async (request: Request) => {
    try {
        // 1. Verify cron secret to prevent unauthorized abuse
        const authHeader = request.headers.get("authorization");
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        // Ensure we only enforce if CRON_SECRET is set in ENV. 
        // This allows local testing if CRON_SECRET is omitted locally.
        if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!isKvConfigured()) {
            return NextResponse.json({ error: "KV not configured" }, { status: 500 });
        }

        // Capture today's date in YYYY-MM-DD
        const today = new Intl.DateTimeFormat("en-AU", {
            timeZone: "Australia/Sydney",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date()).split("/").reverse().join("-"); // Note: sometimes format returns DD/MM/YYYY, safer to build manually

        // Safer date string builder for Sydney time (YYYY-MM-DD)
        const sydneyTime = new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" });
        const d = new Date(sydneyTime);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        // 2. Fetch all stations to calculate averages
        const allStations = await queryStations({});
        if (allStations.length === 0) {
            return NextResponse.json({ error: "No stations available to average" }, { status: 503 });
        }

        const results: Record<string, number> = {};

        // 3. For each primary fuel type, get the average price today
        for (const fuel of STANDARD_FUEL_TYPES) {
            let sum = 0;
            let count = 0;

            for (const station of allStations) {
                const priceObj = station.prices[fuel.id];
                if (priceObj && priceObj.price > 0) {
                    sum += priceObj.price;
                    count++;
                }
            }

            if (count > 0) {
                const avg = Math.round(sum / count);
                await appendDailyAverage(fuel.id, avg, dateStr);
                results[fuel.id] = avg;
            }
        }

        return NextResponse.json({ success: true, date: dateStr, averagesInserted: results });
    } catch (error) {
        console.error("[Cron Daily Average] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
