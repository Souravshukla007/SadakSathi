import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized — please log in to submit a complaint.' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.id) {
            return NextResponse.json({ message: 'Unauthorized — invalid session.' }, { status: 401 });
        }

        const userId = payload.id as string;
        const body = await req.json();

        const { issueType, description, street, city, state, zipcode, latitude, longitude, evidenceUrl, videoUrl } = body;

        // Validate required fields
        if (!issueType || !description || !street || !city || !state || !zipcode) {
            return NextResponse.json(
                { message: 'Missing required fields: issueType, description, street, city, state, zipcode.' },
                { status: 400 }
            );
        }

        const complaint = await prisma.complaint.create({
            data: {
                userId,
                issueType,
                description,
                street,
                city,
                state,
                zipcode,
                latitude:   latitude   ? parseFloat(latitude)   : null,
                longitude:  longitude  ? parseFloat(longitude)  : null,
                evidenceUrl: evidenceUrl ?? null,
                videoUrl:    videoUrl   ?? null,
                status: 'Submitted',
            },
        });

        // Log activity
        await prisma.userActivity.create({
            data: {
                userId,
                action: 'complaint_submitted',
                details: `Submitted complaint #${complaint.id} for ${issueType}`,
            },
        });

        return NextResponse.json({ success: true, complaintId: complaint.id }, { status: 201 });
    } catch (error) {
        console.error('Error creating complaint:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
