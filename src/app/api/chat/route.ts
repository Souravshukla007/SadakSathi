import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, type SessionUser } from '@/lib/session';
import { TRAFFIC_ISSUE_TYPES } from '@/lib/traffic';

const DEPARTMENTS = ['municipal', 'traffic'];
const MAX_MESSAGE_LENGTH = 2000;

// Authorities only see their own department's threads; admin sees all; citizens only their own threads.
function canAccessThread(user: SessionUser, thread: { userId: string; department: string }) {
    if (user.role === 'admin') return true;
    if (user.role === 'municipal' || user.role === 'traffic') return thread.department === user.role;
    return thread.userId === user.id;
}

const isStaff = (role: string) => role === 'municipal' || role === 'traffic' || role === 'admin';

export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) {
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
            if (!canAccessThread(user, thread)) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
            }
            return NextResponse.json({ messages: thread.messages });
        }

        // --- CITIZEN: complaint-specific thread ---
        if (complaintId && !isStaff(user.role)) {
            // Verify the citizen owns this complaint
            const complaint = await prisma.complaint.findUnique({
                where: { id: complaintId },
                select: { id: true, userId: true, issueType: true }
            });
            if (!complaint) {
                return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
            }
            if (complaint.userId !== (user.id)) {
                return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
            }

            // Find or create a thread scoped to this complaint
            let thread = await prisma.chatThread.findFirst({
                where: { userId: user.id, complaintId }, orderBy: { createdAt: 'asc' }, // oldest wins if two were ever created
                include: { messages: { orderBy: { createdAt: 'asc' } } }
            });

            if (!thread) {
                thread = await prisma.chatThread.create({
                    data: {
                        userId: user.id,
                        department: TRAFFIC_ISSUE_TYPES.includes(complaint.issueType) ? 'traffic' : 'municipal', // the desk that handles this report
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
        if (!isStaff(user.role)) {
            if (!department || !DEPARTMENTS.includes(department)) {
                return NextResponse.json({ message: 'department must be municipal or traffic' }, { status: 400 });
            }

            // For a citizen, they only have 1 main thread per department (general chat).
            let thread = await prisma.chatThread.findFirst({
                where: { userId: user.id, department, complaintId: null }, orderBy: { createdAt: 'asc' },
                include: { messages: { orderBy: { createdAt: 'asc' } } }
            });

            // Auto-create if doesn't exist
            if (!thread) {
                thread = await prisma.chatThread.create({
                    data: {
                        userId: user.id,
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
                where: user.role === 'admin' ? {} : { department: user.role },
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
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { threadId, text } = body;

        if (!threadId || !text) {
            return NextResponse.json({ message: 'Missing threadId or text' }, { status: 400 });
        }
        if (typeof text !== 'string' || text.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json({ message: `text must be a string of at most ${MAX_MESSAGE_LENGTH} characters` }, { status: 400 });
        }

        const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
        if (!thread) {
            return NextResponse.json({ message: 'Thread not found' }, { status: 404 });
        }

        // Security check
        if (!canAccessThread(user, thread)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const message = await prisma.chatMessage.create({
            data: {
                threadId,
                senderId: user.id,
                senderRole: user.role,
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
