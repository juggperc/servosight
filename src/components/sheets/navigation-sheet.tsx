"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { RouteData, StationWithPrices } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Clock3,
  Loader2,
  MapPinned,
  Navigation,
  Route,
  Sparkles,
  X,
} from "lucide-react";

type NavigationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: StationWithPrices | null;
  route: RouteData | null;
  routing: boolean;
  routeError: string | null;
  onStartRoute: () => void;
  onClearRoute: () => void;
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes} min`;
};

export const NavigationSheet = ({
  open,
  onOpenChange,
  station,
  route,
  routing,
  routeError,
  onStartRoute,
  onClearRoute,
}: NavigationSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh] md:mx-auto md:max-w-xl md:rounded-t-2xl">
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DrawerTitle className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  Satnav
                </DrawerTitle>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Experimental
                </span>
              </div>
              {station ? (
                <p className="text-xs text-muted-foreground">
                  Smooth turn-by-turn route to `{station.name}`
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose a fuel station on the map to start navigation
                </p>
              )}
            </div>
            {(route || routeError) && (
              <button
                onClick={onClearRoute}
                aria-label="Clear current route"
                tabIndex={0}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-8">
          {station && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-card-foreground">{station.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {station.address}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                  <MapPinned className="h-4 w-4" />
                </div>
              </div>

              {!route && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/40 p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 text-blue-500" />
                    <p className="text-xs text-muted-foreground">
                      Experimental satnav computes a lightweight route locally in your browser for a
                      smooth, simple preview that behaves consistently in production.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={onStartRoute}
                    disabled={routing}
                    className="shrink-0 rounded-xl"
                  >
                    {routing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Route
                  </Button>
                </div>
              )}
            </div>
          )}

          {routeError && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-foreground">Satnav unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground">{routeError}</p>
              <Button size="sm" variant="outline" className="mt-3 rounded-xl" onClick={onStartRoute}>
                Retry route
              </Button>
            </div>
          )}

          {routing && (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Building route</p>
                  <p className="text-xs text-muted-foreground">
                    Sketching a lightweight driving path to your selected station
                  </p>
                </div>
              </div>
            </div>
          )}

          {route && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Route className="h-4 w-4" />
                    <span className="text-[11px] font-medium uppercase tracking-wide">Distance</span>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold tracking-tighter text-card-foreground">
                    {formatDistance(route.distance)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-[11px] font-medium uppercase tracking-wide">ETA</span>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold tracking-tighter text-card-foreground">
                    {formatDuration(route.duration)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
                <div className="border-b border-border/50 px-4 py-3">
                  <p className="text-sm font-semibold text-card-foreground">Turn-by-turn</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Experimental local guidance generated from the route preview
                  </p>
                </div>
                <div className="max-h-[46vh] space-y-1 overflow-y-auto p-3">
                  {route.steps.map((step, index) => (
                    <div
                      key={`${step.instruction}-${index}`}
                      className={cn(
                        "animate-fade-in-up flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors",
                        index === 0 ? "bg-blue-500/5 ring-1 ring-blue-500/10" : "hover:bg-muted/40"
                      )}
                      style={{ animationDelay: `${index * 30}ms`, animationFillMode: "backwards" }}
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/6 text-[11px] font-semibold text-foreground">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-card-foreground">{step.instruction}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{formatDistance(step.distance)}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{formatDuration(step.duration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
