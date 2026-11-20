import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mediaUrlsFor, omitMedia } from '@/lib/complaintMedia';
import { getSessionUser } from '@/lib/session';
import { ComplaintStatus } from '@prisma/client';
import { haversineDistance } from '@/lib/duplicateDetection';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sort   = searchParams.get('sort')   || 'newest';
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || ''; // e.g. Submitted | Approved | Completed

        // "Near me": ?near=<lat>,<lng>&radius=<km> (default 5 km, max 50) → only nearby reports, closest first.
        const [nLat, nLng] = (searchParams.get('near') ?? '').split(',').map(Number);
        const near = Number.isFinite(nLat) && Number.isFinite(nLng) && Math.abs(nLat) <= 90 && Math.abs(nLng) <= 180
            ? { lat: nLat, lng: nLng } : null;
        const radiusKm = Math.min(Math.max(Number(searchParams.get('radius')) || 5, 0.5), 50);

        // Try to get the current user (optional — feed is public)
        const currentUserId = (await getSessionUser())?.id ?? null;

        const orderBy =
            sort === 'upvotes'
                ? { upvotes: { _count: 'desc' as const } }
                : sort === 'oldest'
                ? { createdAt: 'asc' as const }
                : { createdAt: 'desc' as const };

        // Build where clause
        const where: Record<string, unknown> = { isDuplicate: false };

        // Ignore unknown values instead of letting Prisma throw on the enum
        if ((Object.values(ComplaintStatus) as string[]).includes(status)) {
            where.status = status;
        }

        if (near) {
            // Bounding box in the query (cheap), exact distance below.
            const dLat = radiusKm / 111.32;
            const dLng = dLat / Math.max(Math.cos((near.lat * Math.PI) / 180), 0.01);
            where.latitude = { gte: near.lat - dLat, lte: near.lat + dLat };
            where.longitude = { gte: near.lng - dLng, lte: near.lng + dLng };
        }

        if (search) {
            where.OR = [
                { street:      { contains: search, mode: 'insensitive' } },
                { city:        { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { issueType:   { contains: search, mode: 'insensitive' } },
            ];
        }

        const complaints = await prisma.complaint.findMany({
            omit: omitMedia,
            where,
            orderBy,
            // Near me: rows are cut only AFTER sorting by distance (below), so a close old report isn't lost
            // behind 200 newer far ones. shortcut: caps the box at 2,000 rows (media omitted, so small);
            // past that many open reports in one area, sort by distance in SQL instead.
            take: near ? 2000 : 50,
            include: {
                user:   { select: { fullName: true } },
                _count: { select: { upvotes: true } },
                ...(currentUserId
                    ? {
                          upvotes: {
                              where:  { userId: currentUserId },
                              select: { id: true },
                          },
                      }
                    : {}),
            },
        });
        const urls = await mediaUrlsFor(complaints.map(c => c.id));

        const withDistance = complaints.map((c) => ({
            c,
            distanceKm: near && c.latitude != null && c.longitude != null
                ? haversineDistance(near.lat, near.lng, c.latitude, c.longitude) / 1000 : null,
        }));
        const rows = near
            ? withDistance.filter(r => r.distanceKm != null && r.distanceKm <= radiusKm).sort((a, b) => a.distanceKm! - b.distanceKm!).slice(0, 50)
            : withDistance;

        const result = rows.map(({ c, distanceKm }) => ({
            id:           c.id,
            issueType:    c.issueType,
            description:  c.description,
            street:       c.street,
            city:         c.city,
            state:        c.state,
            status:       c.status,
            remarks:      c.remarks,
            evidenceUrl:  urls(c.id).evidenceUrl,
            latitude:     c.latitude,
            longitude:    c.longitude,
            createdAt:    c.createdAt,
            upvoteCount:  c._count.upvotes,
            submittedBy:  c.user?.fullName || 'Anonymous',
            hasVoted:     currentUserId ? (c.upvotes?.length ?? 0) > 0 : false,
            distanceKm:   distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching feed:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
