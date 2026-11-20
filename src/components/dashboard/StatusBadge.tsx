import React from 'react';
import { ComplaintStatus } from '@prisma/client';

interface StatusBadgeProps {
    status: ComplaintStatus | string;
    className?: string;
}

const PILL = 'inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded text-xs font-semibold';

// Single source of truth for complaint status colours (see SADAKSATHI_BRIEF.md).
// `accent` is the solid colour of the same mapping, for card stripes next to the badge.
const STATUS_CONFIG: Record<string, { label: string; className: string; accent: string }> = {
    Submitted: { label: 'Submitted', className: 'bg-hazard/15 text-hazard-ink', accent: 'bg-hazard' },
    Approved: { label: 'Approved', className: 'bg-surface text-text-primary border border-border-dark', accent: 'bg-border-dark' },
    OnHold: { label: 'On hold', className: 'bg-surface text-text-primary border border-border-dark', accent: 'bg-border-dark' },
    Rejected: { label: 'Rejected', className: 'bg-signal-red/10 text-signal-red', accent: 'bg-signal-red' },
    Completed: { label: 'Completed', className: 'bg-sign-green/10 text-sign-green', accent: 'bg-sign-green' },
    ResolvedReviewed: { label: 'Resolved', className: 'bg-sign-green/10 text-sign-green', accent: 'bg-sign-green' },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-neutral-surface text-text-secondary' };
    return <span className={`${PILL} ${config.className} ${className}`}>{config.label}</span>;
}

/** Solid background class for a status, e.g. a coloured stripe on a report card. */
export function statusAccent(status: string): string {
    return STATUS_CONFIG[status]?.accent ?? 'bg-border-light';
}

// Detection priority: High = signal red, Medium = amber, Low = neutral.
const PRIORITY_CLASS: Record<string, string> = {
    high: 'bg-signal-red/10 text-signal-red',
    medium: 'bg-hazard/15 text-hazard-ink',
    low: 'bg-neutral-surface text-text-secondary border border-border-light',
};

export function PriorityBadge({ priority }: { priority?: string | null }) {
    const key = (priority ?? '').toLowerCase();
    const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Unknown';
    return <span className={`${PILL} ${PRIORITY_CLASS[key] ?? PRIORITY_CLASS.low}`}>{label}</span>;
}
