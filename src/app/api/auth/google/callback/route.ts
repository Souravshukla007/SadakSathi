import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (!code || !clientId || !clientSecret) {
        return NextResponse.redirect(`${baseUrl}/auth?error=AuthenticationFailed`);
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

        if (!googleUser.email) {
            return NextResponse.redirect(`${baseUrl}/auth?error=EmailRequired`);
        }

        // 3. Check if the user already exists in the database
        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        // 4. Create a new user if they don't exist
        if (!user) {
            // Generate a placeholder username based on the email or name
            const baseUsername = googleUser.email.split('@')[0];
            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000); // Simple uniqueness
            
            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    fullName: googleUser.name || 'Google User',
                    username: `${baseUsername}_${uniqueSuffix}`,
                    role: 'Citizen Contributor', 
                    passwordHash: "",
                },
            });
        }

        // 5. Generate our custom JWT for the application session
        const token = await signToken({ userId: user.id, role: user.role });

        // 6. Redirect to the homepage with the cookie set
        const response = NextResponse.redirect(`${baseUrl}/`);
        
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Google OAuth Callback Error:', error);
        return NextResponse.redirect(`${baseUrl}/auth?error=InternalServerError`);
    }
}
