"use client";

import { Crosshair, Loader2 } from "lucide-react";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useEffect } from "react";

type LocateButtonProps = {
  onLocate: (lat: number, lng: number) => void;
};

export const LocateButton = ({ onLocate }: LocateButtonProps) => {
  const { lat, lng, loading, error, requestLocation } = useGeolocation();

  useEffect(() => {
    if (lat && lng) {
      onLocate(lat, lng);
    }
  }, [lat, lng, onLocate]);

  const hasLocation = lat !== null && lng !== null;

  return (
    <button
      onClick={requestLocation}
      disabled={loading}
      aria-label="Find my location"
      tabIndex={0}
      className="absolute right-4 bottom-28 z-[1000] flex h-12 w-12 items-center justify-center rounded-2xl bg-background/90 shadow-lg ring-1 ring-border/60 backdrop-blur-sm transition-all duration-200 ease-out hover:shadow-xl active:scale-90 disabled:opacity-50 md:bottom-8"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="relative">
          {hasLocation && (
            <div className="absolute -inset-1 animate-ping rounded-full bg-blue-500/20" />
          )}
          <Crosshair
            className={`relative h-5 w-5 transition-colors ${
              error ? "text-destructive" : hasLocation ? "text-blue-500" : "text-foreground"
            }`}
          />
        </div>
      )}
    </button>
  );
};
