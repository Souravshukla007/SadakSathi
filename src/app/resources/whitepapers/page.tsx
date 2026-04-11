import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import Link from 'next/link';

export default function WhitepapersPage() {
    const whitepapers = [
        {
            title: "Computer Vision in Municipal Governance: A Zero-to-One Approach",
            date: "October 2025",
            abstract: "An in-depth analysis of how edge-AI and cloud inference models drastically reduce the time to municipal intervention for critical infrastructure faults like potholes and damaged signage.",
            tag: "AI & Infrastructure"
        },
        {
            title: "Traffic Violation Automation: Scaling Safety",
            date: "August 2025",
            abstract: "Discussing our 98.4% accuracy helmet-detection model and how automating e-challan systems removes bias and increases urban road safety compliance.",
            tag: "Traffic Enforcement"
        },
        {
            title: "Predictive Road Maintenance with Geospatial AI",
            date: "March 2025",
            abstract: "How aggregating crowd-sourced image data over time enables cities to predict pavement degradation before it reaches critical severity thresholds.",
            tag: "Predictive Analytics"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-neutral-surface">
            <AppHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-12">
                        <div className="text-brand-primary text-sm font-bold tracking-widest uppercase mb-3">Resources</div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-4">Whitepapers</h1>
                        <p className="text-lg text-text-secondary max-w-2xl">
                            Explore our deeply researched technical papers on urban mobility, AI inference models, and structural road analytics.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {whitepapers.map((wp, i) => (
                            <div key={i} className="bg-white border border-border-light rounded-2xl p-8 hover:shadow-soft transition-all duration-300 flex flex-col h-full">
                                <div className="text-xs font-mono font-bold text-brand-primary bg-brand-primary/10 w-max px-3 py-1 rounded-full mb-4">
                                    {wp.tag}
                                </div>
                                <h3 className="text-xl font-heading font-bold text-text-primary mb-3 leading-snug">{wp.title}</h3>
                                <p className="text-xs text-text-secondary font-mono mb-4">{wp.date}</p>
                                <p className="text-sm text-text-secondary mb-8 flex-grow">{wp.abstract}</p>
                                <button className="flex items-center gap-2 text-sm font-bold text-brand-primary hover:text-blue-700 transition-colors mt-auto">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8l-8 8-8-8"/>
                                    </svg>
                                    Download PDF
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
