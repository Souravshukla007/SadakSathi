import React from 'react';
import { Car, Gauge, IndianRupee, ReceiptText, ShieldAlert } from 'lucide-react';
import { IconChip, Panel, TONE, type Tone } from './DeskUI';

interface AnalyticsData {
    totalViolations: number;
    avgConfidence: number;
    vehicleCount: number;
    totalChallanAmount: number;
    totalChallansIssued: number;
}

interface TrafficAnalyticsCardProps {
    data: AnalyticsData;
}

export default function TrafficAnalyticsCard({ data }: TrafficAnalyticsCardProps) {
    const metrics: { label: string; display: string; progress: number | null; icon: typeof Car; tone: Tone }[] = [
        {
            label: 'Violations detected',
            display: data.totalViolations.toString(),
            progress: Math.min((data.totalViolations / 50) * 100, 100),
            icon: ShieldAlert,
            tone: 'red',
        },
        {
            label: 'Average confidence',
            display: `${data.avgConfidence}%`,
            progress: data.avgConfidence,
            icon: Gauge,
            tone: 'green',
        },
        {
            label: 'Vehicles tracked',
            display: data.vehicleCount.toLocaleString(),
            progress: null,
            icon: Car,
            tone: 'neutral',
        },
    ];

    return (
        <Panel title="Violation metrics" className="h-full">
            <div className="space-y-5">
                {metrics.map((m) => (
                    <div key={m.label} className="flex items-center gap-3">
                        <IconChip icon={m.icon} tone={m.tone} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="text-sm font-semibold text-text-secondary">{m.label}</span>
                                <span className="font-heading text-2xl font-normal tracking-tighter tabular-nums">{m.display}</span>
                            </div>
                            {m.progress !== null && (
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-surface" aria-hidden="true">
                                    <div className={`h-full rounded-full bg-current ${TONE[m.tone].mark}`} style={{ width: `${m.progress}%` }} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <dl className="grid grid-cols-2 gap-3 border-t border-border-light pt-4 text-sm">
                    <div className="rounded-lg bg-neutral-surface p-3">
                        <dt className="flex items-center gap-1.5 text-text-secondary"><ReceiptText className="h-4 w-4" aria-hidden="true" />Challans issued</dt>
                        <dd className="mt-1 font-heading text-xl font-bold tabular-nums">{data.totalChallansIssued}</dd>
                    </div>
                    <div className="rounded-lg bg-neutral-surface p-3">
                        <dt className="flex items-center gap-1.5 text-text-secondary"><IndianRupee className="h-4 w-4" aria-hidden="true" />Total amount</dt>
                        <dd className="mt-1 font-heading text-xl font-bold tabular-nums">₹{data.totalChallanAmount.toLocaleString('en-IN')}</dd>
                    </div>
                </dl>
            </div>
        </Panel>
    );
}
