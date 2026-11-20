import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mediaUrlsFor, omitMedia } from '@/lib/complaintMedia';
import { requireUser } from '@/lib/session';

export async function GET() {
    try {
        const session = await requireUser();
        if (session instanceof NextResponse) return session;
        const userId = session.id;

        const complaints = await prisma.complaint.findMany({
            omit: omitMedia,
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { upvotes: true } },
            },
        });
        const urls = await mediaUrlsFor(complaints.map(c => c.id));

        const result = complaints.map((c) => ({
            id: c.id,
            issueType: c.issueType,
            description: c.description,
            street: c.street,
            city: c.city,
            state: c.state,
            status: c.status,
            remarks: c.remarks,
            evidenceUrl: urls(c.id).evidenceUrl,
            latitude: c.latitude,
            longitude: c.longitude,
            createdAt: c.createdAt,
            upvoteCount: c._count.upvotes,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching my complaints:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
