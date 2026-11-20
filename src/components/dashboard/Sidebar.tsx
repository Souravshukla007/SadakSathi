import React from 'react';
import Link from 'next/link';
import { LogOut, Signpost, type LucideIcon } from 'lucide-react';

export interface SidebarLink {
    href: string;
    label: string;
    icon: LucideIcon;
}

interface SidebarProps {
    links: SidebarLink[];
    activeHref: string;
    portalLabel: string;
    user: { fullName?: string; email?: string } | null;
    onLogout: () => void;
}

// Dark asphalt sidebar shared by the citizen dashboard and account pages (desktop only).
export default function Sidebar({ links, activeHref, portalLabel, user, onLogout }: SidebarProps) {
    return (
        <aside className="w-64 bg-asphalt text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-[60]">
            <div className="px-6 py-5 border-b border-white/10">
                <Link href="/" className="text-xl font-heading font-normal tracking-tighter flex items-center gap-2">
                    <Signpost className="w-5 h-5 text-hazard" aria-hidden="true" />
                    SadakSathi
                </Link>
                <div className="mt-1 text-sm text-white/60">{portalLabel}</div>
            </div>

            <nav className="flex-grow p-3 space-y-1" aria-label="Account">
                {links.map(({ href, label, icon: Icon }) => {
                    const active = href === activeHref;
                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                active
                                    ? 'bg-text-primary text-neutral-background font-semibold'
                                    : 'text-white/75 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{user?.fullName ?? 'Citizen'}</div>
                        <div className="text-xs text-white/60 truncate">{user?.email ?? ''}</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full mt-1 flex items-center gap-3 px-3 py-2 text-sm text-white/75 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
