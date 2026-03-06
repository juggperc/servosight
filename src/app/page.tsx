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
import { Button } from "@/components/ui/button";
import { ArrowRight, Navigation, Sparkles, X } from "lucide-react";
import { fetchBrowserRoute, getActiveStepIndex } from "@/lib/browser-route";

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
    setActiveRoute(null);
    setRouteError(null);
    setNavigationOpen(false);
    setCurrentStepIndex(0);
    setNavLocation(null);
  }, []);

  const handleStartRoute = useCallback(async () => {
    if (!selectedStation) return;

    setRouting(true);
    setRouteError(null);
    setNavigationOpen(true);
    routeAbortRef.current?.abort();
    routeAbortRef.current = new AbortController();

    try {
      const currentLocation = await getCurrentLocation();
      setNavLocation(currentLocation);
      const route = await fetchBrowserRoute(
        currentLocation,
        selectedStation,
        routeAbortRef.current.signal
      );
      setCurrentStepIndex(0);
      setActiveRoute(route satisfies RouteData);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : "Failed to build route");
      setActiveRoute(null);
    } finally {
      setRouting(false);
    }
  }, [getCurrentLocation, selectedStation]);

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

  const currentStep = activeRoute?.steps[currentStepIndex] ?? null;

  return (
    <main className="fixed inset-0 overflow-hidden">
      <div className="h-full w-full md:pl-20">
        <DynamicMap
          onStationSelect={setSelectedStation}
          activeRoute={activeRoute}
          navLocation={navLocation}
        />
      </div>

      {activeRoute && currentStep && (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[1700] mx-auto max-w-md animate-fade-in-up md:left-24 md:right-auto md:top-6">
          <div className="rounded-3xl border border-border/60 bg-background/92 px-4 py-3 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Turn by turn
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                Step {Math.min(currentStepIndex + 1, activeRoute.steps.length)}/{activeRoute.steps.length}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">{currentStep.instruction}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>{Math.max(10, Math.round(currentStep.distance))} m</span>
              <ArrowRight className="h-3 w-3" />
              <span>{Math.max(1, Math.round(currentStep.duration / 60))} min</span>
            </div>
          </div>
        </div>
      )}

      {selectedStation && !navigationOpen && (
        <div className="absolute inset-x-3 bottom-24 z-[1600] mx-auto max-w-md animate-fade-in-up md:bottom-6 md:left-24 md:right-auto">
          <div className="rounded-3xl border border-border/60 bg-background/92 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{selectedStation.name}</p>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Experimental
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  Experimental browser-side satnav with real turn-by-turn routing and a smooth route preview
                </p>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                aria-label="Dismiss station satnav card"
                tabIndex={0}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span>Browser-routed, Vercel-safe</span>
              </div>
              <Button onClick={handleStartRoute} size="sm" className="rounded-xl">
                <Navigation className="mr-2 h-4 w-4" />
                Start satnav
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <SubmitSheet open={submitOpen} onOpenChange={handleDrawerClose(setSubmitOpen)} />
      <SearchSheet open={searchOpen} onOpenChange={handleDrawerClose(setSearchOpen)} />
      <DealsSheet open={dealsOpen} onOpenChange={handleDrawerClose(setDealsOpen)} />
      <SettingsSheet open={settingsOpen} onOpenChange={handleDrawerClose(setSettingsOpen)} />
      <NavigationSheet
        open={navigationOpen}
        onOpenChange={(open) => {
          setNavigationOpen(open);
          if (!open) {
            setActiveRoute(null);
            setRouteError(null);
            setCurrentStepIndex(0);
            setNavLocation(null);
          }
        }}
        station={selectedStation}
        route={activeRoute}
        currentStepIndex={currentStepIndex}
        routing={routing}
        routeError={routeError}
        onStartRoute={handleStartRoute}
        onClearRoute={handleClearRoute}
      />

      <IOSPrompt />
      <DonatePopup />
    </main>
  );
};

export default HomePage;
