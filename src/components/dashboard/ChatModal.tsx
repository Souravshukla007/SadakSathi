'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CircleAlert, Loader2, MessageSquare, Send, X } from 'lucide-react';

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
                    setError(data.message || 'The chat for this report did not load.');
                    return;
                }
                const data = await res.json();
                setThreadId(data.threadId);
                setMessages(data.messages || []);
            } catch {
                setError('The chat server could not be reached.');
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
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-asphalt/60 p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="chat-modal-title"
                className="animate-rise bg-surface rounded-t-xl sm:rounded-xl shadow-medium w-full max-w-lg flex flex-col overflow-hidden h-[85vh] sm:h-[520px]"
            >

                {/* Header */}
                <div className="road-glow relative px-4 sm:px-5 py-3.5 border-b border-border-light flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-lg grid place-items-center bg-sign-green/10 text-sign-green flex-shrink-0"><MessageSquare className="w-5 h-5" aria-hidden="true" /></span>
                        <div className="min-w-0">
                            <h3 id="chat-modal-title" className="font-heading font-bold text-base leading-tight">Chat with the department</h3>
                            <p className="text-xs text-text-secondary">
                                Report <span className="font-mono">#{complaintId.slice(-8).toUpperCase()}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-11 h-11 -mr-2 grid place-items-center text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-neutral-surface"
                        aria-label="Close chat"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-neutral-surface" aria-live="polite">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
                            <Loader2 className="w-6 h-6 animate-spin text-sign-green" aria-hidden="true" />
                            <p className="text-sm">Opening chat…</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                            <CircleAlert className="w-7 h-7 text-signal-red" aria-hidden="true" />
                            <p className="text-sm font-semibold text-text-primary">Chat could not be opened</p>
                            <p className="text-sm text-text-secondary">{error} Close this window and try again.</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6 text-text-secondary">
                            <MessageSquare className="w-7 h-7" aria-hidden="true" />
                            <p className="text-sm font-semibold text-text-primary">No messages yet</p>
                            <p className="text-sm">Ask a question or add details about this report. The department replies here.</p>
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isMe = m.senderRole !== 'municipal' && m.senderRole !== 'traffic';
                            return (
                                <div key={m.id} className={`animate-rise flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] sm:max-w-[78%] rounded-xl px-3.5 py-2.5 ${isMe
                                        ? 'bg-text-primary text-neutral-background rounded-br-sm'
                                        : 'bg-surface border border-border-light text-text-primary rounded-bl-sm'
                                        }`}>
                                        {!isMe && (
                                            <p className="text-xs font-semibold text-sign-green mb-1">
                                                {m.senderRole === 'traffic' ? 'Traffic department' : 'Municipal department'}
                                            </p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                                        <p className={`text-xs mt-1.5 ${isMe ? 'text-white/80' : 'text-text-secondary'} text-right`}>
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
                <div className="p-3 border-t border-border-light bg-surface shrink-0">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <label htmlFor="chat-modal-input" className="sr-only">Message</label>
                        <input
                            id="chat-modal-input"
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={threadId ? 'Write a message' : 'Opening chat…'}
                            disabled={!threadId || sending || loading}
                            className="min-w-0 flex-grow min-h-11 px-3.5 bg-surface border border-border-light rounded-lg focus:outline-none focus:border-sign-green text-sm disabled:bg-neutral-surface"
                        />
                        <button
                            type="submit"
                            aria-label="Send message"
                            disabled={!inputText.trim() || !threadId || sending || loading}
                            className="min-h-11 min-w-11 px-3.5 bg-text-primary text-neutral-background font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-40 flex items-center justify-center"
                        >
                            {sending
                                ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                : <Send className="w-4 h-4" aria-hidden="true" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
