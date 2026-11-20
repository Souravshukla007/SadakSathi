import React from 'react';
import { CircleCheck, CirclePause, CircleX, Clock, Inbox, ThumbsUp, TriangleAlert, type LucideIcon } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import Reveal from '@/components/Reveal';
import PageHero from '@/components/landing/PageHero';

const STATUSES: { label: string; icon: LucideIcon; chip: string; meaning: string }[] = [
    { label: 'Submitted', icon: Inbox, chip: 'bg-hazard/15 text-hazard-ink', meaning: 'Your report has arrived and is waiting for the department to look at it.' },
    { label: 'Approved', icon: ThumbsUp, chip: 'border border-border-dark text-text-primary', meaning: 'The department accepted it and is planning the work.' },
    { label: 'On hold', icon: CirclePause, chip: 'border border-border-dark text-text-primary', meaning: 'Work is paused, usually waiting on information or a crew. Check the chat for a question.' },
    { label: 'Rejected', icon: CircleX, chip: 'bg-signal-red/10 text-signal-red', meaning: 'The department won’t act on it. The remarks say why.' },
    { label: 'Completed', icon: CircleCheck, chip: 'bg-text-primary text-neutral-background', meaning: 'The department says it’s fixed, sometimes with an after photo.' },
];

export default function SLAAgreementsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-background">
            <AppHeader />
            <main id="main-content" className="flex-grow">
                <PageHero title="Response times" icon={Clock}>
                    <p className="animate-rise [animation-delay:120ms] mt-8 flex items-start gap-3 rounded-lg border border-hazard/40 bg-hazard/15 text-hazard-ink px-4 py-3">
                        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        SadakSathi doesn&apos;t publish a service-level agreement yet. How fast a report is handled depends on the municipal or traffic department it goes to.
                    </p>
                </PageHero>

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20">
                    <h2 className="text-2xl font-heading font-normal tracking-tighter mb-2">What each status means</h2>
                    <p className="text-text-secondary leading-relaxed mb-8">You&apos;ll see one of these on every report you make.</p>
                    <Reveal>
                        <dl className="overflow-hidden rounded-xl border border-border-light bg-surface divide-y divide-border-light elevated">
                            {STATUSES.map((s) => (
                                <div key={s.label} className="px-5 py-5 sm:px-6 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-6 sm:items-baseline">
                                    <dt>
                                        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-0.5 rounded ${s.chip}`}>
                                            <s.icon className="size-4" aria-hidden="true" />
                                            {s.label}
                                        </span>
                                    </dt>
                                    <dd className="mt-2 sm:mt-0 text-text-secondary leading-relaxed">{s.meaning}</dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
