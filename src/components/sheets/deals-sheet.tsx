"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STANDARD_FUEL_TYPES } from "@/lib/data/fuel-types";
import type { StationWithPrices, FuelTypeId, FreshnessFilterId } from "@/lib/types";
import { DealCard } from "@/components/cards/deal-card";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { Locate, Loader2, Flame } from "lucide-react";
import { FreshnessFilterBar } from "@/components/filters/freshness-filter-bar";
import { filterStationsByFreshness } from "@/lib/freshness";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

type DealsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const DealsSheet = ({ open, onOpenChange }: DealsSheetProps) => {
  const { lat, lng, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
  const [deals, setDeals] = useState<StationWithPrices[]>([]);
  const [fuelType, setFuelType] = useState<FuelTypeId>("u91");
  const [radius, setRadius] = useState(25);
  const [freshness, setFreshness] = useState<FreshnessFilterId>("any");
  const [searching, setSearching] = useState(false);
  const [averagePrice, setAveragePrice] = useState(0);

  const [countrywideMode] = useLocalStorage<boolean>("servo-countrywide-mode", true);

  const fetchDeals = useCallback(async () => {
    if (!lat || !lng) return;
    if (!countrywideMode) {
      setDeals([]);
      setAveragePrice(0);
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({
        fuelType,
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
      });

      const promises = [
        fetch(`/api/stations?${params}`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/petrolspy?lat=${lat}&lng=${lng}`).then(async (r) => {
          if (!r.ok) return [];
          const data = await r.json();
          return Array.isArray(data) ? data : data?.stations ?? [];
        })
      ];

      const results = await Promise.allSettled(promises);
      let combinedStations: StationWithPrices[] = [];

      for (const result of results) {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          combinedStations = [...combinedStations, ...result.value];
        }
      }

      const data = filterStationsByFreshness(
        combinedStations,
        fuelType,
        freshness
      );
      const withPrices = data.filter((s) => s.cheapestPrice !== undefined);

      const avg =
        withPrices.length > 0
          ? withPrices.reduce((sum, s) => sum + (s.cheapestPrice ?? 0), 0) / withPrices.length
          : 0;
      setAveragePrice(avg);

      withPrices.sort((a, b) => (a.cheapestPrice ?? Infinity) - (b.cheapestPrice ?? Infinity));
      setDeals(withPrices.slice(0, 10));
    } finally {
      setSearching(false);
    }
  }, [freshness, fuelType, lat, lng, radius, countrywideMode]);

  useEffect(() => {
    if (open && !lat && !lng) {
      requestLocation();
    }
  }, [open, lat, lng, requestLocation]);

  useEffect(() => {
    if (lat && lng && open) {
      fetchDeals();
    }
  }, [lat, lng, open, fetchDeals]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] md:mx-auto md:max-w-lg md:rounded-t-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Best Deals
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-8">
          <div className="flex gap-2">
            <Select value={fuelType} onValueChange={(v) => setFuelType(v as FuelTypeId)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STANDARD_FUEL_TYPES.map((fuel) => (
                  <SelectItem key={fuel.id} value={fuel.id}>
                    {fuel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={radius.toString()} onValueChange={(v) => setRadius(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FreshnessFilterBar value={freshness} onChange={setFreshness} />

          {!lat && !lng && (
            <div className="flex flex-col items-center gap-3 py-8">
              {geoLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Locate className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {geoError || "Enable location to find deals near you"}
                  </p>
                  <Button variant="outline" size="sm" onClick={requestLocation}>
                    Enable Location
                  </Button>
                </>
              )}
            </div>
          )}

          {searching && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!searching && deals.length > 0 && (
            <div className="space-y-3">
              {deals.map((station, idx) => (
                <DealCard
                  key={station.id}
                  station={station}
                  fuelType={fuelType}
                  rank={idx + 1}
                  averagePrice={averagePrice}
                  index={idx}
                />
              ))}
            </div>
          )}

          {!searching && lat && lng && deals.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No deals found within {radius} km
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setRadius((r) => Math.min(r * 2, 200))}
              >
                Expand search radius
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
