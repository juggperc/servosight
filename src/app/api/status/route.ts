import { NextResponse } from "next/server";
import { getNswApiStatus } from "@/lib/nsw-fuel-api";
import { isLiveDataAvailable } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = () => {
  const api = getNswApiStatus();
  return NextResponse.json({
    live: isLiveDataAvailable(),
    nswApi: api,
    rateLimit: {
      used: api.apiCallsThisMonth,
      limit: 2500,
      remaining: 2500 - api.apiCallsThisMonth,
    },
  });
};
