'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';

interface AnalyticsData {
    totalViolations: number;
    avgConfidence: number;
    vehicleCount: number;
    totalChallanAmount: number;
    totalChallansIssued: number;
}

export default function TrafficInsightsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AnalyticsData>({
        totalViolations: 0,
        avgConfidence: 0,
        vehicleCount: 0,
        totalChallanAmount: 0,
        totalChallansIssued: 0,
    });

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Auth check
                const authRes = await fetch('/api/auth/me');
                if (!authRes.ok) { router.push('/auth'); return; }
                
                // Fetch traffic analytics
                const res = await fetch('/api/traffic/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [router]);

    return (
        <>
            <AppHeader dashboardMode />
            <main className="flex-grow pt-16 h-screen flex flex-col bg-neutral-surface">
                <div className="flex-grow flex w-full h-full overflow-hidden">
                    
                    {/* Sidebar */}
                    <aside className="w-64 bg-text-primary text-white hidden lg:flex flex-col h-full z-10 shadow-soft flex-shrink-0">
                        <div className="p-6 border-b border-white/10">
                            <div className="text-xl font-heading font-bold flex items-center gap-2">
                                <span className="text-2xl">🛣️</span> SadakSathi
                            </div>
                            <div className="mt-2 text-[10px] text-white/50 font-mono uppercase tracking-widest">Traffic Operations</div>
                        </div>
                        <nav className="flex-grow p-4 space-y-1">
                            <Link href="/Traffic" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Dashboard
                            </Link>
                            <Link href="/upload" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                Run Detection
                            </Link>
                            <Link href="/results?engine=traffic" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Last Report
                            </Link>
                            <Link href="/Traffic/chat" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                Chats
                            </Link>
                            <Link href="/Traffic/insights" className="flex items-center gap-3 px-4 py-3 bg-brand-primary text-text-primary font-bold rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Insights
                            </Link>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-grow p-8 overflow-y-auto">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-heading font-normal tracking-tight">Traffic Insights</h1>
                                    <p className="text-sm text-text-secondary mt-1">Analytics on traffic violations and e-challans.</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center text-text-secondary">
                                    <div className="inline-block w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-3" />
                                    <p className="text-sm">Loading insights…</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                                            <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-2">Vehicles Scanned</div>
                                            <div className="text-3xl font-bold">{stats.vehicleCount.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                                            <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-2">Total Violations</div>
                                            <div className="text-3xl font-bold text-red-600">{stats.totalViolations.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                                            <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-2">Avg AI Confidence</div>
                                            <div className="text-3xl font-bold text-brand-primary">{stats.avgConfidence}%</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                                            <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-2">Challans Issued</div>
                                            <div className="text-3xl font-bold text-green-600">{stats.totalChallansIssued}</div>
                                            <div className="text-xs text-text-secondary mt-1 font-mono">₹{stats.totalChallanAmount.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-8 rounded-2xl shadow-soft border border-border-light">
                                        <h2 className="font-heading font-bold text-lg mb-6">Enforcement Funnel</h2>
                                        
                                        <div className="flex flex-col items-center max-w-md mx-auto space-y-2">
                                            {/* Stage 1 */}
                                            <div className="w-full bg-neutral-surface border border-border-light rounded-xl p-4 flex justify-between items-center relative z-10">
                                                <span className="font-bold text-sm">Vehicles Scanned</span>
                                                <span className="font-mono">{stats.vehicleCount}</span>
                                            </div>
                                            {/* Stage 2 */}
                                            <div className="w-[85%] bg-red-50 border border-red-100 rounded-xl p-4 flex justify-between items-center relative z-10">
                                                <span className="font-bold text-sm text-red-700">Violations Detected</span>
                                                <span className="font-mono text-red-700">{stats.totalViolations}</span>
                                            </div>
                                            {/* Stage 3 */}
                                            <div className="w-[70%] bg-green-50 border border-green-100 rounded-xl p-4 flex justify-between items-center relative z-10">
                                                <span className="font-bold text-sm text-green-700">Challans Issued</span>
                                                <span className="font-mono text-green-700">{stats.totalChallansIssued}</span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-center text-xs text-text-secondary mt-8">
                                            {(stats.totalViolations / Math.max(stats.vehicleCount, 1) * 100).toFixed(1)}% violation rate.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
