import { NextRequest, NextResponse } from "next/server";
import { getNationalHistory } from "@/lib/kv";
import type { FuelTypeId } from "@/lib/types";
import { STANDARD_FUEL_TYPES } from "@/lib/data/fuel-types";

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const fuelType = searchParams.get("fuelType") as FuelTypeId;

    const validIds = STANDARD_FUEL_TYPES.map(f => f.id);
    if (!fuelType || !validIds.includes(fuelType)) {
        return NextResponse.json({ error: "Invalid fuelType" }, { status: 400 });
    }

    try {
        const history = await getNationalHistory(fuelType);
        return NextResponse.json({ history });
    } catch (error) {
        console.error("[API National History] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
