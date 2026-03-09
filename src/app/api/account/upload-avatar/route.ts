import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const userId = payload.id as string;
        const { imageBase64 } = await req.json();

        if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
            return NextResponse.json({ message: 'Invalid image data' }, { status: 400 });
        }

        // Limit to ~2MB
        if (imageBase64.length > 2_800_000) {
            return NextResponse.json({ message: 'Image too large. Max 2MB.' }, { status: 413 });
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
