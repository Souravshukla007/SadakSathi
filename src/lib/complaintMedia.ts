import { prisma } from '@/lib/prisma';

// shortcut: media is stored as base64 data URLs in Postgres; move to object storage when uploads grow.
// Lists never carry the base64: they get a URL to /api/complaints/<id>/media and the browser
// fetches (and caches) each picture only when it is shown.

export const MEDIA_FIELDS = { evidence: 'evidenceUrl', video: 'videoUrl', resolution: 'resolutionImageUrl' } as const;
export type MediaKind = keyof typeof MEDIA_FIELDS;

/** Formats we accept and serve. No SVG: served from our origin it could run script. */
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']);
export const MAX_MEDIA_CHARS = 4_000_000; // ~3 MB file

export function parseDataUrl(value: string): { type: string; bytes: Buffer } | null {
    const m = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(value);
    if (!m || !ALLOWED_TYPES.has(m[1])) return null;
    return { type: m[1], bytes: Buffer.from(m[2], 'base64') };
}

/** null when valid (or empty); otherwise an error message for a 400/413. */
export function mediaError(value: unknown, kind: 'image' | 'video'): { message: string; status: number } | null {
    if (value == null || value === '') return null;
    if (typeof value !== 'string' || !value.startsWith(`data:${kind}/`) || !parseDataUrl(value)) {
        return { message: `Unsupported ${kind} format.`, status: 400 };
    }
    if (value.length > MAX_MEDIA_CHARS) return { message: `${kind === 'image' ? 'Photo' : 'Video'} is too large (max ~3 MB).`, status: 413 };
    return null;
}

export const omitMedia = { evidenceUrl: true, videoUrl: true, resolutionImageUrl: true } as const;

export const mediaUrl = (id: string, kind: MediaKind) => `/api/complaints/${id}/media?kind=${kind}`;

/**
 * For complaints loaded with `omit: omitMedia`, returns a function giving each one's media URLs.
 * `IS NOT NULL` checks don't read the stored base64, so this stays cheap.
 */
export async function mediaUrlsFor(ids: string[]) {
    const kinds = Object.keys(MEDIA_FIELDS) as MediaKind[];
    const present = await Promise.all(kinds.map(kind =>
        prisma.complaint.findMany({ where: { id: { in: ids }, [MEDIA_FIELDS[kind]]: { not: null } }, select: { id: true } })
            .then(rows => new Set(rows.map(r => r.id)))));
    return (id: string) => ({
        evidenceUrl: present[0].has(id) ? mediaUrl(id, 'evidence') : null,
        videoUrl: present[1].has(id) ? mediaUrl(id, 'video') : null,
        resolutionImageUrl: present[2].has(id) ? mediaUrl(id, 'resolution') : null,
    });
}
