"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import DownloadAppButton from "@/components/app-download/DownloadAppButton";
import DownloadAppModal from "@/components/app-download/DownloadAppModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import ThemeToggle from "@/components/ThemeToggle";

interface AppHeaderProps {
    dashboardMode?: boolean;
}

/** The original logo: road emoji plus the wordmark. `className` sets the wordmark colour. */
export function BrandMark({ className = "text-text-primary" }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 text-xl font-heading font-bold ${className}`}>
            <span aria-hidden="true" className="text-2xl">🛣️</span>
            SadakSathi
        </span>
    );
}

export default function AppHeader({ dashboardMode = false }: AppHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const isAuthorityDashboard = pathname?.startsWith('/Municipal') || pathname?.startsWith('/Traffic');

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

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mobileMenuOpen]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setIsLoggedIn(false);
            setShowLogoutConfirm(false);
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const triggerLogout = () => {
        setShowLogoutConfirm(true);
    };

    /** Shared link class */
    const navLinkClass = "px-2 xl:px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors flex items-center gap-1 whitespace-nowrap aria-[current=page]:text-text-primary";
    const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname?.startsWith(path)) ? "page" as const : undefined;
    const mobileLinkClass = "py-3 text-sm font-medium text-text-primary border-b border-border-light flex items-center gap-1.5 aria-[current=page]:text-sign-green";
    // The original's near-black button; colours flip with the theme so it stays readable in dark mode.
    const darkBtn = "px-4 py-2 bg-text-primary text-neutral-background font-medium text-sm rounded-lg hover:shadow-soft transition-all hover:-translate-y-0.5 whitespace-nowrap";

    // Public pages fit the full header from 1024px; dashboard pages lose 16rem to the sidebar, so 1280px.
    const showWide = dashboardMode ? 'hidden xl:flex' : 'hidden lg:flex';
    const showNarrow = dashboardMode ? 'xl:hidden' : 'lg:hidden';

    return (
        <>
        <header className={`fixed top-0 right-0 z-50 py-3 bg-neutral-background border-b border-border-light transition-all ${dashboardMode ? 'w-full lg:w-[calc(100%-16rem)]' : 'w-full left-0'}`}>
            <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">
                <Link href="/" aria-label="SadakSathi home" className={`rounded-md items-center ${dashboardMode ? 'flex lg:hidden' : 'flex'}`}>
                    <BrandMark />
                </Link>

                {/* Desktop nav — flex-1 centered, never overlaps right side */}
                <div className={`${showWide} flex-1 items-center justify-center gap-0.5 min-w-0 mx-4`}>
                    {/* Below 1280px the logo is the way home, so the bar fits a logged-in user's links. */}
                    <Link href="/" aria-current={isActive("/")} className={`${navLinkClass} max-xl:hidden`}>Home</Link>
                    <Link href="/upload" aria-current={isActive("/upload")} className={navLinkClass}>AI Detector</Link>
                    {!isAuthorityDashboard && (
                        <Link href="/complaints" aria-current={isActive("/complaints")} className={navLinkClass}>Complaints</Link>
                    )}
                    {!isLoading && isLoggedIn && !isAuthorityDashboard && (
                        <>
                            <Link href="/leaderboard" aria-current={isActive("/leaderboard")} className={navLinkClass}>Leaderboard</Link>
                            <Link href="/dashboard" aria-current={isActive("/dashboard")} className={navLinkClass}>Dashboard</Link>
                        </>
                    )}
                </div>

                {/* Desktop right-side actions */}
                <div className={`${showWide} items-center gap-2 flex-shrink-0`}>
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <DownloadAppButton onClick={() => setShowDownloadModal(true)} compact />
                    {!isLoading && isLoggedIn ? (
                        <>
                            <button type="button" onClick={triggerLogout} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap">Logout</button>
                            {!isAuthorityDashboard && (
                                <Link href="/my-account" aria-current={isActive("/my-account")} className={darkBtn}>My Account</Link>
                            )}
                        </>
                    ) : !isLoading && (
                        <>
                            <Link href="/auth" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Log in</Link>
                            <Link href="/auth" className={darkBtn}>Sign up</Link>
                        </>
                    )}
                </div>

                {/* Mobile: theme toggle stays on the bar, next to the menu button */}
                <ThemeToggle className={`${showNarrow} ml-auto mr-1`} />
                <button
                    type="button"
                    className={`${showNarrow} flex flex-col gap-1.5 size-11 px-2.5 justify-center rounded-md ${mobileMenuOpen ? 'hamburger-open' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-menu"
                >
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full" />
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full" />
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full" />
                </button>
            </nav>

            {/* Mobile menu */}
            <div id="mobile-menu" className={`${showNarrow} absolute top-full left-0 w-full bg-neutral-background border-t border-border-light transition-[transform,opacity,visibility] duration-300 ${mobileMenuOpen ? 'mobile-menu-visible' : 'mobile-menu-hidden invisible'}`}>
                <div className="flex flex-col px-6 py-4 gap-1">
                    <Link href="/" aria-current={isActive("/")} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <Link href="/upload" aria-current={isActive("/upload")} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>AI Detector</Link>
                    <Link href="/complaints" aria-current={isActive("/complaints")} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Complaints</Link>
                    {!isLoading && isLoggedIn && !isAuthorityDashboard && (
                        <>
                            <Link href="/leaderboard" aria-current={isActive("/leaderboard")} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
                            <Link href="/dashboard" aria-current={isActive("/dashboard")} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                        </>
                    )}

                    <div className="py-2 border-b border-border-light"><LanguageSwitcher /></div>
                    <button type="button" onClick={() => { setMobileMenuOpen(false); setShowDownloadModal(true); }} className="py-3 text-sm font-medium text-sign-green text-left border-b border-border-light">📱 Download App</button>

                    {!isLoading && isLoggedIn ? (
                        <>
                            {!isAuthorityDashboard && (
                                <Link href="/my-account" aria-current={isActive("/my-account")} className={mobileLinkClass} onClick={() => setMobileMenuOpen(false)}>My Account</Link>
                            )}
                            <button type="button" onClick={() => { setMobileMenuOpen(false); triggerLogout(); }} className="py-3 text-sm font-medium text-signal-red text-left">Logout</button>
                        </>
                    ) : !isLoading && (
                        <Link href="/auth" className="py-3 text-sm font-medium text-sign-green" onClick={() => setMobileMenuOpen(false)}>
                            Get Started →
                        </Link>
                    )}
                </div>
            </div>
        </header>

        <DownloadAppModal open={showDownloadModal} onClose={() => setShowDownloadModal(false)} />
        <LogoutConfirmModal
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
        />
        </>
    );
}
