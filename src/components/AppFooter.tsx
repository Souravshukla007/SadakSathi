'use client';

import React, { useState } from "react";
import Link from "next/link";
import DownloadAppButton from "@/components/app-download/DownloadAppButton";
import DownloadAppModal from "@/components/app-download/DownloadAppModal";
import { BrandMark } from "@/components/AppHeader";

const COLUMNS = [
    {
        title: "Platform",
        links: [
            { href: "/upload", label: "Upload Portal" },
            { href: "/performance", label: "Model Analytics" },
            { href: "/Municipal", label: "Municipal Dashboard" },
            { href: "/guide", label: "User Guide" },
        ],
    },
    {
        title: "Resources",
        links: [
            { href: "/resources/whitepapers", label: "Whitepapers" },
            { href: "/resources/api-docs", label: "API Docs" },
            { href: "/resources/case-studies", label: "Case Studies" },
        ],
    },
    {
        title: "Governance",
        links: [
            { href: "/governance/safety-standards", label: "Safety Standards" },
            { href: "/governance/privacy-policy", label: "Privacy Policy" },
            { href: "/governance/sla-agreements", label: "SLA Agreements" },
        ],
    },
];

export default function AppFooter() {
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    return (
        <>
        <footer className="bg-neutral-background pt-24 pb-12 border-t border-border-light">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16">
                    <div>
                        <Link href="/" aria-label="SadakSathi home" className="inline-flex rounded-md mb-6">
                            <BrandMark />
                        </Link>
                        <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                            Next-generation road safety platform leveraging Specialized Computer Vision for municipal excellence.
                        </p>
                        <div className="mt-5">
                            <DownloadAppButton onClick={() => setShowDownloadModal(true)} />
                        </div>
                    </div>
                    {COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h2 className="font-heading font-bold mb-6 text-sm uppercase tracking-widest text-text-primary">{col.title}</h2>
                            <ul className="space-y-3 text-sm text-text-secondary">
                                {col.links.map((l) => (
                                    <li key={l.href}>
                                        <Link href={l.href} className="hover:text-sign-green transition-colors">{l.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="pt-12 border-t border-border-light">
                    <p className="text-xs text-text-secondary font-mono uppercase tracking-tighter">© {new Date().getFullYear()} SadakSathi AI. Engineered for Municipal Impact.</p>
                </div>
            </div>
        </footer>

        <DownloadAppModal open={showDownloadModal} onClose={() => setShowDownloadModal(false)} />
        </>
    );
}
