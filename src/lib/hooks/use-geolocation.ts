"use client";

import { useState, useCallback } from "react";

type GeolocationState = {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
};

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolocation not supported" }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timeout = setTimeout(() => {
      setState((prev) => ({ ...prev, loading: false, error: "Location request timed out" }));
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        clearTimeout(timeout);
        const messages: Record<number, string> = {
          1: "Location access denied",
          2: "Location unavailable",
          3: "Location request timed out",
        };
        setState((prev) => ({
          ...prev,
          loading: false,
          error: messages[err.code] || "Unknown error",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { ...state, requestLocation };
};
