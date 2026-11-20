import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/session';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const expectedState = req.cookies.get('oauth_state')?.value;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!code || !clientId || !clientSecret || !state || state !== expectedState) {
        const res = NextResponse.redirect(`${baseUrl}/auth?error=AuthenticationFailed`);
        res.cookies.delete('oauth_state');
        return res;
    }

    try {
        // 1. Exchange the authorization code for an access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Error fetching Google Token:', tokenData.error);
            return NextResponse.redirect(`${baseUrl}/auth?error=GoogleTokenError`);
        }

        const { access_token } = tokenData;

        // 2. Fetch the user's profile from Google using the access token
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const googleUser = await userResponse.json();

        // Only an address Google has verified proves the person owns it.
        if (!googleUser.email || googleUser.verified_email !== true) {
            return NextResponse.redirect(`${baseUrl}/auth?error=EmailRequired`);
        }

        // 3. Check if the user already exists in the database
        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        // Staff accounts sign in with their password only, so a Google identity for a staff
        // address (for example from whoever registers that domain) can never open a desk.
        if (user && user.role !== 'user') {
            return NextResponse.redirect(`${baseUrl}/auth?error=UsePassword`);
        }

        // 4. Create a new user if they don't exist
        if (!user) {
            // Generate a placeholder username based on the email or name
            const baseUsername = googleUser.email.split('@')[0];
            const uniqueSuffix = crypto.randomUUID().slice(0, 12);
            
            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    fullName: googleUser.name || 'Google User',
                    username: `${baseUsername}_${uniqueSuffix}`,
                    role: 'user',
                    passwordHash: "",
                },
            });
        }

        // 5. Redirect to the homepage with our session cookie set
        const response = NextResponse.redirect(`${baseUrl}/`);
        response.cookies.delete('oauth_state');
        return setSessionCookie(response, user);

    } catch (error) {
        console.error('Google OAuth Callback Error:', error);
        return NextResponse.redirect(`${baseUrl}/auth?error=InternalServerError`);
    }
}
