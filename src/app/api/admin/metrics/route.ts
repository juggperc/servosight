import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
    const startKv = Date.now();
    let kvStatus = "offline";
    let kvLatency = 0;
    let kvKeys = 0;

    try {
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            // Test KV connection and count
            const keys = await kv.keys("*");
            kvKeys = keys.length;
            kvStatus = "online";
        } else {
            kvStatus = "unconfigured";
        }
    } catch (error) {
        kvStatus = "error";
    }
    kvLatency = Date.now() - startKv;

    const uptime = process.uptime(); // Node process uptime
    const memUsage = process.memoryUsage();

    // Basic OS info, works in node runtime, not edge.
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpuLoadAvg = os.loadavg();

    return NextResponse.json({
        uptime,
        memory: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            systemTotal: totalMem,
            systemFree: freeMem,
        },
        cpu: {
            loadAvg: cpuLoadAvg,
            cores: os.cpus().length,
        },
        kv: {
            status: kvStatus,
            latencyMs: kvLatency,
            keysCount: kvKeys,
        },
        env: {
            region: process.env.VERCEL_REGION || "local (dev)",
            nodeEnv: process.env.NODE_ENV,
        }
    });
}
