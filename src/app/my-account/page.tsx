'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import ProfileHeader from '@/components/account/ProfileHeader';
import ProfileStats from '@/components/account/ProfileStats';
import ProfileForm from '@/components/account/ProfileForm';
import SecuritySettings from '@/components/account/SecuritySettings';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';
import NotificationSettings from '@/components/account/NotificationSettings';
import ActivityTable from '@/components/account/ActivityTable';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
    id: string;
    fullName: string;
    username: string;
    email?: string;
    role?: string;
    phone?: string;
    city?: string;
    state?: string;
    profileImageUrl?: string;
    createdAt: string;
}

interface Stats {
    complaintsSubmitted: number;
    upvotesReceived: number;
    leaderboardRank: number;
    reportsGenerated: number;
}

interface Activity {
    id: string;
    action: string;
    details?: string;
    createdAt: string;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ user, onLogout }: { user: UserProfile | null; onLogout: () => void }) {
    const links = [
        { href: '/Municipal', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { href: '/complaints', label: 'Complaints', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { href: '/leaderboard', label: 'Leaderboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },

        { href: '/performance', label: 'Analytics', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { href: '/my-account', label: 'My Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', active: true },
    ];

    return (
        <aside className="w-64 bg-text-primary text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-[60]">
            <div className="p-6 border-b border-white/10">
                <div className="text-xl font-heading font-bold flex items-center gap-2">
                    <span className="text-2xl">🛣️</span> SadakSathi
                </div>
                <div className="mt-2 text-[10px] text-white/50 font-mono uppercase tracking-widest">User Portal</div>
            </div>
            <nav className="flex-grow p-4 space-y-1">
                {links.map((l) => (
                    <Link key={l.href} href={l.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${l.active ? 'bg-brand-primary text-text-primary font-bold' : 'text-white opacity-70 hover:opacity-100 hover:bg-white/5'}`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={(l as any).icon} />
                        </svg>
                        {l.label}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-4 py-3 mb-1">
                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-text-primary font-bold text-sm flex-shrink-0">
                        {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{user?.fullName ?? 'User'}</div>
                        <div className="text-[10px] opacity-60 truncate">{user?.email ?? ''}</div>
                    </div>
                </div>
                <button onClick={onLogout} className="w-full px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all text-left">
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-5">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">Delete Account</h3>
                <p className="text-sm text-text-secondary mb-6">
                    This action is <strong>permanent and irreversible</strong>. All your complaints, votes, and data will be deleted. Are you sure?
                </p>
                <div className="flex gap-3">
                    <button onClick={onConfirm} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm">
                        Yes, Delete My Account
                    </button>
                    <button onClick={onClose} className="flex-1 py-3 border border-border-light font-medium rounded-lg hover:border-gray-400 transition-colors text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<Stats>({ complaintsSubmitted: 0, upvotesReceived: 0, leaderboardRank: 1, reportsGenerated: 0 });
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
                if (!meRes.ok) { router.push('/auth'); return; }

                const profileRes = await fetch('/api/account/profile');
                if (!profileRes.ok) { router.push('/auth'); return; }

                const { user: u, stats: s, activities: a } = await profileRes.json();
                setUser(u);
                setStats(s);
                setActivities(a);
            } catch { router.push('/auth'); }
            finally { setLoading(false); }
        })();
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
    };

    const triggerLogout = () => {
        setShowLogoutConfirm(true);
    };

    const handleDeleteAccount = async () => {
        try {
            toast.success('Account deletion request received. (Demo mode — not deleted.)');
            setShowDeleteModal(false);
        } catch {
            toast.error('Failed to delete account.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-surface">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                    <p className="text-sm text-text-secondary">Loading your account…</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-center" />
            <AppHeader dashboardMode />
            <LogoutConfirmModal 
                isOpen={showLogoutConfirm} 
                onClose={() => setShowLogoutConfirm(false)} 
                onConfirm={handleLogout} 
            />
            <main className="flex-grow pt-16">
                <div className="flex min-h-screen bg-neutral-surface">
                    <Sidebar user={user} onLogout={triggerLogout} />

                    <div className="flex-grow lg:ml-64 p-6 lg:p-8">
                        <div className="max-w-5xl mx-auto space-y-6">

                            {/* Page Title */}
                            <div>
                                <h1 className="text-3xl font-heading font-normal tracking-tight">My Account</h1>
                                <p className="text-sm text-text-secondary mt-1">Manage your profile, security settings, and activity.</p>
                            </div>

                            {/* Profile Header */}
                            {user && (
                                <ProfileHeader
                                    user={user}
                                    onAvatarChange={(url) => setUser((u) => u ? { ...u, profileImageUrl: url } : u)}
                                />
                            )}

                            {/* Stats */}
                            <ProfileStats stats={stats} />

                            {/* 2-col grid: form + security/notifications */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {user && (
                                    <ProfileForm
                                        user={user}
                                        onSave={(updated) => setUser((u) => u ? { ...u, ...updated } : u)}
                                    />
                                )}
                                <div className="space-y-6">
                                    <SecuritySettings />
                                    <NotificationSettings />
                                </div>
                            </div>

                            {/* Activity */}
                            <ActivityTable activities={activities} />

                            {/* Danger Zone */}
                            <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
                                    <h3 className="font-heading font-bold text-red-700">Danger Zone</h3>
                                    <p className="text-xs text-red-600/70 mt-0.5">Irreversible actions — proceed with caution</p>
                                </div>
                                <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="font-medium text-sm">Delete My Account</div>
                                        <div className="text-xs text-text-secondary mt-0.5">Permanently delete your account and all associated data.</div>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex-shrink-0 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Delete My Account
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            <div className="lg:ml-64">
                <AppFooter />
            </div>

            {showDeleteModal && (
                <DeleteModal onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteAccount} />
            )}
        </>
    );
}
