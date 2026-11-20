'use client';

import React, { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { ViolationBadge, ViolationTypeBadge } from './ViolationBadge';

const FINE_MAP: Record<string, number> = {
    helmet_violation: 1000,
    triple_riding: 1500,
    wrong_side: 2000,
    plate_detection: 500,
};

// Initial empty state for when DB is empty
const INITIAL_DETECTIONS: Detection[] = [];

interface Detection {
    id: string;
    type: string;
    confidence: number;
    timestamp: string;
    status: string;
    challan: { amount: number } | null;
}

export default function DetectionStreamTable() {
    const [detections, setDetections] = useState<Detection[]>(INITIAL_DETECTIONS);

    useEffect(() => {
        const fetchDetections = async () => {
            try {
                const res = await fetch('/api/traffic/detections');
                if (!res.ok) return;
                const data = await res.json();
                setDetections(data);
            } catch {
                // keep existing data on failure
            }
        };
        fetchDetections();
        const interval = setInterval(fetchDetections, 3000);
        return () => clearInterval(interval);
    }, []);

    const dueCount = detections.filter((d) => !d.challan && d.confidence * 100 >= 90).length;

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('en-IN', { hour12: false });

    return (
        <section className="elevated overflow-hidden rounded-xl border border-border-light bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-sign-green/10 text-sign-green" aria-hidden="true">
                        <Radio className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-heading font-bold">Detection stream</h2>
                        <p className="mt-0.5 text-sm text-text-secondary">Refreshes every 3 seconds. Striped rows are due a challan.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {dueCount > 0 && (
                        <span className="rounded-full bg-signal-red/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-signal-red">
                            {dueCount} due a challan
                        </span>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full bg-sign-green/10 px-2.5 py-1 text-xs font-semibold text-sign-green">
                        <span className="relative flex h-2 w-2" aria-hidden="true">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                        </span>
                        Live
                    </span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                    <thead className="border-b border-border-light bg-neutral-surface">
                        <tr className="text-sm font-semibold text-text-secondary">
                            <th scope="col" className="px-4 py-3 sm:pl-6">Time</th>
                            <th scope="col" className="px-4 py-3">Violation</th>
                            <th scope="col" className="px-4 py-3">Confidence</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                            <th scope="col" className="px-4 py-3 sm:pr-6">Challan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                        {detections.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-secondary">
                                    No detections yet. Run detection on camera footage and new violations appear here.
                                </td>
                            </tr>
                        ) : (
                            detections.map((d) => {
                                const pct = d.confidence * 100; // stored 0-1
                                const challanDue = !d.challan && pct >= 90;
                                return (
                                    <tr key={d.id} className="transition-colors hover:bg-sign-green/5">
                                        <td className="relative whitespace-nowrap px-4 py-3 text-sm tabular-nums text-text-secondary sm:pl-6">
                                            {challanDue && <span className="hazard-stripe absolute inset-y-0 left-0 w-1.5" aria-hidden="true" />}
                                            {formatTime(d.timestamp)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ViolationTypeBadge type={d.type} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-12 text-sm font-semibold tabular-nums">{pct.toFixed(1)}%</span>
                                                <div className="h-2 w-20 overflow-hidden rounded-full bg-neutral-surface" aria-hidden="true">
                                                    <div
                                                        className={`h-full rounded-full ${pct >= 90 ? 'bg-signal-red' : 'bg-hazard'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <ViolationBadge status={d.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold tabular-nums sm:pr-6">
                                            {d.challan ? (
                                                <span>₹{d.challan.amount.toLocaleString('en-IN')}</span>
                                            ) : challanDue ? (
                                                <span className="text-signal-red">₹{FINE_MAP[d.type] ?? '—'} due</span>
                                            ) : (
                                                <span className="text-text-secondary">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
