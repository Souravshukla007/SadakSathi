import React from "react";
import Link from "next/link";

export default function AppFooter() {
    return (
        <footer className="bg-white pt-16 pb-8 border-t border-border-light flex-shrink-0">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-black/5">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-xl font-heading font-bold text-text-primary flex items-center gap-2 mb-4">
                            <span className="text-2xl">🛣️</span> PotholeVision
                        </Link>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Making our roads safer through the power of Computer Vision and community engagement.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold mb-4 text-sm uppercase tracking-wider">Product</h4>
                        <ul className="space-y-2 text-sm text-text-secondary">
                            <li><Link href="/complaints" className="hover:text-brand-primary transition-colors">Report Issue</Link></li>
                            <li><Link href="/traffic-violations" className="hover:text-brand-primary transition-colors">Traffic Detection</Link></li>
                            <li><Link href="/leaderboard" className="hover:text-brand-primary transition-colors">Leaderboard</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold mb-4 text-sm uppercase tracking-wider">Company</h4>
                        <ul className="space-y-2 text-sm text-text-secondary">
                            <li><Link href="#" className="hover:text-brand-primary transition-colors">About</Link></li>
                            <li><Link href="#" className="hover:text-brand-primary transition-colors">Contact</Link></li>
                            <li><Link href="#" className="hover:text-brand-primary transition-colors">Partners</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold mb-4 text-sm uppercase tracking-wider">Newsletter</h4>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Email" className="bg-neutral-surface border border-border-light rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                            <button className="bg-text-primary text-white p-2 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg></button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8">
                    <p className="text-xs text-text-secondary">© 2025 PotholeVision AI. All rights reserved.</p>
                    <div className="flex gap-6 text-xs text-text-secondary">
                        <Link href="#" className="hover:text-text-primary">Privacy Policy</Link>
                        <Link href="#" className="hover:text-text-primary">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
