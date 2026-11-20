import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type StatTone = 'neutral' | 'green' | 'amber' | 'red';

// Same colour language as the status badges: amber = waiting, green = resolved, red = urgent.
const TONES: Record<StatTone, { chip: string; wash: string; value: string }> = {
    neutral: { chip: 'bg-neutral-surface text-text-primary border border-border-light', wash: 'from-neutral-surface', value: 'text-text-primary' },
    green: { chip: 'bg-sign-green/12 text-sign-green', wash: 'from-sign-green/8', value: 'text-sign-green' },
    amber: { chip: 'bg-hazard/20 text-hazard-ink', wash: 'from-hazard/10', value: 'text-hazard-ink' },
    red: { chip: 'bg-signal-red/10 text-signal-red', wash: 'from-signal-red/6', value: 'text-signal-red' },
};

interface StatTileProps {
    icon: LucideIcon;
    label: string;
    value: React.ReactNode;
    tone?: StatTone;
    /** Show the value small and grey, for "nothing yet" states. */
    muted?: boolean;
    /** Entrance delay (ms) for staggering a row of tiles on page load. */
    delay?: number;
    className?: string;
}

// One figure in a <dl>: label + icon chip, then the value. Must be rendered inside a <dl>.
export default function StatTile({ icon: Icon, label, value, tone = 'neutral', muted = false, delay, className = '' }: StatTileProps) {
    const t = TONES[tone];
    return (
        <div
            style={delay !== undefined ? { animationDelay: `${delay}ms` } : undefined}
            className={`${delay !== undefined ? 'animate-rise ' : ''}elevated h-full rounded-xl border border-border-light bg-surface bg-linear-to-br ${t.wash} to-transparent to-70% p-4 sm:p-5 ${className}`}>
            <dt className="flex items-start justify-between gap-3 text-sm font-semibold text-text-secondary">
                <span className="min-w-0 pt-1">{label}</span>
                <span className={`w-10 h-10 rounded-lg grid place-items-center flex-shrink-0 ${t.chip}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
            </dt>
            <dd className={`font-heading font-normal tracking-tighter tabular-nums break-words ${muted ? 'mt-2 text-lg text-text-secondary' : `mt-1 text-3xl ${t.value}`}`}>
                {value}
            </dd>
        </div>
    );
}
