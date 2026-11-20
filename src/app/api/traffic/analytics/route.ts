import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TRAFFIC_ISSUE_TYPES } from '@/lib/traffic';
import { requireUser, STAFF } from '@/lib/session';


export async function GET() {
    try {
        const session = await requireUser(STAFF.traffic);
        if (session instanceof NextResponse) return session;

        const [violations, vehicleCount, challans, citizenComplaints] = await Promise.all([
            prisma.trafficViolation.aggregate({ _count: true, _avg: { confidence: true } }),
            prisma.vehicleDetection.count(),
            prisma.challan.aggregate({ _sum: { amount: true }, _count: true }),
            prisma.complaint.count({ where: { issueType: { in: TRAFFIC_ISSUE_TYPES } } }),
        ]);

        // Combine AI detections + citizen complaints for total count
        const totalViolations = violations._count + citizenComplaints;

        return NextResponse.json({
            totalViolations,
            // confidence is stored 0-1; the UI shows a percentage with one decimal
            avgConfidence: Math.round((violations._avg.confidence ?? 0) * 1000) / 10,
            vehicleCount,
            totalChallanAmount: challans._sum.amount ?? 0,
            totalChallansIssued: challans._count,
            citizenReports: citizenComplaints,
        });
    } catch (error) {
        console.error('Traffic analytics error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
