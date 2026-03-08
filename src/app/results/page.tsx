"use client";

import React, { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Link from "next/link";
import Image from "next/image";

export default function ResultsPage() {
    useEffect(() => {
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
    }, []);

    return (
        <>
            <AppHeader />
            <main className="flex-grow pt-16">
                <section className="pt-32 pb-24 px-6 bg-neutral-surface min-h-screen">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12" data-animation-on-scroll="">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Link href="/upload" className="text-brand-primary hover:underline text-sm font-bold flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                        BACK TO UPLOAD
                                    </Link>
                                    <span className="text-gray-300">/</span>
                                    <span className="text-sm text-text-secondary font-mono">REPORT #PV-882190</span>
                                </div>
                                <h1 className="font-heading text-4xl font-normal tracking-tighter">Detection Results</h1>
                            </div>
                            <div className="flex gap-4">
                                <button className="px-6 py-3 bg-white border border-border-light text-text-primary font-bold rounded-sm flex items-center gap-2 hover:bg-gray-50 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    DOWNLOAD JSON
                                </button>
                                <button className="px-6 py-3 bg-text-primary text-white font-bold rounded-sm shadow-medium flex items-center gap-2 hover:-translate-y-0.5 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                    EXPORT PDF REPORT
                                </button>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Media View */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-2xl shadow-medium border border-border-light overflow-hidden" data-animation-on-scroll="">
                                    <div className="bg-gray-900 aspect-video relative group overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="https://images.pexels.com/photos/11849379/pexels-photo-11849379.jpeg?w=1200&h=800&fit=crop" alt="Analyzed road" className="w-full h-full object-cover opacity-80" loading="eager" />

                                        {/* SVG Bounding Boxes */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            {/* Box 1 */}
                                            <rect x="20" y="30" width="15" height="12" fill="none" stroke="#ef4444" strokeWidth="0.5" className="animate-pulse"></rect>
                                            {/* Box 2 */}
                                            <rect x="55" y="45" width="20" height="15" fill="none" stroke="#facc15" strokeWidth="0.5"></rect>
                                            {/* Box 3 */}
                                            <rect x="40" y="70" width="10" height="8" fill="none" stroke="#22c55e" strokeWidth="0.5"></rect>
                                        </svg>

                                        {/* Overlay Labels (HTML for better styling) */}
                                        <div className="absolute top-[30%] left-[20%] -translate-y-full bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-t-sm">POTHOLE #1: SEVERE (94%)</div>
                                        <div className="absolute top-[45%] left-[55%] -translate-y-full bg-yellow-400 text-black text-[8px] font-bold px-1 py-0.5 rounded-t-sm">POTHOLE #2: MEDIUM (88%)</div>
                                        <div className="absolute top-[70%] left-[40%] -translate-y-full bg-green-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-t-sm">CRACK #3: MINOR (78%)</div>

                                        {/* Analysis Status */}
                                        <div className="absolute top-4 right-4 bg-gray-950/80 backdrop-blur p-4 rounded-lg border border-white/10 text-white">
                                            <div className="text-[10px] opacity-60 uppercase mb-2">Live Analysis</div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-8 text-xs"><span>Detections:</span> <span className="font-bold text-brand-primary">03</span></div>
                                                <div className="flex justify-between gap-8 text-xs"><span>Confidence:</span> <span className="font-bold text-brand-primary">86.7%</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detection Table */}
                                <div className="bg-white rounded-2xl shadow-medium border border-border-light overflow-hidden" data-animation-on-scroll="">
                                    <div className="px-6 py-4 border-b border-border-light bg-neutral-surface">
                                        <h3 className="font-heading font-bold">Detailed Detection List</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-xs font-mono text-text-secondary uppercase border-b border-border-light">
                                                    <th className="px-6 py-4">ID</th>
                                                    <th className="px-6 py-4">Severity</th>
                                                    <th className="px-6 py-4">Confidence</th>
                                                    <th className="px-6 py-4">Dimensions</th>
                                                    <th className="px-6 py-4">Coordinates</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-light">
                                                <tr className="hover:bg-neutral-surface transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm">#001</td>
                                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase">Severe</span></td>
                                                    <td className="px-6 py-4 text-sm">94.2%</td>
                                                    <td className="px-6 py-4 text-sm">45cm x 32cm</td>
                                                    <td className="px-6 py-4 text-sm font-mono">40.71, -74.00</td>
                                                </tr>
                                                <tr className="hover:bg-neutral-surface transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm">#002</td>
                                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-[10px] font-bold uppercase">Medium</span></td>
                                                    <td className="px-6 py-4 text-sm">88.5%</td>
                                                    <td className="px-6 py-4 text-sm">22cm x 18cm</td>
                                                    <td className="px-6 py-4 text-sm font-mono">40.72, -74.01</td>
                                                </tr>
                                                <tr className="hover:bg-neutral-surface transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm">#003</td>
                                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-600 rounded text-[10px] font-bold uppercase">Minor</span></td>
                                                    <td className="px-6 py-4 text-sm">78.1%</td>
                                                    <td className="px-6 py-4 text-sm">N/A (Crack)</td>
                                                    <td className="px-6 py-4 text-sm font-mono">40.71, -74.02</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-8">
                                {/* Map Placeholder */}
                                <div className="bg-white p-6 rounded-2xl shadow-medium border border-border-light" data-animation-on-scroll="">
                                    <h3 className="font-heading font-bold mb-4">Location Visualization</h3>
                                    <div className="bg-gray-100 rounded-xl aspect-square relative overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="https://images.pexels.com/photos/6287932/pexels-photo-6287932.jpeg?w=600&h=600&fit=crop" alt="Map View" className="w-full h-full object-cover" loading="eager" />
                                        {/* Simulated Markers */}
                                        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce shadow-lg"></div>
                                        <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-lg"></div>
                                        <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg"></div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-sm text-text-secondary">Accuracy Radius:</span>
                                        <span className="text-sm font-bold">~2.4m</span>
                                    </div>
                                </div>

                                {/* Maintenance Recommendation */}
                                <div className="bg-text-primary text-white p-6 rounded-2xl shadow-medium" data-animation-on-scroll="">
                                    <h3 className="font-heading font-bold mb-4">AI Dispatch Advice</h3>
                                    <p className="text-sm opacity-70 mb-6 leading-relaxed">
                                        Based on severity and location density, we recommend dispatching a Tier-1 repair crew to #001 immediately. #002 and #003 can be scheduled for routine quarterly maintenance.
                                    </p>
                                    <button className="w-full py-3 bg-brand-primary text-text-primary font-bold rounded-md hover:scale-[1.02] transition-transform">Generate Work Order</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <AppFooter />
        </>
    );
}
