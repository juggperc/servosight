"use client";

import { useState, useEffect } from "react";
import { Share, X } from "lucide-react";

export const IOSPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in window.navigator && (window.navigator as Record<string, unknown>).standalone === true);
    const dismissed = localStorage.getItem("servo-ios-prompt-dismissed");

    if (isIOS && !isStandalone && !dismissed) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("servo-ios-prompt-dismissed", "true");
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Add to Home Screen"
    >
      <div
        className="mx-4 mb-8 w-full max-w-sm animate-in slide-in-from-bottom-4 rounded-2xl bg-background p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground">
              <span className="text-lg font-bold text-background">SS</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Add ServoSight</p>
              <p className="text-xs text-muted-foreground">to your Home Screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            tabIndex={0}
            className="rounded-full p-1 transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background">
              <Share className="h-4 w-4 text-blue-500" />
            </span>
            <p className="text-xs">
              Tap the <strong>Share</strong> button in Safari
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background text-sm">
              +
            </span>
            <p className="text-xs">
              Select <strong>Add to Home Screen</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="mt-4 w-full rounded-xl bg-foreground py-2.5 text-sm font-medium text-background transition-opacity active:opacity-80"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
