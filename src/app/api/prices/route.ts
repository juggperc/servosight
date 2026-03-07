import { NextRequest, NextResponse } from "next/server";
import { addPriceReport, getStation, addUserStation } from "@/lib/store";
import { FUEL_TYPES } from "@/lib/data/fuel-types";
import type { FuelTypeId } from "@/lib/types";

export const runtime = "nodejs";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    let { stationId, fuelType, price, lat, lng, stationName } = body as {
      stationId: string;
      fuelType: FuelTypeId;
      price: number;
      lat?: number;
      lng?: number;
      stationName?: string;
    };

    if (!stationId || !fuelType || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (stationId === "NEW_STATION") {
      if (lat === undefined || lng === undefined || !stationName) {
        return NextResponse.json({ error: "Missing properties for new station drop" }, { status: 400 });
      }
      const created = addUserStation({ name: stationName, lat, lng });
      stationId = created.id;
    } else {
      const station = await getStation(stationId);
      if (!station) {
        return NextResponse.json({ error: "Station not found" }, { status: 404 });
      }
    }

    const validFuelTypes = FUEL_TYPES.map((f) => f.id);
    if (!validFuelTypes.includes(fuelType)) {
      return NextResponse.json({ error: "Invalid fuel type" }, { status: 400 });
    }

    if (price < 500 || price > 5000) {
      return NextResponse.json({ error: "Price out of reasonable range" }, { status: 400 });
    }

    const report = addPriceReport({ stationId, fuelType, price });
    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
};
