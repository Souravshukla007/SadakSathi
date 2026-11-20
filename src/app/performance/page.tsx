import React from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Reveal from "@/components/Reveal";
import IconTile from "@/components/landing/IconTile";
import PageHero from "@/components/landing/PageHero";
import { Gauge, GitMerge, ListChecks, Route, ScanSearch, ScanText, type LucideIcon } from "lucide-react";

// Figures as recorded in the project README; they change with hardware and model weights.
const METRICS: { name: string; value: string; detail: string; icon: LucideIcon }[] = [
    // Measured November 2026 on a 20-thread laptop CPU, no GPU. Re-measure on your own hardware.
    { name: "Road hazard detection", value: "~0.3 s", detail: "Median time for one photo, from upload to result, including priority scoring and the marked-up image.", icon: ScanSearch },
    { name: "Road model accuracy", value: "0.81", detail: "mAP50 of the bundled road model on its validation set: potholes, garbage, overflowing garbage, manholes and fallen trees.", icon: Route },
    { name: "Duplicate check", value: "~60 ms", detail: "Median time to compare a new report with earlier ones (76 ms mean) in the project's test suite.", icon: GitMerge },
    { name: "Duplicate test suite", value: "87 / 87", detail: "Graded cases passed in the 100-report test suite. The other 13 are borderline cases that are logged, not graded.", icon: ListChecks },
    { name: "Number plate reading", value: "3 of 4", detail: "Test plates read exactly; the fourth was read partly from a tiny crop. About 1.6 s per plate, once per tracked vehicle. A small sample, so expect misses.", icon: ScanText },
];

const FLOORS = [
    { label: "Always high", chip: "bg-signal-red/10 text-signal-red", items: "Open manholes" },
    { label: "At least medium", chip: "bg-hazard/15 text-hazard-ink", items: "Broken signs, broken street lights, overflowing garbage" },
    { label: "Size and depth decide", chip: "border border-border-dark text-text-primary", items: "Potholes, garbage piles, fallen trees" },
];

export default function PerformancePage() {
    return (
        <>
            <AppHeader />
            <main id="main-content" className="flex-grow">
                <PageHero
                    wide
                    title="How the models perform"
                    icon={Gauge}
                    lead={<>Speed and accuracy measured on the project&apos;s own test runs. Your numbers will differ with the server&apos;s hardware.</>}
                />

                <section className="py-14 md:py-20 px-4 sm:px-6 bg-neutral-background">
                    <div className="max-w-6xl mx-auto">
                        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {METRICS.map((m, i) => (
                                <Reveal key={m.name} delay={i * 70} className="group rounded-xl border border-border-light bg-surface p-6 elevated">
                                    <dt className="flex items-center gap-3 font-bold text-text-primary">
                                        <IconTile icon={m.icon} small />
                                        {m.name}
                                    </dt>
                                    <dd className="mt-5 font-heading text-4xl font-normal tracking-tighter tabular-nums text-text-primary">{m.value}</dd>
                                    <dd className="mt-2 text-text-secondary leading-relaxed">{m.detail}</dd>
                                </Reveal>
                            ))}
                        </dl>

                        <Reveal className="mt-16 grid gap-8 rounded-xl border border-border-light bg-neutral-surface p-6 sm:p-10 lg:grid-cols-2 lg:gap-12">
                            <div>
                                <h2 className="font-heading text-2xl font-normal tracking-tighter mb-4">How priority is set</h2>
                                <p className="text-text-secondary leading-relaxed mb-4">
                                    For each road hazard, the model measures how much of the photo it covers and estimates its depth from the shadow inside it. Those two numbers decide whether it&apos;s high, medium or low priority.
                                </p>
                                <p className="text-text-secondary leading-relaxed">
                                    Some hazards have a floor: an open manhole is always high priority, and broken signs, broken street lights and overflowing garbage are at least medium. A photo with two or more high-priority hazards, or a cluster of three or more close together, is marked high overall.
                                </p>
                            </div>
                            <ul className="space-y-3 self-center">
                                {FLOORS.map((f) => (
                                    <li key={f.label} className="rounded-lg border border-border-light bg-surface p-4">
                                        <span className={`inline-block text-sm font-semibold px-2.5 py-0.5 rounded ${f.chip}`}>{f.label}</span>
                                        <p className="mt-2 text-text-primary">{f.items}</p>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    </div>
                </section>
            </main>
            <AppFooter />
        </>
    );
}
