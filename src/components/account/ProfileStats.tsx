import React from 'react';
import { ClipboardList, FileCheck, ThumbsUp, Trophy } from 'lucide-react';
import StatTile from '@/components/dashboard/StatTile';

interface Stats {
    complaintsSubmitted: number;
    upvotesReceived: number;
    leaderboardRank: number;
    reportsResolved: number;
}

interface ProfileStatsProps { stats: Stats; }

export default function ProfileStats({ stats }: ProfileStatsProps) {
    const items = [
        { icon: ClipboardList, label: 'Hazards reported', value: stats.complaintsSubmitted, tone: 'neutral' as const },
        { icon: ThumbsUp, label: 'Upvotes received', value: stats.upvotesReceived, tone: 'neutral' as const },
        // API returns rank 0 for users with no points yet
        { icon: Trophy, label: 'Leaderboard rank', value: stats.leaderboardRank > 0 ? `#${stats.leaderboardRank}` : 'Not ranked yet', muted: stats.leaderboardRank <= 0, tone: 'amber' as const },
        { icon: FileCheck, label: 'Reports resolved', value: stats.reportsResolved, tone: 'green' as const },
    ];

    return (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map(({ icon, label, value, muted, tone }, i) => (
                <StatTile key={label} icon={icon} label={label} value={value} tone={tone} muted={muted} delay={i * 70} />
            ))}
        </dl>
    );
}
