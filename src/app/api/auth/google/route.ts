import { NextResponse } from 'next/server';
import { authCookieOptions } from '@/lib/auth';

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
        return NextResponse.json({ message: 'Google Client ID is not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const state = crypto.randomUUID();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
        client_id: clientId,
        state,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent'
    });

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state', state, { ...authCookieOptions, maxAge: 60 * 10 });
    return response;
}
