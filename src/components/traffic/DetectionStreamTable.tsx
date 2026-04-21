'use client';

import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        fetchDetections();
        const interval = setInterval(fetchDetections, 3000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('en-IN', { hour12: false });

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
            <div className="px-8 py-5 border-b border-border-light flex items-center justify-between">
                <div>
                    <h3 className="font-heading font-bold">Detection Stream</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Auto-refreshes every 3 seconds</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    LIVE
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-mono text-text-secondary uppercase bg-neutral-surface border-b border-border-light">
                            <th className="px-8 py-4">Time</th>
                            <th className="px-8 py-4">Violation Type</th>
                            <th className="px-8 py-4">Confidence</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4">Challan ₹</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                        {detections.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-text-secondary font-medium">
                                    No live detections stream data available yet.
                                </td>
                            </tr>
                        ) : (
                            detections.map((d) => (
                                <tr key={d.id} className="hover:bg-neutral-surface/50 transition-colors">
                                    <td className="px-8 py-4 text-xs font-mono text-text-secondary whitespace-nowrap">
                                        {formatTime(d.timestamp)}
                                    </td>
                                    <td className="px-8 py-4">
                                        <ViolationTypeBadge type={d.type} />
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">{d.confidence.toFixed(1)}%</span>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${d.confidence >= 90 ? 'bg-red-500' : 'bg-yellow-400'}`}
                                                    style={{ width: `${d.confidence}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <ViolationBadge status={d.status} />
                                    </td>
                                    <td className="px-8 py-4 text-sm font-bold">
                                        {d.challan ? (
                                            <span className="text-red-600">₹{d.challan.amount.toLocaleString('en-IN')}</span>
                                        ) : d.confidence >= 90 ? (
                                            <span className="text-yellow-500">₹{FINE_MAP[d.type] ?? '—'} (pending)</span>
                                        ) : (
                                            <span className="text-text-secondary/50">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
