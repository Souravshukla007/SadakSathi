'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChartColumn, ClipboardList, FileText, LayoutDashboard, LogOut, MessageSquare, Upload, type LucideIcon } from 'lucide-react';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';

type Desk = 'municipal' | 'traffic';

const NAV: Record<Desk, { href: string; label: string; icon: LucideIcon }[]> = {
    municipal: [
        { href: '/Municipal', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/Municipal/complaints', label: 'Complaints', icon: ClipboardList },
        { href: '/Municipal/chat', label: 'Chats', icon: MessageSquare },
        { href: '/Municipal/insights', label: 'Insights', icon: ChartColumn },
        { href: '/upload', label: 'Run detection', icon: Upload },
        { href: '/results?engine=road', label: 'Last report', icon: FileText },
    ],
    traffic: [
        { href: '/Traffic', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/Traffic/chat', label: 'Chats', icon: MessageSquare },
        { href: '/Traffic/insights', label: 'Insights', icon: ChartColumn },
        { href: '/upload', label: 'Run detection', icon: Upload },
        { href: '/results?engine=traffic', label: 'Last report', icon: FileText },
    ],
};

/**
 * Staff desk navigation: a fixed asphalt sidebar on lg+, and an in-flow
 * scrollable strip below the header on smaller screens. Render it at the top
 * of the page's content column; the column needs `lg:pl-64`.
 */
export default function StaffNav({ desk }: { desk: Desk }) {
    const pathname = usePathname();
    const router = useRouter();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const links = NAV[desk];
    const deskName = desk === 'municipal' ? 'Municipal desk' : 'Traffic desk';
    const isActive = (href: string) => pathname === href.split('?')[0];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/auth');
    };

    return (
        <>
            <LogoutConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
            />

            <aside className="hidden lg:flex fixed inset-y-0 left-0 z-[60] w-64 flex-col bg-asphalt text-white">
                <div className="p-4">
                    <Link href={links[0].href} className="road-sign block px-5 py-4">
                        <span className="block font-heading text-xl font-normal tracking-tighter">SadakSathi</span>
                        <span className="block text-sm font-semibold text-white/85">{deskName}</span>
                    </Link>
                </div>
                <nav aria-label={deskName} className="flex-grow overflow-y-auto px-3 py-3 space-y-1">
                    {links.map(({ href, label, icon: Icon }) => {
                        const active = isActive(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={`group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[background-color,color] duration-200 ${
                                    active
                                        ? 'bg-sign-green font-bold text-white shadow-medium'
                                        : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {/* Amber marker slides in on the current page, like a lane arrow lighting up. */}
                                {active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r bg-hazard animate-pop" aria-hidden="true" />}
                                <Icon className={`h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 ${active ? '' : 'group-hover:translate-x-0.5'}`} aria-hidden="true" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-white/10 p-3">
                    <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-signal-red/20 hover:text-white"
                    >
                        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                        Sign out
                    </button>
                </div>
            </aside>

            <nav aria-label={deskName} className="lg:hidden flex-shrink-0 bg-asphalt">
                <div className="flex gap-1 overflow-x-auto px-3 py-2">
                    {links.map(({ href, label, icon: Icon }) => {
                        const active = isActive(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={`relative flex min-h-11 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                                    active ? 'bg-sign-green font-bold text-white' : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {label}
                                {active && <span className="absolute inset-x-3 -bottom-0.5 h-1 rounded-t bg-hazard animate-pop" aria-hidden="true" />}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
