import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

export default function SLAAgreementsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-surface">
            <AppHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="mb-12 text-center">
                        <div className="text-brand-primary text-sm font-bold tracking-widest uppercase mb-3">Enterprise Governance</div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-6">Service Level Agreements</h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Our commitment to municipal infrastructure requires rock-solid reliability. SadakSathi guarantees industry-leading uptime and resolution metrics.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-border-light shadow-soft overflow-hidden">
                        <div className="p-8 border-b border-border-light bg-neutral-surface/30">
                            <h3 className="text-2xl font-bold font-heading">Core SLA Commitments</h3>
                        </div>
                        <div className="divide-y divide-border-light">
                            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-1">API & Platform Uptime</h4>
                                    <p className="text-sm text-text-secondary">Guaranteed availability for image ingestion and dashboard access.</p>
                                </div>
                                <div className="flex-shrink-0 text-3xl font-heading font-bold text-brand-primary">
                                    99.98%
                                </div>
                            </div>
                            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-1">Inference Latency</h4>
                                    <p className="text-sm text-text-secondary">Maximum time allowed for our edge servers to classify an uploaded image.</p>
                                </div>
                                <div className="flex-shrink-0 text-3xl font-heading font-bold text-brand-primary">
                                    {'<'} 1.5s
                                </div>
                            </div>
                            <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-1">Support Response Time</h4>
                                    <p className="text-sm text-text-secondary">Expected maximum response time for tier-1 municipal production incidents.</p>
                                </div>
                                <div className="flex-shrink-0 text-3xl font-heading font-bold text-brand-primary">
                                    15 mins
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-8">
                        <h3 className="font-bold text-blue-900 mb-2">Service Credits</h3>
                        <p className="text-sm text-blue-800/80 leading-relaxed">
                            In the unlikely event that SadakSathi does not meet the Uptime SLA during any given calendar month, governmental and municipal subscribers will be eligible to request Service Credits equivalent to 10% of their monthly billing cycle per 1% of downtime incurred below the guaranteed 99.98% threshold.
                        </p>
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
