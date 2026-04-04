"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DownloadAppButton from "@/components/app-download/DownloadAppButton";
import DownloadAppModal from "@/components/app-download/DownloadAppModal";

interface AppHeaderProps {
    dashboardMode?: boolean;
}

export default function AppHeader({ dashboardMode = false }: AppHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error(error);
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

    return (
        <>
        <header className={`fixed top-0 right-0 z-50 py-3 bg-white border-b border-border-light transition-all ${dashboardMode ? 'w-full lg:w-[calc(100%-16rem)]' : 'w-full left-0'}`}>
            <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <Link href="/" className={`text-xl font-heading font-bold text-text-primary items-center gap-2 ${dashboardMode ? 'hidden lg:flex opacity-0 pointer-events-none' : 'flex'}`}>
                    <span className="text-2xl">🛣️</span> SadakSathi
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    <Link href="/" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Home</Link>
                    <Link href="/complaints" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Complaints</Link>
                    <Link href="/leaderboard" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Leaderboard</Link>
                    <Link href="/auth" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Traffic AI</Link>
                    <Link href="/account" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Dashboard</Link>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <DownloadAppButton onClick={() => setShowDownloadModal(true)} />
                    {!isLoading && isLoggedIn ? (
                        <>
                            <button onClick={handleLogout} className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Logout</button>
                            <Link href="/account" className="px-5 py-2.5 bg-text-primary text-white font-medium text-sm rounded-lg hover:shadow-soft transition-all hover:-translate-y-0.5">
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

                <button
                    className={`md:hidden flex flex-col gap-1.5 w-6 h-6 justify-center ${mobileMenuOpen ? 'hamburger-open' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full"></span>
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full"></span>
                    <span className="hamburger-line block h-0.5 w-full bg-text-primary rounded-full"></span>
                </button>
            </nav>

            <div className={`md:hidden absolute top-full left-0 w-full bg-white border-t border-border-light transition-all duration-300 ${mobileMenuOpen ? 'mobile-menu-visible' : 'mobile-menu-hidden'}`}>
                <div className="flex flex-col px-6 py-4 gap-1">
                    <Link href="/" className="py-3 text-sm font-medium text-text-primary border-b border-border-light" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    <Link href="/complaints" className="py-3 text-sm font-medium text-text-primary border-b border-border-light" onClick={() => setMobileMenuOpen(false)}>Complaints</Link>
                    <Link href="/leaderboard" className="py-3 text-sm font-medium text-text-primary border-b border-border-light" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
                    <Link href="/auth" className="py-3 text-sm font-medium text-text-primary border-b border-border-light" onClick={() => setMobileMenuOpen(false)}>Traffic AI</Link>
                    <Link href="/account" className="py-3 text-sm font-medium text-text-primary border-b border-border-light" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                    <button onClick={() => { setMobileMenuOpen(false); setShowDownloadModal(true); }} className="py-3 text-sm font-medium text-brand-primary text-left border-b border-border-light">📱 Download App</button>
                    {!isLoading && isLoggedIn ? (
                        <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="py-3 text-sm font-medium text-red-500 text-left">Logout</button>
                    ) : !isLoading && (
                        <Link href="/auth" className="py-3 text-sm font-medium text-brand-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                    )}
                </div>
            </div>
        </header>

        <DownloadAppModal open={showDownloadModal} onClose={() => setShowDownloadModal(false)} />
        </>
    );
}
