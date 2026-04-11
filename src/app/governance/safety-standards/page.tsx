import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

export default function SafetyStandardsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-surface">
            <AppHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="text-brand-primary text-sm font-bold tracking-widest uppercase mb-3">Governance</div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-6">AI Safety & Compliance Standards</h1>
                        <p className="text-lg text-text-secondary">
                            At SadakSathi, deploying AI in civic environments requires an uncompromising commitment to bias reduction, data integrity, and traffic-safety compliance.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-border-light shadow-soft p-8 md:p-12 space-y-12">
                        <section>
                            <h2 className="text-2xl font-bold font-heading mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                                Unbiased Visual Inference
                            </h2>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                Our Computer Vision models are trained on highly diverse, cross-regional datasets encompassing various weather conditions, lighting limitations, and camera resolutions to ensure high fidelity detections regardless of the socio-economic geography of the deployed area.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold font-heading mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                                Data Anonymization at the Edge
                            </h2>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                In our Traffic Enforcement pipelines, faces and irrelevant vehicle descriptors are blurred automatically via Edge-compute modules prior to being transmitted to our main servers. Only authorized instances (e.g., catching a helmet violation) will parse the necessary PII metrics securely.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold font-heading mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
                                ISO Compliance
                            </h2>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                SadakSathi infrastructures strictly adhere to ISO/IEC 27001 standards for Information Security Management. Access to our internal dashboards and reporting analytics requires multi-factor authenticated Municipal accounts.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
