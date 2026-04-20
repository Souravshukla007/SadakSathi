"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DownloadAppButton from "@/components/app-download/DownloadAppButton";
import DownloadAppModal from "@/components/app-download/DownloadAppModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface AppHeaderProps {
    dashboardMode?: boolean;
}

/** Nav links that require authentication */
const AUTH_REQUIRED_PATHS = [
    "/upload",
    "/dashboard",
    "/my-account",
    "/my-complaints",
    "/complaints",
    "/leaderboard",
    "/performance",
    "/traffic-violations",
    "/results",
];

export default function AppHeader({ dashboardMode = false }: AppHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me', { cache: 'no-store' });
                setIsLoggedIn(res.ok);
            } catch {
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setIsLoggedIn(false);
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    /**
     * Returns an href that is either the real path (logged in)
     * or /auth?redirect=<path> (guest).
     */
    const guardedHref = (path: string) => {
        if (isLoggedIn) return path;
        if (AUTH_REQUIRED_PATHS.includes(path)) {
            return `/auth?redirect=${encodeURIComponent(path)}`;
        }
        return path;
    };

    /** Shared link class */
    const navLinkClass = "px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors flex items-center gap-1";
    const mobileLinkClass = "py-3 text-sm font-medium text-text-primary border-b border-border-light flex items-center gap-1.5";

    /** Lock icon shown next to auth-required links for guests */
    const LockIcon = () => (
        <svg className="w-3 h-3 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );

    /** Whether to show lock on a link */
    const showLock = (path: string) => !isLoading && !isLoggedIn && AUTH_REQUIRED_PATHS.includes(path);

    return (
        <>
        <header className={`fixed top-0 right-0 z-50 py-3 bg-white border-b border-border-light transition-all ${dashboardMode ? 'w-full lg:w-[calc(100%-16rem)]' : 'w-full left-0'}`}>
            <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
                <Link href="/" className={`text-xl font-heading font-bold text-text-primary items-center gap-2 ${dashboardMode ? 'hidden lg:flex opacity-0 pointer-events-none' : 'flex'}`}>
                    <span className="text-2xl">🛣️</span> SadakSathi
                </Link>

                {/* Desktop nav — absolutely centered */}
                <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
                    <Link href="/" className={navLinkClass}>Home</Link>
                    <Link href="/traffic-violations" className={navLinkClass}>Traffic AI</Link>
                    <Link href="/upload"             className={navLinkClass}>AI Detector</Link>
                    {!isLoading && isLoggedIn && (
                        <>
                            <Link href="/complaints"  className={navLinkClass}>Complaints</Link>
                            <Link href="/leaderboard" className={navLinkClass}>Leaderboard</Link>
                            <Link href="/dashboard"   className={navLinkClass}>Dashboard</Link>
                        </>
                    )}
                </div>

                {/* Desktop right-side actions */}
                <div className="hidden md:flex items-center gap-3">
                    <LanguageSwitcher />
                    <DownloadAppButton onClick={() => setShowDownloadModal(true)} />
                    {!isLoading && isLoggedIn ? (
                        <>
                            <button onClick={handleLogout} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Logout</button>
                            <Link href="/my-account" className="px-5 py-2.5 bg-text-primary text-white font-medium text-sm rounded-lg hover:shadow-soft transition-all hover:-translate-y-0.5">
                                My Account
                            </Link>
                        </>
                    ) : !isLoading && (
                        <>
                            <Link href="/auth" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Log in</Link>
                            <Link href="/auth" className="px-5 py-2.5 bg-text-primary text-white font-medium text-sm rounded-lg hover:shadow-soft transition-all hover:-translate-y-0.5">
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    className={`md:hidden flex flex-col gap-1.5 w-6 h-6 justify-center ${mobileMenuOpen ? 'hamburger-open' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full" />
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full" />
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full" />
                </button>
            </nav>

            {/* Mobile menu */}
            <div className={`md:hidden absolute top-full left-0 w-full bg-white border-t border-border-light transition-all duration-300 ${mobileMenuOpen ? 'mobile-menu-visible' : 'mobile-menu-hidden'}`}>
                <div className="flex flex-col px-6 py-4 gap-1">
                    <Link href="/" className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <Link href="/traffic-violations" className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Traffic AI</Link>
                    <Link href="/upload"             className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>AI Detector</Link>
                    {!isLoading && isLoggedIn && (
                        <>
                            <Link href="/complaints"  className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Complaints</Link>
                            <Link href="/leaderboard" className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
                            <Link href="/dashboard"   className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                        </>
                    )}

                    <div className="py-2 border-b border-border-light"><LanguageSwitcher /></div>
                    <button onClick={() => { setMobileMenuOpen(false); setShowDownloadModal(true); }} className="py-3 text-sm font-medium text-brand-primary text-left border-b border-border-light">📱 Download App</button>

                    {!isLoading && isLoggedIn ? (
                        <>
                            <Link href="/my-account" className="py-3 text-sm font-medium text-text-primary border-b border-border-light" onClick={() => setMobileMenuOpen(false)}>My Account</Link>
                            <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="py-3 text-sm font-medium text-red-500 text-left">Logout</button>
                        </>
                    ) : !isLoading && (
                        <Link href="/auth" className="py-3 text-sm font-medium text-brand-primary" onClick={() => setMobileMenuOpen(false)}>
                            Get Started →
                        </Link>
                    )}
                </div>
            </div>
        </header>

        <DownloadAppModal open={showDownloadModal} onClose={() => setShowDownloadModal(false)} />
        </>
    );
}
