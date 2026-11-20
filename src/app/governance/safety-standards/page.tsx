import React from 'react';
import { GitMerge, Lock, Scale, ShieldCheck, UserCheck, type LucideIcon } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import Reveal from '@/components/Reveal';
import IconTile from '@/components/landing/IconTile';
import PageHero from '@/components/landing/PageHero';

const CHECKS: { title: string; icon: LucideIcon; body: string }[] = [
    { title: 'A person reviews every report', icon: UserCheck, body: 'The model suggests what a hazard is and how urgent it looks. Municipal staff decide whether to approve, hold, reject or complete each report, and can add remarks.' },
    { title: 'Challans are issued by traffic staff', icon: Scale, body: 'Violations found in footage are listed for the traffic desk. A challan is created only when a traffic officer issues it, after checking the footage and the number plate.' },
    { title: 'Duplicates are linked, not deleted', icon: GitMerge, body: 'If a new report matches one within about 100 m, it is linked to the original so the department sees how many people reported it. Text-only reports need a near-exact match to count as duplicates.' },
    { title: 'Staff accounts are separate', icon: Lock, body: 'Municipal and traffic staff log in with their own accounts and see only their department’s queue.' },
];

export default function SafetyStandardsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-background">
            <AppHeader />
            <main id="main-content" className="flex-grow">
                <PageHero
                    wide
                    title="How decisions are checked"
                    icon={ShieldCheck}
                    lead="Detection is automatic, but nothing is fixed, rejected or fined without a person looking at it."
                />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
                    <ul className="grid gap-5 md:grid-cols-2">
                        {CHECKS.map((c, i) => (
                            <Reveal as="li" key={c.title} delay={i * 70}>
                                <section className="group h-full rounded-xl border border-border-light bg-surface p-6 sm:p-7 elevated lift">
                                    <IconTile icon={c.icon} />
                                    <h2 className="mt-5 text-xl font-heading font-bold tracking-tight">{c.title}</h2>
                                    <p className="mt-2 text-text-secondary leading-relaxed">{c.body}</p>
                                </section>
                            </Reveal>
                        ))}
                    </ul>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
