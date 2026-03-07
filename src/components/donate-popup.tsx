"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "next-themes";
import { X, Heart, Copy, Check, Coins, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { appleSpring, fadeUp, quickFade, softSpring } from "@/lib/motion";

const BTC_ADDRESS = "bc1pns9f80z2s3t4xyqx0sec9v63jfuxwhvjyxetfar3hwv7h0qke90qjcx4fu";
const BTC_URI = `bitcoin:${BTC_ADDRESS}`;

export const DonatePopup = ({ compact = false }: { compact?: boolean }) => {
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
              "above-bottom-nav glass-pill fixed left-4 z-[1500] flex items-center gap-2 rounded-full px-3 py-2 md:bottom-4 md:left-32",
              compact && "max-md:left-auto max-md:right-4 max-md:px-2.5 max-md:py-1.5"
            )}
          >
            <motion.button
              onClick={() => setExpanded(true)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={quickFade}
              className="flex items-center gap-2 text-xs font-medium text-foreground"
              aria-label="Show Bitcoin donation info"
              tabIndex={0}
            >
              <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/12 text-orange-500">
                <motion.div
                  animate={{ scale: [1, 1.18, 1], opacity: [0.16, 0.32, 0.16] }}
                  transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-orange-500/30"
                />
                <Heart className="relative h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[11px] font-semibold">{compact ? "Support" : "Support via BTC"}</span>
                {!compact && (
                  <span className="text-[10px] text-muted-foreground">Help keep prices live and independent</span>
                )}
              </div>
            </motion.button>
            <button
              onClick={handleDismiss}
              className="ml-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/24 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              exit={fadeUp.exit}
              transition={appleSpring}
              className="glass-panel-strong relative mx-4 w-full max-w-sm overflow-hidden rounded-[2rem] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-orange-500/14 via-amber-400/10 to-transparent" />
              <motion.div
                aria-hidden="true"
                animate={{ x: [0, 10, -6, 0], y: [0, -4, 6, 0], scale: [1, 1.04, 0.98, 1] }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="pointer-events-none absolute -top-10 right-4 h-28 w-28 rounded-full bg-orange-400/14 blur-3xl"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-500 ring-1 ring-orange-500/15">
                    <Coins className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Support ServoSight</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Keep live fuel tracking independent
                    </p>
                  </div>
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

              <div className="mt-4 flex flex-wrap gap-2">
                <div className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-foreground/85">
                  <Sparkles className="h-3 w-3 text-orange-500" />
                  Community funded
                </div>
                <div className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-foreground/85">
                  <Heart className="h-3 w-3 text-orange-500" />
                  Bitcoin only
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                If ServoSight saves you money at the pump, consider sending a few sats to help
                keep the app fast, live, and expanding across more states.
              </p>

              <div className="mt-4 flex justify-center">
                <motion.a
                  href={BTC_URI}
                  aria-label="Open Bitcoin wallet"
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={softSpring}
                  className="relative rounded-[1.6rem]"
                >
                  <motion.div
                    aria-hidden="true"
                    animate={{ scale: [1, 1.04, 1], opacity: [0.42, 0.6, 0.42] }}
                    transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    className="absolute inset-2 rounded-[1.4rem] bg-orange-400/18 blur-2xl"
                  />
                  <div className="depth-soft relative rounded-[1.5rem] bg-white p-3 ring-1 ring-black/5">
                    <QRCodeSVG
                      value={BTC_URI}
                      size={188}
                      bgColor="#ffffff"
                      fgColor={resolvedTheme === "dark" ? "#1a1a1a" : "#0a0a0a"}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </motion.a>
              </div>

              <div className="mt-5">
                <p className="text-center text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Bitcoin (BTC)
                </p>
                <motion.button
                  onClick={handleCopy}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  transition={softSpring}
                  className="glass-panel mt-2 flex w-full items-center gap-3 rounded-[1.1rem] px-3 py-3 text-left transition-colors hover:bg-muted/50"
                  aria-label="Copy Bitcoin address"
                  tabIndex={0}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background/75 ring-1 ring-border/60">
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Copy address
                    </p>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-foreground">
                      {BTC_ADDRESS}
                    </span>
                  </div>
                </motion.button>
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.p
                      key="copied"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={quickFade}
                      className="mt-2 text-center text-[10px] font-medium text-green-500"
                    >
                      Address copied to clipboard
                    </motion.p>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0.8 }}
                      exit={{ opacity: 0 }}
                      transition={quickFade}
                      className="mt-2 text-center text-[10px] text-muted-foreground"
                    >
                      Scan with a wallet or tap to copy
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
