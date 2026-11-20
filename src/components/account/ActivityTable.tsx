import React from 'react';
import Link from 'next/link';
import { ClipboardList, Image as ImageIcon, Lock, Plus, UserPen, type LucideIcon } from 'lucide-react';
import EmptyState from '@/components/dashboard/EmptyState';

interface Activity {
    id: string;
    action: string;
    details?: string;
    createdAt: string;
}

interface ActivityTableProps {
    activities: Activity[];
}

const ACTION_ICONS: Record<string, LucideIcon> = {
    'Complaint Submitted': ClipboardList,
    'Profile Updated': UserPen,
    'Avatar Updated': ImageIcon,
    'Password Changed': Lock,
};

export default function ActivityTable({ activities }: ActivityTableProps) {
    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' });

    return (
        <div className="bg-surface rounded-xl border border-border-light elevated">
            <div className="px-4 sm:px-6 py-4 border-b border-border-light">
                <h3 className="font-heading font-bold">Recent activity</h3>
                <p className="text-sm text-text-secondary mt-0.5">Reports, profile and password changes on your account</p>
            </div>
            {activities.length === 0 ? (
                <EmptyState
                    title="No activity yet"
                    action={
                        <Link href="/complaints" className="inline-flex items-center gap-2 min-h-11 px-5 bg-text-primary text-neutral-background font-bold rounded-lg text-sm hover:opacity-90 transition-colors">
                            <Plus className="w-4 h-4" aria-hidden="true" />
                            Report a hazard
                        </Link>
                    }
                >
                    Reports you send and changes to your profile will be listed here.
                </EmptyState>
            ) : (
                <ul className="divide-y divide-border-light">
                    {activities.map((a) => {
                        const Icon = ACTION_ICONS[a.action] ?? UserPen;
                        return (
                            <li key={a.id} className="px-4 sm:px-6 py-3.5 flex items-start sm:items-center gap-3 hover:bg-neutral-surface/60 transition-colors">
                                <span className="w-9 h-9 rounded-lg grid place-items-center bg-sign-green/10 text-sign-green flex-shrink-0">
                                    <Icon className="w-4 h-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-4">
                                    <p className="text-sm font-semibold sm:w-44 sm:flex-shrink-0">{a.action.charAt(0) + a.action.slice(1).toLowerCase()}</p>
                                    <p className="text-sm text-text-secondary sm:flex-1 break-words">{a.details ?? ''}</p>
                                    <p className="text-xs text-text-secondary mt-0.5 sm:mt-0 whitespace-nowrap">{formatTime(a.createdAt)}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
