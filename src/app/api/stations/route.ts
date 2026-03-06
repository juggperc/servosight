import { NextRequest, NextResponse } from "next/server";
import { queryStations } from "@/lib/store";
import type { FuelTypeId } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;

  const fuelType = searchParams.get("fuelType") as FuelTypeId | null;
  const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const radius = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : undefined;
  const hasHydrogen = searchParams.get("hasHydrogen") === "true";
  const hasEv = searchParams.get("hasEv") === "true";

  const results = await queryStations({
    fuelType: fuelType || undefined,
    lat,
    lng,
    radius,
    hasHydrogen: hasHydrogen || undefined,
    hasEv: hasEv || undefined,
  });

  return NextResponse.json(results);
};
