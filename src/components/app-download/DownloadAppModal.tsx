'use client';

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Download, Smartphone, X } from 'lucide-react';

interface DownloadAppModalProps {
    open: boolean;
    onClose: () => void;
}

// The browser's beforeinstallprompt event (not in the TS DOM lib).
type InstallPromptEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };

const APP_LINK = 'https://sadaksathi.ai/app';

export default function DownloadAppModal({ open, onClose }: DownloadAppModalProps) {
    const [pwaPrompt, setPwaPrompt] = useState<InstallPromptEvent | null>(null);
    const [copied, setCopied] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Capture PWA install prompt
    useEffect(() => {
        const handler = (e: Event) => { e.preventDefault(); setPwaPrompt(e as InstallPromptEvent); };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // ESC to close
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const handlePwaInstall = async () => {
        if (!pwaPrompt) { toast('Open this site in Chrome or Edge on Android to install it.'); return; }
        pwaPrompt.prompt();
        const { outcome } = await pwaPrompt.userChoice;
        if (outcome === 'accepted') { toast.success('App installed'); setPwaPrompt(null); onClose(); }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(APP_LINK);
            setCopied(true);
            toast.success('Link copied');
            setTimeout(() => setCopied(false), 2000);
        } catch { toast.error('Could not copy the link. Select it and copy it by hand.'); }
    };

    const handleEmail = () => {
        window.open(`mailto:?subject=Download SadakSathi&body=Get the app here: ${APP_LINK}`, '_blank');
    };

    if (!open) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-asphalt/60 overscroll-contain"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="download-app-title"
                className="animate-pop bg-surface rounded-xl shadow-medium w-full max-w-lg overflow-hidden border border-border-light"
            >
                {/* Header */}
                <div className="road-glow flex items-start justify-between px-6 pt-6 pb-4 border-b border-border-light">
                    <div className="flex items-start gap-3">
                        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-sign-green text-white shadow-[inset_0_0_0_2px_var(--color-sign-green),inset_0_0_0_3.5px_#fff]"><Smartphone className="size-5" /></span>
                        <div>
                            <h2 id="download-app-title" className="font-heading font-normal tracking-tighter text-xl">Get the SadakSathi app</h2>
                            <p className="mt-1 text-sm text-text-secondary">
                                Report road problems and check traffic footage from your phone.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="ml-4 size-11 flex items-center justify-center rounded-lg text-text-secondary hover:bg-neutral-surface hover:text-text-primary transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* Android + iOS row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Android */}
                        <div className="rounded-lg p-4 flex flex-col gap-3 border border-border-light bg-surface elevated lift">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-sign-green" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C14.15 1.23 13.11 1 12 1s-2.15.23-3.14.63L7.38.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                                </svg>
                                <span className="font-bold">Android</span>
                            </div>
                            <a
                                href="/sadaksathi-app.apk"
                                download="sadaksathi-app.apk"
                                className="w-full inline-flex min-h-11 items-center justify-center gap-2 bg-text-primary hover:opacity-90 text-neutral-background text-sm font-semibold rounded-lg transition-colors"
                            >
                                <Download className="size-4" aria-hidden="true" /> Download APK
                            </a>
                            <p className="text-xs text-text-secondary">Needs Android 8 or newer</p>
                        </div>

                        {/* iOS */}
                        <div className="rounded-lg p-4 flex flex-col gap-3 border border-border-light bg-neutral-surface">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                </svg>
                                <span className="font-bold">iPhone</span>
                                <span className="text-xs font-semibold bg-hazard/15 text-hazard-ink px-1.5 py-0.5 rounded">Coming soon</span>
                            </div>
                            <button
                                type="button"
                                disabled
                                className="w-full min-h-11 text-center bg-surface border border-border-light text-text-secondary text-sm font-semibold rounded-lg cursor-not-allowed"
                            >
                                App Store
                            </button>
                            <p className="text-xs text-text-secondary">Not on the App Store yet</p>
                        </div>
                    </div>

                    {/* PWA Install */}
                    <div className="flex items-center justify-between gap-4 rounded-lg p-4 bg-neutral-surface">
                        <div>
                            <div className="font-bold text-sm mb-0.5">Install the web app</div>
                            <div className="text-sm text-text-secondary">Add SadakSathi to your home screen</div>
                        </div>
                        <button
                            type="button"
                            onClick={handlePwaInstall}
                            className="flex-shrink-0 min-h-11 px-4 bg-surface border border-border-light hover:border-text-secondary text-text-primary text-sm font-semibold rounded-lg transition-colors"
                        >
                            Install
                        </button>
                    </div>

                    {/* Share link */}
                    <div>
                        <div className="text-sm font-semibold text-text-secondary mb-2">Share the download link</div>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2">
                            <div className="flex-1 min-w-0 flex items-center px-3 py-2.5 bg-neutral-surface border border-border-light rounded-lg text-sm text-text-secondary overflow-hidden">
                                <span className="truncate">{APP_LINK}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className={`flex-shrink-0 inline-flex min-h-11 items-center gap-1 px-3 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${copied ? 'border-sign-green text-sign-green bg-sign-green/10' : 'border-border-light hover:border-text-secondary'}`}
                            >
                                {copied ? <><Check className="w-4 h-4" aria-hidden="true" /> Copied</> : 'Copy'}
                            </button>
                            <button
                                type="button"
                                onClick={handleEmail}
                                className="flex-shrink-0 min-h-11 px-3 py-2.5 text-sm font-semibold rounded-lg border border-border-light hover:border-text-secondary transition-colors"
                            >
                                Email
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
