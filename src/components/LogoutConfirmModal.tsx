'use client';

import React, { useEffect, useRef } from 'react';
import { LogOut } from 'lucide-react';

interface LogoutConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Focus the safe choice and let Escape back out, like every other dialog on the site.
    useEffect(() => {
        if (!isOpen) return;
        cancelRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-asphalt/60 p-4 overscroll-contain"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-desc" className="animate-pop bg-surface rounded-xl p-6 sm:p-8 max-w-sm w-full shadow-medium border border-border-light">
                <div className="w-12 h-12 bg-signal-red text-white rounded-lg flex items-center justify-center mb-5 shadow-[inset_0_0_0_2px_var(--color-signal-red),inset_0_0_0_3.5px_#fff]">
                    <LogOut className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 id="logout-title" className="text-xl font-heading font-normal tracking-tighter mb-2">Log out?</h3>
                <p id="logout-desc" className="text-text-secondary mb-8">
                    This logs you out on all your devices. You&apos;ll need to log in again to see your reports.
                </p>
                <div className="flex gap-3">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onClose}
                        className="flex-1 min-h-12 py-3 px-4 bg-surface border border-border-light text-text-primary font-bold rounded-lg hover:bg-neutral-surface hover:border-border-dark transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 min-h-12 py-3 px-4 bg-signal-red text-white font-bold rounded-lg hover:bg-signal-red/90 transition-colors"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
}
