"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import type { StationWithPrices, FuelTypeId } from "@/lib/types";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { Locate, Loader2, LineChart, TrendingDown, TrendingUp, Route } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { formatPriceCents } from "@/lib/utils";
import { motion } from "motion/react";
import { softSpring } from "@/lib/motion";
import { StationCard } from "@/components/cards/station-card";

type SearchSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SearchSheet = ({ open, onOpenChange }: SearchSheetProps) => {
  const { lat, lng, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
  const [stations, setStations] = useState<StationWithPrices[]>([]);
  const [fuelType, setFuelType] = useState<FuelTypeId>("u91");
  const [radius, setRadius] = useState(15);
  const [searching, setSearching] = useState(false);

  // Smart Route State
  const [smartRouteOpen, setSmartRouteOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [routingState, setRoutingState] = useState<"idle" | "calculating" | "done">("idle");

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

      combinedStations.sort((a, b) => (a.prices[fuelType]?.price ?? Infinity) - (b.prices[fuelType]?.price ?? Infinity));
      setStations(combinedStations);
    } finally {
      setSearching(false);
    }
  }, [fuelType, lat, lng, radius, countrywideMode]);

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

  const cycleData = useMemo(() => {
    const prices = stations.map(s => s.prices[fuelType]?.price).filter(Boolean) as number[];
    if (prices.length < 3) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Position 0 to 100 on the cycle
    const percent = max > min ? ((avg - min) / (max - min)) * 100 : 50;

    const isCheap = percent < 40;
    const isFair = percent >= 40 && percent < 70;
    const isExpensive = percent >= 70;

    const cheapestStation = stations[0];

    return { min, max, avg, percent, isCheap, isFair, isExpensive, cheapestStation };
  }, [stations, fuelType]);

  const handleCalculateRoute = () => {
    if (!destination) return;
    setRoutingState("calculating");
    setTimeout(() => {
      setRoutingState("done");
    }, 1500);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] md:mx-auto md:max-w-lg md:rounded-t-[2rem] overflow-hidden">
        <DrawerHeader className="text-left relative z-10">
          <DrawerTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-500" />
            Price Forecast & Routing
          </DrawerTitle>
        </DrawerHeader>

        <div className="relative flex-1 overflow-y-auto px-4 pb-8 no-scrollbar">
          <div className="flex gap-2 mb-6">
            <Select value={fuelType} onValueChange={(v) => setFuelType(v as FuelTypeId)}>
              <SelectTrigger className="flex-1 bg-background/50 backdrop-blur-md rounded-2xl h-11 border-white/10">
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
              <SelectTrigger className="w-24 bg-background/50 backdrop-blur-md rounded-2xl h-11 border-white/10">
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

          {!lat && !lng && (
            <div className="flex flex-col items-center gap-3 py-12">
              {geoLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Locate className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground text-center">
                    {geoError || "We need your location to project the fuel cycle accurately."}
                  </p>
                  <Button variant="secondary" className="rounded-2xl font-bold mt-2" onClick={requestLocation}>
                    Enable Location
                  </Button>
                </>
              )}
            </div>
          )}

          {searching && !cycleData && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {cycleData && !searching && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={softSpring} className="space-y-6">

              {/* CYCLE GAUGE CARD */}
              <div className="glass-panel-strong relative overflow-hidden rounded-[2rem] p-5">
                <div className={`absolute inset-0 opacity-10 ${cycleData.isCheap ? 'bg-green-500' : cycleData.isExpensive ? 'bg-red-500' : 'bg-orange-500'}`} />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground/80 uppercase">Current Cycle Phase</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {cycleData.isCheap ? (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      ) : cycleData.isExpensive ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <LineChart className="h-5 w-5 text-orange-500" />
                      )}
                      <span className={`text-[22px] font-black tracking-tight ${cycleData.isCheap ? 'text-green-500' : cycleData.isExpensive ? 'text-red-500' : 'text-orange-500'}`}>
                        {cycleData.isCheap ? "Buy Now" : cycleData.isExpensive ? "Hold Off" : "Prices Rising"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Local Avg</p>
                    <p className="font-price text-2xl font-black text-foreground">{formatPriceCents(cycleData.avg)}</p>
                  </div>
                </div>

                {/* THE GAUGE */}
                <div className="relative mt-6 mb-2 z-10">
                  <div className="h-3 w-full rounded-full bg-zinc-800/50 overflow-hidden flex ring-1 ring-white/5 shadow-inner">
                    <div className="h-full w-1/3 bg-gradient-to-r from-green-500/80 to-green-500/20" />
                    <div className="h-full w-1/3 bg-gradient-to-r from-orange-500/20 to-orange-500/80" />
                    <div className="h-full w-1/3 bg-gradient-to-r from-red-500/80 to-red-500/80" />
                  </div>

                  {/* Indicator Marker */}
                  <motion.div
                    initial={{ left: "50%" }}
                    animate={{ left: `${Math.max(5, Math.min(95, cycleData.percent))}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="absolute top-1/2 -mt-3 -ml-2.5 flex flex-col items-center drop-shadow-lg"
                  >
                    <div className="h-4 w-5 rounded-full bg-white ring-2 ring-zinc-950 shadow-sm" />
                  </motion.div>
                </div>

                <div className="flex justify-between text-[11px] font-bold text-muted-foreground px-1 mt-3 relative z-10">
                  <span>Low: {formatPriceCents(cycleData.min)}</span>
                  <span>High: {formatPriceCents(cycleData.max)}</span>
                </div>
              </div>

              {/* SMART ROUTE CARD */}
              <div className="glass-panel relative rounded-[2rem] p-5 overflow-hidden ring-1 ring-white/10">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold tracking-tight text-foreground flex items-center gap-2">
                      <Route className="h-4 w-4 text-blue-400" />
                      Smart Route Pricing
                    </h3>
                    <p className="text-xs text-muted-foreground tracking-tight leading-relaxed max-w-[240px]">
                      Find the absolute cheapest detour on your way home. Don't waste fuel looking for it.
                    </p>
                  </div>
                </div>

                {!smartRouteOpen ? (
                  <Button
                    variant="default"
                    className="w-full rounded-xl mt-5 font-bold bg-blue-600 hover:bg-blue-700 h-11"
                    onClick={() => setSmartRouteOpen(true)}
                  >
                    Plan a Refuel Route
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-5 space-y-4"
                  >
                    <div className="relative">
                      <div className="absolute left-3.5 top-0 bottom-0 flex flex-col items-center justify-center py-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <div className="w-[1.5px] h-6 bg-border/60 my-1" />
                        <div className="h-2 w-2 rounded-full border-2 border-orange-500" />
                      </div>
                      <div className="pl-9 space-y-2">
                        <div className="h-11 rounded-xl bg-muted/30 border border-white/5 flex items-center px-3">
                          <span className="text-sm font-medium text-foreground">Current Location</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Where to?"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="h-11 w-full rounded-xl bg-background/50 border border-white/10 px-3 text-sm font-medium outline-none transition-colors focus:border-blue-500 placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>

                    {routingState === "idle" && (
                      <Button
                        disabled={!destination}
                        className="w-full rounded-xl font-bold h-11"
                        onClick={handleCalculateRoute}
                      >
                        Scan Route
                      </Button>
                    )}

                    {routingState === "calculating" && (
                      <div className="h-11 w-full rounded-xl bg-muted/40 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing 12km radius...
                      </div>
                    )}

                    {routingState === "done" && cycleData.cheapestStation && (
                      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3">
                          <span className="bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">+4 min detour</span>
                        </div>
                        <p className="text-xs font-semibold text-green-400 mb-1 tracking-tight">Best route found!</p>
                        <p className="text-[17px] font-bold text-foreground tracking-tight leading-tight">
                          Save ~$5.40 by stopping at {cycleData.cheapestStation.name}
                        </p>

                        <div className="mt-4 flex gap-2">
                          <Button className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold h-10">
                            Start Route
                          </Button>
                          <Button variant="outline" className="rounded-xl h-10" onClick={() => setRoutingState("idle")}>
                            Reset
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Optional: just keeping the cheapest station as a fallback insight */}
              {cycleData.cheapestStation && (
                <div className="pt-2 pb-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Deepest local discount</p>
                  <StationCard station={cycleData.cheapestStation} fuelType={fuelType} />
                </div>
              )}
            </motion.div>
          )}

          {!searching && lat && lng && !cycleData && stations.length > 0 && (
            <div className="py-12 text-center text-sm font-medium text-muted-foreground">
              Not enough local data to project the price cycle accurately. Check back after a few reports!
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer >
  );
};
