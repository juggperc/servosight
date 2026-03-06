import type { RouteData, RouteStep, StationWithPrices } from "@/lib/types";
import { haversineDistance } from "@/lib/utils";

type Point = { lat: number; lng: number };

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

const getBearing = (from: Point, to: Point): number => {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLng = toRadians(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
};

const getHeadingLabel = (bearing: number): string => {
  const headings = [
    "north",
    "north-east",
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
  ];

  return headings[Math.round(bearing / 45) % headings.length];
};

const interpolatePoint = (from: Point, to: Point, t: number): Point => ({
  lat: from.lat + (to.lat - from.lat) * t,
  lng: from.lng + (to.lng - from.lng) * t,
});

const offsetPoint = (point: Point, perpendicularBearing: number, offsetKm: number): Point => {
  const latOffset = (offsetKm / 111) * Math.cos(toRadians(perpendicularBearing));
  const lngOffset =
    (offsetKm / (111 * Math.cos(toRadians(point.lat)))) *
    Math.sin(toRadians(perpendicularBearing));

  return {
    lat: point.lat + latOffset,
    lng: point.lng + lngOffset,
  };
};

const estimateSpeedKmh = (distanceKm: number): number => {
  if (distanceKm < 5) return 35;
  if (distanceKm < 20) return 50;
  if (distanceKm < 80) return 72;
  return 92;
};

const createSteps = (
  from: Point,
  destination: Point,
  station: StationWithPrices,
  distanceKm: number,
  durationSeconds: number
): RouteStep[] => {
  const initialBearing = getBearing(from, destination);
  const halfwayMeters = Math.round((distanceKm * 1000) / 2);
  const heading = getHeadingLabel(initialBearing);

  const steps: RouteStep[] = [
    {
      instruction: `Head ${heading}`,
      distance: Math.max(250, Math.round(distanceKm * 1000 * 0.18)),
      duration: Math.max(40, Math.round(durationSeconds * 0.18)),
    },
  ];

  if (distanceKm > 3) {
    steps.push({
      instruction: `Continue toward ${station.suburb || station.state}`,
      distance: Math.max(400, halfwayMeters),
      duration: Math.max(60, Math.round(durationSeconds * 0.56)),
    });
  }

  steps.push({
    instruction: `Arrive at ${station.name}`,
    distance: Math.max(120, Math.round(distanceKm * 1000 * 0.14)),
    duration: Math.max(20, Math.round(durationSeconds * 0.14)),
  });

  return steps;
};

export const buildLocalRoute = (
  origin: Point,
  station: StationWithPrices
): RouteData => {
  const destination = { lat: station.lat, lng: station.lng };
  const directDistanceKm = haversineDistance(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng
  );

  const roadDistanceKm = directDistanceKm * (directDistanceKm < 6 ? 1.18 : 1.1);
  const durationSeconds = (roadDistanceKm / estimateSpeedKmh(roadDistanceKm)) * 3600;

  const bearing = getBearing(origin, destination);
  const midpoint = interpolatePoint(origin, destination, 0.5);
  const controlOffsetKm = Math.min(Math.max(directDistanceKm * 0.08, 0.18), 2.4);
  const controlPoint = offsetPoint(midpoint, bearing + 90, controlOffsetKm);

  const pointOne = interpolatePoint(origin, controlPoint, 0.45);
  const pointTwo = interpolatePoint(controlPoint, destination, 0.55);

  const geometry: [number, number][] = [
    [origin.lat, origin.lng],
    [pointOne.lat, pointOne.lng],
    [controlPoint.lat, controlPoint.lng],
    [pointTwo.lat, pointTwo.lng],
    [destination.lat, destination.lng],
  ];

  return {
    destinationStationId: station.id,
    origin,
    destination,
    geometry,
    distance: Math.round(roadDistanceKm * 1000),
    duration: Math.round(durationSeconds),
    steps: createSteps(origin, destination, station, roadDistanceKm, durationSeconds),
  };
};
