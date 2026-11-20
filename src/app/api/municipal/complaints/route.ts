import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mediaUrlsFor, omitMedia } from '@/lib/complaintMedia';
import { requireUser, STAFF } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await requireUser(STAFF.municipal);
        if (session instanceof NextResponse) return session;

        // shortcut: returns every complaint (media omitted, so rows are small); add take/skip paging past a few thousand reports.
        const complaints = await prisma.complaint.findMany({
            omit: omitMedia,
            include: {
                user: {
                    select: { fullName: true, email: true }
                },
                _count: {
                    select: { upvotes: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        const urls = await mediaUrlsFor(complaints.map(c => c.id));

        // Format for the dashboard
        const formatted = complaints.map(c => ({
            id: c.id,
            issueType: c.issueType,
            description: c.description,
            street: c.street,
            city: c.city,
            state: c.state,
            zipcode: c.zipcode,
            latitude: c.latitude,
            longitude: c.longitude,
            status: c.status,
            remarks: c.remarks,
            isDuplicate: c.isDuplicate,
            originalReportId: c.originalReportId,
            evidenceUrl: urls(c.id).evidenceUrl,
            videoUrl: urls(c.id).videoUrl,
            resolutionImageUrl: urls(c.id).resolutionImageUrl,
            createdAt: c.createdAt,
            submittedBy: c.user.fullName,
            submitterEmail: c.user.email,
            upvoteCount: c._count.upvotes
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Failed to fetch municipal complaints:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
