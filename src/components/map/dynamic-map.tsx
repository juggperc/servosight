"use client";

import dynamic from "next/dynamic";
import type { RouteData, StationWithPrices } from "@/lib/types";

const MapView = dynamic(() => import("./map-view").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-ping rounded-full bg-foreground/10" />
          <div className="absolute inset-1 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground/70">Loading map</p>
          <div className="flex gap-1">
            <div className="h-1 w-1 animate-pulse-soft rounded-full bg-foreground/30" style={{ animationDelay: "0ms" }} />
            <div className="h-1 w-1 animate-pulse-soft rounded-full bg-foreground/30" style={{ animationDelay: "200ms" }} />
            <div className="h-1 w-1 animate-pulse-soft rounded-full bg-foreground/30" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </div>
    </div>
  ),
});

type DynamicMapProps = {
  onStationSelect?: (station: StationWithPrices) => void;
  activeRoute?: RouteData | null;
};

export const DynamicMap = ({ onStationSelect, activeRoute }: DynamicMapProps) => {
  return <MapView onStationSelect={onStationSelect} activeRoute={activeRoute} />;
};
