import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

/**
 * Routes that require authentication.
 * Guests hitting these will be redirected to /auth?redirect=<original-path>
 */
const PROTECTED_ROUTES = [
    '/dashboard',
    '/upload',
    '/results',
    '/my-account',
    '/my-complaints',
    '/complaints',
    '/leaderboard',
    '/performance',
    '/traffic-violations',
    '/governance',
    '/resources',
    '/admin',
    '/unified-detector',
    '/Municipal',
];

/**
 * Routes only for unauthenticated users.
 * Logged-in users are bounced to /dashboard.
 */
const AUTH_ONLY_ROUTES = ['/auth', '/login', '/signup'];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
    const isAuthOnly  = AUTH_ONLY_ROUTES.some(r => pathname.startsWith(r));

    const token = request.cookies.get('auth_token')?.value;

    // ── Guest on protected route → redirect to /auth?redirect=<path> ──────────
    if (isProtected) {
        if (!token) {
            const loginUrl = new URL('/auth', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        const payload = await verifyToken(token);
        if (!payload) {
            // Token invalid/expired — clear cookie and redirect
            const loginUrl = new URL('/auth', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            const res = NextResponse.redirect(loginUrl);
            res.cookies.delete('auth_token');
            return res;
        }

        // Admin-only guard
        if (pathname.startsWith('/admin') && payload.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // ── Logged-in user on auth pages → send to dashboard ─────────────────────
    if (isAuthOnly && token) {
        const payload = await verifyToken(token);
        if (payload) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp).*)',
    ],
};
