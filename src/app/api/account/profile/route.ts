import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rankOf } from '@/lib/leaderboard';
import { requireUser } from '@/lib/session';

export async function GET() {
    try {
        const session = await requireUser();
        if (session instanceof NextResponse) return session;
        const userId = session.id;

        const [user, complaintCount, resolvedCount, activities] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true, username: true, fullName: true, email: true,
                    role: true, phone: true, city: true, state: true,
                    profileImageUrl: true, createdAt: true,
                },
            }),
            prisma.complaint.count({ where: { userId } }),
            prisma.complaint.count({ where: { userId, status: { in: ['Completed', 'ResolvedReviewed'] } } }),
            prisma.userActivity.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);

        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const { rank, upvotes } = await rankOf(userId);

        return NextResponse.json({
            user,
            stats: {
                complaintsSubmitted: complaintCount,
                upvotesReceived: upvotes,
                leaderboardRank: rank,
                reportsResolved: resolvedCount,
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
        const session = await requireUser();
        if (session instanceof NextResponse) return session;
        const userId = session.id;
        const { fullName, phone, city, state } = await req.json();

        for (const v of [fullName, phone, city, state]) {
            if (v != null && (typeof v !== 'string' || v.length > 100)) {
                return NextResponse.json({ message: 'Profile fields must be text up to 100 characters.' }, { status: 400 });
            }
        }
        if (fullName === null || (typeof fullName === 'string' && !fullName.trim())) {
            return NextResponse.json({ message: 'Full name cannot be empty.' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { fullName, phone, city, state },
            // never echo passwordHash back to the client
            select: { id: true, username: true, fullName: true, email: true, role: true, phone: true, city: true, state: true },
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
