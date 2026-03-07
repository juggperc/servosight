"use client";

import { Crosshair, Loader2 } from "lucide-react";
import { useAppHaptics } from "@/components/haptics-provider";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { softSpring } from "@/lib/motion";

type LocateButtonProps = {
  onLocate: (lat: number, lng: number) => void;
};

export const LocateButton = ({ onLocate }: LocateButtonProps) => {
  const haptics = useAppHaptics();
  const { lat, lng, loading, error, requestLocation } = useGeolocation();
  const previousLocationRef = useRef<string | null>(null);
  const previousErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (lat && lng) {
      onLocate(lat, lng);
    }
  }, [lat, lng, onLocate]);

  useEffect(() => {
    if (lat === null || lng === null) return;

    const nextLocation = `${lat}:${lng}`;
    if (previousLocationRef.current === nextLocation) return;

    previousLocationRef.current = nextLocation;
    haptics.locateSuccess();
  }, [haptics, lat, lng]);

  useEffect(() => {
    if (!error || previousErrorRef.current === error) return;

    previousErrorRef.current = error;
    haptics.warning();
  }, [error, haptics]);

  const hasLocation = lat !== null && lng !== null;

  return (
    <motion.button
      onClick={() => {
        haptics.locateRequest();
        requestLocation();
      }}
      disabled={loading}
      aria-label="Find my location"
      tabIndex={0}
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.96 }}
      transition={softSpring}
      className="glass-panel absolute right-4 bottom-32 z-[1000] flex h-12 w-12 items-center justify-center rounded-[1.35rem] text-foreground transition-all disabled:opacity-50 md:bottom-12"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="relative">
          {hasLocation && (
            <div className="absolute -inset-1 animate-ping rounded-full bg-blue-500/20" />
          )}
          <Crosshair
            className={`relative h-5 w-5 transition-colors ${error ? "text-destructive" : hasLocation ? "text-blue-500" : "text-foreground"
              }`}
          />
        </div>
      )}
    </motion.button>
  );
};
