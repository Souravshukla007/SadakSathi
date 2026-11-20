import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MEDIA_FIELDS, parseDataUrl, type MediaKind } from '@/lib/complaintMedia';

/** GET /api/complaints/<id>/media?kind=evidence|video|resolution — the stored file as real bytes. */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const kind = req.nextUrl.searchParams.get('kind') ?? '';
    // Own keys only: "constructor" or "__proto__" must not resolve to Object.prototype members.
    const field = Object.hasOwn(MEDIA_FIELDS, kind) ? MEDIA_FIELDS[kind as MediaKind] : undefined;
    if (!field) return NextResponse.json({ message: 'kind must be evidence, video or resolution' }, { status: 400 });

    const row = await prisma.complaint.findUnique({ where: { id }, select: { [field]: true } }) as Record<string, string | null> | null;
    const media = row?.[field] ? parseDataUrl(row[field]) : null;
    if (!media) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    return new Response(new Uint8Array(media.bytes), {
        headers: {
            'Content-Type': media.type,
            'Cache-Control': 'private, max-age=3600',
            // Even if someone opens it directly, it is inert content, not a page.
            'Content-Security-Policy': "default-src 'none'; sandbox",
        },
    });
}
