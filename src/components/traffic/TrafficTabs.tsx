'use client';

import React from 'react';

// ids are the stored violation types, so the page can filter on them directly.
const TABS = [
    { id: 'all', label: 'All violations' },
    { id: 'helmet_violation', label: 'No helmet' },
    { id: 'triple_riding', label: 'Triple riding' },
    { id: 'wrong_side', label: 'Wrong side' },
    { id: 'plate_detection', label: 'Missing plate' },
];

interface TrafficTabsProps {
    active: string;
    onChange: (id: string) => void;
    /** Optional count per tab id ('all' included), shown as a small figure. */
    counts?: Record<string, number>;
}

export default function TrafficTabs({ active, onChange, counts }: TrafficTabsProps) {
    return (
        <div className="flex gap-1.5 overflow-x-auto rounded-lg bg-neutral-surface p-1">
            {TABS.map((tab) => {
                const isActive = active === tab.id;
                const count = counts?.[tab.id];
                return (
                    <button
                        key={tab.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChange(tab.id)}
                        className={`inline-flex min-h-11 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3.5 text-sm transition-[background-color,color,box-shadow] duration-200 ${
                            isActive
                                ? 'bg-text-primary font-bold text-neutral-background shadow-soft'
                                : 'font-medium text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                    >
                        {tab.label}
                        {count !== undefined && (
                            <span className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${isActive ? 'bg-sign-green-dark text-white' : 'bg-surface text-text-primary'}`}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
