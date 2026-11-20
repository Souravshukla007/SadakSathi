import React from 'react';
import { Camera, Car, Cookie, Eye, MessagesSquare, ShieldCheck, TriangleAlert, UserRound, type LucideIcon } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import Reveal from '@/components/Reveal';
import IconTile from '@/components/landing/IconTile';
import PageHero from '@/components/landing/PageHero';

const STORED: { what: string; icon: LucideIcon; detail: string }[] = [
    { what: 'Your account', icon: UserRound, detail: 'Name, username, email, a hashed password (never the password itself), and optionally phone, city, state and a profile photo. If you sign in with Google, we get your name and email from Google.' },
    { what: 'Your reports', icon: Camera, detail: 'The photo or video you upload, your description, the street address and coordinates, and the detection results (what was found and its priority).' },
    { what: 'What you do on reports', icon: MessagesSquare, detail: 'Upvotes, feedback and ratings you leave, and chat messages between you and the department handling a report.' },
    { what: 'Traffic footage', icon: Car, detail: 'For violations found in uploaded footage: the vehicle type, the violation, the number plate text and any challan issued.' },
    { what: 'Cookies', icon: Cookie, detail: 'One cookie keeps you logged in. If you pick Hindi or Marathi, a second cookie remembers the language.' },
];

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-background">
            <AppHeader />
            <main id="main-content" className="flex-grow">
                <PageHero title="Privacy" icon={ShieldCheck} lead="What SadakSathi stores about you, who can see it, and where it goes.">
                    <p className="animate-rise [animation-delay:180ms] mt-8 flex items-start gap-3 rounded-lg border border-hazard/40 bg-hazard/15 text-hazard-ink px-4 py-3">
                        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        Draft: this page describes what the app stores today. It hasn&apos;t been reviewed as a legal privacy policy.
                    </p>
                </PageHero>

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-20">
                    <h2 className="text-2xl font-heading font-normal tracking-tighter mb-6">What we store</h2>
                    <ul className="grid gap-4">
                        {STORED.map((s, i) => (
                            <Reveal as="li" key={s.what} delay={i * 70}>
                                <article className="group flex gap-4 rounded-xl border border-border-light bg-surface p-5 sm:p-6 elevated lift">
                                    <IconTile icon={s.icon} small />
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-text-primary">{s.what}</h3>
                                        <p className="mt-1 text-text-secondary leading-relaxed">{s.detail}</p>
                                    </div>
                                </article>
                            </Reveal>
                        ))}
                    </ul>

                    <Reveal className="mt-14 rounded-xl border border-border-light bg-neutral-surface p-6 sm:p-8">
                        <h2 className="flex items-center gap-3 text-2xl font-heading font-normal tracking-tighter mb-4">
                            <Eye className="size-6 text-sign-green" aria-hidden="true" />
                            Who sees it
                        </h2>
                        <p className="text-text-secondary leading-relaxed mb-4">
                            Road hazard reports go to municipal staff and appear in the complaints feed, where other signed-in users can upvote them. Traffic violations go to traffic police staff only.
                        </p>
                        <p className="text-text-secondary leading-relaxed">
                            Photos are analysed by SadakSathi&apos;s own detection service, not sent to an outside AI provider. If you switch the language to Hindi or Marathi, the page text is translated by Google Translate.
                        </p>
                    </Reveal>

                    <Reveal className="mt-10">
                        <h2 className="flex items-center gap-3 text-2xl font-heading font-normal tracking-tighter mb-4">
                            <MessagesSquare className="size-6 text-sign-green" aria-hidden="true" />
                            Questions
                        </h2>
                        <p className="text-text-secondary leading-relaxed">
                            To ask about your data, message the department through the chat on one of your reports.
                        </p>
                    </Reveal>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
