"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import type { StationWithPrices, FuelTypeId, FreshnessFilterId, PriceAlert } from "@/lib/types";
import { StationMarker } from "./station-marker";
import { LocateButton } from "./locate-button";
import { FuelFilter } from "./fuel-filter";
import { formatPriceCents } from "@/lib/utils";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { FreshnessFilterBar } from "@/components/filters/freshness-filter-bar";
import { useAppHaptics } from "@/components/haptics-provider";
import { filterStationsByFreshness } from "@/lib/freshness";
import { BellRing } from "lucide-react";

const LIGHT_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const AUSTRALIA_CENTER: L.LatLngExpression = [-28.0, 134.0];
const DEFAULT_ZOOM = 5;
const CLUSTER_BREAKPOINT_ZOOM = 10;

type MapViewProps = {
  onStationSelect?: (station: StationWithPrices) => void;
  navLocation?: { lat: number; lng: number } | null;
  compactOverlay?: boolean;
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

type AlertToast = {
  id: string;
  stationName: string;
  fuelType: FuelTypeId;
  price: number;
  threshold: number;
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

export const MapView = ({ onStationSelect, navLocation, compactOverlay = false }: MapViewProps) => {
  const haptics = useAppHaptics();
  const [stations, setStations] = useState<StationWithPrices[]>([]);
  const [selectedFuel, setSelectedFuel] = useState<FuelTypeId>("u91");
  const [showHydrogen, setShowHydrogen] = useState(false);
  const [showEv, setShowEv] = useState(false);
  const [freshness, setFreshness] = useState<FreshnessFilterId>("any");
  const [flyTo, setFlyTo] = useState<FlyToState | null>(null);
  const [dataSource, setDataSource] = useState<"loading" | "live" | "unavailable" | "disabled">("loading");
  const [priceAlerts, setPriceAlerts] = useLocalStorage<PriceAlert[]>("servo-price-alerts", []);

  const [aggregateMode] = useLocalStorage<boolean>("servo-aggregate-mode", true);
  const [petrolspyMode] = useLocalStorage<boolean>("servo-petrolspy-mode", false);

  const [petrolspyStations, setPetrolspyStations] = useState<StationWithPrices[]>([]);
  const [petrolspyLoading, setPetrolspyLoading] = useState(false);
  const [petrolspyError, setPetrolspyError] = useState<string | null>(null);
  const [alertToasts, setAlertToasts] = useState<AlertToast[]>([]);
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: DEFAULT_ZOOM,
    bounds: null,
  });
  const previousZoomRef = useRef<number | null>(null);

  const fetchStations = useCallback(
    async (signal?: AbortSignal) => {
      if (!aggregateMode) {
        setStations([]);
        setDataSource("disabled");
        return;
      }

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
    [selectedFuel, showHydrogen, showEv, aggregateMode]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchStations(controller.signal);
    return () => controller.abort();
  }, [fetchStations]);

  const fetchPetrolspy = useCallback(
    async (centerLat: number, centerLng: number, signal?: AbortSignal) => {
      if (!petrolspyMode) return;
      setPetrolspyLoading(true);
      setPetrolspyError(null);
      try {
        const res = await fetch(
          `/api/petrolspy?lat=${centerLat}&lng=${centerLng}`,
          { signal }
        );
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.stations ?? [];
        if (!signal?.aborted) {
          setPetrolspyStations(list);
          setPetrolspyError(list.length === 0 && data?.error ? data.error : null);
        }
      } catch {
        if (!signal?.aborted) {
          setPetrolspyStations([]);
          setPetrolspyError("Request failed");
        }
      } finally {
        if (!signal?.aborted) setPetrolspyLoading(false);
      }
    },
    [petrolspyMode]
  );

  useEffect(() => {
    if (!petrolspyMode || !viewport.bounds) {
      setPetrolspyStations([]);
      setPetrolspyError(null);
      return;
    }
    const center = viewport.bounds.getCenter();
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchPetrolspy(center.lat, center.lng, controller.signal);
    }, 600);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [petrolspyMode, viewport.bounds, fetchPetrolspy]);

  const combinedStations = useMemo(
    () => [...stations, ...petrolspyStations],
    [stations, petrolspyStations]
  );

  const handleLocate = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng });
  }, []);

  const { p33, p66 } = useMemo(() => {
    const allPrices = filterStationsByFreshness(combinedStations, selectedFuel, freshness)
      .map((s) => s.cheapestPrice)
      .filter((p): p is number => p !== undefined)
      .sort((a, b) => a - b);

    return {
      p33: allPrices[Math.floor(allPrices.length * 0.33)] ?? 0,
      p66: allPrices[Math.floor(allPrices.length * 0.66)] ?? Infinity,
    };
  }, [freshness, selectedFuel, combinedStations]);

  const freshnessFilteredStations = useMemo(
    () => filterStationsByFreshness(combinedStations, selectedFuel, freshness),
    [freshness, selectedFuel, combinedStations]
  );

  const alertsByKey = useMemo(() => {
    return new Map(
      priceAlerts.map((alert) => [`${alert.stationId}:${alert.fuelType}`, alert] as const)
    );
  }, [priceAlerts]);

  useEffect(() => {
    if (!priceAlerts.length || !combinedStations.length) return;

    const stationMap = new Map(combinedStations.map((station) => [station.id, station] as const));
    const nextToasts: AlertToast[] = [];
    let didUpdateAlerts = false;

    const nextAlerts = priceAlerts.map((alert) => {
      const station = stationMap.get(alert.stationId);
      const priceData = station?.prices[alert.fuelType];

      if (!priceData || priceData.price > alert.threshold) {
        return alert;
      }

      const lastNotifiedTime = alert.lastNotifiedAt ? new Date(alert.lastNotifiedAt).getTime() : 0;
      const reportedTime = new Date(priceData.reportedAt).getTime();
      const alreadyNotifiedForThisUpdate = lastNotifiedTime >= reportedTime;

      if (alreadyNotifiedForThisUpdate) {
        return alert;
      }

      didUpdateAlerts = true;
      nextToasts.push({
        id: `${alert.id}-${reportedTime}`,
        stationName: alert.stationName,
        fuelType: alert.fuelType,
        price: priceData.price,
        threshold: alert.threshold,
      });

      return {
        ...alert,
        lastNotifiedAt: priceData.reportedAt,
        lastNotifiedPrice: priceData.price,
      };
    });

    if (didUpdateAlerts) {
      setPriceAlerts(nextAlerts);
    }

    if (nextToasts.length) {
      haptics.success();
      setAlertToasts((previous) => {
        const existingIds = new Set(previous.map((toast) => toast.id));
        return [...previous, ...nextToasts.filter((toast) => !existingIds.has(toast.id))];
      });
    }
  }, [haptics, priceAlerts, setPriceAlerts, combinedStations]);

  useEffect(() => {
    if (!alertToasts.length) return;

    const timers = alertToasts.map((toast) =>
      window.setTimeout(() => {
        setAlertToasts((previous) => previous.filter((item) => item.id !== toast.id));
      }, 5000)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [alertToasts]);

  useEffect(() => {
    if (previousZoomRef.current === null) {
      previousZoomRef.current = viewport.zoom;
      return;
    }

    const delta = viewport.zoom - previousZoomRef.current;
    if (delta !== 0) {
      haptics.zoomDial(delta);
      previousZoomRef.current = viewport.zoom;
    }
  }, [haptics, viewport.zoom]);

  const handleSaveAlert = useCallback(
    (station: StationWithPrices, fuelType: FuelTypeId, threshold: number) => {
      setPriceAlerts((previous) => {
        const existing = previous.find(
          (alert) => alert.stationId === station.id && alert.fuelType === fuelType
        );

        if (existing) {
          return previous.map((alert) =>
            alert.id === existing.id
              ? {
                ...alert,
                threshold,
                createdAt: new Date().toISOString(),
              }
              : alert
          );
        }

        return [
          ...previous,
          {
            id: `alert-${station.id}-${fuelType}`,
            stationId: station.id,
            stationName: station.name,
            fuelType,
            threshold,
            createdAt: new Date().toISOString(),
          },
        ];
      });
    },
    [setPriceAlerts]
  );

  const handleRemoveAlert = useCallback(
    (alertId: string) => {
      setPriceAlerts((previous) => previous.filter((alert) => alert.id !== alertId));
    },
    [setPriceAlerts]
  );

  const visibleStations = useMemo(() => {
    if (!viewport.bounds) {
      return freshnessFilteredStations;
    }

    const paddedBounds = viewport.bounds.pad(0.35);
    return freshnessFilteredStations.filter((station) =>
      paddedBounds.contains(L.latLng(station.lat, station.lng))
    );
  }, [freshnessFilteredStations, viewport.bounds]);

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
      haptics.clusterPress();
      setFlyTo({
        lat: cluster.lat,
        lng: cluster.lng,
        zoom: Math.min(viewport.zoom + 2, 13),
      });
    },
    [haptics, viewport.zoom]
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
            priceAlert={alertsByKey.get(`${station.id}:${selectedFuel}`)}
            onSaveAlert={handleSaveAlert}
            onRemoveAlert={handleRemoveAlert}
            compactPopup={compactOverlay}
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

      <FreshnessFilterBar
        value={freshness}
        onChange={setFreshness}
        className="absolute top-[3.85rem] left-4 right-4 z-[1000] md:left-auto md:right-4 md:max-w-md"
      />

      <LocateButton onLocate={handleLocate} />

      {petrolspyMode && (
        <div className="pointer-events-auto absolute bottom-20 left-4 z-[1000] flex flex-col gap-1 md:bottom-4 md:left-4">
          {petrolspyError && (
            <div className="glass-pill max-w-[200px] rounded-lg px-2 py-1 text-[10px] text-amber-600 dark:text-amber-500">
              PetrolSpy: {petrolspyError}
            </div>
          )}
          <a
            href="https://petrolspy.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-pill flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="PetrolSpy – fuel data attribution"
          >
            <img
              src="https://petrolspy.com.au/favicon.ico"
              alt=""
              className="h-3.5 w-3.5"
              width={14}
              height={14}
            />
            <span className="font-semibold text-amber-600 dark:text-amber-500">PetrolSpy</span>
          </a>
        </div>
      )}

      {dataSource !== "loading" && (aggregateMode || petrolspyMode) && (
        <div
          className={`above-bottom-nav glass-pill absolute left-4 z-[1000] flex max-w-[calc(100%-6.5rem)] items-center gap-1.5 rounded-full text-[10px] font-medium md:bottom-4 md:max-w-none ${compactOverlay ? "px-2 py-1" : "px-2.5 py-1"
            }`}
        >
          <div
            className={`h-1.5 w-1.5 rounded-full ${dataSource === "live" ? "bg-green-500 animate-pulse" : "bg-amber-500"
              }`}
          />
          <span className="truncate text-muted-foreground">
            {dataSource === "live" || (petrolspyMode && petrolspyStations.length > 0)
              ? viewport.zoom < CLUSTER_BREAKPOINT_ZOOM && stationClusters.length > 0
                ? compactOverlay
                  ? `${visibleStations.length.toLocaleString()} · ${stationClusters.length} groups`
                  : `${visibleStations.length.toLocaleString()} stations · ${stationClusters.length} smart groups`
                : compactOverlay
                  ? `${freshnessFilteredStations.length.toLocaleString()} live`
                  : `${aggregateMode ? `${stations.length.toLocaleString()} state` : ""}${aggregateMode && petrolspyMode ? " + " : ""}${petrolspyMode && petrolspyStations.length > 0 ? `${petrolspyStations.length} PetrolSpy` : ""}`
              : "Live data unavailable"}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute right-4 top-[7.25rem] z-[1100] flex max-w-xs flex-col gap-2 md:top-4">
        {alertToasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-panel flex items-start gap-2 rounded-2xl px-3 py-2 shadow-lg"
          >
            <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{toast.stationName}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {toast.fuelType.toUpperCase()} hit {formatPriceCents(toast.price)} under your{" "}
                {formatPriceCents(toast.threshold)} alert.
              </p>
            </div>
          </div>
        ))}
      </div>

      {dataSource === "unavailable" && aggregateMode && (
        <div className="glass-panel-strong pointer-events-none absolute inset-x-4 top-24 z-[1000] mx-auto max-w-sm rounded-[1.6rem] p-4 text-center">
          <p className="text-sm font-semibold text-foreground">Waiting for live data</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fuel data is loaded from State APIs. Once it responds, stations will
            appear here and users can keep prices fresh by reporting updates.
          </p>
        </div>
      )}
    </div>
  );
};
