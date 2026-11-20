'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { ChartColumn, ClipboardList, LayoutDashboard, Loader2, TriangleAlert, Trophy, UserRound } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import ProfileHeader from '@/components/account/ProfileHeader';
import ProfileStats from '@/components/account/ProfileStats';
import ProfileForm from '@/components/account/ProfileForm';
import SecuritySettings from '@/components/account/SecuritySettings';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';
import NotificationSettings from '@/components/account/NotificationSettings';
import ActivityTable from '@/components/account/ActivityTable';
import Sidebar, { type SidebarLink } from '@/components/dashboard/Sidebar';
import PageHero from '@/components/dashboard/PageHero';

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
    reportsResolved: number;
}

interface Activity {
    id: string;
    action: string;
    details?: string;
    createdAt: string;
}

const NAV_LINKS: SidebarLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/complaints', label: 'Road reports', icon: ClipboardList },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/performance', label: 'Analytics', icon: ChartColumn },
    { href: '/my-account', label: 'My account', icon: UserRound },
];

// ─── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-asphalt/60 p-4">
            <div role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-desc" className="animate-pop bg-surface rounded-xl shadow-medium w-full max-w-md p-6">
                <span className="w-12 h-12 rounded-xl grid place-items-center bg-signal-red/10 text-signal-red mb-4">
                    <TriangleAlert className="w-6 h-6" aria-hidden="true" />
                </span>
                <h3 id="delete-title" className="font-heading font-normal tracking-tighter text-xl mb-2">Delete your account?</h3>
                <p id="delete-desc" className="text-sm text-text-secondary mb-6">
                    This permanently deletes your account, your reports and your upvotes. It cannot be undone.
                </p>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button type="button" onClick={onClose} className="flex-1 min-h-11 border border-border-light font-bold rounded-lg hover:border-border-dark transition-colors text-sm">
                        Keep my account
                    </button>
                    <button type="button" onClick={onConfirm} className="flex-1 min-h-11 bg-signal-red hover:bg-signal-red/90 text-white font-bold rounded-lg transition-colors text-sm">
                        Delete my account
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
    const [stats, setStats] = useState<Stats>({ complaintsSubmitted: 0, upvotesReceived: 0, leaderboardRank: 1, reportsResolved: 0 });
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
                <div className="flex flex-col items-center gap-3 text-text-secondary">
                    <Loader2 className="w-7 h-7 animate-spin text-sign-green" aria-hidden="true" />
                    <p className="text-sm">Loading your account…</p>
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
            <main id="main-content" className="flex-grow pt-16">
                <div className="flex min-h-screen bg-neutral-surface">
                    <Sidebar links={NAV_LINKS} activeHref="/my-account" portalLabel="Your account" user={user} onLogout={triggerLogout} />

                    <div className="flex-grow min-w-0 lg:ml-64 px-4 py-6 sm:p-6 lg:p-8">
                        <div className="max-w-5xl mx-auto space-y-6">

                            <PageHero inset title="My account" description="Your profile, password, notifications and recent activity." />

                            {user && (
                                <ProfileHeader
                                    user={user}
                                    onAvatarChange={(url) => setUser((u) => u ? { ...u, profileImageUrl: url } : u)}
                                />
                            )}

                            <ProfileStats stats={stats} />

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

                            <ActivityTable activities={activities} />

                            {/* Delete account */}
                            <section className="bg-surface rounded-xl border border-signal-red/40 elevated overflow-hidden">
                                <div className="hazard-stripe h-1.5" aria-hidden="true" />
                                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-heading font-bold text-signal-red">Delete account</h2>
                                        <p className="text-sm text-text-secondary mt-0.5">Permanently removes your account and everything you have reported. This cannot be undone.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex-shrink-0 min-h-11 px-4 border border-signal-red text-signal-red hover:bg-signal-red/10 text-sm font-bold rounded-lg transition-colors"
                                    >
                                        Delete my account
                                    </button>
                                </div>
                            </section>

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
