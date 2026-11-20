'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import AppHeader from '@/components/AppHeader';
import { ArrowLeft, Landmark, Loader2, MessageSquare, Send, TrafficCone } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserPayload {
    id: string;
    fullName?: string;
    email?: string;
    role?: string;
}

interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderRole: string;
    createdAt: string;
}

export default function UserChatPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserPayload | null>(null);
    const [activeDepartment, setActiveDepartment] = useState<'municipal' | 'traffic'>('municipal');
    
    const [threadId, setThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auth check
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) { router.push('/auth'); return; }
                const data = await res.json();
                setUser(data.user);
            } catch {
                router.push('/auth');
            }
        })();
    }, [router]);

    // Fetch thread and messages
    const fetchChat = async (department: string) => {
        try {
            const res = await fetch(`/api/chat?department=${department}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${res.status}`);
            }
            const data = await res.json();
            setThreadId(data.threadId);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Fetch chat error:', error);
            toast.error((error instanceof Error && error.message) || 'Chat did not load. Refresh the page to try again.');
        } finally {
            setLoading(false);
        }
    };

    // Initial load and tab switch (the switch itself resets the view in the tab's click handler)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch; state is only set after the await
        if (user) fetchChat(activeDepartment);
    }, [activeDepartment, user]);

    // Polling every 3 seconds
    useEffect(() => {
        if (!threadId) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/chat?threadId=${threadId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (e) {
                console.error(e);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [threadId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        
        if (!threadId) {
            toast.error('Chat is not connected yet. Refresh the page and try again.');
            return;
        }
        
        const text = inputText;
        setInputText('');
        setSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId, text }),
            });
            if (!res.ok) throw new Error('Failed to send');
            const data = await res.json();
            setMessages((prev) => [...prev, data.message]);
        } catch {
            toast.error('Message not sent. Check your connection and try again.');
            setInputText(text); // restore
        } finally {
            setSending(false);
        }
    };

    if (!user) return null;

    const deptName = activeDepartment === 'municipal' ? 'Municipal' : 'Traffic';

    return (
        <>
            <Toaster position="top-center" />
            <AppHeader />
            <main id="main-content" className="flex-grow pt-16 h-screen flex flex-col bg-neutral-surface">
                <div className="flex-grow flex max-w-5xl w-full mx-auto p-4 lg:p-8 h-full overflow-hidden">
                    <div className="w-full flex flex-col bg-surface rounded-xl border border-border-light elevated overflow-hidden">

                        {/* Header */}
                        <div className="road-glow relative px-4 sm:px-6 pt-4 pb-5 border-b border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-start gap-3">
                                <Link href="/dashboard" aria-label="Back to dashboard" className="w-11 h-11 -ml-2 grid place-items-center flex-shrink-0 rounded-lg text-text-secondary hover:text-sign-green transition-colors">
                                    <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-heading font-normal tracking-tighter">Support chat</h1>
                                    <p className="text-sm text-text-secondary mt-0.5">Message the municipal or traffic department directly.</p>
                                </div>
                            </div>

                            {/* Department toggle */}
                            <div className="flex w-full sm:w-auto bg-neutral-surface p-1 rounded-lg border border-border-light" role="group" aria-label="Department">
                                {([
                                    { id: 'municipal', label: 'Municipal', icon: Landmark },
                                    { id: 'traffic', label: 'Traffic', icon: TrafficCone },
                                ] as const).map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => {
                                            if (id === activeDepartment) return;
                                            setLoading(true);
                                            setThreadId(null);
                                            setMessages([]);
                                            setActiveDepartment(id);
                                        }}
                                        aria-pressed={activeDepartment === id}
                                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-10 px-4 text-sm font-bold rounded-md transition-colors ${activeDepartment === id ? 'bg-surface shadow-soft text-sign-green' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        <Icon className="w-4 h-4" aria-hidden="true" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat area */}
                        <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-neutral-surface" aria-live="polite">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-3 text-text-secondary">
                                    <Loader2 className="w-6 h-6 animate-spin text-sign-green" aria-hidden="true" />
                                    <p className="text-sm">Connecting to the {deptName.toLowerCase()} department…</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-2 text-text-secondary text-center px-4">
                                    <span className="w-14 h-14 rounded-2xl grid place-items-center bg-sign-green/10 text-sign-green mb-1"><MessageSquare className="w-7 h-7" aria-hidden="true" /></span>
                                    <p className="text-sm font-semibold text-text-primary">No messages yet</p>
                                    <p className="text-sm max-w-sm">Write below to start a conversation with the {deptName.toLowerCase()} department.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((m) => {
                                        const isMe = m.senderId === user.id;
                                        return (
                                            <div key={m.id} className={`animate-rise flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-2.5 ${isMe ? 'bg-text-primary text-neutral-background rounded-br-sm' : 'bg-surface border border-border-light text-text-primary rounded-bl-sm'}`}>
                                                    {!isMe && <div className="text-xs font-semibold text-sign-green mb-1">{deptName} department</div>}
                                                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                                                    <div className={`text-xs mt-1.5 ${isMe ? 'text-white/80' : 'text-text-secondary'} text-right`}>
                                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input area */}
                        <div className="p-3 sm:p-4 border-t border-border-light bg-surface">
                            <form onSubmit={handleSend} className="flex gap-2 sm:gap-3">
                                <label htmlFor="support-chat-input" className="sr-only">Message to the {deptName.toLowerCase()} department</label>
                                <input
                                    id="support-chat-input"
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Write a message"
                                    className="min-w-0 flex-grow min-h-11 px-4 bg-surface border border-border-light rounded-lg focus:outline-none focus:border-sign-green text-sm disabled:bg-neutral-surface"
                                    disabled={loading || sending}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || loading || sending}
                                    className="min-h-11 px-4 sm:px-5 bg-text-primary text-neutral-background font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
                                    <span className="hidden sm:inline">Send</span>
                                    <span className="sr-only sm:hidden">Send</span>
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </main>
        </>
    );
}
