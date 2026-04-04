import { NextResponse } from 'next/server';
import { comparePasswords } from '@/lib/auth';
import { signToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { validateCredentials } from '@/lib/credentials';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, authorityType } = body;

        if (!email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Handle hard-coded credentials for municipal and traffic authorities
        if (authorityType === 'municipal' || authorityType === 'traffic') {
            console.log('🔍 Authority login attempt:', { email, password, authorityType });
            
            const credentials = validateCredentials(email, password);
            console.log('🔍 Credentials validation result:', credentials);
            
            if (!credentials) {
                console.log('❌ Invalid credentials for authority access');
                return NextResponse.json({ message: 'Invalid credentials for authority access' }, { status: 401 });
            }

            // Generate JWT token with authority role
            const token = await signToken({ 
                userId: `${credentials.role}-user`, 
                role: credentials.role,
                username: credentials.username,
                authorityType: credentials.role
            });

            // Determine redirect URL based on role
            const redirectUrl = credentials.role === 'municipal' ? '/Municipal' : '/dashboard/traffic';
            console.log('🚀 Authority login successful:', { role: credentials.role, redirectUrl });

            const response = NextResponse.json({ 
                message: 'Authority login successful',
                role: credentials.role,
                redirectUrl: redirectUrl
            }, { status: 200 });
            
            response.cookies.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/',
            });

            return response;
        }

        // Handle regular citizen login with database
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }

        if (!user.passwordHash) {
            return NextResponse.json({ message: 'Please login using Google' }, { status: 401 });
        }

        const isValid = await comparePasswords(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }

        const token = await signToken({ userId: user.id, role: user.role });

        const response = NextResponse.json({ message: 'Login successful' }, { status: 200 });
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
