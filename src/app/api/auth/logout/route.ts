import { NextResponse } from 'next/server';
import { authCookieOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST() {
    // Revoke the token on the server too, so a copied cookie stops working. Bumping tokenVersion
    // ends this account's sessions on every device (the same mechanism a password change uses).
    const user = await getSessionUser();
    if (user) await prisma.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } });

    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    response.cookies.set('auth_token', '', { ...authCookieOptions, maxAge: 0 });
    return response;
}
