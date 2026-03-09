import React from 'react';

interface Stats {
    complaintsSubmitted: number;
    upvotesReceived: number;
    leaderboardRank: number;
    reportsGenerated: number;
}

const ICONS = {
    complaintsSubmitted: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    upvotesReceived: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
    leaderboardRank: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    reportsGenerated: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

const COLORS = {
    complaintsSubmitted: 'text-blue-600 bg-blue-50',
    upvotesReceived: 'text-green-600 bg-green-50',
    leaderboardRank: 'text-purple-600 bg-purple-50',
    reportsGenerated: 'text-orange-600 bg-orange-50',
};

interface ProfileStatsProps { stats: Stats; }

export default function ProfileStats({ stats }: ProfileStatsProps) {
    const items = [
        { key: 'complaintsSubmitted', label: 'Complaints Submitted', value: stats.complaintsSubmitted },
        { key: 'upvotesReceived', label: 'Upvotes Received', value: stats.upvotesReceived },
        { key: 'leaderboardRank', label: 'Leaderboard Rank', value: `#${stats.leaderboardRank}` },
        { key: 'reportsGenerated', label: 'Reports Generated', value: stats.reportsGenerated },
    ] as const;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
                <div key={item.key} className="bg-white rounded-2xl shadow-soft border border-border-light p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${COLORS[item.key]}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ICONS[item.key]} />
                        </svg>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-1">{item.label}</div>
                    <div className="text-2xl font-bold">{item.value}</div>
                </div>
            ))}
        </div>
    );
}
