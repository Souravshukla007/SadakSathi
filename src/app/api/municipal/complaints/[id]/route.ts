import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, STAFF } from '@/lib/session';
import { ComplaintStatus, Prisma } from '@prisma/client';
import { mediaError, mediaUrlsFor, omitMedia } from '@/lib/complaintMedia';
import { canMoveStatus } from '@/lib/complaintStatus';
import { TRAFFIC_ISSUE_TYPES } from '@/lib/traffic';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        // Municipal staff handle every report; the traffic desk handles citizen traffic reports (No Helmet etc.).
        const session = await requireUser([...STAFF.municipal, 'traffic']);
        if (session instanceof NextResponse) return session;

        const current = await prisma.complaint.findUnique({ where: { id }, select: { status: true, issueType: true, resolutionImageUrl: true } });
        if (!current) return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
        const isTrafficReport = TRAFFIC_ISSUE_TYPES.includes(current.issueType);
        if (session.role === 'traffic' && !isTrafficReport) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        let { status, remarks } = body;
        const { isDuplicate, originalReportId, resolutionImageUrl } = body;

        if (isDuplicate !== undefined && typeof isDuplicate !== 'boolean') {
            return NextResponse.json({ message: 'isDuplicate must be true or false' }, { status: 400 });
        }
        // A duplicate must point at a real, different report, or it vanishes from the feed with nothing to follow.
        if (isDuplicate === true) {
            const ok = typeof originalReportId === 'string' && originalReportId !== id
                && await prisma.complaint.count({ where: { id: originalReportId } });
            if (!ok) return NextResponse.json({ message: 'Pick the original report this one duplicates.' }, { status: 400 });
        }

        // Automatically set to Rejected if duplicate and status not already set to Rejected/OnHold
        if (isDuplicate && status !== 'Rejected' && status !== 'OnHold') {
            status = 'Rejected';
            if (!remarks) {
                remarks = `Duplicate of report #${originalReportId || 'unknown'}`;
            }
        }

        if (status !== undefined && !Object.values(ComplaintStatus).includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }
        if (status !== undefined && !canMoveStatus(current.status, status)) {
            return NextResponse.json({ message: `A report that is ${current.status} can't be moved to ${status}.` }, { status: 400 });
        }

        // A new photo arrives as a data URL; the existing one comes back as its /media URL (keep it).
        const newPhoto = typeof resolutionImageUrl === 'string' && resolutionImageUrl.startsWith('data:') ? resolutionImageUrl : undefined;
        const badPhoto = mediaError(newPhoto, 'image');
        if (badPhoto) return NextResponse.json({ message: badPhoto.message }, { status: badPhoto.status });

        // A road repair needs an "after" photo; a traffic report is closed by the challan, not a photo.
        if (status === 'Completed' && !newPhoto && !isTrafficReport && !current.resolutionImageUrl) {
            return NextResponse.json({ message: 'Add a resolution photo before marking this complaint completed.' }, { status: 400 });
        }

        const complaint = await prisma.complaint.update({
            where: { id },
            omit: omitMedia,
            data: {
                status: status as ComplaintStatus,
                // Fields left out of the request stay as they are (undefined = untouched in Prisma).
                remarks,
                isDuplicate,
                originalReportId: isDuplicate === false ? null : isDuplicate === true ? originalReportId : undefined,
                ...(newPhoto ? { resolutionImageUrl: newPhoto } : {}),
            }
        });

        const urls = (await mediaUrlsFor([id]))(id);
        return NextResponse.json({ success: true, complaint: { ...complaint, ...urls } });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
        }
        console.error('Failed to update complaint:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const session = await requireUser(STAFF.municipal);
        if (session instanceof NextResponse) return session;

        // Must delete related records first due to foreign keys; all-or-nothing
        await prisma.$transaction([
            prisma.detectionResult.deleteMany({ where: { complaintId: id } }),
            prisma.feedback.deleteMany({ where: { complaintId: id } }),
            prisma.upvote.deleteMany({ where: { complaintId: id } }),
            prisma.chatMessage.deleteMany({ where: { thread: { complaintId: id } } }),
            prisma.chatThread.deleteMany({ where: { complaintId: id } }),
            // Reports flagged as duplicates of this one would stay hidden for good: bring them back.
            prisma.complaint.updateMany({ where: { originalReportId: id }, data: { isDuplicate: false, originalReportId: null } }),
            prisma.complaint.delete({ where: { id } }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
        }
        console.error('Failed to delete complaint:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
