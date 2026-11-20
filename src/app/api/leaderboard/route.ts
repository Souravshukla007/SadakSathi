import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { topContributors } from '@/lib/leaderboard';

export async function GET() {
    try {
        const [top, totalUsers, totalComplaints] = await Promise.all([
            topContributors(50), prisma.user.count({ where: { role: 'user' } }), prisma.complaint.count(),
        ]);
        return NextResponse.json({
            leaderboard: top.map(({ hasAvatar, ...u }, i) => ({
                ...u,
                // The picture loads separately (and is cached) instead of riding in this response.
                profileImageUrl: hasAvatar ? `/api/users/${u.id}/avatar` : null,
                rank: i + 1,
            })),
            stats: { totalContributors: totalUsers, totalReports: totalComplaints },
        });
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
