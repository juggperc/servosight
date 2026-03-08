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
    LogOut,
    Map,
} from 'lucide-react'
import Link from 'next/link'

// Quick helper for plausible mocked command centre stats
const STYLES = {
    glass: 'rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-2xl',
    glassDark: 'rounded-xl border border-blue-500/20 bg-blue-500/5 p-4',
}

export default function AdminDashboard() {
    const [uptime, setUptime] = useState(0)
    const [requests, setRequests] = useState(13303)
    const [activeUsers, setActiveUsers] = useState(Math.floor(Math.random() * 50) + 120)

    // Real-time ticking effect
    useEffect(() => {
        const start = Date.now() - 3600000 * 48 // 48 hours ago mock

        const interval = setInterval(() => {
            setUptime(Math.floor((Date.now() - start) / 1000))

            // Randomly spike metrics to make it feel alive
            if (Math.random() > 0.7) {
                setRequests(r => r + Math.floor(Math.random() * 5))
            }
            if (Math.random() > 0.9) {
                setActiveUsers(u => u + (Math.random() > 0.5 ? 1 : -1))
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const fmtUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24))
        const h = Math.floor(seconds % (3600 * 24) / 3600)
        const m = Math.floor(seconds % 3600 / 60)
        const s = Math.floor(seconds % 60)
        return `${d}d ${h}h ${m}m ${s}s`
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-4 text-white selection:bg-blue-500/30 md:p-8">
            {/* Background glow */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950" />

            <div className="relative z-10 mx-auto max-w-6xl space-y-6">

                {/* Header */}
                <header className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-mono text-xl font-bold uppercase tracking-widest text-white">ServoSight</h1>
                            <p className="text-[10px] font-bold tracking-widest text-blue-400">COMMAND_CENTRE_v1.0.0</p>
                        </div>
                    </div>

                    <Link href="/" className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
                        <Map className="h-4 w-4" />
                        Live Map
                    </Link>
                </header>

                {/* Top Metric Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={STYLES.glass}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">System Uptime</p>
                            <Activity className="h-4 w-4 text-emerald-400" />
                        </div>
                        <p className="mt-4 font-mono text-2xl font-bold tracking-tight text-white">{fmtUptime(uptime)}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <p className="text-[10px] font-semibold tracking-wider text-emerald-400">ALL SYSTEMS NOMINAL</p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={STYLES.glass}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Impressions</p>
                            <Eye className="h-4 w-4 text-blue-400" />
                        </div>
                        <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-white">4.2M</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500">+12% from last week</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={STYLES.glass}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Live API Requests</p>
                            <Zap className="h-4 w-4 text-yellow-400" />
                        </div>
                        <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-white">{requests.toLocaleString()}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500">~42 req/sec global avg</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={STYLES.glass}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Users</p>
                            <Users className="h-4 w-4 text-purple-400" />
                        </div>
                        <p className="mt-4 font-mono text-3xl font-bold tracking-tight text-white">{activeUsers}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-500">Connected to edge network</p>
                    </motion.div>
                </div>

                {/* Detailed Status Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* API Health */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`col-span-1 lg:col-span-2 ${STYLES.glass}`}>
                        <h2 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                            <Server className="h-4 w-4 text-zinc-400" />
                            API Routing Status
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <div>
                                        <p className="text-sm font-bold text-white">/api/petrolspy</p>
                                        <p className="text-xs text-zinc-400">External upstream integration</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-bold text-white">124ms</p>
                                    <p className="text-xs text-emerald-400">99.9% Success</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <div>
                                        <p className="text-sm font-bold text-white">/api/prices</p>
                                        <p className="text-xs text-zinc-400">Database read layer</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-bold text-white">42ms</p>
                                    <p className="text-xs text-emerald-400">100% Success</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <div>
                                        <p className="text-sm font-bold text-white">/api/prices/report</p>
                                        <p className="text-xs text-zinc-400">Crowdsourcing write layer</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-bold text-white">88ms</p>
                                    <p className="text-xs text-emerald-400">100% Success</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* System Load */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className={STYLES.glass}>
                        <h2 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                            <Cpu className="h-4 w-4 text-zinc-400" />
                            Edge Compute Load
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">CPU Usage</span>
                                    <span className="font-mono text-white">14%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full w-[14%] rounded-full bg-blue-500 transition-all duration-1000" />
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Memory</span>
                                    <span className="font-mono text-white">1.2 GB / 4.0 GB</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full w-[30%] rounded-full bg-purple-500 transition-all duration-1000" />
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                                    <span className="text-zinc-400">Vercel KV Load</span>
                                    <span className="font-mono text-white">4%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full w-[4%] rounded-full bg-emerald-500 transition-all duration-1000" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 rounded-xl border border-white/5 bg-white/5 p-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                <Database className="h-4 w-4" />
                                REGION
                            </div>
                            <p className="mt-1 font-mono text-sm font-bold text-white">syd1 (Sydney, AU)</p>
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    )
}
