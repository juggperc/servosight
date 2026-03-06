"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import type { RouteData, StationWithPrices, FuelTypeId } from "@/lib/types";
import { StationMarker } from "./station-marker";
import { LocateButton } from "./locate-button";
import { FuelFilter } from "./fuel-filter";

const LIGHT_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const AUSTRALIA_CENTER: L.LatLngExpression = [-28.0, 134.0];
const DEFAULT_ZOOM = 5;

type MapViewProps = {
  onStationSelect?: (station: StationWithPrices) => void;
  activeRoute?: RouteData | null;
  navLocation?: { lat: number; lng: number } | null;
};

const ThemeTileLayer = () => {
  const { resolvedTheme } = useTheme();
  const tileUrl = resolvedTheme === "dark" ? DARK_TILES : LIGHT_TILES;

  return <TileLayer attribution={ATTRIBUTION} url={tileUrl} />;
};

const FlyToLocation = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.5 });
  }, [map, lat, lng]);
  return null;
};

const RouteOverlay = ({ route }: { route: RouteData }) => {
  const map = useMap();

  useEffect(() => {
    if (!route.geometry.length) return;
    const bounds = L.latLngBounds(route.geometry);
    map.fitBounds(bounds, {
      padding: [48, 48],
      animate: true,
      duration: 1.2,
    });
  }, [map, route]);

  return (
    <>
      <Polyline
        positions={route.geometry}
        pathOptions={{
          color: "#0f172a",
          weight: 10,
          opacity: 0.12,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <Polyline
        positions={route.geometry}
        pathOptions={{
          color: "#3b82f6",
          weight: 6,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "14 12",
          className: "route-line-animated",
        }}
      />
      <CircleMarker
        center={[route.origin.lat, route.origin.lng]}
        radius={7}
        pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
      />
      <CircleMarker
        center={[route.destination.lat, route.destination.lng]}
        radius={8}
        pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#111827", fillOpacity: 1 }}
      />
    </>
  );
};

export const MapView = ({ onStationSelect, activeRoute, navLocation }: MapViewProps) => {
  const [stations, setStations] = useState<StationWithPrices[]>([]);
  const [selectedFuel, setSelectedFuel] = useState<FuelTypeId>("u91");
  const [showHydrogen, setShowHydrogen] = useState(false);
  const [showEv, setShowEv] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [dataSource, setDataSource] = useState<"loading" | "live" | "unavailable">("loading");

  const fetchStations = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams({ fuelType: selectedFuel });
      if (showHydrogen) params.set("hasHydrogen", "true");
      if (showEv) params.set("hasEv", "true");

      try {
        const res = await fetch(`/api/stations?${params}`, { signal });
        if (res.ok) {
          const data = await res.json();
          setStations(data);
          setDataSource(data.length > 0 ? "live" : "unavailable");
        }
      } catch {
        if (!signal?.aborted) {
          setDataSource("unavailable");
        }
      }
    },
    [selectedFuel, showHydrogen, showEv]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchStations(controller.signal);
    return () => controller.abort();
  }, [fetchStations]);

  const handleLocate = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng });
  }, []);

  const { p33, p66 } = useMemo(() => {
    const allPrices = stations
      .map((s) => s.cheapestPrice)
      .filter((p): p is number => p !== undefined)
      .sort((a, b) => a - b);

    return {
      p33: allPrices[Math.floor(allPrices.length * 0.33)] ?? 0,
      p66: allPrices[Math.floor(allPrices.length * 0.66)] ?? Infinity,
    };
  }, [stations]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={AUSTRALIA_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="h-full w-full"
        attributionControl={false}
      >
        <ThemeTileLayer />

        {stations.map((station) => (
          <StationMarker
            key={station.id}
            station={station}
            selectedFuel={selectedFuel}
            cheapThreshold={p33}
            expensiveThreshold={p66}
            onSelect={onStationSelect}
          />
        ))}

        {flyTo && <FlyToLocation lat={flyTo.lat} lng={flyTo.lng} />}
        {activeRoute && <RouteOverlay route={activeRoute} />}
        {navLocation && (
          <CircleMarker
            center={[navLocation.lat, navLocation.lng]}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: "#2563eb",
              fillOpacity: 1,
            }}
          />
        )}
      </MapContainer>

      <FuelFilter
        selectedFuel={selectedFuel}
        onFuelChange={setSelectedFuel}
        showHydrogen={showHydrogen}
        onHydrogenChange={setShowHydrogen}
        showEv={showEv}
        onEvChange={setShowEv}
      />

      <LocateButton onLocate={handleLocate} />

      {dataSource !== "loading" && (
        <div className="absolute bottom-20 left-4 z-[1000] flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium shadow-sm ring-1 ring-border/50 backdrop-blur-sm md:bottom-4">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              dataSource === "live" ? "bg-green-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span className="text-muted-foreground">
            {dataSource === "live"
              ? `${stations.length.toLocaleString()} live NSW/TAS stations`
              : "Live NSW data unavailable"}
          </span>
        </div>
      )}

      {dataSource === "unavailable" && (
        <div className="pointer-events-none absolute inset-x-4 top-24 z-[1000] mx-auto max-w-sm rounded-2xl bg-background/92 p-4 text-center shadow-lg ring-1 ring-border/60 backdrop-blur-md">
          <p className="text-sm font-semibold text-foreground">Waiting for live NSW data</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fuel data is loaded from the NSW Government API. Once it responds, stations will
            appear here and users can keep prices fresh by reporting updates.
          </p>
        </div>
      )}
    </div>
  );
};
