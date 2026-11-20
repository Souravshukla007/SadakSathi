import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import Reveal from '@/components/Reveal';
import PageHero from '@/components/landing/PageHero';
import { Code } from 'lucide-react';

const ENDPOINTS = [
    {
        id: 'detect-image',
        method: 'POST',
        path: '/detect/image',
        summary: 'Finds road hazards in one photo and rates each one high, medium or low.',
        params: [
            ['file', 'The image (multipart form field). Required.'],
            ['conf_threshold', 'Minimum confidence, default 0.20.'],
            ['include_annotated', 'Return the photo with boxes drawn on it, default true.'],
        ],
        example: `{
  "success": true,
  "total_detections": 1,
  "road_priority": "High",
  "detections": [
    { "class_name": "manhole_cover", "confidence": 0.8951, "priority": "High" }
  ],
  "message": "Detected 1 hazard(s)."
}`,
    },
    {
        id: 'detect-traffic-video',
        method: 'POST',
        path: '/detect/traffic/video',
        summary: 'Tracks vehicles through a video and lists each violation once, with the number plate where it can be read.',
        params: [
            ['file', 'The video (multipart form field). Required.'],
            ['conf_threshold', 'Minimum confidence, default 0.25.'],
            ['tracker', 'bytetrack.yaml or botsort.yaml.'],
            ['run_ocr', 'Read number plates, default true.'],
        ],
        example: `{
  "success": true,
  "unique_tracked_violations": 1,
  "violations": [
    { "track_id": 4, "display_name": "No Helmet", "priority": "High",
      "first_seen_sec": 0.4, "plate_text": "MH 12 AB 1234" }
  ]
}`,
    },
    {
        id: 'duplicate-check',
        method: 'POST',
        path: '/duplicate/check',
        summary: 'Checks whether a new report matches an existing one within about 100 m, using the photo, the description and the distance.',
        params: [
            ['text', 'The report description.'],
            ['location', '[latitude, longitude].'],
            ['issue_type', 'For example pothole.'],
            ['image_base64', 'The photo, optional.'],
        ],
        example: `{
  "is_duplicate": true,
  "confidence": 0.724,
  "original_report_id": "cuid_of_original_complaint"
}`,
    },
    {
        id: 'health',
        method: 'GET',
        path: '/health',
        summary: 'Says whether the service is up and which models are loaded.',
        params: [],
        example: null,
    },
];

const METHOD_CHIP: Record<string, string> = {
    POST: 'bg-text-primary text-neutral-background',
    GET: 'border border-border-dark text-text-primary',
};

export default function APIDocsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-background">
            <AppHeader />
            <main id="main-content" className="flex-grow">
                <PageHero
                    wide
                    title="Detection API"
                    icon={Code}
                    lead="The detection service that the web app calls behind the scenes. It runs on your own server (port 8000 by default) and has no public endpoint or API keys."
                />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
                        <nav aria-label="Endpoints" className="lg:w-60 flex-shrink-0">
                            <ul className="lg:sticky lg:top-28 space-y-1 rounded-xl border border-border-light bg-surface p-2 text-sm elevated">
                                {ENDPOINTS.map((e) => (
                                    <li key={e.id}>
                                        <a href={`#${e.id}`} className="flex min-h-11 items-center gap-2 rounded-md px-3 font-semibold text-text-primary hover:bg-neutral-surface transition-colors">
                                            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${METHOD_CHIP[e.method]}`}>{e.method}</span>
                                            <span className="min-w-0 break-words">{e.path}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <div className="flex-grow min-w-0 space-y-6">
                            {ENDPOINTS.map((e) => (
                                <Reveal key={e.id}>
                                    <section id={e.id} className="scroll-mt-28 rounded-xl border border-border-light bg-surface p-6 sm:p-8 elevated">
                                        <h2 className="flex flex-wrap items-center gap-3 text-2xl font-heading font-normal tracking-tighter mb-3 break-words">
                                            <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${METHOD_CHIP[e.method]}`}>{e.method}</span>
                                            <span className="min-w-0 break-words">{e.path}</span>
                                        </h2>
                                        <p className="text-text-secondary leading-relaxed mb-5">{e.summary}</p>
                                        {e.params.length > 0 && (
                                            <dl className="mb-5 divide-y divide-border-light rounded-lg border border-border-light text-sm">
                                                {e.params.map(([name, desc]) => (
                                                    <div key={name} className="px-4 py-2.5 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
                                                        <dt><code className="font-mono font-semibold text-text-primary">{name}</code></dt>
                                                        <dd className="text-text-secondary">{desc}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        )}
                                        {e.example && (
                                            <>
                                                <h3 className="text-sm font-semibold text-text-secondary mb-2">Example response</h3>
                                                <pre className="bg-asphalt rounded-lg p-4 font-mono text-xs text-white/90 overflow-x-auto border border-border-light">{e.example}</pre>
                                            </>
                                        )}
                                    </section>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
