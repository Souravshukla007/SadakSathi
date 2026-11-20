import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { checkAndFlagDuplicate } from '@/lib/duplicateDetection';
import { mediaError } from '@/lib/complaintMedia';

const MAX_REPORTS_PER_DAY = 20;

export async function POST(req: NextRequest) {
    try {
        const session = await requireUser();
        if (session instanceof NextResponse) return session;
        const userId = session.id;

        const recent = await prisma.complaint.count({ where: { userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
        if (recent >= MAX_REPORTS_PER_DAY) {
            return NextResponse.json({ message: `You can file up to ${MAX_REPORTS_PER_DAY} reports a day. Try again tomorrow.` }, { status: 429 });
        }

        const body = await req.json();

        const { issueType, description, street, city, state, zipcode, latitude, longitude, evidenceUrl, videoUrl } = body;

        // Validate required fields
        if (!issueType || !description || !street || !city || !state || !zipcode) {
            return NextResponse.json(
                { message: 'Missing required fields: issueType, description, street, city, state, zipcode.' },
                { status: 400 }
            );
        }

        // Requests may be up to 110 MB (for videos), so cap the text: the feed sends it to every visitor.
        const tooLong = Object.entries({ issueType: [issueType, 100], description: [description, 2000], street: [street, 200], city: [city, 100], state: [state, 100], zipcode: [zipcode, 20] })
            .find(([, [v, max]]) => typeof v !== 'string' || v.length > (max as number));
        if (tooLong) {
            return NextResponse.json({ message: `${tooLong[0]} must be text of at most ${tooLong[1][1]} characters.` }, { status: 400 });
        }

        const badMedia = mediaError(evidenceUrl, 'image') ?? mediaError(videoUrl, 'video');
        if (badMedia) return NextResponse.json({ message: badMedia.message }, { status: badMedia.status });

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const parsedLat = Number.isFinite(lat) ? lat : null;
        const parsedLng = Number.isFinite(lng) ? lng : null;

        const complaint = await prisma.complaint.create({
            data: {
                userId,
                issueType,
                description,
                street,
                city,
                state,
                zipcode,
                latitude:    parsedLat,
                longitude:   parsedLng,
                evidenceUrl: evidenceUrl || null,
                videoUrl:    videoUrl || null,
                status: 'Submitted',
            },
        });

        // ── Automatic duplicate detection ──────────────────────────────────
        const duplicateOfId = await checkAndFlagDuplicate({
            id: complaint.id, createdAt: complaint.createdAt, issueType, description, lat: parsedLat, lng: parsedLng, evidenceUrl: evidenceUrl || null,
        });
        // ─────────────────────────────────────────────────────────────────────

        // Log activity
        await prisma.userActivity.create({
            data: {
                userId,
                action: 'complaint_submitted',
                details: duplicateOfId
                    ? `Submitted complaint #${complaint.id} for ${issueType} — auto-flagged as duplicate of #${duplicateOfId}`
                    : `Submitted complaint #${complaint.id} for ${issueType}`,
            },
        });

        return NextResponse.json(
            {
                success: true,
                complaintId: complaint.id,
                isDuplicate: !!duplicateOfId,
                duplicateOf: duplicateOfId ?? null,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Error creating complaint:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
