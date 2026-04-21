'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

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
        } catch (error: any) {
            console.error('Fetch chat error:', error);
            toast.error(error.message || 'Failed to connect to chat');
        } finally {
            setLoading(false);
        }
    };

    // Initial load and tab switch
    useEffect(() => {
        setLoading(true);
        setThreadId(null);
        setMessages([]);
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
            toast.error('Chat connection not established. Please refresh or restart your server.');
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
        } catch (error) {
            toast.error('Failed to send message');
            setInputText(text); // restore
        } finally {
            setSending(false);
        }
    };

    if (!user) return null;

    return (
        <>
            <Toaster position="top-center" />
            <AppHeader dashboardMode />
            <main className="flex-grow pt-16 h-screen flex flex-col bg-neutral-surface">
                <div className="flex-grow flex max-w-7xl w-full mx-auto p-4 lg:p-8 gap-6 h-full overflow-hidden">
                    
                    {/* Sidebar navigation can go here if needed, or we just rely on AppHeader and Back button */}
                    <div className="w-full flex flex-col bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-surface/50">
                            <div>
                                <h1 className="text-2xl font-heading font-bold flex items-center gap-3">
                                    <Link href="/dashboard" className="text-text-secondary hover:text-brand-primary transition-colors" title="Back to Dashboard">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                    </Link>
                                    Support Chat
                                </h1>
                                <p className="text-xs text-text-secondary mt-1">Direct communication with municipal and traffic authorities.</p>
                            </div>
                            
                            {/* Department Toggle */}
                            <div className="flex bg-neutral-surface p-1 rounded-lg border border-border-light">
                                <button
                                    onClick={() => setActiveDepartment('municipal')}
                                    className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeDepartment === 'municipal' ? 'bg-white shadow-sm text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    🏛️ Municipal
                                </button>
                                <button
                                    onClick={() => setActiveDepartment('traffic')}
                                    className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeDepartment === 'traffic' ? 'bg-white shadow-sm text-brand-primary' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    🚦 Traffic
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-grow overflow-y-auto p-6 bg-gray-50/50">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                                    <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-3" />
                                    <p className="text-sm">Connecting to {activeDepartment === 'municipal' ? 'Municipal' : 'Traffic'} desk...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-text-secondary text-center">
                                    <div className="text-5xl mb-4">👋</div>
                                    <p className="text-sm max-w-sm">No messages yet. Send a message to start a conversation with the {activeDepartment === 'municipal' ? 'Municipal' : 'Traffic'} Authority.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((m) => {
                                        const isMe = m.senderId === user.id;
                                        return (
                                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${isMe ? 'bg-brand-primary text-text-primary rounded-br-sm' : 'bg-white border border-border-light text-text-primary rounded-bl-sm shadow-sm'}`}>
                                                    {!isMe && <div className="text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wider">{activeDepartment} Authority</div>}
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                                                    <div className={`text-[10px] mt-2 ${isMe ? 'text-text-primary/70' : 'text-text-secondary'} text-right`}>
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

                        {/* Input Area */}
                        <div className="p-4 border-t border-border-light bg-white">
                            <form onSubmit={handleSend} className="flex gap-3">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="flex-grow px-4 py-3 bg-neutral-surface border border-border-light rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm"
                                    disabled={loading || sending}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || loading || sending}
                                    className="px-6 py-3 bg-text-primary text-white font-bold rounded-xl hover:bg-text-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <span>Send</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </main>
        </>
    );
}
