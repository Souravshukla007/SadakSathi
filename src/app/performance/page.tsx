"use client";

import React, { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export default function PerformancePage() {
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
            if (!el.classList.contains('animate-on-scroll-hidden')) {
                el.classList.add('animate-on-scroll-hidden');
            }
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <AppHeader />
            <main className="flex-grow">
                <section className="pt-32 pb-24 px-6 bg-neutral-background min-h-screen">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="max-w-3xl mb-16" data-animation-on-scroll="">
                            <div className="inline-block px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-full uppercase tracking-widest mb-4">Model v2.4 Research</div>
                            <h1 className="text-5xl md:text-6xl font-heading font-bold tracking-tight text-text-primary mb-6">AI Model Performance</h1>
                            <p className="text-xl text-text-secondary">Deep academic benchmarks and real-world performance metrics for our specialized infrastructure vision models.</p>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16" data-animation-on-scroll="">
                            {/* Metric 1 */}
                            <div className="bg-white p-10 rounded-3xl border border-border-light shadow-soft group hover:border-brand-primary transition-all">
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Precision</h4>
                                <p className="text-5xl font-bold text-text-primary mb-4">94.8%</p>
                                <p className="text-xs text-text-secondary">Accuracy of detected potholes across daylight and low-light environments.</p>
                            </div>
                            {/* Metric 2 */}
                            <div className="bg-white p-10 rounded-3xl border border-border-light shadow-soft group hover:border-brand-primary transition-all">
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Recall</h4>
                                <p className="text-5xl font-bold text-text-primary mb-4">91.2%</p>
                                <p className="text-xs text-text-secondary">Ability to correctly identify all existing road hazards in a single frame pass.</p>
                            </div>
                            {/* Metric 3 */}
                            <div className="bg-white p-10 rounded-3xl border border-border-light shadow-soft group hover:border-brand-primary transition-all">
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">F1 Score</h4>
                                <p className="text-5xl font-bold text-text-primary mb-4">92.9</p>
                                <p className="text-xs text-text-secondary">Weighted average balance between precision and recall metrics.</p>
                            </div>
                            {/* Metric 4 */}
                            <div className="bg-white p-10 rounded-3xl border border-border-light shadow-soft group hover:border-brand-primary transition-all">
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">mAP @ .50</h4>
                                <p className="text-5xl font-bold text-text-primary mb-4">0.86</p>
                                <p className="text-xs text-text-secondary">Mean Average Precision at 50% intersection over union threshold.</p>
                            </div>
                            {/* Metric 5 */}
                            <div className="bg-white p-10 rounded-3xl border border-border-light shadow-soft group hover:border-brand-primary transition-all">
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">False Positive Rate</h4>
                                <p className="text-5xl font-bold text-text-primary mb-4">1.2%</p>
                                <p className="text-xs text-text-secondary">Minimal misidentification of shadows or road debris as potholes.</p>
                            </div>
                            {/* Metric 6 */}
                            <div className="bg-white p-10 rounded-3xl border border-border-light shadow-soft group hover:border-brand-primary transition-all">
                                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Inference Time</h4>
                                <p className="text-5xl font-bold text-text-primary mb-4">42<span className="text-2xl">ms</span></p>
                                <p className="text-xs text-text-secondary">Processing latency on NVIDIA Jetson Orin edge-computing hardware.</p>
                            </div>
                        </div>

                        {/* Methodology */}
                        <div className="bg-neutral-surface p-12 rounded-3xl border border-border-light" data-animation-on-scroll="">
                            <div className="max-w-3xl">
                                <h3 className="font-heading text-2xl font-bold mb-6">Validation Methodology</h3>
                                <p className="text-text-secondary leading-relaxed mb-6">
                                    Model v2.4 was trained on a proprietary dataset of 120,000+ high-resolution road frames spanning 12 different weather conditions and 4 distinct geographical road types. Our validation sets are audited by civil engineering experts to ensure depth estimation accuracy aligns with real-world physical measurements.
                                </p>
                                <button className="px-8 py-4 bg-text-primary text-white font-bold rounded-lg shadow-soft hover:shadow-medium transition-all">
                                    Download Whitepaper (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <AppFooter />
        </>
    );
}
