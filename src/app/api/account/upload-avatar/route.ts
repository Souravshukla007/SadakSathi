import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function POST(req: NextRequest) {
    try {
        const session = await requireUser();
        if (session instanceof NextResponse) return session;
        const userId = session.id;
        const { imageBase64 } = await req.json();

        if (typeof imageBase64 !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,/.test(imageBase64)) {
            return NextResponse.json({ message: 'Invalid image data. Use PNG, JPEG, WebP or GIF.' }, { status: 400 });
        }

        // ~300 KB: avatars are inlined in leaderboard responses (50 per request)
        if (imageBase64.length > 400_000) {
            return NextResponse.json({ message: 'Image too large. Max 300 KB.' }, { status: 413 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { profileImageUrl: imageBase64 },
        });

        await prisma.userActivity.create({
            data: { userId, action: 'Avatar Updated', details: 'Profile picture was changed.' },
        });

        return NextResponse.json({ success: true, profileImageUrl: imageBase64 });
    } catch (error) {
        console.error('Upload avatar error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
