"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "next-themes";
import { X, Heart, Copy, Check, Coins, Sparkles } from "lucide-react";
import { useAppHaptics } from "@/components/haptics-provider";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { appleSpring, fadeUp, quickFade, softSpring } from "@/lib/motion";

const BTC_ADDRESS = "bc1pns9f80z2s3t4xyqx0sec9v63jfuxwhvjyxetfar3hwv7h0qke90qjcx4fu";
const BTC_URI = `bitcoin:${BTC_ADDRESS}`;

export const DonatePopup = ({ compact = false }: { compact?: boolean }) => {
  const haptics = useAppHaptics();
  const { resolvedTheme } = useTheme();
  const [dismissed, setDismissed] = useLocalStorage("servo-donate-dismissed", false);
  const [expanded, setExpanded] = useState(false);
  const [toastExpanded, setToastExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleDismiss = useCallback(() => {
    haptics.dismiss();
    setVisible(false);
    setDismissed(true);
  }, [haptics, setDismissed]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BTC_ADDRESS);
      haptics.copy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      haptics.warning();
    }
  }, [haptics]);

  if (!visible) return null;

  return (
    <>
      {/* Collapsed: subtle floating pill */}
      <AnimatePresence>
        {!expanded && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -40, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)", transition: { duration: 0.2 } }}
            transition={appleSpring}
            className={cn(
              "fixed top-3 z-[2000] mx-auto overflow-hidden bg-zinc-950/80 ring-1 ring-white/10 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] transform-gpu will-change-transform mt-safe",
              toastExpanded
                ? "rounded-[2rem] w-[calc(100%-24px)] md:w-[380px] left-3 md:left-1/2 md:-translate-x-1/2"
                : "rounded-full w-fit left-1/2 -translate-x-1/2"
            )}
          >
            {/* COMPACT STAGE */}
            {!toastExpanded && (
              <motion.button
                layout="position"
                onClick={() => {
                  haptics.selection();
                  setToastExpanded(true);
                }}
                className="flex items-center gap-2 px-3 py-2"
                aria-label="Show Bitcoin donation info"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-orange-500/30"
                  />
                  <Heart className="relative h-3 w-3" />
                </div>
                <span className="text-[12px] font-semibold text-zinc-100 tracking-tight pr-1">Support ServoSight</span>
              </motion.button>
            )}

            {/* EXPANDED STAGE */}
            {toastExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
                className="flex flex-col p-4 w-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-500">
                      <Heart className="h-4 w-4" />
                    </div>
                    <span className="text-[13px] font-bold text-zinc-100 tracking-tight">Support ServoSight</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.selection();
                      setToastExpanded(false);
                    }}
                    className="rounded-full bg-white/10 p-1.5 text-zinc-400 transition-colors hover:text-white hover:bg-white/20"
                    aria-label="Collapse notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-[12.5px] leading-relaxed text-zinc-300 mb-4 tracking-tight">
                  Running a live tool like this for free isn't cheap. We rely entirely on community Bitcoin donations to pay for servers and keep the app independent. If we save you money at the pump, please consider sending a few sats!
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      haptics.success();
                      setExpanded(true);
                      setToastExpanded(false);
                    }}
                    className="flex-1 rounded-[14px] bg-orange-500 text-white font-bold text-[13px] py-2.5 transition-colors hover:bg-orange-600 shadow-[0_4px_14px_rgba(249,115,22,0.3)]"
                  >
                    Donate BTC
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-5 rounded-[14px] bg-white/10 text-zinc-300 font-bold text-[13px] transition-colors hover:bg-white/20"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
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
            onClick={() => {
              haptics.dismiss();
              setExpanded(false);
            }}
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
                  onClick={() => {
                    haptics.dismiss();
                    setExpanded(false);
                  }}
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
                  onClick={() => haptics.success()}
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
