'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Activity,
    Server,
    Zap,
    Users,
    Database,
    Terminal,
    Cpu,
    Eye,
    Map as MapIcon,
} from 'lucide-react'
import Link from 'next/link'

const STYLES = {
    glass: 'rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-2xl',
}

interface ServerMetrics {
    uptime: number;
    memory: {
        rss: number;
        systemTotal: number;
    };
    cpu: {
        loadAvg: number[];
    };
    kv: {
        status: string;
        latencyMs: number;
        keysCount: number;
    };
    env: {
        region: string;
        nodeEnv: string;
    };
}

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState<ServerMetrics | null>(null)
    const [psLatency, setPsLatency] = useState<number | null>(null)
    const [dbLatency, setDbLatency] = useState<number | null>(null)

    const fetchRealData = async () => {
        try {
            // 1. Fetch server stats
            const resStats = await fetch('/api/admin/metrics')
            if (resStats.ok) setMetrics(await resStats.json())

            // 2. Ping PetrolSpy Integration (use dummy coords for latency test)
            const psStart = performance.now()
            await fetch('/api/petrolspy?lat=-33.86&lng=151.2')
            setPsLatency(Math.round(performance.now() - psStart))

            // 3. Ping core prices API
            const dbStart = performance.now()
            await fetch('/api/prices')
            setDbLatency(Math.round(performance.now() - dbStart))
        } catch (e) {
            console.error('Failed to grab real metrics', e)
        }
    }

    // Refresh every 10 seconds
    useEffect(() => {
        fetchRealData()
        const interval = setInterval(fetchRealData, 10000)
        return () => clearInterval(interval)
    }, [])

    const fmtUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24))
        const h = Math.floor(seconds % (3600 * 24) / 3600)
        const m = Math.floor(seconds % 3600 / 60)
        const s = Math.floor(seconds % 60)
        if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
        return `${h}h ${m}m ${s}s`
    }

    const fmtBytes = (bytes: number) => {
        if (!bytes) return "0 MB"
        return (bytes / 1024 / 1024).toFixed(1) + " MB"
    }

    if (!metrics) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-white">
                <Activity className="h-6 w-6 animate-pulse text-blue-500" />
                <span className="ml-3 animate-pulse text-sm font-bold tracking-widest text-zinc-400">CONNECTING TO EDGE...</span>
            </div>
        )
    }

    // Convert cpu load to percentage (roughly matching typical display)
    const cpuPercent = metrics.cpu.loadAvg && metrics.cpu.loadAvg.length > 0
        ? Math.min(100, Math.round(metrics.cpu.loadAvg[0] * 10))
        : 1;

    // Convert memory (rss vs total)
    const memPercent = Math.round((metrics.memory.rss / (metrics.memory.systemTotal || metrics.memory.rss * 4)) * 100);

    return (
        <div className="min-h-screen bg-zinc-950 p-4 text-white selection:bg-blue-500/30 md:p-8">
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950" />
            <div className="relative z-10 mx-auto max-w-6xl space-y-6">
                <header className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-mono text-xl font-bold uppercase tracking-widest text-white">ServoSight</h1>
                            <p className="text-[10px] font-bold tracking-widest text-blue-400">REALTIME_COMMAND_v1</p>
                        </div>
                    </div>
                    <Link href="/" className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
                        <MapIcon className="h-4 w-4" />
                        Live Map
                    </Link>
                </header>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={STYLES.glass}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Node Uptime</p>
                            <Activity className="h-4 w-4 text-emerald-400" />
                        </div>
                        <p className="mt-4 font-mono text-2xl font-bold tracking-tight text-white">{fmtUptime(metrics.uptime)}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <p className="text-[10px] font-semibold tracking-wider text-emerald-400">LIVE PROCESS</p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={STYLES.glass}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Vercel KV Store</p>
                            <Eye className="h-4 w-4 text-blue-400" />
                        </div>
                        <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-white">{metrics.kv.keysCount} keys</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500">
                            {metrics.kv.status === 'online' ? `Latency: ${metrics.kv.latencyMs}ms` : 'KV Data Not Configured'}
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={STYLES.glass}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Memory RSS Feed</p>
                            <Zap className="h-4 w-4 text-yellow-400" />
                        </div>
                        <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-white">{fmtBytes(metrics.memory.rss)}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500">Allocated in this Serverless instance</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={STYLES.glass}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Server Region</p>
                            <Users className="h-4 w-4 text-purple-400" />
                        </div>
                        <p className="mt-4 font-mono text-2xl font-bold tracking-tight text-white">{metrics.env.region}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500">Current Next.js Execution Context</p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`col-span-1 lg:col-span-2 ${STYLES.glass}`}>
                        <h2 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                            <Server className="h-4 w-4 text-zinc-400" />
                            Live Direct API Pings
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className={`h-2 w-2 rounded-full ${psLatency && psLatency < 2000 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <div>
                                        <p className="text-sm font-bold text-white">/api/petrolspy</p>
                                        <p className="text-xs text-zinc-400">External upstream integration polling</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-bold text-white">{psLatency ?? '---'}ms</p>
                                    <p className="text-xs text-emerald-400">Tested Live</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <div>
                                        <p className="text-sm font-bold text-white">/api/prices</p>
                                        <p className="text-xs text-zinc-400">Local node execution route</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-bold text-white">{dbLatency ?? '---'}ms</p>
                                    <p className="text-xs text-emerald-400">Tested Live</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <div>
                                        <p className="text-sm font-bold text-white">Vercel Insights</p>
                                        <p className="text-xs text-zinc-400">Traffic logs deferred to Vercel Analytics</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <a href="https://vercel.com" target="_blank" className="font-mono text-[10px] font-bold text-blue-400 hover:underline">OPEN VERCEL</a>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={STYLES.glass}>
                        <h2 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                            <Cpu className="h-4 w-4 text-zinc-400" />
                            Hardware Polling
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Node CPU Load Estimate</span>
                                    <span className="font-mono text-white">{cpuPercent}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full rounded-full bg-blue-500 transition-all duration-1000" style={{ width: `${cpuPercent}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Node RSS Memory Ratio</span>
                                    <span className="font-mono text-white">{memPercent}% / {fmtBytes(metrics.memory.systemTotal)}</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full rounded-full bg-purple-500 transition-all duration-1000" style={{ width: `${memPercent}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 rounded-xl border border-white/5 bg-white/5 p-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                <Database className="h-4 w-4" />
                                ENVIRONMENT
                            </div>
                            <p className="mt-1 font-mono text-sm font-bold text-white">NODE_ENV: {metrics.env.nodeEnv}</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
