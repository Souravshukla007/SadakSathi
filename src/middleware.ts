import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

// Define the routes that require authentication
const protectedRoutes = ['/dashboard', '/complaints/new', '/profile', '/admin'];
const authRoutes = ['/auth', '/login', '/signup'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    const token = request.cookies.get('auth_token')?.value;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }

        const payload = await verifyToken(token);
        if (!payload) {
            // Invalid token
            const response = NextResponse.redirect(new URL('/auth', request.url));
            response.cookies.delete('auth_token');
            return response;
        }

        // Admin checks can be added here
        if (pathname.startsWith('/admin') && payload.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    if (isAuthRoute && token) {
        const payload = await verifyToken(token);
        if (payload) {
            return NextResponse.redirect(new URL('/', request.url)); // Or dashboard based on role
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png|.*\\.jpg|.*\\.svg).*)',
    ],
};
