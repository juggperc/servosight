"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { appleSpring } from "@/lib/motion";
import { HapticsProvider } from "@/components/haptics-provider";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MotionConfig reducedMotion="user" transition={appleSpring}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <HapticsProvider>{children}</HapticsProvider>
      </NextThemesProvider>
    </MotionConfig>
  );
};
