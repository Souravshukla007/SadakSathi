import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const userId = payload.id as string;

        const [user, complaintCount, upvoteCount, activities] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true, username: true, fullName: true, email: true,
                    role: true, phone: true, city: true, state: true,
                    profileImageUrl: true, createdAt: true,
                },
            }),
            prisma.complaint.count({ where: { userId } }),
            prisma.upvote.count({ where: { userId } }),
            prisma.userActivity.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);

        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        // Compute leaderboard rank by complaint count
        const usersRanked = await prisma.complaint.groupBy({
            by: ['userId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });
        const rank = usersRanked.findIndex((u) => u.userId === userId) + 1;

        return NextResponse.json({
            user,
            stats: {
                complaintsSubmitted: complaintCount,
                upvotesReceived: upvoteCount,
                leaderboardRank: rank || 1,
                reportsGenerated: Math.floor(complaintCount * 0.6),
            },
            activities,
        });
    } catch (error) {
        console.error('GET /api/account/profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const userId = payload.id as string;
        const { fullName, phone, city, state } = await req.json();

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { fullName, phone, city, state },
        });

        // Log activity
        await prisma.userActivity.create({
            data: { userId, action: 'Profile Updated', details: 'Profile information was changed.' },
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error('PUT /api/account/profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
