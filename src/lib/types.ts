export type FuelTypeId =
  | "u91"
  | "e10"
  | "p95"
  | "p98"
  | "diesel"
  | "premium_diesel"
  | "lpg"
  | "hydrogen"
  | "ev";

export type FuelCategory = "standard" | "premium" | "diesel" | "gas" | "alternative";

export type FuelType = {
  id: FuelTypeId;
  label: string;
  shortLabel: string;
  category: FuelCategory;
  isAlternative: boolean;
};

export type Station = {
  id: string;
  name: string;
  brand: string;
  address: string;
  suburb: string;
  state: string;
  lat: number;
  lng: number;
  fuelTypes: FuelTypeId[];
  hasHydrogen: boolean;
  hasEv: boolean;
};

export type PriceReport = {
  id: string;
  stationId: string;
  fuelType: FuelTypeId;
  price: number; // price in tenths of a cent (e.g. 1802 = 180.2c/L)
  reportedAt: string;
};

export type StationWithPrices = Station & {
  prices: Record<FuelTypeId, { price: number; reportedAt: string } | undefined>;
  cheapestPrice?: number;
  distance?: number;
};

export type RouteStep = {
  instruction: string;
  distance: number;
  duration: number;
};

export type RouteData = {
  destinationStationId: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  geometry: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
};
