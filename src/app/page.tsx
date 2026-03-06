"use client";

import { useState, useCallback } from "react";
import { DynamicMap } from "@/components/map/dynamic-map";
import { BottomNav, type TabId } from "@/components/navigation/bottom-nav";
import { SubmitSheet } from "@/components/sheets/submit-sheet";
import { SearchSheet } from "@/components/sheets/search-sheet";
import { DealsSheet } from "@/components/sheets/deals-sheet";
import { SettingsSheet } from "@/components/sheets/settings-sheet";
import { IOSPrompt } from "@/components/onboarding/ios-prompt";
import { DonatePopup } from "@/components/donate-popup";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dealsOpen, setDealsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);

    setSubmitOpen(false);
    setSearchOpen(false);
    setDealsOpen(false);
    setSettingsOpen(false);

    switch (tab) {
      case "submit":
        setSubmitOpen(true);
        break;
      case "search":
        setSearchOpen(true);
        break;
      case "deals":
        setDealsOpen(true);
        break;
      case "settings":
        setSettingsOpen(true);
        break;
      default:
        break;
    }
  }, []);

  const handleDrawerClose = useCallback((setter: (open: boolean) => void) => {
    return (open: boolean) => {
      setter(open);
      if (!open) setActiveTab("map");
    };
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden">
      <div className="h-full w-full md:pl-20">
        <DynamicMap />
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <SubmitSheet open={submitOpen} onOpenChange={handleDrawerClose(setSubmitOpen)} />
      <SearchSheet open={searchOpen} onOpenChange={handleDrawerClose(setSearchOpen)} />
      <DealsSheet open={dealsOpen} onOpenChange={handleDrawerClose(setDealsOpen)} />
      <SettingsSheet open={settingsOpen} onOpenChange={handleDrawerClose(setSettingsOpen)} />

      <IOSPrompt />
      <DonatePopup />
    </main>
  );
};

export default HomePage;
