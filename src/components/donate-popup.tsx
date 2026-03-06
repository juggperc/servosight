"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "next-themes";
import { X, Heart, Copy, Check } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { cn } from "@/lib/utils";

const BTC_ADDRESS = "bc1pns9f80z2s3t4xyqx0sec9v63jfuxwhvjyxetfar3hwv7h0qke90qjcx4fu";
const BTC_URI = `bitcoin:${BTC_ADDRESS}`;

export const DonatePopup = () => {
  const { resolvedTheme } = useTheme();
  const [dismissed, setDismissed] = useLocalStorage("servo-donate-dismissed", false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, [setDismissed]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BTC_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: ignored
    }
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Collapsed: subtle floating pill */}
      {!expanded && (
        <div
          className={cn(
            "fixed left-4 bottom-20 z-[1500] flex animate-in slide-in-from-left-4 fade-in items-center gap-2 rounded-full bg-background/95 px-3.5 py-2 shadow-lg ring-1 ring-border backdrop-blur-sm transition-all md:bottom-4 md:left-24",
          )}
        >
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 text-xs font-medium text-foreground"
            aria-label="Show Bitcoin donation info"
            tabIndex={0}
          >
            <Heart className="h-3.5 w-3.5 text-orange-500" />
            <span>Support via BTC</span>
          </button>
          <button
            onClick={handleDismiss}
            className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss donation prompt"
            tabIndex={0}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Expanded: QR card */}
      {expanded && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setExpanded(false)}>
          <div
            className="mx-4 w-full max-w-xs animate-in zoom-in-95 fade-in rounded-2xl bg-background p-5 shadow-2xl ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-semibold">Support ServoSight</p>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="rounded-full p-1 transition-colors hover:bg-muted"
                aria-label="Close donation popup"
                tabIndex={0}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              If ServoSight saves you money at the pump, consider sending a few sats.
            </p>

            <div className="mt-4 flex justify-center">
              <a
                href={BTC_URI}
                className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-border"
                aria-label="Open Bitcoin wallet"
              >
                <QRCodeSVG
                  value={BTC_URI}
                  size={180}
                  bgColor="#ffffff"
                  fgColor={resolvedTheme === "dark" ? "#1a1a1a" : "#0a0a0a"}
                  level="M"
                  includeMargin={false}
                />
              </a>
            </div>

            <div className="mt-4">
              <p className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Bitcoin (BTC)
              </p>
              <button
                onClick={handleCopy}
                className="mt-1.5 flex w-full items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted"
                aria-label="Copy Bitcoin address"
                tabIndex={0}
              >
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-foreground">
                  {BTC_ADDRESS}
                </span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
              </button>
              {copied && (
                <p className="mt-1 text-center text-[10px] font-medium text-green-500">
                  Copied to clipboard
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
