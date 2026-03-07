"use client";

import dynamic from "next/dynamic";
import type { StationWithPrices } from "@/lib/types";
import { motion } from "motion/react";
import { appleSpring } from "@/lib/motion";

const MapView = dynamic(() => import("./map-view").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={appleSpring}
        className="glass-panel-strong flex flex-col items-center gap-4 rounded-[1.8rem] px-8 py-7"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.8, ease: "linear" }}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500"
        >
          <div className="absolute inset-0 animate-pulse-soft rounded-full bg-blue-500/10" />
          <div className="absolute inset-2 rounded-full border-2 border-current/20 border-t-current" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground/80">Loading map</p>
          <div className="flex gap-1">
            <div className="h-1 w-1 animate-pulse-soft rounded-full bg-foreground/30" style={{ animationDelay: "0ms" }} />
            <div className="h-1 w-1 animate-pulse-soft rounded-full bg-foreground/30" style={{ animationDelay: "200ms" }} />
            <div className="h-1 w-1 animate-pulse-soft rounded-full bg-foreground/30" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </motion.div>
    </div>
  ),
});

type DynamicMapProps = {
  onStationSelect?: (station: StationWithPrices) => void;
  navLocation?: { lat: number; lng: number } | null;
  compactOverlay?: boolean;
};

export const DynamicMap = ({ onStationSelect, navLocation, compactOverlay }: DynamicMapProps) => {
  return (
    <MapView
      onStationSelect={onStationSelect}
      navLocation={navLocation}
      compactOverlay={compactOverlay}
    />
  );
};
