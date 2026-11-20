import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { userFromToken } from './lib/session';

/**
 * Routes that require authentication.
 * Guests hitting these will be redirected to /auth?redirect=<original-path>
 */
const PROTECTED_ROUTES = [
    '/dashboard',
    '/upload',
    '/results',
    '/my-account',
    '/leaderboard',
    '/Municipal',
    '/Traffic',
];

/**
 * Routes only for unauthenticated users.
 * Logged-in users are bounced to /dashboard.
 */
const AUTH_ONLY_ROUTES = ['/auth'];

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/** A browser-sent Origin from another site on a state-changing call (CSRF), or an opaque "null" origin. */
function isCrossSite(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return false; // non-browser clients and same-origin GET navigations send none
    try {
        return new URL(origin).host !== request.headers.get('host');
    } catch {
        return true;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── API: refuse cross-site writes. Backs up SameSite=Lax cookies (defence in depth). ──
    if (pathname.startsWith('/api/')) {
        if (!SAFE_METHODS.includes(request.method) && isCrossSite(request)) {
            return NextResponse.json({ message: 'Cross-site request refused' }, { status: 403 });
        }
        return NextResponse.next();
    }

    const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
    const isAuthOnly  = AUTH_ONLY_ROUTES.some(r => pathname.startsWith(r));

    if (!isProtected && !isAuthOnly) return NextResponse.next();

    const token = request.cookies.get('auth_token')?.value;
    // Checks the database, not just the signature: a token revoked by a password change, lockout or
    // role change counts as logged out here too. Otherwise /auth would bounce to /dashboard while every
    // API answers 401, and the person could never log in again.
    const user = await userFromToken(token);
    const home = user?.role === 'municipal' ? '/Municipal' : user?.role === 'traffic' ? '/Traffic' : '/dashboard';

    // ── Guest (or revoked token) on protected route → /auth?redirect=<path> ──
    if (isProtected && !user) {
        const loginUrl = new URL('/auth', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const res = NextResponse.redirect(loginUrl);
        if (token) res.cookies.delete('auth_token');
        return res;
    }

    if (isProtected && user) {
        // Authority dashboards: own role or admin only
        if (pathname.startsWith('/Municipal') && user.role !== 'municipal' && user.role !== 'admin') {
            return NextResponse.redirect(new URL(home, request.url));
        }
        if (pathname.startsWith('/Traffic') && user.role !== 'traffic' && user.role !== 'admin') {
            return NextResponse.redirect(new URL(home, request.url));
        }
    }

    // ── Logged-in user on auth pages → send to their home ────────────────────
    if (isAuthOnly) {
        if (user) return NextResponse.redirect(new URL(home, request.url));
        if (token) {
            const res = NextResponse.next();
            res.cookies.delete('auth_token'); // stale cookie: drop it so the header shows the guest view
            return res;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp).*)',
    ],
};
