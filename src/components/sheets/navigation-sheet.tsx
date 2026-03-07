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
} from "lucide-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { AnimatePresence, motion } from "motion/react";
import { appleSpring, fadeUp, quickFade, softSpring } from "@/lib/motion";

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
  const upcomingStep = route?.steps[currentStepIndex] ?? null;
  const nextStep = route?.steps[currentStepIndex + 1] ?? null;

  const getStepIcon = (maneuverType?: string) => {
    if (maneuverType === "arrive") return Flag;
    if (maneuverType === "turn") return CornerUpRight;
    if (maneuverType === "depart") return ArrowUp;
    return CornerUpLeft;
  };

  const UpcomingIcon = getStepIcon(upcomingStep?.maneuverType);

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible
      modal={false}
      direction="bottom"
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Content className="glass-panel-strong fixed inset-x-3 bottom-[4.5rem] z-[1650] mx-auto flex w-auto max-w-md flex-col rounded-[26px] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 md:bottom-6 md:left-32 md:right-auto md:max-w-md md:rounded-[30px] md:w-full">
          <DrawerPrimitive.Title className="sr-only">Satnav</DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Compact live navigation widget with the next two turns.
          </DrawerPrimitive.Description>

          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-foreground/10" />

          <motion.div
            initial={fadeUp.initial}
            animate={fadeUp.animate}
            transition={softSpring}
            className="space-y-2.5 p-3.5 pb-4 md:space-y-3 md:p-4 md:pb-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/10 dark:text-blue-300">
                    <Navigation className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                      {station?.name ?? "Satnav"}
                    </p>
                    <p className="truncate text-[11px] leading-relaxed text-muted-foreground md:text-xs">
                      {station?.suburb || station?.address || "Preparing route"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClearRoute}
                aria-label="Dismiss satnav widget"
                tabIndex={0}
                className="rounded-full bg-background/45 p-2 text-muted-foreground transition-colors hover:bg-background/75 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {routeError ? (
                <motion.div
                  key="route-error"
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  exit={fadeUp.exit}
                  transition={quickFade}
                  className="rounded-3xl border border-destructive/15 bg-destructive/[0.06] p-4"
                >
                  <p className="text-sm font-semibold text-foreground">Could not start navigation</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{routeError}</p>
                  <Button size="sm" className="mt-3 rounded-2xl" onClick={onStartRoute}>
                    Retry route
                  </Button>
                </motion.div>
              ) : null}

              {!route && routing ? (
                <motion.div
                  key="routing"
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  exit={fadeUp.exit}
                  transition={quickFade}
                  className="glass-panel rounded-3xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6, ease: "linear" }}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-300"
                    >
                      <Loader2 className="h-5 w-5" />
                    </motion.div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-card-foreground">Routing now</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Locking onto your location and drawing the first turn.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {route && upcomingStep ? (
                <motion.div
                  key={`${currentStepIndex}-${upcomingStep.instruction}`}
                  initial={fadeUp.initial}
                  animate={fadeUp.animate}
                  exit={fadeUp.exit}
                  transition={appleSpring}
                  className="space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-muted-foreground md:gap-2 md:text-[11px]">
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-700 dark:text-blue-300">
                      Step {Math.min(currentStepIndex + 1, route.steps.length)}/{route.steps.length}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/45 px-2 py-1">
                      <RouteIcon className="h-3.5 w-3.5" />
                      {formatDistance(route.distance)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/45 px-2 py-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDuration(route.duration)}
                    </span>
                  </div>

                  <motion.div
                    layout
                    transition={appleSpring}
                    className="rounded-[20px] bg-gradient-to-br from-blue-500/16 via-blue-500/[0.08] to-background/90 p-3.5 ring-1 ring-blue-500/12 md:rounded-[24px] md:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        layout
                        transition={appleSpring}
                        className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 md:h-11 md:w-11"
                      >
                        <UpcomingIcon className="h-5 w-5" />
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                          Upcoming
                        </p>
                        <p className="mt-1 text-base font-semibold leading-tight tracking-tight text-foreground md:text-lg">
                          {upcomingStep.instruction}
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground md:mt-2 md:text-sm">
                          In {formatDistance(upcomingStep.distance)} · {formatDuration(upcomingStep.duration)}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    layout
                    transition={appleSpring}
                    className="glass-panel rounded-[18px] px-3.5 py-2.5 md:rounded-[22px] md:px-4 md:py-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Then
                    </p>
                    <p className="mt-1 truncate text-sm font-medium tracking-tight text-card-foreground">
                      {nextStep?.instruction ?? "Arrive at your selected station"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {nextStep
                        ? `${formatDistance(nextStep.distance)} · ${formatDuration(nextStep.duration)}`
                        : "Live guidance will keep updating as you move."}
                    </p>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};
