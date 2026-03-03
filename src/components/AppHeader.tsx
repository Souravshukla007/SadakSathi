"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function AppHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 w-full z-50 py-3 bg-white border-b border-border-light">
            <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="text-xl font-heading font-bold text-text-primary flex items-center gap-2">
                    <span className="text-2xl">🛣️</span> PotholeVision
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    <Link href="/" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Home</Link>
                    <Link href="/complaints" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Complaints</Link>
                    <Link href="/leaderboard" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Leaderboard</Link>
                    <Link href="/traffic-violations" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Traffic AI</Link>
                    <Link href="/user" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-md transition-colors">Dashboard</Link>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Link href="/auth" className="text-sm font-medium text-text-secondary hover:text-text-primary">Log in</Link>
                    <Link href="/auth" className="px-5 py-2.5 bg-text-primary text-white font-medium text-sm rounded-lg hover:shadow-soft transition-all hover:-translate-y-0.5">
                        Sign up
                    </Link>
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
                    <Link href="/traffic-violations" className="py-3 text-sm font-medium text-text-primary border-b border-border-light" onClick={() => setMobileMenuOpen(false)}>Traffic AI</Link>
                    <Link href="/user" className="py-3 text-sm font-medium text-text-primary border-b border-border-light" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                    <Link href="/auth" className="py-3 text-sm font-medium text-brand-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                </div>
            </div>
        </header>
    );
}
