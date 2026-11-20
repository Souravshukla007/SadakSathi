import { mlFetch } from '@/lib/mlBackend';
import { prisma } from '@/lib/prisma';
import type { ComplaintStatus } from '@prisma/client';

/** Maximum distance (in meters) to consider two complaints the same issue. */
const DUPLICATE_RADIUS_METERS = 100;
/** Only look at complaints submitted within this many days. */
const DUPLICATE_WINDOW_DAYS = 30;
const ML_TIMEOUT_MS = 5_000;

/** Great-circle distance between two (lat, lng) pairs in meters. */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type NewComplaint = { id: string; createdAt: Date; issueType: string; description: string; lat: number | null; lng: number | null; evidenceUrl: string | null };

/** Reports that can still be "the original": a fixed or rejected one doesn't hide a fresh report of the same spot. */
const OPEN_STATUSES = { notIn: ['Completed', 'ResolvedReviewed', 'Rejected'] as ComplaintStatus[] };

/** Oldest open, non-duplicate complaint of the same type within 100 m in the last 30 days, filed before this one. */
async function findByLocation(c: NewComplaint & { lat: number; lng: number }): Promise<string | null> {
    const since = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 86_400_000);
    // Bounding box first so the DB only returns nearby rows; Haversine then trims the corners.
    const dLat = DUPLICATE_RADIUS_METERS / 111_320;
    const dLng = dLat / Math.max(Math.cos((c.lat * Math.PI) / 180), 0.01);
    const candidates = await prisma.complaint.findMany({
        where: {
            // createdAt < this one: two reports filed at the same moment can't flag each other and both vanish.
            id: { not: c.id }, issueType: c.issueType, isDuplicate: false, status: OPEN_STATUSES, createdAt: { gte: since, lt: c.createdAt },
            latitude: { gte: c.lat - dLat, lte: c.lat + dLat },
            longitude: { gte: c.lng - dLng, lte: c.lng + dLng },
        },
        select: { id: true, latitude: true, longitude: true },
        orderBy: { createdAt: 'asc' }, // oldest first → link to the root report
    });
    return candidates.find(x => haversineDistance(c.lat, c.lng, x.latitude!, x.longitude!) <= DUPLICATE_RADIUS_METERS)?.id ?? null;
}

/**
 * Ask the ML backend's multimodal engine (text + photo + location). Best-effort: if the ML server
 * is down or slow, the location rule above still applies. Its index lives in memory, so every
 * non-duplicate complaint is added to it for future checks.
 */
async function findWithMlEngine(c: NewComplaint & { lat: number; lng: number }): Promise<string | null> {
    const report = { text: c.description, location: [c.lat, c.lng], issue_type: c.issueType, image_base64: c.evidenceUrl ?? undefined };
    const post = (path: string, body: object) => mlFetch(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(ML_TIMEOUT_MS),
    });
    try {
        const res = await post('/duplicate/check', report);
        const verdict = res.ok ? await res.json() : null;
        const originalId: string | undefined = verdict?.is_duplicate ? verdict.original_report_id : undefined;
        // Only trust IDs that are real, still-open originals in our DB.
        if (originalId && await prisma.complaint.count({ where: { id: originalId, isDuplicate: false, status: OPEN_STATUSES } })) return originalId;
        await post('/duplicate/add-report', { ...report, id: c.id });
    } catch {
        // ML backend unreachable or timed out: fall back to the location rule only.
    }
    return null;
}

/**
 * Flags a newly created complaint as a duplicate if it matches an earlier one.
 * Returns the original complaint's ID, or null.
 */
export async function checkAndFlagDuplicate(c: NewComplaint): Promise<string | null> {
    if (c.lat === null || c.lng === null) return null; // both rules need a location
    const located = { ...c, lat: c.lat, lng: c.lng };
    const originalId = (await findByLocation(located)) ?? (await findWithMlEngine(located));
    if (originalId) {
        await prisma.complaint.update({
            where: { id: c.id },
            data: {
                isDuplicate: true,
                originalReportId: originalId,
                remarks: `Automatically flagged as a duplicate of report #${originalId}.`,
            },
        });
    }
    return originalId;
}
