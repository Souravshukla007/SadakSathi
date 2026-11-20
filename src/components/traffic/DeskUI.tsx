import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Shared building blocks for the staff desks (Municipal + Traffic): glow page header,
 * elevated panels, tone-coloured icon chips and dependency-free CSS/SVG charts.
 * Colours come only from tokens. Chart fills use `bg-current`/`currentColor` with a
 * `text-*` token so the dark-theme overrides for green/red text also lighten the marks.
 */

export type Tone = 'green' | 'amber' | 'red' | 'neutral';

export const TONE: Record<Tone, { chip: string; text: string; mark: string; cssVar: string }> = {
    green: { chip: 'bg-sign-green/10 text-sign-green', text: 'text-sign-green', mark: 'text-sign-green', cssVar: '--color-sign-green' },
    amber: { chip: 'bg-hazard/15 text-hazard-ink', text: 'text-hazard-ink', mark: 'text-hazard', cssVar: '--color-hazard' },
    red: { chip: 'bg-signal-red/10 text-signal-red', text: 'text-signal-red', mark: 'text-signal-red', cssVar: '--color-signal-red' },
    neutral: { chip: 'bg-text-secondary/10 text-text-primary', text: 'text-text-primary', mark: 'text-text-secondary', cssVar: '--color-text-secondary' },
};

/** Complaint status -> tone, matching the brief's status mapping (and StatusBadge). */
export function complaintTone(status: string): Tone {
    if (status === 'Submitted') return 'amber';
    if (status === 'Rejected') return 'red';
    if (status === 'Completed' || status === 'ResolvedReviewed') return 'green';
    return 'neutral';
}

/** Soft top-down wash of a tone over the card surface. */
export const toneWash = (tone: Tone): React.CSSProperties => ({
    backgroundImage: `linear-gradient(160deg, color-mix(in srgb, var(${TONE[tone].cssVar}) 11%, transparent), transparent 62%)`,
});

export function IconChip({ icon: Icon, tone = 'green', size = 'md' }: { icon: LucideIcon; tone?: Tone; size?: 'sm' | 'md' }) {
    const box = size === 'sm' ? 'h-8 w-8 rounded-md' : 'h-10 w-10 rounded-lg';
    const glyph = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
        <span className={`inline-flex flex-shrink-0 items-center justify-center ${box} ${TONE[tone].chip}`} aria-hidden="true">
            <Icon className={glyph} />
        </span>
    );
}

/** A thin coloured bar on the leading edge of a table row (put it in a `relative` first cell). */
export function RowStripe({ tone }: { tone: Tone }) {
    return <span className={`absolute inset-y-0 left-0 w-1 bg-current ${TONE[tone].mark}`} aria-hidden="true" />;
}

