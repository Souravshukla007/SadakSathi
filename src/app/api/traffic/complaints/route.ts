import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TRAFFIC_ISSUE_TYPES } from '@/lib/traffic';
import { mediaUrlsFor, omitMedia } from '@/lib/complaintMedia';
import { requireUser, STAFF } from '@/lib/session';


export async function GET() {
    try {
        const session = await requireUser(STAFF.traffic);
        if (session instanceof NextResponse) return session;

        const complaints = await prisma.complaint.findMany({
            omit: omitMedia,
            where: {
                issueType: { in: TRAFFIC_ISSUE_TYPES },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: { select: { fullName: true } },
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
            evidenceUrl: urls(c.id).evidenceUrl,
            createdAt: c.createdAt,
            submittedBy: c.user?.fullName || 'Anonymous',
            isDuplicate: c.isDuplicate,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Traffic complaints fetch error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
