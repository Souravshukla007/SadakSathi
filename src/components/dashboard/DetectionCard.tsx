import React from 'react';
import { PriorityBadge } from '@/components/dashboard/StatusBadge';

// Confidence as a number plus a bar that fills in when it first renders.
export function ConfidenceMeter({ value }: { value: number }) {
    const pct = Math.max(0, Math.min(100, value * 100));
    return (
        <div>
            <div className="flex items-baseline justify-between text-xs text-text-secondary mb-1.5">
                <span>Confidence</span>
                <span className="font-bold text-text-primary tabular-nums">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-surface border border-border-light overflow-hidden" aria-hidden="true">
                <div
                    className="h-full rounded-full bg-sign-green origin-left animate-[bar-fill_700ms_var(--ease-out-sign)_both]"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

interface DetectionCardProps {
    title: string;
    priority?: string | null;
    confidence: number;
    /** Secondary line, e.g. detection ID or track and timestamp. */
    meta?: React.ReactNode;
    /** Traffic scans: show the plate row, with "not read" when OCR found nothing. */
    showPlate?: boolean;
    plate?: string | null;
}

export default function DetectionCard({ title, priority, confidence, meta, showPlate = false, plate }: DetectionCardProps) {
    const high = (priority ?? '').toLowerCase() === 'high';
    return (
        <article className="lift elevated relative overflow-hidden h-full bg-surface rounded-xl border border-border-light p-4">
            {high && <div className="hazard-stripe absolute inset-x-0 top-0 h-1" aria-hidden="true" />}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-heading font-bold text-text-primary break-words">{title}</h3>
                    {meta && <p className="text-xs text-text-secondary mt-0.5">{meta}</p>}
                </div>
                <PriorityBadge priority={priority} />
            </div>
            <div className="mt-4">
                <ConfidenceMeter value={confidence} />
            </div>
            {showPlate && (
                <p className="mt-3 text-sm text-text-secondary flex items-center gap-2">
                    Number plate
                    {plate ? <span className="plate text-sm">{plate}</span> : <span className="font-semibold">not read</span>}
                </p>
            )}
        </article>
    );
}
