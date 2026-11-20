'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ThumbsUp } from 'lucide-react';

interface VoteButtonProps {
    complaintId: string;
    initialCount: number;
    hasVoted: boolean;
}

export default function VoteButton({ complaintId, initialCount, hasVoted: initialHasVoted }: VoteButtonProps) {
    const [count, setCount] = useState(initialCount);
    const [hasVoted, setHasVoted] = useState(initialHasVoted);
    const [loading, setLoading] = useState(false);
    const [pops, setPops] = useState(0); // bumps on each vote so the icon replays its pop

    const handleVote = async () => {
        if (hasVoted || loading) return;
        setLoading(true);
        // Optimistic update
        setCount((prev) => prev + 1);
        setHasVoted(true);
        setPops((n) => n + 1);
        try {
            const res = await fetch('/api/complaints/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ complaintId }),
            });
            const data = await res.json();
            if (!res.ok) {
                // Rollback
                setCount((prev) => prev - 1);
                setHasVoted(false);
                toast.error(data.message || 'Upvote not saved. Try again.');
            } else {
                setCount(data.upvoteCount);
                toast.success('Upvoted');
            }
        } catch {
            setCount((prev) => prev - 1);
            setHasVoted(false);
            toast.error('Upvote not saved: no connection. Check your network and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleVote}
            disabled={hasVoted || loading}
            aria-pressed={hasVoted}
            aria-label={hasVoted ? `Upvoted, ${count} upvotes` : `Upvote this report, ${count} upvotes`}
            title={hasVoted ? 'You upvoted this report' : 'Upvote this report'}
            className={`inline-flex items-center gap-1.5 min-h-11 px-3 rounded-lg border text-sm font-bold transition-[color,background-color,border-color,transform] duration-200 active:scale-95 ${
                hasVoted
                    ? 'border-sign-green bg-sign-green/10 text-sign-green cursor-default'
                    : 'border-border-light text-text-secondary hover:border-sign-green hover:text-sign-green'
            }`}
        >
            <ThumbsUp key={pops} className={`w-4 h-4 ${pops ? 'animate-pop' : ''}`} fill={hasVoted ? 'currentColor' : 'none'} aria-hidden="true" />
            <span key={`n${pops}`} className={`tabular-nums ${pops ? 'animate-pop' : ''}`}>{count}</span>
        </button>
    );
}