export function DeskHeader({ title, description, icon, children }: {
    title: string; description: React.ReactNode; icon?: LucideIcon; children?: React.ReactNode;
}) {
    return (
        <header className="road-glow elevated relative mb-6 overflow-hidden rounded-xl border border-border-light">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex min-w-0 items-center gap-4">
                    {icon && (
                        <span className="road-sign hidden h-12 w-12 flex-shrink-0 items-center justify-center animate-pop sm:inline-flex" aria-hidden="true">
                            {React.createElement(icon, { className: 'h-6 w-6' })}
                        </span>
                    )}
                    <div className="min-w-0">
                        <h1 className="font-heading text-2xl font-normal tracking-tighter text-balance sm:text-3xl">{title}</h1>
                        <p className="mt-1 text-sm text-text-secondary">{description}</p>
                    </div>
                </div>
                {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
            </div>
        </header>
    );
}

export function Panel({ title, description, action, icon, tone = 'green', className = '', bodyClassName = 'p-4 sm:p-6', children }: {
    title: string; description?: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon; tone?: Tone;
    className?: string; bodyClassName?: string; children: React.ReactNode;
}) {
    return (
        <section className={`elevated overflow-hidden rounded-xl border border-border-light bg-surface ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    {icon && <IconChip icon={icon} tone={tone} size="sm" />}
                    <div className="min-w-0">
                        <h2 className="font-heading font-bold">{title}</h2>
                        {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
                    </div>
                </div>
                {action}
            </div>
            <div className={bodyClassName}>{children}</div>
        </section>
    );
}

export interface Segment { label: string; value: number; tone: Tone }

/** Donut with a centre figure and a text legend (the legend is the accessible version). */
export function DonutChart({ segments, centerValue, centerLabel }: {
    segments: Segment[]; centerValue: React.ReactNode; centerLabel: string;
}) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    let offset = 0;
    return (
        <div className="flex flex-col items-center gap-5">
            <div className="relative h-40 w-40 flex-shrink-0 animate-pop">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="4" className="stroke-neutral-surface" />
                    {total > 0 && segments.map((s) => {
                        const pct = (s.value / total) * 100;
                        const el = pct > 0 && (
                            <circle
                                key={s.label}
                                cx="18" cy="18" r="15.9155" fill="none" strokeWidth="4"
                                stroke="currentColor"
                                className={TONE[s.tone].mark}
                                strokeDasharray={`${pct} ${100 - pct}`}
                                strokeDashoffset={-offset}
                            />
                        );
                        offset += pct;
                        return el;
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-heading text-3xl font-bold tabular-nums">{centerValue}</span>
                    <span className="text-xs text-text-secondary">{centerLabel}</span>
                </div>
            </div>
            <ul className="w-full min-w-0 space-y-2.5 text-sm">
                {segments.map((s) => {
                    const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                    return (
                        <li key={s.label} className="flex items-center justify-between gap-3">
                            <span className="flex min-w-0 items-center gap-2">
                                <span className={`h-3 w-3 flex-shrink-0 rounded-sm bg-current ${TONE[s.tone].mark}`} aria-hidden="true" />
                                <span>{s.label}</span>
                            </span>
                            <span className="flex-shrink-0 tabular-nums">
                                <span className="font-semibold">{s.value.toLocaleString('en-IN')}</span>
                                <span className="ml-1.5 text-text-secondary">{pct}%</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/** Horizontal bars, one per category, with the count written next to each label. */
export function BarList({ items, tone = 'green', total }: { items: { label: string; value: number }[]; tone?: Tone; total?: number }) {
    const max = Math.max(total ?? 0, ...items.map((i) => i.value), 1);
    return (
        <ul className="space-y-3.5">
            {items.map((item, i) => (
                <li key={item.label}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="min-w-0 break-words font-semibold">{item.label}</span>
                        <span className="flex-shrink-0 font-semibold tabular-nums">{item.value.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-neutral-surface" aria-hidden="true">
                        <div
                            className={`h-full origin-left rounded-full bg-current animate-rise ${TONE[tone].mark}`}
                            style={{ width: `${Math.max((item.value / max) * 100, 2)}%`, animationDelay: `${i * 70}ms` }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** Vertical columns with the count above each one. Read by screen readers as one summary label. */
export function ColumnChart({ values, labels, tone = 'green', summary }: { values: number[]; labels: string[]; tone?: Tone; summary: string }) {
    const max = Math.max(...values, 1);
    return (
        <div role="img" aria-label={summary}>
            <div className="relative flex h-44 items-end justify-between gap-2 border-b border-border-light sm:h-52">
                {/* Gridlines at half and full height */}
                <span className="absolute inset-x-0 top-0 border-t border-dashed border-border-light" aria-hidden="true" />
                <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-border-light" aria-hidden="true" />
                {values.map((v, i) => (
                    <div key={i} className="relative flex h-full flex-1 flex-col items-center justify-end">
                        <span className="mb-1 text-xs font-semibold tabular-nums text-text-secondary">{v}</span>
                        <div
                            className={`w-full max-w-10 rounded-t-md animate-rise ${v === 0 ? 'bg-border-light' : `bg-current ${TONE[tone].mark}`}`}
                            style={{ height: `${Math.max((v / max) * 85, 2)}%`, animationDelay: `${i * 60}ms` }}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-2 flex justify-between gap-2 text-xs text-text-secondary">
                {labels.map((d, i) => <span key={i} className="flex-1 text-center">{d}</span>)}
            </div>
        </div>
    );
}
