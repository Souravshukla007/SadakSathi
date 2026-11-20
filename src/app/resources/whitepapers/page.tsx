import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import Reveal from '@/components/Reveal';
import IconTile from '@/components/landing/IconTile';
import PageHero from '@/components/landing/PageHero';
import { FileText, Gauge, GitMerge, ScanText, type LucideIcon } from 'lucide-react';

const NOTES: { title: string; icon: LucideIcon; body: string[] }[] = [
    {
        title: 'Spotting duplicate reports',
        icon: GitMerge,
        body: [
            'Only reports within 100 m of the new one are compared; everything farther away is skipped straight away using a grid lookup.',
            'Each nearby report gets a score from three signals: how similar the photos look (25%), how similar the descriptions read (40%), and how close the two locations are (35%).',
            'A combined score of 0.68 or more marks the new report as a duplicate and links it to the original. Without a photo the best possible score is 0.75, so text-only reports must be almost identical and within about 5 m.',
        ],
    },
    {
        title: 'Rating a hazard’s priority',
        icon: Gauge,
        body: [
            'The model outlines each hazard and measures the share of the photo it covers.',
            'Depth is estimated from the shadow inside the outline: darker and higher-contrast means deeper.',
            'Open manholes are always high priority; broken signs, broken street lights and overflowing garbage are at least medium.',
        ],
    },
    {
        title: 'Reading number plates without slowing down',
        icon: ScanText,
        body: [
            'Reading a plate takes about 1.6 seconds on a CPU, too slow to do on every video frame.',
            'Each vehicle is tracked across frames and given an ID, and its plate is read once for that ID. This cuts plate-reading work by about 95%.',
        ],
    },
];

export default function WhitepapersPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-background">
            <AppHeader />
            <main id="main-content" className="flex-grow">
                <PageHero
                    title="Technical notes"
                    icon={FileText}
                    lead={<>Short explanations of how SadakSathi makes its decisions. Longer papers haven&apos;t been published yet.</>}
                />

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20 space-y-6">
                    {NOTES.map((n, i) => (
                        <Reveal key={n.title} delay={i * 70}>
                            <section className="group rounded-xl border border-border-light bg-surface p-6 sm:p-8 elevated lift">
                                <h2 className="flex items-center gap-4 text-2xl font-heading font-normal tracking-tighter mb-5">
                                    <IconTile icon={n.icon} />
                                    {n.title}
                                </h2>
                                <ul className="list-disc pl-5 space-y-2 text-text-secondary leading-relaxed marker:text-sign-green">
                                    {n.body.map((p) => <li key={p}>{p}</li>)}
                                </ul>
                            </section>
                        </Reveal>
                    ))}
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
