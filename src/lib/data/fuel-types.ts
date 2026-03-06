import type { FuelType, FuelTypeId } from "@/lib/types";

export const FUEL_TYPES: FuelType[] = [
  { id: "u91", label: "Unleaded 91", shortLabel: "U91", category: "standard", isAlternative: false },
  { id: "e10", label: "E10", shortLabel: "E10", category: "standard", isAlternative: false },
  { id: "p95", label: "Premium 95", shortLabel: "P95", category: "premium", isAlternative: false },
  { id: "p98", label: "Premium 98", shortLabel: "P98", category: "premium", isAlternative: false },
  { id: "diesel", label: "Diesel", shortLabel: "DSL", category: "diesel", isAlternative: false },
  { id: "premium_diesel", label: "Premium Diesel", shortLabel: "P.DSL", category: "diesel", isAlternative: false },
  { id: "lpg", label: "LPG", shortLabel: "LPG", category: "gas", isAlternative: false },
  { id: "hydrogen", label: "Hydrogen", shortLabel: "H₂", category: "alternative", isAlternative: true },
  { id: "ev", label: "EV Charging", shortLabel: "EV", category: "alternative", isAlternative: true },
];

export const STANDARD_FUEL_TYPES = FUEL_TYPES.filter((f) => !f.isAlternative);
export const ALTERNATIVE_FUEL_TYPES = FUEL_TYPES.filter((f) => f.isAlternative);

export const getFuelType = (id: FuelTypeId): FuelType => {
  return FUEL_TYPES.find((f) => f.id === id)!;
};

export const FUEL_TYPE_MAP: Record<FuelTypeId, FuelType> = Object.fromEntries(
  FUEL_TYPES.map((f) => [f.id, f])
) as Record<FuelTypeId, FuelType>;
