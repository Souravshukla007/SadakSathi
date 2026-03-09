import React from 'react';

interface Activity {
    id: string;
    action: string;
    details?: string;
    createdAt: string;
}

interface ActivityTableProps {
    activities: Activity[];
}

const ACTION_ICONS: Record<string, string> = {
    'Complaint Submitted': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    'Profile Updated': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    'Avatar Updated': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    'Password Changed': 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
};

const MOCK_ACTIVITIES: Activity[] = [
    { id: '1', action: 'Complaint Submitted', details: 'Wardha Road pothole reported.', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', action: 'Profile Updated', details: 'Profile information was changed.', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: '3', action: 'Complaint Submitted', details: 'MG Road waterlogging.', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export default function ActivityTable({ activities }: ActivityTableProps) {
    const items = activities.length > 0 ? activities : MOCK_ACTIVITIES;

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' });

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light">
                <h3 className="font-heading font-bold">Account Activity</h3>
                <p className="text-xs text-text-secondary mt-0.5">Your recent account actions</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-mono text-text-secondary uppercase bg-neutral-surface border-b border-border-light">
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                        {items.map((a) => (
                            <tr key={a.id} className="hover:bg-neutral-surface/50 transition-colors">
                                <td className="px-6 py-4 text-xs font-mono text-text-secondary whitespace-nowrap">{formatTime(a.createdAt)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ACTION_ICONS[a.action] ?? ACTION_ICONS['Profile Updated']} />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium">{a.action}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-text-secondary">{a.details ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
