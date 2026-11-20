'use client';

import React, { useSyncExternalStore } from 'react';
import { Cctv } from 'lucide-react';
import { IconChip } from './DeskUI';

// Illustrative frame: shows staff what the detector draws, not a real camera feed.
const MOCK_BOXES = [
    { label: 'No helmet', confidence: 98, color: 'red', x: '10%', y: '20%', w: '25%', h: '35%' },
    { label: 'Triple riding', confidence: 92, color: 'red', x: '40%', y: '30%', w: '30%', h: '38%' },
    { label: 'Helmet', confidence: 96, color: 'green', x: '75%', y: '25%', w: '20%', h: '30%' },
    { label: 'Number plate', confidence: 88, color: 'amber', x: '45%', y: '64%', w: '15%', h: '9%', plateText: 'MH 12 AB 1234' },
];

const BOX_STYLE: Record<string, { border: string; tag: string }> = {
    red: { border: 'border-signal-red', tag: 'bg-signal-red text-white' },
    amber: { border: 'border-hazard', tag: 'bg-hazard text-asphalt' },
    green: { border: 'border-sign-green', tag: 'bg-text-primary text-neutral-background' },
};

const subscribeClock = (onTick: () => void) => {
    const timer = setInterval(onTick, 1000);
    return () => clearInterval(timer);
};
const readClock = () => new Date().toLocaleTimeString('en-IN', { hour12: false });

interface TrafficPreviewProps {
    frameNumber?: number;
    totalFrames?: number;
}

export default function TrafficPreview({ frameNumber = 842, totalFrames = 1200 }: TrafficPreviewProps) {
    // Empty on the server and during hydration (avoids a mismatch), then ticks every second.
    const timeStr = useSyncExternalStore(subscribeClock, readClock, () => '');

    return (
        <section className="elevated overflow-hidden rounded-xl border border-border-light bg-surface">
            <div className="flex items-center gap-3 border-b border-border-light px-4 py-4 sm:px-6">
                <IconChip icon={Cctv} tone="neutral" size="sm" />
                <div className="min-w-0">
                    <h2 className="font-heading font-bold">What the detector marks</h2>
                    <p className="mt-0.5 text-sm text-text-secondary">Sample frame showing how violations, plates and compliant riders are boxed.</p>
                </div>
            </div>

            <div className="relative mx-4 my-4 aspect-video overflow-hidden rounded-lg bg-asphalt sm:mx-6">
                {/* One scan pass on load, the way the model sweeps a frame. */}
                <span className="absolute inset-x-0 z-10 h-0.5 bg-hazard animate-scan-once" aria-hidden="true" />
                <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white sm:text-xs">Sample frame</span>
                {/* Road surface with a dashed centre line */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/30">
                    <div className="absolute inset-x-0 top-1/2 flex h-1 gap-8 px-12">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-full flex-1 rounded bg-hazard/40" />
                        ))}
                    </div>
                </div>

                {MOCK_BOXES.map((box) => {
                    const style = BOX_STYLE[box.color];
                    return (
                        <div key={box.label} className="absolute" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
                            <div className={`h-full w-full rounded-sm border-2 ${style.border}`} />
                            <div className={`absolute bottom-full left-0 mb-0.5 flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[10px] font-bold sm:text-xs ${style.tag}`}>
                                {box.label} {box.confidence}%
                            </div>
                            {box.plateText && (
                                <span className="plate absolute left-0 top-full mt-0.5 whitespace-nowrap text-[10px] font-bold sm:text-xs">
                                    {box.plateText}
                                </span>
                            )}
                        </div>
                    );
                })}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-black/70 px-3 py-1.5 text-[10px] text-white/80 sm:text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="whitespace-nowrap tabular-nums">Frame {frameNumber} of {totalFrames}</span>
                        <span className="hidden h-1 w-24 overflow-hidden rounded-full bg-white/20 sm:block" aria-hidden="true">
                            <span className="block h-full rounded-full bg-hazard" style={{ width: `${(frameNumber / totalFrames) * 100}%` }} />
                        </span>
                    </span>
                    <span className="tabular-nums">{timeStr}</span>
                </div>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 pb-4 text-sm text-text-secondary sm:px-6">
                <li className="flex items-center gap-2">
                    <span className="h-0.5 w-4 rounded bg-signal-red" aria-hidden="true" />
                    Violation
                </li>
                <li className="flex items-center gap-2">
                    <span className="h-0.5 w-4 rounded bg-hazard" aria-hidden="true" />
                    Number plate (OCR)
                </li>
                <li className="flex items-center gap-2">
                    <span className="h-0.5 w-4 rounded bg-sign-green" aria-hidden="true" />
                    Compliant
                </li>
            </ul>
        </section>
    );
}
