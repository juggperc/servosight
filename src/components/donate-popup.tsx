"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "next-themes";
import { X, Heart, Copy, Check } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { appleSpring, fadeUp, quickFade, softSpring } from "@/lib/motion";

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
      <AnimatePresence>
        {!expanded && (
          <motion.div
            initial={{ opacity: 0, x: -20, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -14, y: 8, filter: "blur(8px)" }}
            transition={softSpring}
            className={cn(
              "glass-pill fixed left-4 bottom-20 z-[1500] flex items-center gap-2 rounded-full px-3.5 py-2 md:bottom-4 md:left-32",
            )}
          >
            <motion.button
              onClick={() => setExpanded(true)}
              whileTap={{ scale: 0.98 }}
              transition={quickFade}
              className="flex items-center gap-2 text-xs font-medium text-foreground"
              aria-label="Show Bitcoin donation info"
              tabIndex={0}
            >
              <Heart className="h-3.5 w-3.5 text-orange-500" />
              <span>Support via BTC</span>
            </motion.button>
            <button
              onClick={handleDismiss}
              className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss donation prompt"
              tabIndex={0}
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded: QR card */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quickFade}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              exit={fadeUp.exit}
              transition={appleSpring}
              className="glass-panel-strong mx-4 w-full max-w-xs rounded-[1.8rem] p-5"
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
                  className="depth-soft rounded-[1.4rem] bg-white p-3 ring-1 ring-border"
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
                  className="glass-panel mt-1.5 flex w-full items-center gap-2 rounded-[1rem] px-3 py-2 text-left transition-colors hover:bg-muted/60"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
