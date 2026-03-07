"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import type { StationWithPrices, FuelTypeId } from "@/lib/types";
import { StationMarker } from "./station-marker";
import { LocateButton } from "./locate-button";
import { FuelFilter } from "./fuel-filter";
import { formatPriceCents } from "@/lib/utils";

const LIGHT_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const AUSTRALIA_CENTER: L.LatLngExpression = [-28.0, 134.0];
const DEFAULT_ZOOM = 5;
const CLUSTER_BREAKPOINT_ZOOM = 10;

type MapViewProps = {
  onStationSelect?: (station: StationWithPrices) => void;
  navLocation?: { lat: number; lng: number } | null;
};

type FlyToState = {
  lat: number;
  lng: number;
  zoom?: number;
};

type ViewportState = {
  zoom: number;
  bounds: L.LatLngBounds | null;
};

type StationCluster = {
  id: string;
  lat: number;
  lng: number;
  count: number;
  minPrice?: number;
  maxPrice?: number;
  stations: StationWithPrices[];
};

const ThemeTileLayer = () => {
  const { resolvedTheme } = useTheme();
  const tileUrl = resolvedTheme === "dark" ? DARK_TILES : LIGHT_TILES;

  return <TileLayer attribution={ATTRIBUTION} url={tileUrl} />;
};

const FlyToLocation = ({ lat, lng, zoom }: FlyToState) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], zoom ?? 13, { duration: 1.3 });
  }, [map, lat, lng, zoom]);

  return null;
};

const MapViewportListener = ({
  onChange,
}: {
  onChange: (nextViewport: ViewportState) => void;
}) => {
  const map = useMapEvents({
    moveend: () => {
      onChange({
        zoom: map.getZoom(),
        bounds: map.getBounds(),
      });
    },
    zoomend: () => {
      onChange({
        zoom: map.getZoom(),
        bounds: map.getBounds(),
      });
    },
    resize: () => {
      onChange({
        zoom: map.getZoom(),
        bounds: map.getBounds(),
      });
    },
  });

  useEffect(() => {
    onChange({
      zoom: map.getZoom(),
      bounds: map.getBounds(),
    });
  }, [map, onChange]);

  return null;
};

const getClusterColumns = (zoom: number): number => {
  if (zoom <= 5) return 6;
  if (zoom <= 6) return 8;
  if (zoom <= 7) return 10;
  if (zoom <= 8) return 12;
  if (zoom <= 9) return 15;
  return 18;
};

