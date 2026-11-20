import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authCookieOptions } from '@/lib/auth';
import { signToken, verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export type SessionUser = { id: string; role: string };

/**
 * The logged-in user, or null. Checks the DB so that a password change (tokenVersion bump),
 * a deleted account or a changed role takes effect immediately instead of at token expiry.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
    return userFromToken((await cookies()).get('auth_token')?.value);
}

/** Same check for callers that hold the token themselves (src/proxy.ts reads it from the request). */
export async function userFromToken(token: string | undefined): Promise<SessionUser | null> {
    const payload = token ? await verifyToken(token) : null;
    if (!payload?.id) return null;
    const user = await prisma.user.findUnique({
        where: { id: String(payload.id) },
        select: { id: true, role: true, tokenVersion: true },
    });
    if (!user || user.tokenVersion !== (payload.tv ?? 0)) return null;
    return { id: user.id, role: user.role };
}

/**
 * Use at the top of a route: `const user = await requireUser(['municipal', 'admin']);
 * if (user instanceof NextResponse) return user;`
 */
export async function requireUser(roles?: string[]): Promise<SessionUser | NextResponse> {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    if (roles && !roles.includes(user.role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    return user;
}

export const STAFF = { municipal: ['municipal', 'admin'], traffic: ['traffic', 'admin'] };

/** Sign a session token for this user and set it as the auth cookie on `res`. */
export async function setSessionCookie<T extends NextResponse>(res: T, user: { id: string; role: string; tokenVersion: number }): Promise<T> {
    res.cookies.set('auth_token', await signToken({ id: user.id, role: user.role, tv: user.tokenVersion }), authCookieOptions);
    return res;
}
