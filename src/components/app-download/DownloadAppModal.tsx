'use client';

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface DownloadAppModalProps {
    open: boolean;
    onClose: () => void;
}

const APP_LINK = 'https://sadaksathi.ai/app';

export default function DownloadAppModal({ open, onClose }: DownloadAppModalProps) {
    const [pwaPrompt, setPwaPrompt] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Capture PWA install prompt
    useEffect(() => {
        const handler = (e: Event) => { e.preventDefault(); setPwaPrompt(e); };
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
        if (!pwaPrompt) { toast('Open the site in Chrome / Edge on Android to install.', { icon: 'ℹ️' }); return; }
        pwaPrompt.prompt();
        const { outcome } = await pwaPrompt.userChoice;
        if (outcome === 'accepted') { toast.success('App installed!'); setPwaPrompt(null); onClose(); }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(APP_LINK);
            setCopied(true);
            toast.success('Link copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch { toast.error('Could not copy link.'); }
    };

    const handleEmail = () => {
        window.open(`mailto:?subject=Download SadakSathi&body=Get the app here: ${APP_LINK}`, '_blank');
    };

    if (!open) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>

            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                style={{ animation: 'scaleIn 0.2s ease-out' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border-light">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🛣️</span>
                            <h2 className="font-heading font-bold text-xl">Download the SadakSathi App</h2>
                        </div>
                        <p className="text-sm text-text-secondary">
                            Report road issues faster and monitor traffic violations directly from your phone.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="ml-4 w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-neutral-surface hover:text-text-primary transition-colors flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* Android + iOS row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Android */}
                        <div className="bg-neutral-surface rounded-xl p-4 flex flex-col gap-3 border border-border-light">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C14.15 1.23 13.11 1 12 1s-2.15.23-3.14.63L7.38.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                                    </svg>
                                </div>
                                <span className="text-sm font-bold">Android</span>
                            </div>
                            <a
                                href="/sadaksathi-app.apk"
                                download="sadaksathi-app.apk"
                                className="w-full text-center py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Download APK
                            </a>
                            <p className="text-[10px] text-text-secondary text-center">Requires Android 8+</p>
                        </div>

                        {/* iOS */}
                        <div className="bg-neutral-surface rounded-xl p-4 flex flex-col gap-3 border border-border-light">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                    </svg>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold">iOS</span>
                                    <span className="text-[9px] font-bold uppercase bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Soon</span>
                                </div>
                            </div>
                            <button
                                disabled
                                className="w-full text-center py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
                            >
                                App Store
                            </button>
                            <p className="text-[10px] text-text-secondary text-center">Coming soon to iOS</p>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex items-center gap-5 bg-neutral-surface rounded-xl p-4 border border-border-light">
                        {/* QR placeholder */}
                        <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg border border-border-light flex items-center justify-center overflow-hidden">
                            <svg viewBox="0 0 100 100" className="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg">
                                {/* QR mock pattern */}
                                <rect width="100" height="100" fill="white"/>
                                {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                                    const val = (r * 7 + c * 3 + r + c) % 3 === 0;
                                    return val ? <rect key={`${r}-${c}`} x={r*13+5} y={c*13+5} width="10" height="10" fill="#111"/> : null;
                                }))}
                                {/* Corner squares */}
                                <rect x="5" y="5" width="26" height="26" fill="none" stroke="#111" strokeWidth="4"/>
                                <rect x="10" y="10" width="16" height="16" fill="#111"/>
                                <rect x="69" y="5" width="26" height="26" fill="none" stroke="#111" strokeWidth="4"/>
                                <rect x="74" y="10" width="16" height="16" fill="#111"/>
                                <rect x="5" y="69" width="26" height="26" fill="none" stroke="#111" strokeWidth="4"/>
                                <rect x="10" y="74" width="16" height="16" fill="#111"/>
                            </svg>
                        </div>
                        <div>
                            <div className="font-bold text-sm mb-1">Scan to Download</div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Scan this QR code with your phone camera to install the app instantly — no typing required.
                            </p>
                        </div>
                    </div>

                    {/* PWA Install */}
                    <div className="flex items-center justify-between bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4">
                        <div>
                            <div className="font-bold text-sm mb-0.5">Install Web App</div>
                            <div className="text-xs text-text-secondary">Add SadakSathi to your home screen</div>
                        </div>
                        <button
                            onClick={handlePwaInstall}
                            className="flex-shrink-0 px-4 py-2 bg-brand-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Install App
                        </button>
                    </div>

                    {/* Share link */}
                    <div>
                        <div className="text-xs font-bold uppercase text-text-secondary tracking-wider mb-2">Share Download Link</div>
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center px-3 py-2.5 bg-neutral-surface border border-border-light rounded-lg text-xs text-text-secondary font-mono overflow-hidden">
                                <span className="truncate">{APP_LINK}</span>
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium rounded-lg border transition-all ${copied ? 'border-green-400 text-green-600 bg-green-50' : 'border-border-light hover:border-brand-primary hover:text-brand-primary'}`}
                            >
                                {copied ? '✓ Copied' : 'Copy'}
                            </button>
                            <button
                                onClick={handleEmail}
                                className="flex-shrink-0 px-3 py-2.5 text-xs font-medium rounded-lg border border-border-light hover:border-brand-primary hover:text-brand-primary transition-all"
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
