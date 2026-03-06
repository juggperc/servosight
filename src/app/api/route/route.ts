import { NextRequest, NextResponse } from "next/server";
import type { RouteData, RouteStep } from "@/lib/types";

export const dynamic = "force-dynamic";

type OsrmStep = {
  distance?: number;
  duration?: number;
  name?: string;
  maneuver?: {
    type?: string;
    modifier?: string;
    exit?: number;
  };
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  legs?: Array<{
    steps?: OsrmStep[];
  }>;
};

const formatInstruction = (step: OsrmStep): string => {
  const type = step.maneuver?.type ?? "continue";
  const modifier = step.maneuver?.modifier;
  const roadName = step.name?.trim() ? ` on ${step.name.trim()}` : "";

  if (type === "depart") {
    return `Head${modifier ? ` ${modifier}` : ""}${roadName}`.trim();
  }

  if (type === "arrive") {
    return "You have arrived at the station";
  }

  if (type === "roundabout") {
    const exit = step.maneuver?.exit ? ` and take exit ${step.maneuver.exit}` : "";
    return `At the roundabout, continue${exit}${roadName}`.trim();
  }

  if (type === "merge") {
    return `Merge${modifier ? ` ${modifier}` : ""}${roadName}`.trim();
  }

  if (type === "fork") {
    return `Keep${modifier ? ` ${modifier}` : ""}${roadName}`.trim();
  }

  if (type === "end of road") {
    return `At the end of the road, turn${modifier ? ` ${modifier}` : ""}${roadName}`.trim();
  }

  if (type === "turn" || type === "continue" || type === "new name") {
    if (modifier) {
      return `${type === "continue" ? "Continue" : "Turn"} ${modifier}${roadName}`.trim();
    }
    return `${type === "continue" ? "Continue" : "Proceed"}${roadName}`.trim();
  }

  return `${type.charAt(0).toUpperCase()}${type.slice(1)}${roadName}`.trim();
};

export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const fromLat = Number(searchParams.get("fromLat"));
  const fromLng = Number(searchParams.get("fromLng"));
  const toLat = Number(searchParams.get("toLat"));
  const toLng = Number(searchParams.get("toLng"));
  const stationId = searchParams.get("stationId") ?? "";

  if ([fromLat, fromLng, toLat, toLng].some((value) => Number.isNaN(value))) {
    return NextResponse.json({ error: "Invalid route coordinates" }, { status: 400 });
  }

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Routing service unavailable" }, { status: 502 });
    }

    const data = await response.json();
    const route = data.routes?.[0] as OsrmRoute | undefined;

    if (!route?.geometry?.coordinates?.length) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const steps: RouteStep[] =
      route.legs?.flatMap((leg) =>
        (leg.steps ?? []).map((step) => ({
          instruction: formatInstruction(step),
          distance: step.distance ?? 0,
          duration: step.duration ?? 0,
        }))
      ) ?? [];

    const result: RouteData = {
      destinationStationId: stationId,
      origin: { lat: fromLat, lng: fromLng },
      destination: { lat: toLat, lng: toLng },
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: route.distance,
      duration: route.duration,
      steps,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to calculate route" }, { status: 500 });
  }
};
