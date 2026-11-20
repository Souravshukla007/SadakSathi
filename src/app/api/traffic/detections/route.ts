import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, STAFF } from '@/lib/session';

export async function GET() {
    try {
        const session = await requireUser(STAFF.traffic);
        if (session instanceof NextResponse) return session;

        const detections = await prisma.trafficViolation.findMany({
            orderBy: { timestamp: 'desc' },
            take: 50,
            include: {
                challan: true,
                vehicle: { select: { vehicleType: true } },
            },
        });

        return NextResponse.json(detections);
    } catch (error) {
        console.error('Detections fetch error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
