import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

export default function APIDocsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-surface">
            <AppHeader />
            <main className="flex-grow pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-12 border-b border-border-light pb-8">
                        <div className="text-brand-primary text-sm font-bold tracking-widest uppercase mb-3">Developers</div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-4">API Documentation</h1>
                        <p className="text-lg text-text-secondary max-w-2xl">
                            Integrate SadakSathi's computer vision and data reporting engines directly into your municipal systems or custom apps.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-8">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Getting Started</h4>
                                    <ul className="space-y-2 text-sm font-medium">
                                        <li><a href="#" className="text-brand-primary">Authentication</a></li>
                                        <li><a href="#" className="text-text-primary hover:text-brand-primary">Endpoints Overview</a></li>
                                        <li><a href="#" className="text-text-primary hover:text-brand-primary">Rate Limits</a></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Complaints API</h4>
                                    <ul className="space-y-2 text-sm font-medium">
                                        <li><a href="#" className="text-text-primary hover:text-brand-primary">Create Complaint</a></li>
                                        <li><a href="#" className="text-text-primary hover:text-brand-primary">Retrieve Image Streams</a></li>
                                        <li><a href="#" className="text-text-primary hover:text-brand-primary">Update Status</a></li>
                                    </ul>
                                </div>
                            </div>
                        </aside>

                        {/* Content Area */}
                        <div className="flex-grow bg-white border border-border-light rounded-2xl p-8 lg:p-12">
                            <h2 className="text-2xl font-heading font-bold mb-4">Authentication</h2>
                            <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                All API requests require a Bearer token in the Authorization header. You can generate a 
                                scoped API key from your municipality dashboard.
                            </p>
                            
                            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto mb-10">
                                <span className="text-pink-400">Authorization:</span> Bearer sk_live_abc123...
                            </div>

                            <h2 className="text-2xl font-heading font-bold mb-4">POST /api/v1/complaints</h2>
                            <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                Submits a raw image and geo-coordinates for automated AI processing. Our engine will return detected classes (pothole, garbage, fallen tree) and a severity score ranging from 0.0 to 1.0.
                            </p>

                            <h4 className="text-sm font-bold mb-3">Request Payload</h4>
                            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto mb-6">
{`{
  "image": "data:image/jpeg;base64,...",
  "location": {
    "lat": 19.0760,
    "lng": 72.8777
  },
  "timestamp": "2025-04-05T12:00:00Z"
}`}
                            </div>

                            <h4 className="text-sm font-bold mb-3">Response</h4>
                            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
{`{
  "id": "cmp_8992abc",
  "status": "processed",
  "detections": [
    { "class": "pothole", "confidence": 0.98, "severity": 0.85 }
  ],
  "assignedTo": "ward_k_east"
}`}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
