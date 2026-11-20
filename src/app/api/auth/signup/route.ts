import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/session';
import { allow, clientIp } from '@/lib/rateLimit';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
    try {
        if (!allow(`signup:${clientIp(req)}`, 5, 3_600_000)) {
            return NextResponse.json({ message: 'Too many sign-ups from this network. Try again in an hour.' }, { status: 429 });
        }
        const body = await req.json();
        const { firstName, lastName, email, password } = body;

        if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string' || !firstName || !lastName || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }
        if (typeof password !== 'string' || password.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
        }
        // Names appear on the public feed and leaderboard; 254 is the longest valid email address.
        if (firstName.length > 50 || lastName.length > 50 || email.length > 254 || password.length > 200) {
            return NextResponse.json({ message: 'Names can be up to 50 characters, and the email up to 254.' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);
        const fullName = `${firstName} ${lastName}`;

        const user = await prisma.user.create({
            data: {
                username: email.split('@')[0] + '_' + crypto.randomUUID().slice(0, 12),
                fullName,
                email,
                role: 'user', // never trust a client-supplied role
                passwordHash: hashedPassword,
            }
        });

        return setSessionCookie(NextResponse.json({ message: 'User created successfully' }, { status: 201 }), user);
    } catch (error) {
        // Two sign-ups racing past the existence check: the unique index decides.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
        }
        console.error('Signup error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
