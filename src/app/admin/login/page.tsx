'use client'

import { useState } from 'react'
import { Lock, LogIn, ShieldAlert } from 'lucide-react'
import { loginAction } from './actions'
import { motion } from 'framer-motion'

export default function AdminLogin() {
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const result = await loginAction(formData)
        if (result?.error) {
            setError(result.error)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-mono">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_50%)]" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl backdrop-blur-2xl"
            >
                <div className="mb-8 flex flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                        <Lock className="h-8 w-8 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Central Command</h1>
                    <p className="mt-2 text-xs text-zinc-400">Restricted Access // Secure Gateway</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="relative">
                            <input
                                type="password"
                                name="password"
                                autoFocus
                                placeholder="Enter Passcode..."
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-10 text-sm font-medium text-white placeholder-zinc-500 outline-none transition-all focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500"
                            />
                            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400"
                        >
                            <ShieldAlert className="h-4 w-4" />
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
                    >
                        Authenticate
                        <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </form>
            </motion.div>
        </div>
    )
}
