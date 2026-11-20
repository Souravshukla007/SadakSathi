import React from 'react';
import { Bike, ScanLine, TriangleAlert, Users, type LucideIcon } from 'lucide-react';

interface ViolationBadgeProps {
    status: string;
}

/** Brief status colours: amber = needs action, neutral = in hand, red = problem, green = done. */
export const BADGE_TONE = {
    amber: 'bg-hazard/15 text-hazard-ink',
    neutral: 'border border-border-dark text-text-primary',
    red: 'bg-signal-red/10 text-signal-red',
    green: 'bg-sign-green/10 text-sign-green',
} as const;

const BADGE_BASE = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold';
const Dot = () => <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current" aria-hidden="true" />;

const STATUS_CONFIG: Record<string, { label: string; tone: keyof typeof BADGE_TONE }> = {
    detected: { label: 'Needs review', tone: 'amber' },
    pending: { label: 'Pending', tone: 'amber' },
    warning: { label: 'Warning', tone: 'amber' },
    challan_issued: { label: 'Challan issued', tone: 'neutral' },
    cleared: { label: 'Cleared', tone: 'green' },
    resolved: { label: 'Resolved', tone: 'green' },
};

const CHALLAN_CONFIG: Record<string, keyof typeof BADGE_TONE> = {
    Issued: 'amber',
    Paid: 'green',
    Disputed: 'red',
    Cancelled: 'neutral',
};

const VIOLATION_LABELS: Record<string, string> = {
    helmet_violation: 'No helmet',
    triple_riding: 'Triple riding',
    wrong_side: 'Wrong side',
    plate_detection: 'Plate detection',
};

export const VIOLATION_ICONS: Record<string, LucideIcon> = {
    helmet_violation: Bike,
    triple_riding: Users,
    wrong_side: TriangleAlert,
    plate_detection: ScanLine,
};

export function ViolationBadge({ status }: ViolationBadgeProps) {
    const config = STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' '), tone: 'neutral' };
    return <span className={`${BADGE_BASE} ${BADGE_TONE[config.tone]}`}><Dot />{config.label}</span>;
}

export function ChallanBadge({ status, amount }: { status: string; amount: number }) {
    return (
        <span className={`${BADGE_BASE} ${BADGE_TONE[CHALLAN_CONFIG[status] ?? 'neutral']}`}>
            <Dot />{status}, ₹{amount.toLocaleString('en-IN')}
        </span>
    );
}

export function ViolationTypeBadge({ type }: { type: string }) {
    const label = VIOLATION_LABELS[type] ?? type.replace(/_/g, ' ');
    const Icon = VIOLATION_ICONS[type] ?? TriangleAlert;
    return (
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
            <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-signal-red/10 text-signal-red" aria-hidden="true">
                <Icon className="h-4 w-4" />
            </span>
            {label}
        </span>
    );
}

export const VIOLATION_LABELS_MAP = VIOLATION_LABELS;
