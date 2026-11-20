'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';

interface DownloadAppButtonProps {
    onClick: () => void;
    compact?: boolean;
    /** For dark backgrounds such as the footer. */
    onDark?: boolean;
}

export default function DownloadAppButton({ onClick, compact = false, onDark = false }: DownloadAppButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={compact ? 'Download app' : undefined}
            className={`flex min-h-10 items-center gap-1.5 border rounded-lg font-semibold text-sm transition-colors px-3 py-2 ${onDark
                ? "border-white/30 text-white hover:bg-white/10 hover:border-white/60 focus-visible:outline-white!"
                : "border-border-light text-text-secondary hover:bg-neutral-surface hover:text-text-primary"}`}
        >
            <Smartphone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!compact && <span>Download app</span>}
        </button>
    );
}
