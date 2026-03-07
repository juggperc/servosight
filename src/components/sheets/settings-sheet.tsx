"use client";

import { useTheme } from "next-themes";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppHaptics } from "@/components/haptics-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { STANDARD_FUEL_TYPES } from "@/lib/data/fuel-types";
import type { FuelTypeId } from "@/lib/types";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { Moon, Sun, Fuel, Radius, Heart, Copy, Check, Smartphone, Zap } from "lucide-react";
import { useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

const BTC_ADDRESS = "bc1pns9f80z2s3t4xyqx0sec9v63jfuxwhvjyxetfar3hwv7h0qke90qjcx4fu";
const BTC_URI = `bitcoin:${BTC_ADDRESS}`;

type SettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PETROLSPY_DISCLAIMER =
  "PetrolSpy data may be slow to load or fail, but could show cheaper options in your area. Data is scraped from petrolspy.com.au and is not guaranteed.";

export const SettingsSheet = ({ open, onOpenChange }: SettingsSheetProps) => {
  const haptics = useAppHaptics();
  const { resolvedTheme, setTheme } = useTheme();
  const [defaultFuel, setDefaultFuel] = useLocalStorage<FuelTypeId>("servo-default-fuel", "u91");
  const [defaultRadius, setDefaultRadius] = useLocalStorage<number>("servo-default-radius", 10);
  const [petrolspyMode, setPetrolspyMode] = useLocalStorage<boolean>("servo-petrolspy-mode", false);
  const [aggregateMode, setAggregateMode] = useLocalStorage<boolean>("servo-aggregate-mode", true);

  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [petrolspyDisclaimerOpen, setPetrolspyDisclaimerOpen] = useState(false);
  const isDark = resolvedTheme === "dark";

  const handlePetrolspyToggle = useCallback(
    (checked: boolean) => {
      if (checked) {
        setPetrolspyDisclaimerOpen(true);
      } else {
        haptics.toggleChange(false);
        setPetrolspyMode(false);
      }
    },
    [haptics, setPetrolspyMode]
  );

  const handlePetrolspyConfirm = useCallback(() => {
    haptics.toggleChange(true);
    setPetrolspyMode(true);
    setPetrolspyDisclaimerOpen(false);
  }, [haptics, setPetrolspyMode]);

  const handlePetrolspyCancel = useCallback(() => {
    setPetrolspyDisclaimerOpen(false);
  }, []);

  const handleThemeToggle = () => {
    haptics.toggleChange(!isDark);
    setTheme(isDark ? "light" : "dark");
  };

  const handleCopyBtc = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BTC_ADDRESS);
      haptics.copy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      haptics.warning();
    }
  }, [haptics]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] md:mx-auto md:max-w-md md:rounded-t-2xl">
        <DrawerHeader className="text-left">
          <DrawerTitle>Settings</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-6 px-4 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  {isDark ? "Dark theme active" : "Light theme active"}
                </p>
              </div>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={handleThemeToggle}
              aria-label="Toggle dark mode"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              <div>
                <Label className="text-sm font-medium">Haptic Feedback</Label>
                <p className="text-xs text-muted-foreground">
                  Fine pulses for map and control interactions
                </p>
              </div>
            </div>
            <Switch
              checked={haptics.enabled}
              onCheckedChange={(checked) => {
                haptics.setEnabled(checked);
                haptics.toggleChange(checked);
              }}
              aria-label="Toggle haptic feedback"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <Label className="text-sm font-medium">Aggregate Data (Beta)</Label>
                <p className="text-xs text-muted-foreground">
                  Show live state data (NSW & WA)
                </p>
              </div>
            </div>
            <Switch
              checked={aggregateMode}
              onCheckedChange={(c) => {
                haptics.toggleChange(c);
                setAggregateMode(c);
              }}
              aria-label="Toggle Aggregate data overlay"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fuel className="h-5 w-5 text-amber-500" />
              <div>
                <Label className="text-sm font-medium">PetrolSpy Prices</Label>
                <p className="text-xs text-muted-foreground">
                  Show crowdsourced prices from PetrolSpy
                </p>
              </div>
            </div>
            <Switch
              checked={petrolspyMode}
              onCheckedChange={handlePetrolspyToggle}
              aria-label="Toggle PetrolSpy price overlay"
            />
          </div>

          <AlertDialog open={petrolspyDisclaimerOpen} onOpenChange={setPetrolspyDisclaimerOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Enable PetrolSpy prices?</AlertDialogTitle>
                <AlertDialogDescription>{PETROLSPY_DISCLAIMER}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handlePetrolspyCancel}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePetrolspyConfirm}>Enable</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Fuel className="h-5 w-5" />
              <div>
                <Label className="text-sm font-medium">Default Fuel Type</Label>
                <p className="text-xs text-muted-foreground">
                  Shown by default on the map
                </p>
              </div>
            </div>
            <Select
              value={defaultFuel}
              onValueChange={(v) => {
                haptics.selection();
                setDefaultFuel(v as FuelTypeId);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STANDARD_FUEL_TYPES.map((fuel) => (
                  <SelectItem key={fuel.id} value={fuel.id}>
                    {fuel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Radius className="h-5 w-5" />
              <div>
                <Label className="text-sm font-medium">Search Radius</Label>
                <p className="text-xs text-muted-foreground">
                  {defaultRadius} km
                </p>
              </div>
            </div>
            <Slider
              value={[defaultRadius]}
              onValueChange={(v) => setDefaultRadius(v[0])}
              onValueCommit={() => haptics.selection()}
              min={5}
              max={100}
              step={5}
              aria-label="Search radius"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <button
              onClick={() => {
                haptics.toggleChange(!showQr);
                setShowQr((v) => !v);
              }}
              className="flex w-full items-center gap-3 text-left"
              aria-label="Support ServoSight with Bitcoin"
              tabIndex={0}
            >
              <Heart className="h-5 w-5 text-orange-500" />
              <div>
                <Label className="pointer-events-none text-sm font-medium">Support via BTC</Label>
                <p className="text-xs text-muted-foreground">
                  Tap to {showQr ? "hide" : "show"} QR code
                </p>
              </div>
            </button>
            {showQr && (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/30 p-4">
                <a
                  href={BTC_URI}
                  className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-border"
                  aria-label="Open Bitcoin wallet"
                  onClick={() => haptics.success()}
                >
                  <QRCodeSVG
                    value={BTC_URI}
                    size={140}
                    bgColor="#ffffff"
                    fgColor={isDark ? "#1a1a1a" : "#0a0a0a"}
                    level="M"
                    includeMargin={false}
                  />
                </a>
                <button
                  onClick={handleCopyBtc}
                  className="flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-[10px] ring-1 ring-border transition-colors hover:bg-muted"
                  aria-label="Copy Bitcoin address"
                  tabIndex={0}
                >
                  <span className="max-w-[180px] truncate font-mono text-foreground">{BTC_ADDRESS}</span>
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                </button>
              </div>
            )}
          </div>

          <Separator />

          <div className="pt-2 text-center">
            <p className="text-xs font-medium text-muted-foreground">ServoSight v1.0</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Crowdsourced fuel prices for Australia
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
