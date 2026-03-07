"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STANDARD_FUEL_TYPES } from "@/lib/data/fuel-types";
import type { Station, FuelTypeId } from "@/lib/types";
import { Check, Loader2, MapPin } from "lucide-react";

type SubmitSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export const SubmitSheet = ({ open, onOpenChange, onSuccess }: SubmitSheetProps) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [selectedFuel, setSelectedFuel] = useState<FuelTypeId>("u91");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/stations")
        .then((r) => r.json())
        .then((data) => setStations(data));
    }
  }, [open]);

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.suburb.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchLocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLng(pos.coords.longitude);
        setGeoLoading(false);
        setUseCurrentLocation(true);
        setSelectedStation("NEW_STATION");
        setSearchQuery("");
      },
      () => {
        setGeoLoading(false);
        alert("Failed to get location.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedStation || !selectedFuel || !price) return;

    if (selectedStation === "NEW_STATION" && (!geoLat || !geoLng)) {
      return;
    }

    const priceNum = Math.round(parseFloat(price) * 10);
    if (isNaN(priceNum) || priceNum < 500 || priceNum > 5000) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: selectedStation,
          fuelType: selectedFuel,
          price: priceNum,
          lat: geoLat || undefined,
          lng: geoLng || undefined,
          stationName: selectedStation === "NEW_STATION" ? (locationName || "User Station") : undefined
        }),
      });

      if (res.ok) {
        setSuccess(true);
        onSuccess?.();
        setTimeout(() => {
          setSuccess(false);
          setSelectedStation("");
          setPrice("");
          setUseCurrentLocation(false);
          setGeoLat(null);
          setGeoLng(null);
          setLocationName("");
          onOpenChange(false);
        }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedStation, selectedFuel, price, geoLat, geoLng, locationName, onOpenChange, onSuccess]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] md:mx-auto md:max-w-lg md:rounded-t-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle>Report a Price</DrawerTitle>
        </DrawerHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 px-4 pb-8 pt-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Price reported. Thanks!</p>
          </div>
        ) : (
          <div className="space-y-5 overflow-y-auto px-4 pb-8">
            <div className="space-y-4">
              <Label htmlFor="station-search">Station</Label>

              {!useCurrentLocation ? (
                <>
                  <Input
                    id="station-search"
                    placeholder="Search station name or suburb..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                      {filteredStations.slice(0, 10).map((station) => (
                        <button
                          key={station.id}
                          onClick={() => {
                            setSelectedStation(station.id);
                            setSearchQuery(station.name);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{station.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {station.suburb}, {station.state}
                            </p>
                          </div>
                          {selectedStation === station.id && (
                            <Check className="h-4 w-4 shrink-0 text-green-500" />
                          )}
                        </button>
                      ))}
                      {filteredStations.length === 0 && (
                        <p className="px-3 py-3 text-center text-xs text-muted-foreground">
                          No stations found
                        </p>
                      )}
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">Can't find it? </span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={fetchLocation} disabled={geoLoading}>
                      {geoLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MapPin className="mr-1 h-3 w-3" />} Drop a pin here
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border bg-accent/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-500 flex items-center"><MapPin className="mr-2 h-4 w-4" /> Dropping pin at current location</span>
                    <Button variant="ghost" size="sm" onClick={() => { setUseCurrentLocation(false); setSelectedStation(""); }} className="h-6 px-2 text-xs">Cancel</Button>
                  </div>
                  <Input
                    placeholder="Station Name (e.g. 7-Eleven)"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="bg-background"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select
                value={selectedFuel}
                onValueChange={(v) => setSelectedFuel(v as FuelTypeId)}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="price-input">Price (cents per litre)</Label>
              <div className="relative">
                <Input
                  id="price-input"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="50"
                  max="500"
                  placeholder="e.g. 180.2"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ¢/L
                </span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selectedStation || !price || submitting || (selectedStation === "NEW_STATION" && !locationName)}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit Price
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
