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
import { StationCard } from "@/components/cards/station-card";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { Locate, Loader2 } from "lucide-react";
import { FreshnessFilterBar } from "@/components/filters/freshness-filter-bar";
import { filterStationsByFreshness } from "@/lib/freshness";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

type SearchSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SearchSheet = ({ open, onOpenChange }: SearchSheetProps) => {
  const { lat, lng, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
  const [stations, setStations] = useState<StationWithPrices[]>([]);
  const [fuelType, setFuelType] = useState<FuelTypeId>("u91");
  const [radius, setRadius] = useState(10);
  const [freshness, setFreshness] = useState<FreshnessFilterId>("any");
  const [searching, setSearching] = useState(false);

  const [countrywideMode] = useLocalStorage<boolean>("servo-countrywide-mode", true);

  const handleSearch = useCallback(async () => {
    if (!lat || !lng) return;
    if (!countrywideMode) {
      setStations([]);
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
      data.sort((a, b) => (a.cheapestPrice ?? Infinity) - (b.cheapestPrice ?? Infinity));
      setStations(data);
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
      handleSearch();
    }
  }, [lat, lng, open, handleSearch]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] md:mx-auto md:max-w-lg md:rounded-t-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle>Cheapest Near You</DrawerTitle>
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
                <SelectItem value="5">5 km</SelectItem>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
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
                    {geoError || "Enable location to find nearby stations"}
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

          {!searching && stations.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                {stations.length} station{stations.length !== 1 ? "s" : ""} within {radius} km
              </p>
              {stations.map((station, idx) => (
                <StationCard
                  key={station.id}
                  station={station}
                  fuelType={fuelType}
                  showDistance
                  index={idx}
                />
              ))}
            </div>
          )}

          {!searching && lat && lng && stations.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No stations found within {radius} km</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setRadius((r) => Math.min(r * 2, 100))}
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
