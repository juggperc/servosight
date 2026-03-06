import type { RouteData, RouteStep, StationWithPrices } from "@/lib/types";
import { haversineDistance } from "@/lib/utils";
import { buildLocalRoute } from "@/lib/local-satnav";

type OsrmStep = {
  distance?: number;
  duration?: number;
  name?: string;
  maneuver?: {
    type?: string;
    modifier?: string;
    exit?: number;
    location?: [number, number];
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

type RoutePoint = { lat: number; lng: number };

const formatInstruction = (step: OsrmStep): string => {
  const type = step.maneuver?.type ?? "continue";
  const modifier = step.maneuver?.modifier;
  const roadName = step.name?.trim() ? ` on ${step.name.trim()}` : "";

  if (type === "depart") return `Head${modifier ? ` ${modifier}` : ""}${roadName}`.trim();
  if (type === "arrive") return "You have arrived at the station";
  if (type === "roundabout") {
    const exit = step.maneuver?.exit ? ` and take exit ${step.maneuver.exit}` : "";
    return `At the roundabout, continue${exit}${roadName}`.trim();
  }
  if (type === "merge") return `Merge${modifier ? ` ${modifier}` : ""}${roadName}`.trim();
  if (type === "fork") return `Keep${modifier ? ` ${modifier}` : ""}${roadName}`.trim();
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

export const fetchBrowserRoute = async (
  origin: RoutePoint,
  station: StationWithPrices,
  signal?: AbortSignal
): Promise<RouteData> => {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lng},${origin.lat};${station.lng},${station.lat}` +
    `?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error("Routing service unavailable");
    }

    const data = await response.json();
    const route = data.routes?.[0] as OsrmRoute | undefined;

    if (!route?.geometry?.coordinates?.length) {
      throw new Error("No route found");
    }

    const steps: RouteStep[] =
      route.legs?.flatMap((leg) =>
        (leg.steps ?? []).map((step) => {
          const location = step.maneuver?.location ?? [station.lng, station.lat];
          return {
            instruction: formatInstruction(step),
            distance: step.distance ?? 0,
            duration: step.duration ?? 0,
            location: { lat: location[1], lng: location[0] },
            roadName: step.name?.trim() || undefined,
            maneuverType: step.maneuver?.type,
          };
        })
      ) ?? [];

    return {
      destinationStationId: station.id,
      origin,
      destination: { lat: station.lat, lng: station.lng },
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: route.distance,
      duration: route.duration,
      steps,
    };
  } catch {
    return buildLocalRoute(origin, station);
  }
};

export const getActiveStepIndex = (
  currentPosition: RoutePoint,
  route: RouteData,
  previousIndex: number
): number => {
  if (!route.steps.length) return 0;

  const clampedPrevious = Math.max(0, Math.min(previousIndex, route.steps.length - 1));
  let nextIndex = clampedPrevious;

  for (let index = clampedPrevious; index < route.steps.length; index += 1) {
    const step = route.steps[index];
    const distanceToStepMeters =
      haversineDistance(
        currentPosition.lat,
        currentPosition.lng,
        step.location.lat,
        step.location.lng
      ) * 1000;

    if (distanceToStepMeters < 120) {
      nextIndex = Math.min(index + 1, route.steps.length - 1);
    } else {
      break;
    }
  }

  return nextIndex;
};
