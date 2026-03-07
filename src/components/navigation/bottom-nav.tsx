"use client";

import { Map, Plus, Search, Flame, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { appleSpring, softSpring } from "@/lib/motion";

export type TabId = "map" | "submit" | "search" | "deals" | "settings";

type BottomNavProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

const tabs: { id: TabId; label: string; icon: typeof Map }[] = [
  { id: "map", label: "Map", icon: Map },
  { id: "submit", label: "Report", icon: Plus },
  { id: "search", label: "Search", icon: Search },
  { id: "deals", label: "Deals", icon: Flame },
  { id: "settings", label: "Settings", icon: Settings },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softSpring}
      className="fixed inset-x-3 bottom-3 z-[2000] pb-safe md:inset-x-auto md:left-4 md:top-1/2 md:bottom-auto md:w-[88px] md:-translate-y-1/2"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="glass-panel-strong flex items-center justify-around rounded-[1.9rem] px-2 py-2 shadow-[0_24px_58px_rgba(15,23,42,0.18)] md:h-full md:flex-col md:justify-start md:gap-1 md:rounded-[2rem] md:px-2 md:py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              tabIndex={0}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.97 }}
              transition={appleSpring}
              className={cn(
                "group relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.35rem] px-4 py-2.5 md:w-full md:flex-none md:px-2.5 md:py-3",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground/70 hover:text-foreground/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-highlight"
                  transition={appleSpring}
                  className="absolute inset-0 rounded-[1.35rem] bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_rgba(15,23,42,0.1)] ring-1 ring-white/60 dark:bg-white/8 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_28px_rgba(0,0,0,0.22)] dark:ring-white/10"
                />
              )}
              <div className="relative flex h-8 w-8 items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-icon-glow"
                    transition={softSpring}
                    className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-blue-400/12"
                  />
                )}
                <Icon
                  className={cn(
                    "relative h-[22px] w-[22px] transition-all duration-300 ease-out",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <motion.span
                animate={{ opacity: isActive ? 1 : 0.82 }}
                transition={softSpring}
                className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};
