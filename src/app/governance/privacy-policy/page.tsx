import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-surface">
            <AppHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="mb-12 border-b border-border-light pb-8">
                        <div className="text-brand-primary text-sm font-bold tracking-widest uppercase mb-3">Governance</div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-4">Privacy Policy</h1>
                        <p className="text-sm text-text-secondary font-mono">Last Updated: October 2025</p>
                    </div>

                    <div className="prose prose-blue max-w-none text-text-secondary prose-headings:text-text-primary prose-headings:font-heading prose-a:text-brand-primary bg-white p-8 md:p-12 rounded-2xl border border-border-light shadow-sm">
                        <h3 className="text-xl font-bold mb-3">1. Introduction</h3>
                        <p className="mb-6 leading-relax">
                            SadakSathi AI bounds itself by strict municipal data laws to guarantee the privacy of road users and reporting citizens. 
                            This document describes how we gather, utilize, parse, and protect data acquired through your use of the application and web platform.
                        </p>

                        <h3 className="text-xl font-bold mb-3 mt-8">2. Information Collection</h3>
                        <ul className="list-disc pl-6 mb-6 space-y-2">
                            <li><strong>Geo-spatial Image Data:</strong> Photographs uploaded for hazard or violation detection. These images are scrubbed for unauthorized PII initially.</li>
                            <li><strong>Location Data:</strong> Embedded GPS coordinates attached to complaints to aid municipal authorities.</li>
                            <li><strong>Account Data:</strong> Contact information, reputation scores, and OAuth tokens associated with your citizen login.</li>
                        </ul>

                        <h3 className="text-xl font-bold mb-3 mt-8">3. Use of Information</h3>
                        <p className="mb-6 leading-relax">
                            The visual data uploaded to our service is processed automatically by our Computer Vision models to output structured data (severity, defect type). We do not use citizen-uploaded images for internal marketing or sell telemetry. 
                            Aggregated metrics are shared exclusively with verified municipal accounts.
                        </p>

                        <h3 className="text-xl font-bold mb-3 mt-8">4. Data Retention</h3>
                        <p className="mb-6 leading-relax">
                            Images that contain resolved potholes or verified traffic challans are archived in cold storage for 6 months per regulatory compliance, after which they are permanently expunged. Data models are re-trained on obfuscated, de-identified datasets only.
                        </p>
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
