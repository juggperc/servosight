"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative isolate inline-flex shrink-0 items-center rounded-full border border-white/45 p-[3px] shadow-[0_10px_20px_rgba(15,23,42,0.1)] outline-none transition-[background-color,box-shadow,transform] duration-300 ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-8 data-[size=default]:w-14 data-[size=sm]:h-6 data-[size=sm]:w-10 data-[state=checked]:bg-[linear-gradient(180deg,rgba(194,247,221,0.92),rgba(160,240,201,0.64))] data-[state=unchecked]:bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(235,239,245,0.72))] dark:border-white/10 dark:shadow-[0_12px_24px_rgba(0,0,0,0.24)] dark:data-[state=checked]:bg-[linear-gradient(180deg,rgba(68,168,255,0.3),rgba(45,129,255,0.2))] dark:data-[state=unchecked]:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[3px] rounded-full border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.18)] dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(255,255,255,0.02)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[3px] overflow-hidden rounded-full"
      >
        <span
          className="absolute top-1/2 left-[2px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0.48)_35%,rgba(110,231,183,0.18)_75%,transparent_100%)] blur-[6px] transition-[transform,opacity,scale] duration-300 ease-out group-data-[size=default]/switch:h-6 group-data-[size=default]/switch:w-6 group-data-[size=sm]/switch:h-4 group-data-[size=sm]/switch:w-4 group-data-[state=unchecked]/switch:opacity-35 group-data-[state=checked]/switch:opacity-100 group-data-[state=unchecked]/switch:-translate-y-1/2 group-data-[state=checked]/switch:-translate-y-1/2 group-data-[state=checked]/switch:translate-x-[calc(100%-2px)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),rgba(125,211,252,0.18)_38%,rgba(59,130,246,0.12)_72%,transparent_100%)]"
        />
      </span>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none relative z-10 block rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,244,246,0.84))] ring-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_10px_rgba(15,23,42,0.16),0_1px_3px_rgba(15,23,42,0.1)] transition-[transform,background,box-shadow] duration-300 ease-out group-data-[size=default]/switch:size-6 group-data-[size=sm]/switch:size-4 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.1))] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_10px_rgba(0,0,0,0.35)]"
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-[1px] rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.95),rgba(255,255,255,0.45)_38%,rgba(255,255,255,0.12)_70%,transparent_100%)]"
        />
        <span
          aria-hidden="true"
          className="absolute top-[2px] left-[4px] h-[38%] w-[58%] rounded-full bg-white/75 blur-[1px] dark:bg-white/20"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
