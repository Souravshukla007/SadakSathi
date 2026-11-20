import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseDataUrl } from '@/lib/complaintMedia';

/** GET /api/users/<id>/avatar — the profile picture as real image bytes (public, like the leaderboard). */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { profileImageUrl: true } });
    const image = user?.profileImageUrl ? parseDataUrl(user.profileImageUrl) : null;
    if (!image || !image.type.startsWith('image/')) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return new Response(new Uint8Array(image.bytes), {
        headers: { 'Content-Type': image.type, 'Cache-Control': 'public, max-age=300', 'Content-Security-Policy': "default-src 'none'; sandbox" },
    });
}
