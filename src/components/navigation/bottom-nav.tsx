"use client";

import { Map, Plus, Search, Flame, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <nav
      className="fixed bottom-0 left-0 right-0 z-[2000] border-t border-border/60 bg-background/70 backdrop-blur-2xl backdrop-saturate-150 pb-safe md:left-0 md:top-0 md:right-auto md:bottom-0 md:w-20 md:border-t-0 md:border-r"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-1 md:h-full md:flex-col md:justify-start md:gap-1 md:px-0 md:pt-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              tabIndex={0}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group relative flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 transition-all duration-200 ease-out active:scale-90 md:w-full md:px-2",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground/70 hover:text-foreground/80"
              )}
            >
              <div className="relative flex h-7 w-7 items-center justify-center">
                {isActive && (
                  <div className="absolute -inset-1.5 animate-fade-in-up rounded-xl bg-foreground/[0.08]" />
                )}
                <Icon
                  className={cn(
                    "relative h-[22px] w-[22px] transition-all duration-300 ease-out",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