const ClusterMarker = ({
  cluster,
  onSelect,
}: {
  cluster: StationCluster;
  onSelect: (cluster: StationCluster) => void;
}) => {
  const size = cluster.count > 80 ? 82 : cluster.count > 24 ? 72 : 62;
  const priceLabel =
    cluster.minPrice !== undefined
      ? `<span class="cluster-marker__price">from ${formatPriceCents(cluster.minPrice)}</span>`
      : `<span class="cluster-marker__price">tap to zoom</span>`;

  const icon = useMemo(
    () =>
      L.divIcon({
        className: "cluster-marker-root",
        html: `
          <div class="cluster-marker" style="width:${size}px;height:${size}px;">
            <span class="cluster-marker__pulse"></span>
            <span class="cluster-marker__core">
              <span class="cluster-marker__count">${cluster.count > 99 ? "99+" : cluster.count}</span>
              ${priceLabel}
            </span>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      }),
    [cluster.count, priceLabel, size]
  );

  return (
    <Marker
      position={[cluster.lat, cluster.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(cluster),
      }}
    />
  );
};

export const MapView = ({ onStationSelect, navLocation }: MapViewProps) => {
  const [stations, setStations] = useState<StationWithPrices[]>([]);
  const [selectedFuel, setSelectedFuel] = useState<FuelTypeId>("u91");
  const [showHydrogen, setShowHydrogen] = useState(false);
  const [showEv, setShowEv] = useState(false);
  const [flyTo, setFlyTo] = useState<FlyToState | null>(null);
  const [dataSource, setDataSource] = useState<"loading" | "live" | "unavailable">("loading");
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: DEFAULT_ZOOM,
    bounds: null,
  });

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

  const visibleStations = useMemo(() => {
    if (!viewport.bounds) {
      return stations;
    }

    const paddedBounds = viewport.bounds.pad(0.35);
    return stations.filter((station) => paddedBounds.contains(L.latLng(station.lat, station.lng)));
  }, [stations, viewport.bounds]);

  const { individualStations, stationClusters } = useMemo(() => {
    if (!visibleStations.length || !viewport.bounds || viewport.zoom >= CLUSTER_BREAKPOINT_ZOOM) {
      return {
        individualStations: visibleStations,
        stationClusters: [] as StationCluster[],
      };
    }

    const paddedBounds = viewport.bounds.pad(0.1);
    const west = paddedBounds.getWest();
    const east = paddedBounds.getEast();
    const north = paddedBounds.getNorth();
    const south = paddedBounds.getSouth();
    const lngSpan = Math.max(east - west, 0.01);
    const latSpan = Math.max(north - south, 0.01);
    const columns = getClusterColumns(viewport.zoom);
    const rows = Math.max(4, Math.round(columns * (latSpan / lngSpan)));
    const clusterMap = new Map<
      string,
      {
        latSum: number;
        lngSum: number;
        minPrice?: number;
        maxPrice?: number;
        stations: StationWithPrices[];
      }
    >();

    for (const station of visibleStations) {
      const columnIndex = Math.max(
        0,
        Math.min(columns - 1, Math.floor(((station.lng - west) / lngSpan) * columns))
      );
      const rowIndex = Math.max(
        0,
        Math.min(rows - 1, Math.floor(((north - station.lat) / latSpan) * rows))
      );
      const clusterKey = `${columnIndex}:${rowIndex}`;
      const existing = clusterMap.get(clusterKey);

      if (!existing) {
        clusterMap.set(clusterKey, {
          latSum: station.lat,
          lngSum: station.lng,
          minPrice: station.cheapestPrice,
          maxPrice: station.cheapestPrice,
          stations: [station],
        });
        continue;
      }

      existing.latSum += station.lat;
      existing.lngSum += station.lng;
      existing.stations.push(station);
      if (station.cheapestPrice !== undefined) {
        existing.minPrice =
          existing.minPrice === undefined
            ? station.cheapestPrice
            : Math.min(existing.minPrice, station.cheapestPrice);
        existing.maxPrice =
          existing.maxPrice === undefined
            ? station.cheapestPrice
            : Math.max(existing.maxPrice, station.cheapestPrice);
      }
    }

    const clusteredStations: StationCluster[] = [];
    const singleStations: StationWithPrices[] = [];

    for (const [clusterKey, clusterValue] of clusterMap.entries()) {
      if (clusterValue.stations.length === 1) {
        singleStations.push(clusterValue.stations[0]);
        continue;
      }

      clusteredStations.push({
        id: clusterKey,
        lat: clusterValue.latSum / clusterValue.stations.length,
        lng: clusterValue.lngSum / clusterValue.stations.length,
        count: clusterValue.stations.length,
        minPrice: clusterValue.minPrice,
        maxPrice: clusterValue.maxPrice,
        stations: clusterValue.stations,
      });
    }

    return {
      individualStations: singleStations,
      stationClusters: clusteredStations,
    };
  }, [visibleStations, viewport.bounds, viewport.zoom]);

  const handleClusterSelect = useCallback(
    (cluster: StationCluster) => {
      setFlyTo({
        lat: cluster.lat,
        lng: cluster.lng,
        zoom: Math.min(viewport.zoom + 2, 13),
      });
    },
    [viewport.zoom]
  );

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
        <MapViewportListener onChange={setViewport} />

        {individualStations.map((station) => (
          <StationMarker
            key={station.id}
            station={station}
            selectedFuel={selectedFuel}
            cheapThreshold={p33}
            expensiveThreshold={p66}
            onSelect={onStationSelect}
          />
        ))}
        {stationClusters.map((cluster) => (
          <ClusterMarker key={cluster.id} cluster={cluster} onSelect={handleClusterSelect} />
        ))}

        {flyTo && <FlyToLocation lat={flyTo.lat} lng={flyTo.lng} zoom={flyTo.zoom} />}
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
              ? viewport.zoom < CLUSTER_BREAKPOINT_ZOOM && stationClusters.length > 0
                ? `${visibleStations.length.toLocaleString()} stations · ${stationClusters.length} smart groups`
                : `${stations.length.toLocaleString()} live NSW/TAS stations`
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
