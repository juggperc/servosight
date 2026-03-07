"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { HapticInput } from "web-haptics";
import { useWebHaptics } from "web-haptics/react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

type AppHapticsContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  isSupported: boolean;
  selection: () => void;
  tabChange: () => void;
  toggleChange: (enabled?: boolean) => void;
  zoomDial: (delta: number) => void;
  clusterPress: () => void;
  stationSelect: () => void;
  locateRequest: () => void;
  locateSuccess: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
  dismiss: () => void;
  copy: () => void;
};

const noop = () => undefined;

const AppHapticsContext = createContext<AppHapticsContextValue>({
  enabled: true,
  setEnabled: noop,
  isSupported: false,
  selection: noop,
  tabChange: noop,
  toggleChange: noop,
  zoomDial: noop,
  clusterPress: noop,
  stationSelect: noop,
  locateRequest: noop,
  locateSuccess: noop,
  success: noop,
  warning: noop,
  error: noop,
  dismiss: noop,
  copy: noop,
});

const buildDialPattern = (delta: number): HapticInput => {
  const steps = Math.max(1, Math.min(Math.abs(Math.round(delta)), 4));
  const zoomingIn = delta > 0;

  return Array.from({ length: steps }, (_, index) => ({
    delay: index === 0 ? 0 : zoomingIn ? 22 : 28,
    duration: zoomingIn ? 8 : 12,
    intensity: Math.min(zoomingIn ? 0.34 + index * 0.08 : 0.28 + index * 0.07, 0.7),
  }));
};

export const HapticsProvider = ({ children }: { children: React.ReactNode }) => {
  const { trigger, isSupported } = useWebHaptics();
  const [enabled, setEnabled] = useLocalStorage("servo-haptics-enabled", true);

  const fire = useCallback(
    (input?: HapticInput) => {
      if (!enabled) return;
      void trigger(input);
    },
    [enabled, trigger]
  );

  const value = useMemo<AppHapticsContextValue>(
    () => ({
      enabled,
      setEnabled,
      isSupported,
      selection: () => fire("selection"),
      tabChange: () =>
        fire([
          { duration: 10, intensity: 0.34 },
          { delay: 28, duration: 12, intensity: 0.46 },
        ]),
      toggleChange: (nextEnabled = true) => fire(nextEnabled ? "medium" : "light"),
      zoomDial: (delta: number) => {
        if (delta === 0) return;
        fire(buildDialPattern(delta));
      },
      clusterPress: () =>
        fire([
          { duration: 16, intensity: 0.42 },
          { delay: 34, duration: 12, intensity: 0.26 },
        ]),
      stationSelect: () => fire("nudge"),
      locateRequest: () => fire("soft"),
      locateSuccess: () =>
        fire([
          { duration: 16, intensity: 0.3 },
          { delay: 34, duration: 24, intensity: 0.52 },
        ]),
      success: () => fire("success"),
      warning: () => fire("warning"),
      error: () => fire("error"),
      dismiss: () => fire("light"),
      copy: () =>
        fire([
          { duration: 12, intensity: 0.32 },
          { delay: 26, duration: 18, intensity: 0.56 },
        ]),
    }),
    [enabled, fire, isSupported, setEnabled]
  );

  return <AppHapticsContext.Provider value={value}>{children}</AppHapticsContext.Provider>;
};

export const useAppHaptics = () => useContext(AppHapticsContext);
