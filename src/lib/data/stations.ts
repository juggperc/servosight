import type { Station, PriceReport, FuelTypeId } from "@/lib/types";

const standardFuels: FuelTypeId[] = ["u91", "e10", "p95", "p98", "diesel", "premium_diesel", "lpg"];
const basicFuels: FuelTypeId[] = ["u91", "e10", "p95", "diesel"];
const premiumFuels: FuelTypeId[] = ["u91", "e10", "p95", "p98", "diesel", "premium_diesel"];

export const SEED_STATIONS: Station[] = [
  // Sydney
  { id: "s01", name: "BP Surry Hills", brand: "BP", address: "123 Crown St", suburb: "Surry Hills", state: "NSW", lat: -33.8830, lng: 151.2130, fuelTypes: standardFuels, hasHydrogen: false, hasEv: true },
  { id: "s02", name: "Shell Bondi Junction", brand: "Shell", address: "45 Oxford St", suburb: "Bondi Junction", state: "NSW", lat: -33.8930, lng: 151.2474, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },
  { id: "s03", name: "Caltex Newtown", brand: "Caltex", address: "280 King St", suburb: "Newtown", state: "NSW", lat: -33.8976, lng: 151.1792, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },
  { id: "s04", name: "7-Eleven Parramatta", brand: "7-Eleven", address: "12 Church St", suburb: "Parramatta", state: "NSW", lat: -33.8148, lng: 151.0017, fuelTypes: standardFuels, hasHydrogen: false, hasEv: false },
  { id: "s05", name: "Ampol Chatswood", brand: "Ampol", address: "88 Pacific Hwy", suburb: "Chatswood", state: "NSW", lat: -33.7968, lng: 151.1838, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: true },
  { id: "s06", name: "United Mascot", brand: "United", address: "5 Botany Rd", suburb: "Mascot", state: "NSW", lat: -33.9260, lng: 151.1870, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },

  // Melbourne
  { id: "m01", name: "BP South Yarra", brand: "BP", address: "101 Toorak Rd", suburb: "South Yarra", state: "VIC", lat: -37.8388, lng: 144.9920, fuelTypes: standardFuels, hasHydrogen: false, hasEv: true },
  { id: "m02", name: "Shell Richmond", brand: "Shell", address: "33 Bridge Rd", suburb: "Richmond", state: "VIC", lat: -37.8180, lng: 144.9921, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },
  { id: "m03", name: "Caltex Carlton", brand: "Caltex", address: "200 Lygon St", suburb: "Carlton", state: "VIC", lat: -37.7990, lng: 144.9662, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },
  { id: "m04", name: "7-Eleven Footscray", brand: "7-Eleven", address: "55 Barkly St", suburb: "Footscray", state: "VIC", lat: -37.8003, lng: 144.8997, fuelTypes: standardFuels, hasHydrogen: false, hasEv: false },
  { id: "m05", name: "Ampol St Kilda", brand: "Ampol", address: "10 Fitzroy St", suburb: "St Kilda", state: "VIC", lat: -37.8600, lng: 144.9740, fuelTypes: premiumFuels, hasHydrogen: true, hasEv: true },
  { id: "m06", name: "United Prahran", brand: "United", address: "22 Chapel St", suburb: "Prahran", state: "VIC", lat: -37.8504, lng: 144.9920, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },

  // Brisbane
  { id: "b01", name: "BP Fortitude Valley", brand: "BP", address: "60 Wickham St", suburb: "Fortitude Valley", state: "QLD", lat: -27.4570, lng: 153.0350, fuelTypes: standardFuels, hasHydrogen: false, hasEv: true },
  { id: "b02", name: "Shell South Brisbane", brand: "Shell", address: "44 Vulture St", suburb: "South Brisbane", state: "QLD", lat: -27.4790, lng: 153.0170, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },
  { id: "b03", name: "Caltex Woolloongabba", brand: "Caltex", address: "150 Stanley St", suburb: "Woolloongabba", state: "QLD", lat: -27.4880, lng: 153.0380, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },
  { id: "b04", name: "7-Eleven Toowong", brand: "7-Eleven", address: "28 Coronation Dr", suburb: "Toowong", state: "QLD", lat: -27.4850, lng: 152.9840, fuelTypes: standardFuels, hasHydrogen: false, hasEv: false },
  { id: "b05", name: "Ampol Chermside", brand: "Ampol", address: "5 Gympie Rd", suburb: "Chermside", state: "QLD", lat: -27.3860, lng: 153.0310, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },

  // Perth
  { id: "p01", name: "BP Subiaco", brand: "BP", address: "190 Rokeby Rd", suburb: "Subiaco", state: "WA", lat: -31.9484, lng: 115.8270, fuelTypes: standardFuels, hasHydrogen: false, hasEv: true },
  { id: "p02", name: "Shell Nedlands", brand: "Shell", address: "72 Stirling Hwy", suburb: "Nedlands", state: "WA", lat: -31.9810, lng: 115.8100, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },
  { id: "p03", name: "Caltex Victoria Park", brand: "Caltex", address: "44 Albany Hwy", suburb: "Victoria Park", state: "WA", lat: -31.9750, lng: 115.8930, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },
  { id: "p04", name: "Ampol Fremantle", brand: "Ampol", address: "18 High St", suburb: "Fremantle", state: "WA", lat: -32.0550, lng: 115.7460, fuelTypes: premiumFuels, hasHydrogen: true, hasEv: true },
  { id: "p05", name: "United Morley", brand: "United", address: "66 Walter Rd", suburb: "Morley", state: "WA", lat: -31.8960, lng: 115.9050, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },

  // Adelaide
  { id: "a01", name: "BP Norwood", brand: "BP", address: "100 The Parade", suburb: "Norwood", state: "SA", lat: -34.9210, lng: 138.6310, fuelTypes: standardFuels, hasHydrogen: false, hasEv: true },
  { id: "a02", name: "Shell Unley", brand: "Shell", address: "55 Unley Rd", suburb: "Unley", state: "SA", lat: -34.9490, lng: 138.6010, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },
  { id: "a03", name: "OTR Prospect", brand: "OTR", address: "30 Prospect Rd", suburb: "Prospect", state: "SA", lat: -34.8870, lng: 138.5980, fuelTypes: standardFuels, hasHydrogen: false, hasEv: false },
  { id: "a04", name: "Ampol Glenelg", brand: "Ampol", address: "12 Jetty Rd", suburb: "Glenelg", state: "SA", lat: -34.9790, lng: 138.5140, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: true },

  // Canberra
  { id: "c01", name: "BP Civic", brand: "BP", address: "22 Northbourne Ave", suburb: "Civic", state: "ACT", lat: -35.2780, lng: 149.1310, fuelTypes: standardFuels, hasHydrogen: false, hasEv: true },
  { id: "c02", name: "Shell Woden", brand: "Shell", address: "5 Melrose Dr", suburb: "Woden", state: "ACT", lat: -35.3460, lng: 149.0870, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },
  { id: "c03", name: "Caltex Belconnen", brand: "Caltex", address: "88 Benjamin Way", suburb: "Belconnen", state: "ACT", lat: -35.2390, lng: 149.0660, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },

  // Gold Coast
  { id: "g01", name: "BP Surfers Paradise", brand: "BP", address: "44 Cavill Ave", suburb: "Surfers Paradise", state: "QLD", lat: -28.0025, lng: 153.4296, fuelTypes: standardFuels, hasHydrogen: false, hasEv: true },
  { id: "g02", name: "Shell Broadbeach", brand: "Shell", address: "18 Gold Coast Hwy", suburb: "Broadbeach", state: "QLD", lat: -28.0280, lng: 153.4310, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },
  { id: "g03", name: "Caltex Southport", brand: "Caltex", address: "55 Nerang St", suburb: "Southport", state: "QLD", lat: -27.9680, lng: 153.3970, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },

  // Darwin
  { id: "d01", name: "BP Stuart Park", brand: "BP", address: "10 Stuart Hwy", suburb: "Stuart Park", state: "NT", lat: -12.4430, lng: 130.8430, fuelTypes: standardFuels, hasHydrogen: false, hasEv: false },
  { id: "d02", name: "Shell Palmerston", brand: "Shell", address: "25 Chung Wah Tce", suburb: "Palmerston", state: "NT", lat: -12.4870, lng: 130.9830, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },

  // Hobart
  { id: "h01", name: "BP Sandy Bay", brand: "BP", address: "66 Sandy Bay Rd", suburb: "Sandy Bay", state: "TAS", lat: -42.8920, lng: 147.3260, fuelTypes: standardFuels, hasHydrogen: false, hasEv: true },
  { id: "h02", name: "Shell Moonah", brand: "Shell", address: "14 Main Rd", suburb: "Moonah", state: "TAS", lat: -42.8510, lng: 147.3010, fuelTypes: premiumFuels, hasHydrogen: false, hasEv: false },
  { id: "h03", name: "United Glenorchy", brand: "United", address: "40 Main Rd", suburb: "Glenorchy", state: "TAS", lat: -42.8310, lng: 147.2860, fuelTypes: basicFuels, hasHydrogen: false, hasEv: false },
];

const randomPrice = (base: number, variance: number): number => {
  return Math.round(base + (Math.random() - 0.5) * variance);
};

const hoursAgo = (hours: number): string => {
  return new Date(Date.now() - hours * 3600000).toISOString();
};

export const generateSeedPrices = (): PriceReport[] => {
  const prices: PriceReport[] = [];
  let id = 1;

  const basePrices: Record<string, number> = {
    u91: 1802,
    e10: 1772,
    p95: 1972,
    p98: 2038,
    diesel: 1821,
    premium_diesel: 1831,
    lpg: 1020,
  };

  for (const station of SEED_STATIONS) {
    for (const fuelType of station.fuelTypes) {
      if (fuelType === "hydrogen" || fuelType === "ev") continue;
      const base = basePrices[fuelType] ?? 1800;
      prices.push({
        id: `pr${id++}`,
        stationId: station.id,
        fuelType: fuelType as FuelTypeId,
        price: randomPrice(base, 200),
        reportedAt: hoursAgo(Math.random() * 48),
      });
    }
  }

  return prices;
};
