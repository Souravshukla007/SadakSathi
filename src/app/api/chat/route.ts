import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// Helper to get authenticated user
async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        return await verifyToken(token);
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const department = url.searchParams.get('department'); // 'municipal' or 'traffic'
        const threadId = url.searchParams.get('threadId');
        
        // If threadId is provided, just return the messages for that thread
        if (threadId) {
            const thread = await prisma.chatThread.findUnique({
                where: { id: threadId },
                include: { messages: { orderBy: { createdAt: 'asc' } } }
            });
            if (!thread) return NextResponse.json({ message: 'Thread not found' }, { status: 404 });
            
            // Security check
            if (user.role === 'user' && thread.userId !== user.id) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
            }
            return NextResponse.json({ messages: thread.messages });
        }

        // Return threads based on role
        if (user.role === 'user') {
            if (!department) return NextResponse.json({ message: 'Department required' }, { status: 400 });
            
            // For a citizen, they only have 1 main thread per department (general chat).
            let thread = await prisma.chatThread.findFirst({
                where: { userId: user.id as string, department, complaintId: null },
                include: { messages: { orderBy: { createdAt: 'asc' } } }
            });

            // Auto-create if doesn't exist
            if (!thread) {
                thread = await prisma.chatThread.create({
                    data: {
                        userId: user.id as string,
                        department,
                        complaintId: null
                    },
                    include: { messages: true }
                });
            }
            return NextResponse.json({ threadId: thread.id, messages: thread.messages });
        } else {
            // For authorities (Municipal/Traffic)
            // Return all threads for their department, including latest message and user details
            const threads = await prisma.chatThread.findMany({
                where: { department: user.role as string },
                include: {
                    messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                },
                orderBy: { updatedAt: 'desc' }
            });
            
            // Fetch user info for each thread manually since we don't have relation defined in prisma for userId -> User
            // Wait, we do have user model. But ChatThread userId is just a string, no relation.
            const userIds = [...new Set(threads.map(t => t.userId))];
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, fullName: true, email: true }
            });
            const userMap = new Map(users.map(u => [u.id, u]));

            const enrichedThreads = threads.map(t => ({
                ...t,
                user: userMap.get(t.userId) || { fullName: 'Unknown User' }
            }));

            return NextResponse.json({ threads: enrichedThreads });
        }
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUser();
        if (!user || !user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { threadId, text } = body;

        if (!threadId || !text) {
            return NextResponse.json({ message: 'Missing threadId or text' }, { status: 400 });
        }

        const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
        if (!thread) {
            return NextResponse.json({ message: 'Thread not found' }, { status: 404 });
        }

        // Security check
        if (user.role === 'user' && thread.userId !== user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const message = await prisma.chatMessage.create({
            data: {
                threadId,
                senderId: user.id as string,
                senderRole: user.role as string,
                text
            }
        });

        // Update thread's updatedAt to bubble it up in the inbox
        await prisma.chatThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
