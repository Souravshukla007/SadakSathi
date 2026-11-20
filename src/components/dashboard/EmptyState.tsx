import React from 'react';

// Empty road running to the horizon, a cone, and a direction sign being raised. Decorative only.
export function RoadIllustration({ className = 'w-44 h-auto' }: { className?: string }) {
    return (
        <svg viewBox="0 0 200 120" className={className} aria-hidden="true" focusable="false">
            <ellipse cx="100" cy="118" rx="98" ry="4" className="fill-border-light" />
            <polygon points="82,14 118,14 186,118 14,118" className="fill-border-dark" />
            <rect x="98.5" y="20" width="3" height="8" rx="1" className="fill-hazard" />
            <rect x="98" y="36" width="4" height="11" rx="1" className="fill-hazard" />
            <rect x="97.2" y="57" width="5.6" height="15" rx="1" className="fill-hazard" />
            <rect x="96.2" y="84" width="7.6" height="20" rx="1" className="fill-hazard" />
            <g>
                <polygon points="34,116 46,76 58,116" className="fill-hazard" />
                <polygon points="39,99 53,99 55.2,106 36.8,106" className="fill-surface" />
                <rect x="28" y="113" width="36" height="5" rx="1.5" className="fill-hazard-ink" />
            </g>
            <g className="animate-sign-raise [animation-delay:150ms] [transform-box:fill-box] [transform-origin:bottom]">
                <rect x="160" y="42" width="3" height="76" className="fill-text-light" />
                <rect x="138" y="20" width="48" height="26" rx="3.5" className="fill-sign-green" />
                <rect x="140.5" y="22.5" width="43" height="21" rx="2" fill="none" className="stroke-white" strokeWidth="1.2" />
                <path d="M150 33h18m-5-5 5 5-5 5" fill="none" className="stroke-white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </svg>
    );
}

interface EmptyStateProps {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    headingLevel?: 2 | 3;
}

export default function EmptyState({ title, children, action, headingLevel = 3 }: EmptyStateProps) {
    const Heading = headingLevel === 2 ? 'h2' : 'h3';
    return (
        <div className="px-6 py-12 text-center flex flex-col items-center">
            <RoadIllustration className="w-44 h-auto mb-5" />
            <Heading className="font-heading text-lg font-bold text-text-primary text-balance">{title}</Heading>
            <p className="text-sm text-text-secondary mt-1 max-w-sm text-pretty">{children}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
