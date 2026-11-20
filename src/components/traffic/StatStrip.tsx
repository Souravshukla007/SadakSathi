import React from 'react';
import type { LucideIcon } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { IconChip, TONE, toneWash, type Tone } from './DeskUI';

export interface Stat {
    label: string;
    value: React.ReactNode;
    note?: React.ReactNode;
    icon?: LucideIcon;
    /** Colours the icon chip, the figure and the card's soft wash. */
    tone?: Tone;
}

/** KPI tiles: coloured icon chip, big figure, short note. Tiles reveal in a short stagger. */
export default function StatStrip({ stats, loading = false }: { stats: Stat[]; loading?: boolean }) {
    // 3 tiles would leave a gap in a 2-col grid, so they stack instead.
    const cols = stats.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3';
    return (
        <div className={`grid ${cols} gap-3 sm:gap-4`}>
            {stats.map((s, i) => {
                const tone = s.tone ?? 'neutral';
                return (
                    <Reveal key={s.label} delay={i * 70}>
                        {/* Reveal and .lift both drive transform, so they sit on separate elements. */}
                        <dl className="elevated lift h-full rounded-xl border border-border-light bg-surface px-4 py-4 sm:px-5" style={toneWash(tone)}>
                            <dt className="flex items-start justify-between gap-3 text-sm font-semibold text-text-secondary">
                                {s.label}
                                {s.icon && <IconChip icon={s.icon} tone={tone} size="sm" />}
                            </dt>
                            <dd className={`mt-2 font-heading text-3xl font-normal tracking-tighter tabular-nums ${tone === 'neutral' ? 'text-text-primary' : TONE[tone].text}`}>
                                {loading ? <span className="block h-8 w-16 animate-pulse rounded bg-neutral-surface" aria-hidden="true" /> : s.value}
                            </dd>
                            {s.note && !loading && <dd className="mt-0.5 text-xs text-text-secondary">{s.note}</dd>}
                        </dl>
                    </Reveal>
                );
            })}
        </div>
    );
}
