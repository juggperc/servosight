"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import type { StationWithPrices, FuelTypeId } from "@/lib/types";
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

export const MapView = ({ onStationSelect }: MapViewProps) => {
  const [stations, setStations] = useState<StationWithPrices[]>([]);
  const [selectedFuel, setSelectedFuel] = useState<FuelTypeId>("u91");
  const [showHydrogen, setShowHydrogen] = useState(false);
  const [showEv, setShowEv] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  const fetchStations = useCallback(async () => {
    const params = new URLSearchParams({ fuelType: selectedFuel });
    if (showHydrogen) params.set("hasHydrogen", "true");
    if (showEv) params.set("hasEv", "true");

    const res = await fetch(`/api/stations?${params}`);
    if (res.ok) {
      const data = await res.json();
      setStations(data);
    }
  }, [selectedFuel, showHydrogen, showEv]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const handleLocate = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng });
  }, []);

  const allPrices = stations
    .map((s) => s.cheapestPrice)
    .filter((p): p is number => p !== undefined);
  allPrices.sort((a, b) => a - b);
  const p33 = allPrices[Math.floor(allPrices.length * 0.33)] ?? 0;
  const p66 = allPrices[Math.floor(allPrices.length * 0.66)] ?? Infinity;

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
    </div>
  );
};
