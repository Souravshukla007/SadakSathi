import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { id: true, role: true, fullName: true, email: true, username: true },
        });
        return NextResponse.json({ authenticated: true, user }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
