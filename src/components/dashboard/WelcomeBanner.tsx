import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';

interface WelcomeBannerProps {
    name: string;
    complaintCount: number;
}

// Styled as a highway direction sign: the one bold element on the dashboard.
export default function WelcomeBanner({ name, complaintCount }: WelcomeBannerProps) {
    return (
        <div className="animate-sign-raise road-sign elevated relative overflow-hidden px-6 py-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            {/* Oversized direction arrow, as printed on real highway signs. */}
            <ArrowUpRight className="hidden sm:block absolute -right-6 -bottom-10 w-48 h-48 text-white/10 pointer-events-none" strokeWidth={2.5} aria-hidden="true" />
            <div className="relative min-w-0">
                <h2 className="text-2xl sm:text-3xl font-heading font-normal tracking-tighter break-words">
                    Welcome back, {name}
                </h2>
                <p className="text-white/85 text-sm mt-1">
                    {complaintCount === 0
                        ? 'Spotted a pothole, open manhole or fallen tree? Report it and track it here.'
                        : `You have reported ${complaintCount} hazard${complaintCount !== 1 ? 's' : ''} so far.`}
                </p>
            </div>
            <Link
                href="/complaints"
                className="relative flex-shrink-0 inline-flex items-center gap-2 min-h-11 px-5 py-2.5 bg-surface text-sign-green font-bold rounded-lg hover:bg-neutral-surface transition-colors text-sm"
            >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Report a hazard
            </Link>
        </div>
    );
}
