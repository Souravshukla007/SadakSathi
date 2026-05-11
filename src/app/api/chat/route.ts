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
        const complaintId = url.searchParams.get('complaintId');

        // If threadId is provided, just return the messages for that thread
        if (threadId) {
            const thread = await prisma.chatThread.findUnique({
                where: { id: threadId },
                include: { messages: { orderBy: { createdAt: 'asc' } } }
            });
            if (!thread) return NextResponse.json({ message: 'Thread not found' }, { status: 404 });

            // Security check
            if (user.role !== 'municipal' && user.role !== 'traffic' && thread.userId !== user.id) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
            }
            return NextResponse.json({ messages: thread.messages });
        }

        // --- CITIZEN: complaint-specific thread ---
        if (complaintId && user.role !== 'municipal' && user.role !== 'traffic') {
            // Verify the citizen owns this complaint
            const complaint = await prisma.complaint.findUnique({
                where: { id: complaintId },
                select: { id: true, userId: true, issueType: true }
            });
            if (!complaint) {
                return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
            }
            if (complaint.userId !== (user.id as string)) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
            }

            // Find or create a thread scoped to this complaint
            let thread = await prisma.chatThread.findFirst({
                where: { userId: user.id as string, complaintId },
                include: { messages: { orderBy: { createdAt: 'asc' } } }
            });

            if (!thread) {
                thread = await prisma.chatThread.create({
                    data: {
                        userId: user.id as string,
                        department: 'municipal',
                        complaintId
                    },
                    include: { messages: true }
                });
            }

            return NextResponse.json({
                threadId: thread.id,
                messages: thread.messages,
                complaint: { id: complaint.id, issueType: complaint.issueType }
            });
        }

        // Return threads based on role
        if (user.role !== 'municipal' && user.role !== 'traffic') {
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

            // Fetch user info for each thread
            const userIds = [...new Set(threads.map(t => t.userId))];
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, fullName: true, email: true }
            });
            const userMap = new Map(users.map(u => [u.id, u]));

            // Fetch complaint info for threads that have a complaintId
            const complaintIds = threads
                .map(t => t.complaintId)
                .filter((id): id is string => id !== null);

            const complaints = complaintIds.length > 0
                ? await prisma.complaint.findMany({
                    where: { id: { in: complaintIds } },
                    select: { id: true, issueType: true }
                })
                : [];
            const complaintMap = new Map(complaints.map(c => [c.id, c]));

            const enrichedThreads = threads.map(t => ({
                ...t,
                user: userMap.get(t.userId) || { fullName: 'Unknown User', email: '' },
                complaint: t.complaintId ? (complaintMap.get(t.complaintId) ?? null) : null
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
        if (user.role !== 'municipal' && user.role !== 'traffic' && thread.userId !== user.id) {
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
