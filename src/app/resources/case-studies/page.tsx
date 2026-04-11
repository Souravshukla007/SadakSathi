import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import Link from 'next/link';

export default function CaseStudiesPage() {
    const studies = [
        {
            location: "Navi Mumbai Municipal Corporation",
            metricTitle: "Repair Time Reduction",
            metricValue: "64%",
            details: "By routing AI-classified severe potholes directly to the nearest field worker, Navi Mumbai cut their average repair time from 14 days to just 5 days.",
            imgColor: "bg-blue-100 border-blue-200"
        },
        {
            location: "Kerala Traffic Police",
            metricTitle: "Helmet Violations Caught",
            metricValue: "12,000+",
            details: "SadakSathi's traffic mode was mounted on interceptor vehicles, automatically processing license plates of riders without helmets in real-time.",
            imgColor: "bg-green-100 border-green-200"
        },
        {
            location: "Delhi Public Works Dept",
            metricTitle: "Citizen Engagement",
            metricValue: "3x",
            details: "Gamified leaderboards and transparent tracking increased citizen road-hazard reporting by 300% within the first two months of deployment.",
            imgColor: "bg-orange-100 border-orange-200"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-neutral-surface">
            <AppHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16 text-center max-w-3xl mx-auto">
                        <div className="text-brand-primary text-sm font-bold tracking-widest uppercase mb-3">Impact</div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-6">Real-World Case Studies</h1>
                        <p className="text-lg text-text-secondary">
                            Discover how forward-thinking cities and traffic authorities are transforming urban infrastructure management using SadakSathi's AI engine.
                        </p>
                    </div>

                    <div className="space-y-12">
                        {studies.map((study, idx) => (
                            <div key={idx} className={`bg-white border flex flex-col md:flex-row items-center border-border-light p-8 rounded-3xl shadow-soft ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className={`w-full md:w-2/5 aspect-video md:aspect-[4/3] rounded-2xl flex items-center justify-center border ${study.imgColor} mb-8 md:mb-0 md:mx-8`}>
                                    <svg className="w-16 h-16 text-gray-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <div className="w-full md:w-3/5">
                                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">{study.location}</div>
                                    <h2 className="text-3xl font-heading font-bold mb-6">{study.metricValue} {study.metricTitle}</h2>
                                    <p className="text-text-secondary leading-relaxed mb-8">{study.details}</p>
                                    <Link href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white text-sm font-bold rounded-xl hover:shadow-soft transition-all hover:-translate-y-0.5">
                                        Read Full Study
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
