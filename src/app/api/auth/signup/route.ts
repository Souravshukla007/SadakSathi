import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { signToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { firstName, lastName, email, role, password } = body;

        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
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
                role: role === 'City Administrator' ? 'admin' : (role === 'Maintenance Contractor' ? 'contractor' : 'user'),
                passwordHash: hashedPassword,
            }
        });

        const token = await signToken({ userId: user.id, role: user.role });

        const response = NextResponse.json({ message: 'User created successfully' }, { status: 201 });
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
