'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import AppHeader from '@/components/AppHeader';
import StaffNav from '@/components/traffic/StaffNav';
import { ArrowLeft, FileText, LoaderCircle, Search, Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderRole: string;
    createdAt: string;
}

interface ChatThread {
    id: string;
    userId: string;
    department: string;
    user: { fullName: string; email: string };
    messages: ChatMessage[];
    updatedAt: string;
    complaintId?: string | null;
    complaint?: { id: string; issueType: string } | null;
}

interface StaffChatProps {
    desk: 'municipal' | 'traffic';
    /** Where the linked-complaint chip in the conversation header points. */
    complaintHref: (complaintId: string) => string;
}

const initials = (name?: string) =>
    (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U';

/** Two speech bubbles over a road with a lane line: the empty conversation pane. */
function ChatIllustration() {
    return (
        <svg viewBox="0 0 200 140" className="h-36 w-auto" aria-hidden="true">
            <rect x="0" y="104" width="200" height="30" rx="6" className="fill-neutral-surface" />
            <g className="text-hazard">
                {[12, 56, 100, 144].map((x) => <rect key={x} x={x} y="117" width="28" height="4" rx="2" fill="currentColor" />)}
            </g>
            <g className="text-sign-green animate-rise">
                <rect x="28" y="20" width="96" height="52" rx="12" fill="currentColor" />
                <path d="M48 72 L44 88 L64 72 Z" fill="currentColor" />
            </g>
            <g className="fill-surface">
                <rect x="44" y="36" width="60" height="6" rx="3" />
                <rect x="44" y="50" width="40" height="6" rx="3" />
            </g>
            <g className="animate-rise" style={{ animationDelay: '150ms' }}>
                <path d="M152 88 L160 104 L140 88 Z" className="fill-surface stroke-border-dark" strokeWidth="2" strokeLinejoin="round" />
                <rect x="96" y="48" width="80" height="44" rx="12" className="fill-surface stroke-border-dark" strokeWidth="2" />
                <circle cx="120" cy="70" r="4" className="fill-text-secondary" />
                <circle cx="136" cy="70" r="4" className="fill-text-secondary" />
                <circle cx="152" cy="70" r="4" className="fill-text-secondary" />
            </g>
        </svg>
    );
}

export default function StaffChat({ desk, complaintHref }: StaffChatProps) {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load threads
    useEffect(() => {
        const fetchThreads = async () => {
            try {
                const res = await fetch('/api/chat');
                if (res.ok) {
                    const data = await res.json();
                    setThreads(data.threads || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchThreads();
    }, []);

    // Polling threads list and active thread messages
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                // Refresh threads
                const resThreads = await fetch('/api/chat');
                if (resThreads.ok) {
                    const data = await resThreads.json();
                    setThreads(data.threads || []);
                }
                // Refresh active thread messages
                if (activeThreadId) {
                    const resMsg = await fetch(`/api/chat?threadId=${activeThreadId}`);
                    if (resMsg.ok) {
                        const data = await resMsg.json();
                        setMessages(data.messages || []);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeThreadId]);

    // When clicking a thread, fetch its full messages immediately
    useEffect(() => {
        if (!activeThreadId) return;
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/chat?threadId=${activeThreadId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchMessages();
    }, [activeThreadId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !activeThreadId) return;
        
        const text = inputText;
        setInputText('');
        setSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId: activeThreadId, text }),
            });
            if (!res.ok) throw new Error('Failed to send');
            const data = await res.json();
            setMessages((prev) => [...prev, data.message]);
        } catch {
            toast.error('Message not sent. Check your connection and try again.');
            setInputText(text);
        } finally {
            setSending(false);
        }
    };

    const activeThread = threads.find(t => t.id === activeThreadId);

    const shortRef = (id: string) => id.slice(-6).toUpperCase();
    const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const deskLabel = desk === 'municipal' ? 'municipal' : 'traffic';

    return (
        <>
            <Toaster position="top-center" />
            <AppHeader dashboardMode />
            <main id="main-content" className="flex-grow pt-16 h-screen flex flex-col bg-neutral-surface lg:pl-64">
                <StaffNav desk={desk} />
                <div className="flex min-h-0 w-full flex-1 overflow-hidden">

                    {/* Conversation list */}
                    <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} w-full flex-shrink-0 flex-col border-r border-border-light bg-surface md:w-80`}>
                        <div className="road-glow flex items-center justify-between gap-2 border-b border-border-light px-4 py-4">
                            <div className="min-w-0">
                                <h1 className="font-heading text-lg font-normal tracking-tighter">Citizen chats</h1>
                                <p className="text-xs text-text-secondary">{loading ? 'Loading…' : `${threads.length} conversation${threads.length === 1 ? '' : 's'}`}</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sign-green/10 px-2.5 py-1 text-xs font-semibold text-sign-green">
                                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                                Live
                            </span>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {loading ? (
                                <ul className="divide-y divide-border-light" aria-label="Loading conversations">
                                    {[0, 1, 2, 3].map((i) => (
                                        <li key={i} className="flex animate-pulse gap-3 px-4 py-3" aria-hidden="true">
                                            <span className="h-10 w-10 flex-shrink-0 rounded-full bg-neutral-surface" />
                                            <span className="flex-1 space-y-2 py-1">
                                                <span className="block h-3 w-2/3 rounded bg-neutral-surface" />
                                                <span className="block h-3 w-full rounded bg-neutral-surface" />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : threads.length === 0 ? (
                                <div className="flex flex-col items-center p-6 text-center">
                                    <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-surface text-text-secondary" aria-hidden="true">
                                        <Search className="h-5 w-5" />
                                    </span>
                                    <p className="text-sm text-text-secondary">No conversations yet. Messages citizens send to the {deskLabel} desk appear here.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-border-light">
                                    {threads.map(thread => {
                                        const isActive = activeThreadId === thread.id;
                                        return (
                                            <li key={thread.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveThreadId(thread.id)}
                                                    aria-current={isActive ? 'true' : undefined}
                                                    className={`flex w-full gap-3 border-l-4 px-4 py-3 text-left transition-colors duration-200 ${isActive ? 'border-sign-green bg-sign-green/10' : 'border-transparent hover:bg-neutral-surface'}`}
                                                >
                                                    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${isActive ? 'bg-text-primary text-neutral-background' : 'bg-sign-green/10 text-sign-green'}`} aria-hidden="true">
                                                        {initials(thread.user.fullName)}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="mb-0.5 flex items-baseline justify-between gap-2">
                                                            <span className="truncate text-sm font-bold">{thread.user.fullName}</span>
                                                            <span className="flex-shrink-0 text-xs tabular-nums text-text-secondary">{fmtTime(thread.updatedAt)}</span>
                                                        </span>
                                                        {thread.complaint && (
                                                            <span className="mb-0.5 flex items-center gap-1 text-xs text-hazard-ink">
                                                                <FileText className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                                                                <span className="truncate">{thread.complaint.issueType}</span>
                                                                <span className="font-mono">#{shortRef(thread.complaint.id)}</span>
                                                            </span>
                                                        )}
                                                        <span className="block truncate text-sm text-text-secondary">
                                                            {thread.messages?.[0]?.text || 'No messages yet'}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Conversation */}
                    <div className={`${activeThreadId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
                        {activeThreadId ? (
                            <>
                                <div className="elevated relative z-10 flex items-center gap-3 border-b border-border-light bg-surface px-3 py-3 sm:px-6">
                                    <button
                                        type="button"
                                        onClick={() => setActiveThreadId(null)}
                                        aria-label="Back to conversations"
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-neutral-surface hover:text-text-primary md:hidden"
                                    >
                                        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sign-green/10 text-sm font-bold text-sign-green ring-2 ring-sign-green/30" aria-hidden="true">
                                        {initials(activeThread?.user.fullName)}
                                    </div>
                                    <div className="min-w-0 flex-grow">
                                        <h2 className="truncate font-bold">{activeThread?.user.fullName}</h2>
                                        <p className="truncate text-xs text-text-secondary">{activeThread?.user.email}</p>
                                    </div>
                                    {activeThread?.complaint && (
                                        <Link
                                            href={complaintHref(activeThread.complaint.id)}
                                            className="flex min-h-11 flex-shrink-0 items-center gap-1.5 rounded-lg bg-hazard/15 px-3 text-xs font-semibold text-hazard-ink transition-colors hover:bg-hazard/25"
                                        >
                                            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                                            <span className="hidden sm:inline">{activeThread.complaint.issueType}</span>
                                            <span className="font-mono">#{shortRef(activeThread.complaint.id)}</span>
                                        </Link>
                                    )}
                                </div>

                                <div className="flex-grow space-y-3 overflow-y-auto p-4 sm:p-6">
                                    {messages.length === 0 && (
                                        <p className="py-10 text-center text-sm text-text-secondary">No messages in this conversation yet. Write the first reply below.</p>
                                    )}
                                    {messages.map((m, i) => {
                                        const isMe = m.senderRole === desk;
                                        // Show the avatar once per run of messages from the same side.
                                        const firstOfRun = i === 0 || (messages[i - 1].senderRole === desk) !== isMe;
                                        return (
                                            <div key={m.id} className={`flex items-end gap-2 animate-rise ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {!isMe && (
                                                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sign-green/10 text-xs font-bold text-sign-green ${firstOfRun ? '' : 'invisible'}`} aria-hidden="true">
                                                        {initials(activeThread?.user.fullName)}
                                                    </span>
                                                )}
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-soft sm:max-w-[65%] ${isMe ? 'rounded-br-md bg-text-primary text-neutral-background' : 'rounded-bl-md border border-border-light bg-surface text-text-primary'}`}>
                                                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.text}</p>
                                                    <div className={`mt-1 text-right text-xs tabular-nums ${isMe ? 'text-white/85' : 'text-text-secondary'}`}>
                                                        {fmtTime(m.createdAt)}
                                                    </div>
                                                </div>
                                                {isMe && (
                                                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-hazard text-xs font-bold text-asphalt ${firstOfRun ? '' : 'invisible'}`} aria-hidden="true">
                                                        {desk === 'municipal' ? 'M' : 'T'}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="border-t border-border-light bg-surface p-3 sm:p-4">
                                    <form onSubmit={handleSend} className="mx-auto flex max-w-4xl gap-2">
                                        <label htmlFor="chat-reply" className="sr-only">Reply to {activeThread?.user.fullName ?? 'citizen'}</label>
                                        <input
                                            id="chat-reply"
                                            type="text"
                                            autoComplete="off"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Write a reply…"
                                            className="min-h-11 min-w-0 flex-grow rounded-full border border-border-light bg-neutral-surface px-4 py-2.5 text-sm transition-colors focus:border-sign-green focus:bg-surface"
                                            disabled={sending}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputText.trim() || sending}
                                            className="flex min-h-11 flex-shrink-0 items-center gap-2 rounded-full bg-text-primary px-5 py-2.5 text-sm font-bold text-neutral-background shadow-soft transition-colors hover:opacity-90 disabled:opacity-50"
                                        >
                                            {sending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                                            Send
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="road-glow flex flex-grow flex-col items-center justify-center p-6 text-center">
                                <ChatIllustration />
                                <h2 className="mt-4 font-heading text-lg font-bold">Pick a conversation</h2>
                                <p className="mt-1 max-w-xs text-sm text-text-secondary">Choose a citizen from the list to read their messages and reply from the {deskLabel} desk.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
