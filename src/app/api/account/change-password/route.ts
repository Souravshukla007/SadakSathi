import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireUser, setSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
    try {
        const session = await requireUser();
        if (session instanceof NextResponse) return session;

        const { currentPassword, newPassword, confirmPassword } = await req.json();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
        }
        if (newPassword !== confirmPassword) {
            return NextResponse.json({ message: 'New passwords do not match.' }, { status: 400 });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.id } });
        if (!user?.passwordHash) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
            return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 403 });
        }

        // Bumping tokenVersion logs out every other session (e.g. a stolen cookie).
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await bcrypt.hash(newPassword, 12), tokenVersion: { increment: 1 } },
        });

        await prisma.userActivity.create({
            data: { userId: user.id, action: 'Password Changed', details: 'Account password was updated. Other sessions were signed out.' },
        });

        // Keep this browser signed in with a token for the new version.
        return setSessionCookie(NextResponse.json({ success: true }), updated);
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
