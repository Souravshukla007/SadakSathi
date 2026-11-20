import React from 'react';
import Link from 'next/link';
import { BookOpen, FileClock } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import IconTile from '@/components/landing/IconTile';
import PageHero from '@/components/landing/PageHero';

export default function CaseStudiesPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-background">
            <AppHeader />
            <main id="main-content" className="flex-grow">
                <PageHero title="Case studies" icon={BookOpen} />

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20">
                    <div className="animate-pop [animation-delay:150ms] rounded-xl border border-border-light bg-surface p-6 sm:p-10 elevated">
                        <IconTile icon={FileClock} tone="amber" />
                        <h2 className="mt-5 text-xl font-heading font-bold mb-2">No case studies published yet</h2>
                        <p className="text-text-secondary leading-relaxed mb-6">
                            Write-ups from cities using SadakSathi will appear here. Until then, you can see how the models perform or make a report yourself.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/upload" className="inline-flex min-h-12 items-center justify-center px-5 bg-text-primary text-neutral-background text-sm font-bold rounded-lg hover:opacity-90 transition-colors">
                                Report a hazard
                            </Link>
                            <Link href="/performance" className="inline-flex min-h-12 items-center justify-center px-5 bg-surface border border-border-light text-text-primary text-sm font-bold rounded-lg hover:bg-neutral-surface hover:border-border-dark transition-colors">
                                See model performance
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
