'use client';

import React, { useEffect, useState, useRef } from 'react';

interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderRole: string;
    createdAt: string;
}

interface ChatModalProps {
    complaintId: string;
    onClose: () => void;
}

export default function ChatModal({ complaintId, onClose }: ChatModalProps) {
    const [threadId, setThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // On mount: fetch or auto-create the complaint thread
    useEffect(() => {
        const initThread = async () => {
            try {
                const res = await fetch(`/api/chat?complaintId=${complaintId}`);
                if (!res.ok) {
                    const data = await res.json();
                    setError(data.message || 'Failed to load chat.');
                    return;
                }
                const data = await res.json();
                setThreadId(data.threadId);
                setMessages(data.messages || []);
            } catch {
                setError('Failed to connect to chat server.');
            } finally {
                setLoading(false);
            }
        };
        initThread();
    }, [complaintId]);

    // 3-second polling for new messages
    useEffect(() => {
        if (!threadId) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/chat?threadId=${threadId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch {
                // Silent polling failure — don't disrupt UI
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [threadId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when ready
    useEffect(() => {
        if (!loading && threadId) {
            inputRef.current?.focus();
        }
    }, [loading, threadId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !threadId || sending) return;

        const text = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId, text }),
            });
            if (!res.ok) throw new Error('Send failed');
            const data = await res.json();
            // Optimistically append
            setMessages(prev => [...prev, data.message]);
        } catch {
            setInputText(text); // Restore on failure
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
                style={{ height: '520px' }}>

                {/* Header */}
                <div className="px-5 py-4 border-b border-border-light bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-sm leading-tight">Chat with Authority</h3>
                            <p className="text-[11px] text-text-secondary font-mono">
                                Complaint #{complaintId.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-neutral-surface"
                        aria-label="Close chat"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50/60">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
                            <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs">Connecting to chat…</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-red-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-text-secondary">
                            <div className="text-4xl">💬</div>
                            <p className="text-sm font-medium">No messages yet</p>
                            <p className="text-xs">Be the first to send a message about this complaint.</p>
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isMe = m.senderRole !== 'municipal' && m.senderRole !== 'traffic';
                            return (
                                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${isMe
                                        ? 'bg-brand-primary text-text-primary rounded-br-sm'
                                        : 'bg-white border border-border-light text-text-primary rounded-bl-sm shadow-sm'
                                        }`}>
                                        {!isMe && (
                                            <p className="text-[10px] font-bold text-brand-primary mb-1 uppercase tracking-wide">
                                                Authority
                                            </p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                                        <p className={`text-[10px] mt-1.5 ${isMe ? 'text-text-primary/60' : 'text-text-secondary'} text-right`}>
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border-light bg-white shrink-0">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={threadId ? 'Type a message…' : 'Connecting…'}
                            disabled={!threadId || sending || loading}
                            className="flex-grow px-4 py-2.5 bg-neutral-surface border border-border-light rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm disabled:opacity-60"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || !threadId || sending || loading}
                            className="px-4 py-2.5 bg-text-primary text-white font-bold rounded-xl hover:bg-text-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
