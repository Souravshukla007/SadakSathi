import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        if (!payload?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const userId = payload.id as string;
        const { currentPassword, newPassword, confirmPassword } = await req.json();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
        }
        if (newPassword !== confirmPassword) {
            return NextResponse.json({ message: 'New passwords do not match.' }, { status: 400 });
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.passwordHash) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        const match = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!match) {
            return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 403 });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

        await prisma.userActivity.create({
            data: { userId, action: 'Password Changed', details: 'Account password was updated.' },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
