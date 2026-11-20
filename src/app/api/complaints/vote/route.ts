import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
    try {
        const session = await requireUser();
        if (session instanceof NextResponse) return session;
        const userId = session.id;
        const { complaintId } = await req.json();

        if (!complaintId || typeof complaintId !== 'string') {
            return NextResponse.json({ message: 'complaintId is required' }, { status: 400 });
        }

        const complaint = await prisma.complaint.findUnique({ where: { id: complaintId }, select: { userId: true } });
        if (!complaint) return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
        // Votes earn the author leaderboard points, so authors can't vote for themselves.
        if (complaint.userId === userId) {
            return NextResponse.json({ message: "You can't upvote your own report." }, { status: 400 });
        }

        // Unique (complaintId, userId) index makes double votes fail atomically
        try {
            await prisma.upvote.create({
                data: { userId, complaintId },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2002') {
                    return NextResponse.json({ message: 'You have already voted on this complaint.' }, { status: 409 });
                }
                if (e.code === 'P2003') {
                    return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
                }
            }
            throw e;
        }

        // Return updated count
        const count = await prisma.upvote.count({ where: { complaintId } });

        return NextResponse.json({ success: true, upvoteCount: count });
    } catch (error) {
        console.error('Error casting vote:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
