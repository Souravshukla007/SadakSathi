'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import AppHeader from '@/components/AppHeader';

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
}

export default function TrafficChatPage() {
    const router = useRouter();
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
        } catch (error) {
            toast.error('Failed to send message');
            setInputText(text);
        } finally {
            setSending(false);
        }
    };

    const activeThread = threads.find(t => t.id === activeThreadId);

    return (
        <>
            <Toaster position="top-center" />
            <AppHeader dashboardMode />
            <main className="flex-grow pt-16 h-screen flex flex-col bg-neutral-surface">
                <div className="flex-grow flex w-full h-full overflow-hidden">
                    
                    {/* Sidebar / Threads List */}
                    <div className="w-80 bg-white border-r border-border-light flex flex-col h-full z-10 shadow-soft">
                        <div className="p-4 border-b border-border-light flex items-center justify-between">
                            <h2 className="font-heading font-bold flex items-center gap-2">
                                <Link href="/dashboard/traffic" className="text-text-secondary hover:text-brand-primary">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                </Link>
                                Traffic Inbox
                            </h2>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-xs text-text-secondary">Loading chats...</div>
                            ) : threads.length === 0 ? (
                                <div className="p-4 text-center text-xs text-text-secondary">No conversations yet.</div>
                            ) : (
                                <div className="divide-y divide-border-light">
                                    {threads.map(thread => (
                                        <button
                                            key={thread.id}
                                            onClick={() => setActiveThreadId(thread.id)}
                                            className={`w-full text-left p-4 hover:bg-neutral-surface transition-colors ${activeThreadId === thread.id ? 'bg-brand-primary/10 border-l-4 border-brand-primary' : 'border-l-4 border-transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="font-bold text-sm truncate">{thread.user.fullName}</div>
                                                <div className="text-[10px] text-text-secondary">
                                                    {new Date(thread.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div className="text-xs text-text-secondary truncate">
                                                {thread.messages?.[0]?.text || 'No messages'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-grow flex flex-col bg-gray-50/50 h-full relative">
                        {activeThreadId ? (
                            <>
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-border-light bg-white flex items-center gap-4 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-bold text-text-primary">
                                        {activeThread?.user.fullName.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{activeThread?.user.fullName}</h3>
                                        <p className="text-xs text-text-secondary">{activeThread?.user.email}</p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                                    {messages.map((m) => {
                                        const isMe = m.senderRole === 'traffic';
                                        return (
                                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${isMe ? 'bg-brand-primary text-text-primary rounded-br-sm' : 'bg-white border border-border-light text-text-primary rounded-bl-sm shadow-sm'}`}>
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

                                {/* Input */}
                                <div className="p-4 border-t border-border-light bg-white">
                                    <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Type your response..."
                                            className="flex-grow px-4 py-3 bg-neutral-surface border border-border-light rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm"
                                            disabled={sending}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputText.trim() || sending}
                                            className="px-6 py-3 bg-text-primary text-white font-bold rounded-xl hover:bg-text-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <span>Send</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-text-secondary">
                                <div className="text-6xl mb-4">💬</div>
                                <h3 className="font-heading font-bold text-lg mb-2">Traffic Citizen Inbox</h3>
                                <p className="text-sm">Select a conversation from the sidebar to start chatting.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
