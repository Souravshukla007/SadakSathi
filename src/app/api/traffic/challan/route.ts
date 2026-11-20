import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, STAFF } from '@/lib/session';
import { Prisma } from '@prisma/client';

const FINE_MAP: Record<string, number> = {
    helmet_violation: 1000,
    triple_riding: 1500,
    wrong_side: 2000,
    plate_detection: 500,
};

export async function POST(req: NextRequest) {
    let violationId: string | undefined;
    try {
        const session = await requireUser(STAFF.traffic);
        if (session instanceof NextResponse) return session;

        ({ violationId } = await req.json());
        if (!violationId) {
            return NextResponse.json({ message: 'violationId is required' }, { status: 400 });
        }

        const violation = await prisma.trafficViolation.findUnique({ where: { id: violationId } });
        if (!violation) {
            return NextResponse.json({ message: 'Violation not found' }, { status: 404 });
        }

        const amount = FINE_MAP[violation.type] ?? 500;
        // violationId is @unique: a concurrent double issue fails with P2002 instead of creating two challans
        const [challan] = await prisma.$transaction([
            prisma.challan.create({ data: { violationId, amount } }),
            prisma.trafficViolation.update({
                where: { id: violationId },
                data: { status: 'challan_issued' },
            }),
        ]);

        return NextResponse.json({ success: true, challan });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Send the existing challan so the desk shows it instead of offering "Issue" again.
            const challan = await prisma.challan.findUnique({ where: { violationId } });
            return NextResponse.json({ message: 'Challan already issued', challan }, { status: 409 });
        }
        console.error('Challan creation error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
