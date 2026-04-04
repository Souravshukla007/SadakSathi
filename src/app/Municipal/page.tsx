"use client";

import React, { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyToken } from "@/lib/jwt";

export default function UserDashboardPage() {
    const router = useRouter();

    useEffect(() => {
        // Check authentication and role
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    router.push('/auth');
                    return;
                }
                
                const data = await res.json();
                // Check if user has municipal access
                if (data.role !== 'municipal' && data.role !== 'user') {
                    router.push('/auth');
                    return;
                }
            } catch (error) {
                router.push('/auth');
            }
        };

        checkAuth();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-on-scroll-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('[data-animation-on-scroll]').forEach(el => {
            el.classList.add('animate-on-scroll-hidden');
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, [router]);

    return (
        <>
            <AppHeader dashboardMode={true} />
            <main className="flex-grow pt-16">
                <div className="flex min-h-screen bg-neutral-surface">
                    {/* Sidebar */}
                    <aside className="w-64 bg-text-primary text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-[60]">
                        <div className="p-6 border-b border-white/10">
                            <div className="text-xl font-heading font-bold flex items-center gap-2">
                                <span className="text-2xl">🛣️</span> SadakSathi
                            </div>
                        </div>
                        <nav className="flex-grow p-4 space-y-1">
                            <Link href="/account" className="flex items-center gap-3 px-4 py-3 bg-brand-primary text-text-primary font-bold rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                Dashboard
                            </Link>
                            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                Analytics
                            </Link>
                            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Heatmaps
                            </Link>
                            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Team Access
                            </Link>
                        </nav>
                        <div className="p-4 border-t border-white/10">
                            <div className="flex items-center gap-3 px-4 py-3 text-white opacity-70">
                                <div className="w-8 h-8 rounded-full bg-brand-primary"></div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold truncate">Municipal User</div>
                                    <div className="text-[10px] opacity-60 truncate">Municipal@SadakSathi.ai</div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-grow lg:ml-64 p-8">
                        <div className="max-w-7xl mx-auto">
                            {/* Top Navbar Contextual Info */}
                            <div className="flex justify-between items-center mb-10">
                                <h1 className="text-3xl font-heading font-normal tracking-tight">Municipal Dashboard</h1>
                                <div className="flex items-center gap-4">
                                    <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-soft border border-border-light relative">
                                        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                                    </button>
                                    <div className="h-8 w-px bg-gray-200"></div>
                                    <span className="text-sm font-bold text-text-primary">CITY OF NEW YORK</span>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">Total Uploads</div>
                                    <div className="text-3xl font-bold mb-1">2,482</div>
                                    <div className="text-xs text-green-500 font-bold flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                                        +12.5% this month
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">Potholes Detected</div>
                                    <div className="text-3xl font-bold mb-1">8,102</div>
                                    <div className="text-xs text-text-secondary">Avg. 3.2 per upload</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">High Severity</div>
                                    <div className="text-3xl font-bold mb-1 text-red-500">1,244</div>
                                    <div className="text-xs text-text-secondary">Requires immediate action</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">AI Accuracy</div>
                                    <div className="text-3xl font-bold mb-1">94.2%</div>
                                    <div className="text-xs text-brand-primary font-bold">Industry Leading</div>
                                </div>
                            </div>

                            {/* Charts Area */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-soft border border-border-light">
                                    <h3 className="font-heading font-bold mb-8">Pothole Detection Trends (Daily)</h3>
                                    <div className="h-64 flex items-end justify-between gap-2">
                                        {/* Mock Bar Chart */}
                                        <div className="w-full bg-brand-primary/20 rounded-t-sm h-[40%]"></div>
                                        <div className="w-full bg-brand-primary/40 rounded-t-sm h-[60%]"></div>
                                        <div className="w-full bg-brand-primary/20 rounded-t-sm h-[30%]"></div>
                                        <div className="w-full bg-brand-primary/60 rounded-t-sm h-[85%]"></div>
                                        <div className="w-full bg-brand-primary/40 rounded-t-sm h-[55%]"></div>
                                        <div className="w-full bg-brand-primary/80 rounded-t-sm h-[95%]"></div>
                                        <div className="w-full bg-brand-primary/100 rounded-t-sm h-[70%]"></div>
                                    </div>
                                    <div className="flex justify-between mt-4 text-[10px] font-mono text-text-secondary">
                                        <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-2xl shadow-soft border border-border-light">
                                    <h3 className="font-heading font-bold mb-8">Severity Distribution</h3>
                                    <div className="relative aspect-square flex items-center justify-center">
                                        {/* Mock Pie Chart (Ring) */}
                                        <div className="w-full h-full rounded-full border-[20px] border-gray-100 relative">
                                            <div className="absolute inset-[-20px] rounded-full border-[20px] border-red-500 clip-path-75"></div>
                                        </div>
                                        <div className="absolute text-center">
                                            <div className="text-2xl font-bold">1,244</div>
                                            <div className="text-[10px] uppercase font-mono text-text-secondary">High Risk</div>
                                        </div>
                                    </div>
                                    <div className="mt-8 space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> High</div>
                                            <span className="font-bold">15%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> Medium</div>
                                            <span className="font-bold">45%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-400 rounded-full"></div> Low</div>
                                            <span className="font-bold">40%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Uploads Table */}
                            <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
                                <div className="px-8 py-6 border-b border-border-light flex justify-between items-center">
                                    <h3 className="font-heading font-bold">Recent Detection Tasks</h3>
                                    <button className="text-sm font-bold text-brand-primary hover:underline">View All Tasks</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-mono text-text-secondary uppercase bg-neutral-surface border-b border-border-light">
                                                <th className="px-8 py-4">Task ID</th>
                                                <th className="px-8 py-4">User</th>
                                                <th className="px-8 py-4">Status</th>
                                                <th className="px-8 py-4">Detections</th>
                                                <th className="px-8 py-4">Timestamp</th>
                                                <th className="px-8 py-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-light">
                                            <tr className="hover:bg-neutral-surface transition-colors">
                                                <td className="px-8 py-5 text-sm font-mono">#PV-9912</td>
                                                <td className="px-8 py-5 text-sm">John Doe</td>
                                                <td className="px-8 py-5"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">COMPLETED</span></td>
                                                <td className="px-8 py-5 text-sm font-bold">03</td>
                                                <td className="px-8 py-5 text-sm text-text-secondary">2 mins ago</td>
                                                <td className="px-8 py-5"><Link href="/results" className="text-brand-primary hover:underline text-sm font-bold">Details</Link></td>
                                            </tr>
                                            <tr className="hover:bg-neutral-surface transition-colors">
                                                <td className="px-8 py-5 text-sm font-mono">#PV-9911</td>
                                                <td className="px-8 py-5 text-sm">Sarah Smith</td>
                                                <td className="px-8 py-5"><span className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded text-[10px] font-bold">PROCESSING</span></td>
                                                <td className="px-8 py-5 text-sm font-bold">--</td>
                                                <td className="px-8 py-5 text-sm text-text-secondary">5 mins ago</td>
                                                <td className="px-8 py-5"><span className="text-gray-300 text-sm font-bold">Details</span></td>
                                            </tr>
                                            <tr className="hover:bg-neutral-surface transition-colors">
                                                <td className="px-8 py-5 text-sm font-mono">#PV-9910</td>
                                                <td className="px-8 py-5 text-sm">Municipal Bot</td>
                                                <td className="px-8 py-5"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold">COMPLETED</span></td>
                                                <td className="px-8 py-5 text-sm font-bold">14</td>
                                                <td className="px-8 py-5 text-sm text-text-secondary">15 mins ago</td>
                                                <td className="px-8 py-5"><Link href="/results" className="text-brand-primary hover:underline text-sm font-bold">Details</Link></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <div className="lg:ml-64">
                <AppFooter />
            </div>
        </>
    );
}
