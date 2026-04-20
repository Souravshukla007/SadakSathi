import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sort   = searchParams.get('sort')   || 'newest';
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || ''; // e.g. Submitted | Approved | Completed

        // Try to get the current user (optional — feed is public)
        let currentUserId: string | null = null;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (token) {
            const payload = await verifyToken(token);
            if (payload && payload.id) {
                currentUserId = payload.id as string;
            }
        }

        const orderBy =
            sort === 'upvotes'
                ? { upvotes: { _count: 'desc' as const } }
                : sort === 'oldest'
                ? { createdAt: 'asc' as const }
                : { createdAt: 'desc' as const };

        // Build where clause
        const where: Record<string, unknown> = { isDuplicate: false };

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { street:      { contains: search, mode: 'insensitive' } },
                { city:        { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { issueType:   { contains: search, mode: 'insensitive' } },
            ];
        }

        const complaints = await prisma.complaint.findMany({
            where,
            orderBy,
            take: 50,
            include: {
                user:   { select: { fullName: true } },
                _count: { select: { upvotes: true } },
                ...(currentUserId
                    ? {
                          upvotes: {
                              where:  { userId: currentUserId },
                              select: { id: true },
                          },
                      }
                    : {}),
            },
        });

        const result = complaints.map((c: any) => ({
            id:           c.id,
            issueType:    c.issueType,
            description:  c.description,
            street:       c.street,
            city:         c.city,
            state:        c.state,
            status:       c.status,
            remarks:      c.remarks,
            evidenceUrl:  c.evidenceUrl,
            latitude:     c.latitude,
            longitude:    c.longitude,
            createdAt:    c.createdAt,
            upvoteCount:  c._count.upvotes,
            submittedBy:  c.user?.fullName || 'Anonymous',
            hasVoted:     currentUserId ? (c.upvotes?.length ?? 0) > 0 : false,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching feed:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
