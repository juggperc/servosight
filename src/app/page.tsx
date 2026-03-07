"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DynamicMap } from "@/components/map/dynamic-map";
import { BottomNav, type TabId } from "@/components/navigation/bottom-nav";
import { SubmitSheet } from "@/components/sheets/submit-sheet";
import { SearchSheet } from "@/components/sheets/search-sheet";
import { DealsSheet } from "@/components/sheets/deals-sheet";
import { SettingsSheet } from "@/components/sheets/settings-sheet";
import { NavigationSheet } from "@/components/sheets/navigation-sheet";
import { IOSPrompt } from "@/components/onboarding/ios-prompt";
import { DonatePopup } from "@/components/donate-popup";
import type { RouteData, StationWithPrices } from "@/lib/types";
import { fetchBrowserRoute, getActiveStepIndex } from "@/lib/browser-route";
import { buildLocalRoute } from "@/lib/local-satnav";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dealsOpen, setDealsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<StationWithPrices | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteData | null>(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [navLocation, setNavLocation] = useState<{ lat: number; lng: number } | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);

    setSubmitOpen(false);
    setSearchOpen(false);
    setDealsOpen(false);
    setSettingsOpen(false);
    setNavigationOpen(false);

    switch (tab) {
      case "submit":
        setSubmitOpen(true);
        break;
      case "search":
        setSearchOpen(true);
        break;
      case "deals":
        setDealsOpen(true);
        break;
      case "settings":
        setSettingsOpen(true);
        break;
      default:
        break;
    }
  }, []);

  const handleDrawerClose = useCallback((setter: (open: boolean) => void) => {
    return (open: boolean) => {
      setter(open);
      if (!open) setActiveTab("map");
    };
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<{ lat: number; lng: number }> => {
    if (!navigator.geolocation) {
      throw new Error("Location is not supported on this device");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          const messages: Record<number, string> = {
            1: "Location access was denied",
            2: "Location is unavailable right now",
            3: "Location request timed out",
          };
          reject(new Error(messages[error.code] ?? "Unable to get current location"));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  const handleClearRoute = useCallback(() => {
    routeAbortRef.current?.abort();
    routeAbortRef.current = null;
    setRouting(false);
    setSelectedStation(null);
    setActiveRoute(null);
    setRouteError(null);
    setNavigationOpen(false);
    setCurrentStepIndex(0);
    setNavLocation(null);
  }, []);

  const handleStartRoute = useCallback(
    async (stationOverride?: StationWithPrices) => {
      const station = stationOverride ?? selectedStation;
      if (!station) return;

      setSelectedStation(station);
      setRouting(true);
      setRouteError(null);
      setNavigationOpen(true);
      routeAbortRef.current?.abort();
      const controller = new AbortController();
      routeAbortRef.current = controller;

      try {
        const currentLocation = navLocation ?? (await getCurrentLocation());
        setNavLocation(currentLocation);

        // Show an immediate first instruction, then upgrade to the richer route when available.
        setActiveRoute(buildLocalRoute(currentLocation, station));
        setCurrentStepIndex(0);

        const route = await fetchBrowserRoute(currentLocation, station, controller.signal);
        if (controller.signal.aborted) return;

        setCurrentStepIndex(0);
        setActiveRoute(route satisfies RouteData);
      } catch (error) {
        if (controller.signal.aborted) return;

        setRouteError(error instanceof Error ? error.message : "Failed to build route");
        setActiveRoute(null);
      } finally {
        if (routeAbortRef.current === controller) {
          routeAbortRef.current = null;
        }
        setRouting(false);
      }
    },
    [getCurrentLocation, navLocation, selectedStation]
  );

  const handleStationSelect = useCallback(
    (station: StationWithPrices) => {
      void handleStartRoute(station);
    },
    [handleStartRoute]
  );

  useEffect(() => {
    if (!navigationOpen || !activeRoute) return undefined;
    if (!navigator.geolocation) return undefined;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setNavLocation(nextPosition);
        setCurrentStepIndex((previous) =>
          getActiveStepIndex(nextPosition, activeRoute, previous)
        );
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [navigationOpen, activeRoute]);

  return (
    <main className="fixed inset-0 overflow-hidden">
      <div className="h-full w-full md:pl-20">
        <DynamicMap
          onStationSelect={handleStationSelect}
          activeRoute={activeRoute}
          navLocation={navLocation}
        />
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <SubmitSheet open={submitOpen} onOpenChange={handleDrawerClose(setSubmitOpen)} />
      <SearchSheet open={searchOpen} onOpenChange={handleDrawerClose(setSearchOpen)} />
      <DealsSheet open={dealsOpen} onOpenChange={handleDrawerClose(setDealsOpen)} />
      <SettingsSheet open={settingsOpen} onOpenChange={handleDrawerClose(setSettingsOpen)} />
      <NavigationSheet
        open={navigationOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleClearRoute();
            return;
          }

          setNavigationOpen(true);
        }}
        station={selectedStation}
        route={activeRoute}
        currentStepIndex={currentStepIndex}
        routing={routing}
        routeError={routeError}
        onStartRoute={() => void handleStartRoute()}
        onClearRoute={handleClearRoute}
      />

      <IOSPrompt />
      <DonatePopup />
    </main>
  );
};

export default HomePage;
