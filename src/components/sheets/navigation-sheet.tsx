"use client";

import { Button } from "@/components/ui/button";
import type { RouteData, StationWithPrices } from "@/lib/types";
import {
  Clock3,
  Loader2,
  Navigation,
  Route as RouteIcon,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  X,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { fadeUp, quickFade, softSpring } from "@/lib/motion";
import { useState, useEffect } from "react";
import { useAppHaptics } from "@/components/haptics-provider";

type NavigationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: StationWithPrices | null;
  route: RouteData | null;
  currentStepIndex: number;
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
  currentStepIndex,
  routing,
  routeError,
  onStartRoute,
  onClearRoute,
}: NavigationSheetProps) => {
  const [expanded, setExpanded] = useState(false);

  // Auto-collapse when inactive/routing finishes, auto-expand on error
  useEffect(() => {
    if (!open) {
      setExpanded(false);
    }
  }, [open]);

  useEffect(() => {
    if (routeError) {
      setExpanded(true);
    }
  }, [routeError]);

  if (!open) return null;

  const upcomingStep = route?.steps[currentStepIndex] ?? null;
  const nextStep = route?.steps[currentStepIndex + 1] ?? null;
  const haptics = useAppHaptics();

  const handlePanEnd = (e: any, info: PanInfo) => {
    const threshold = 30;
    if (info.offset.y < -threshold) {
      if (expanded) {
        haptics.selection();
        setExpanded(false);
      }
    } else if (info.offset.y > threshold) {
      if (!expanded) {
        haptics.selection();
        setExpanded(true);
      }
    }
  };

  const getStepIcon = (maneuverType?: string) => {
    if (maneuverType === "arrive") return Flag;
    if (maneuverType === "turn") return CornerUpRight;
    if (maneuverType === "depart") return ArrowUp;
    return CornerUpLeft;
  };

  const UpcomingIcon = getStepIcon(upcomingStep?.maneuverType);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[1650] flex justify-center p-3 pt-safe-top md:pt-4">
      <motion.div
        layout
        transition={softSpring}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.05}
        onPanEnd={handlePanEnd}
        className={`pointer-events-auto relative overflow-hidden bg-zinc-950 shadow-2xl ring-1 ring-zinc-800 origin-top transform-gpu will-change-transform ${expanded ? "w-full max-w-sm rounded-[32px] md:max-w-md" : "w-auto min-w-[200px] max-w-[280px] rounded-full md:max-w-[320px]"
          }`}
        onClick={() => {
          if (!expanded) {
            haptics.selection();
            setExpanded(true);
          }
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!expanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={quickFade}
              className="flex items-center justify-between gap-3 px-3.5 py-2 h-10 md:h-12 md:px-4 md:py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {routing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6, ease: "linear" }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center text-blue-500"
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.div>
                ) : upcomingStep ? (
                  <div className="flex shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 p-1">
                    <UpcomingIcon className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <Navigation className="h-4 w-4 shrink-0 text-blue-500" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-tight text-white leading-tight">
                    {routing ? "Routing..." : upcomingStep ? formatDistance(upcomingStep.distance) : (station?.name ?? "Satnav")}
                  </p>
                </div>
              </div>

              {route && (
                <div className="shrink-0 text-[11px] md:text-xs font-semibold text-blue-400">
                  {formatDuration(route.duration)}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={softSpring}
              className="flex flex-col p-4 md:p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold tracking-tight text-white">
                      {station?.name ?? "Satnav"}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {station?.suburb || station?.address || "Preparing route"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(false);
                    }}
                    aria-label="Collapse widgets"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearRoute();
                    }}
                    aria-label="Stop navigation"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition-colors hover:bg-red-500/30 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {station && (
                <div className="flex items-center gap-2 mb-5">
                  <a
                    href={`https://maps.apple.com/?daddr=${station.lat},${station.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-white/20"
                  >
                    <img src="/icons/apple-maps.svg" alt="Apple Maps" className="h-[18px] w-[18px]" />
                    Maps
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-white/20"
                  >
                    <img src="/icons/google-maps.svg" alt="Google Maps" className="h-[18px] w-[18px]" />
                    Google
                  </a>
                  <a
                    href={`https://waze.com/ul?ll=${station.lat},${station.lng}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-white/20"
                  >
                    <img src="/icons/waze.svg" alt="Waze" className="h-[18px] w-[18px]" />
                    Waze
                  </a>
                </div>
              )}

              <div className="space-y-3">
                {routeError ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm font-semibold text-red-200">Could not start navigation</p>
                    <p className="mt-1 text-xs text-red-300/80">{routeError}</p>
                    <Button
                      size="sm"
                      className="mt-3 w-full rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30"
                      onClick={onStartRoute}
                    >
                      Retry route
                    </Button>
                  </div>
                ) : !route && routing ? (
                  <div className="rounded-2xl bg-white/5 p-4 flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6, ease: "linear" }}
                      className="text-blue-500"
                    >
                      <Loader2 className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-white">Routing now</p>
                      <p className="text-xs text-zinc-400">Locking onto your location...</p>
                    </div>
                  </div>
                ) : route && upcomingStep ? (
                  <>
                    <div className="rounded-[24px] bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-4 ring-1 ring-blue-500/20">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-blue-500 text-white shadow-lg shadow-blue-500/30">
                          <UpcomingIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                            In {formatDistance(upcomingStep.distance)}
                          </p>
                          <p className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-white">
                            {upcomingStep.instruction}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 rounded-[22px] bg-white/5 p-3.5 md:p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          ETA
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm md:text-base font-semibold text-white">
                          <Clock3 className="h-4 w-4 text-blue-400" />
                          {formatDuration(route.duration)}
                        </p>
                      </div>
                      <div className="flex-1 rounded-[22px] bg-white/5 p-3.5 md:p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Distance
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm md:text-base font-semibold text-white">
                          <RouteIcon className="h-4 w-4 text-blue-400" />
                          {formatDistance(route.distance)}
                        </p>
                      </div>
                    </div>

                    {nextStep && (
                      <div className="rounded-[22px] bg-white/5 px-4 py-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Then
                        </p>
                        <p className="mt-0.5 truncate text-sm font-medium text-white">
                          {nextStep.instruction}
                        </p>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
