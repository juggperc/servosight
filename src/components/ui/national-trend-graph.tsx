"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { formatPriceCents } from "@/lib/utils";
import { LineChart, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import type { DailyAverage } from "@/lib/kv";

type NationalTrendGraphProps = {
    data: DailyAverage[];
    isLoading: boolean;
    error?: string | null;
    fuelLogoName?: string;
};

export const NationalTrendGraph = ({ data, isLoading, error, fuelLogoName = "Fuel" }: NationalTrendGraphProps) => {
    const { pathData, minPrice, maxPrice, startPrice, endPrice, isTrendingDown } = useMemo(() => {
        if (!data || data.length < 2) {
            return { pathData: "", minPrice: 0, maxPrice: 0, startPrice: 0, endPrice: 0, isTrendingDown: false };
        }

        const prices = data.map((d) => d.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min;
        const padding = range === 0 ? 10 : range * 0.2; // Add 20% vertical padding

        const yMin = min - padding;
        const yMax = max + padding;
        const yRange = yMax - yMin;

        const width = 300; // SVG viewBox width
        const height = 100; // SVG viewBox height

        // Generate path
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d.price - yMin) / yRange) * height; // Invert Y because SVG origin is top-left
            return `${x},${y}`;
        });

        const d = `M ${points.join(" L ")}`;

        const start = prices[0];
        const end = prices[prices.length - 1];

        return {
            pathData: d,
            minPrice: min,
            maxPrice: max,
            startPrice: start,
            endPrice: end,
            isTrendingDown: end < start,
        };
    }, [data]);

    if (isLoading) {
        return (
            <div className="glass-panel relative h-[220px] rounded-2xl border border-border/50 p-5 flex flex-col items-center justify-center space-y-3 animate-pulse">
                <LineChart className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">Loading market trend...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="glass-panel relative h-[220px] rounded-2xl border border-red-500/30 bg-red-500/5 p-5 flex flex-col items-center justify-center space-y-3">
                <AlertCircle className="h-6 w-6 text-red-500/80" />
                <p className="text-sm font-medium text-red-400">Could not load market history</p>
            </div>
        );
    }

    if (data.length < 2) {
        return (
            <div className="glass-panel relative h-[220px] rounded-2xl border border-border/50 p-5 flex flex-col items-center justify-center text-center space-y-2">
                <LineChart className="h-6 w-6 text-blue-500 mb-1" />
                <p className="text-sm font-bold text-foreground">Gathering Data</p>
                <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                    The national database has just started tracking. Check back tomorrow to see the trend!
                </p>
                {data.length === 1 && (
                    <p className="text-xs font-bold text-blue-400 mt-2">Today's Avg: {formatPriceCents(data[0].price)}</p>
                )}
            </div>
        );
    }

    const TrendIcon = isTrendingDown ? TrendingDown : TrendingUp;
    const trendColor = isTrendingDown ? "text-green-500" : "text-orange-500";
    const strokeColor = isTrendingDown ? "#22c55e" : "#f97316";

    const diff = Math.abs(endPrice - startPrice);
    const diffStr = diff > 0 ? `${formatPriceCents(diff)}` : "Flat";

    return (
        <div className="glass-panel relative overflow-hidden rounded-2xl border border-border/50 p-5">
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <h3 className="text-[13px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                        <LineChart className="h-3.5 w-3.5" />
                        National 30-Day Trend
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                        <TrendIcon className={`h-5 w-5 ${trendColor}`} />
                        <span className={`text-xl font-black tracking-tight ${trendColor}`}>
                            {isTrendingDown ? "Falling" : "Rising"}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{data.length}-Day Delta</p>
                    <p className={`font-price text-xl font-black ${isTrendingDown ? 'text-green-400' : 'text-orange-400'}`}>
                        {isTrendingDown ? "-" : "+"}{diffStr}
                    </p>
                </div>
            </div>

            <div className="h-[100px] w-full mt-6 relative z-10">
                <svg viewBox="0 0 300 100" className="w-full h-full preserve-3d overflow-visible">
                    {/* Subtle grid lines */}
                    <line x1="0" y1="0" x2="300" y2="0" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="currentColor" strokeWidth="1" className="text-white/5" />

                    <motion.path
                        d={pathData}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                        className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                    />
                </svg>

                {/* Start / End Prices Labels */}
                <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-between pointer-events-none">
                    <div className="flex flex-col justify-end pb-1 pb-safe">
                        <span className="text-[10px] font-bold text-muted-foreground/50 tabular-nums">
                            {formatPriceCents(startPrice)}
                        </span>
                    </div>
                    <div className="flex flex-col justify-end pb-1 pb-safe text-right">
                        <span className={`text-[11px] font-black tabular-nums ${trendColor}`}>
                            {formatPriceCents(endPrice)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
