'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import StatusBadge from '@/components/dashboard/StatusBadge';
import VoteButton from '@/components/dashboard/VoteButton';
import ChatModal from '@/components/dashboard/ChatModal';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserPayload {
    id: string;
    fullName?: string;
    email?: string;
    role?: string;
}

interface Complaint {
    id: string;
    issueType: string;
    description: string;
    street: string;
    city: string;
    state: string;
    status: string;
    remarks: string | null;
    evidenceUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    upvoteCount: number;
    hasVoted?: boolean;
    submittedBy?: string;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ user, onLogout }: { user: UserPayload | null; onLogout: () => void }) {
    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: true },
        { href: '/complaints', label: 'Submit Complaint', icon: 'M12 4v16m8-8H4' },
        { href: '/leaderboard', label: 'Leaderboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { href: '/dashboard/chat', label: 'Support Chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
        { href: '/performance', label: 'Analytics', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ];

    return (
        <aside className="w-64 bg-text-primary text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-[60]">
            <div className="p-6 border-b border-white/10">
                <div className="text-xl font-heading font-bold flex items-center gap-2">
                    <span className="text-2xl">🛣️</span> SadakSathi
                </div>
                <div className="mt-2 text-[10px] text-white/50 font-mono uppercase tracking-widest">Citizen Portal</div>
            </div>

            <nav className="flex-grow p-4 space-y-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            link.active
                                ? 'bg-brand-primary text-text-primary font-bold'
                                : 'text-white opacity-70 hover:opacity-100 hover:bg-white/5'
                        }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                        </svg>
                        {link.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-text-primary font-bold text-sm flex-shrink-0">
                        {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">{user?.fullName ?? 'Citizen'}</div>
                        <div className="text-[10px] opacity-60 truncate">{user?.email ?? ''}</div>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full mt-2 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all text-left"
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

// ─── Issue type badge ─────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
    const map: Record<string, string> = {
        pothole: 'bg-red-100 text-red-700',
        waterlogging: 'bg-blue-100 text-blue-700',
        'traffic light': 'bg-yellow-100 text-yellow-700',
        'road damage': 'bg-orange-100 text-orange-700',
    };
    const cls = map[type?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${cls}`}>
            {type || 'Other'}
        </span>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
    const router = useRouter();

    const [user, setUser] = useState<UserPayload | null>(null);
    const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
    const [feed, setFeed] = useState<Complaint[]>([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [myLoading, setMyLoading] = useState(true);
    const [chatComplaintId, setChatComplaintId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [activeTab, setActiveTab] = useState<'my' | 'feed'>('my');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // ── Auth check ──────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    router.push('/auth');
                    return;
                }
                const data = await res.json();
                setUser(data.user as UserPayload);
            } catch {
                router.push('/auth');
            }
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

    // ── Fetch my complaints ─────────────────────────────────────────────────
    const fetchMyComplaints = useCallback(async () => {
        setMyLoading(true);
        try {
            const res = await fetch('/api/complaints/my', { credentials: 'include' });
            if (res.ok) setMyComplaints(await res.json());
        } finally {
            setMyLoading(false);
        }
    }, []);

    // Only fetch after auth is confirmed (user is set)
    useEffect(() => {
        if (user) fetchMyComplaints();
    }, [user, fetchMyComplaints]);

    // ── Fetch public feed ───────────────────────────────────────────────────
    const fetchFeed = useCallback(async () => {
        setFeedLoading(true);
        try {
            const params = new URLSearchParams({ sort, ...(search ? { search } : {}) });
            const res = await fetch(`/api/complaints/feed?${params}`);
            if (res.ok) setFeed(await res.json());
        } finally {
            setFeedLoading(false);
        }
    }, [sort, search]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // ─────────────────────────────────────────────────────────────────────────

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
                        <div className="max-w-7xl mx-auto">

                            {/* ── Header ── */}
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-heading font-normal tracking-tight">My Dashboard</h1>
                                    <p className="text-sm text-text-secondary mt-1">Manage your complaints and track community issues</p>
                                </div>
                                <Link
                                    href="/complaints"
                                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-text-primary text-white font-bold text-sm rounded-lg hover:shadow-soft hover:-translate-y-0.5 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Report Issue
                                </Link>
                            </div>

                            {/* ── Welcome Banner ── */}
                            <WelcomeBanner
                                name={user?.fullName ?? 'Citizen'}
                                complaintCount={myComplaints.length}
                            />

                            {/* ── Stat cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Total Submitted', value: myComplaints.length, color: 'text-text-primary' },
                                    { label: 'Resolved', value: myComplaints.filter(c => c.status === 'Completed' || c.status === 'ResolvedReviewed').length, color: 'text-green-600' },
                                    { label: 'In Progress', value: myComplaints.filter(c => c.status === 'Approved' || c.status === 'OnHold').length, color: 'text-blue-600' },
                                    { label: 'Pending Review', value: myComplaints.filter(c => c.status === 'Submitted').length, color: 'text-yellow-600' },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white p-5 rounded-2xl shadow-soft border border-border-light">
                                        <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-2">{stat.label}</div>
                                        <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Tabs ── */}
                            <div className="flex gap-1 bg-white border border-border-light rounded-xl p-1.5 mb-6 w-fit">
                                {(['my', 'feed'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                            activeTab === tab
                                                ? 'bg-text-primary text-white shadow-sm'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        {tab === 'my' ? 'My Complaints' : 'Community Feed'}
                                    </button>
                                ))}
                            </div>

                            {/* ─────────────────────────────────────────────
                                TAB: MY SUBMITTED COMPLAINTS
                            ───────────────────────────────────────────── */}
                            {activeTab === 'my' && (
                                <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
                                    <div className="px-8 py-5 border-b border-border-light flex justify-between items-center">
                                        <h2 className="font-heading font-bold text-lg">My Submitted Complaints</h2>
                                        <span className="text-xs font-mono text-text-secondary">{myComplaints.length} total</span>
                                    </div>

                                    {myLoading ? (
                                        <div className="p-12 text-center text-text-secondary">
                                            <div className="inline-block w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-3" />
                                            <p className="text-sm">Loading your complaints…</p>
                                        </div>
                                    ) : myComplaints.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="text-5xl mb-4">📭</div>
                                            <h3 className="font-heading font-bold mb-2">No complaints yet</h3>
                                            <p className="text-text-secondary text-sm mb-6">Help your community by reporting road issues.</p>
                                            <Link href="/complaints" className="inline-flex items-center gap-2 px-6 py-3 bg-text-primary text-white font-bold rounded-xl text-sm hover:shadow-soft transition-all">
                                                Report First Issue
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-[10px] font-mono text-text-secondary uppercase bg-neutral-surface border-b border-border-light">
                                                        <th className="px-6 py-4">ID</th>
                                                        <th className="px-6 py-4">Details</th>
                                                        <th className="px-6 py-4">Date</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4">Admin Remarks</th>
                                                        <th className="px-6 py-4">Votes</th>
                                                        <th className="px-6 py-4">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-light">
                                                    {myComplaints.map((c) => (
                                                        <tr key={c.id} className="hover:bg-neutral-surface/50 transition-colors">
                                                            <td className="px-6 py-4 text-xs font-mono text-text-secondary whitespace-nowrap">
                                                                #{c.id.slice(-8).toUpperCase()}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-start gap-3 max-w-xs">
                                                                    {c.evidenceUrl ? (
                                                                        <img
                                                                            src={c.evidenceUrl}
                                                                            alt="Evidence"
                                                                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-border-light"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-neutral-surface border border-border-light flex items-center justify-center text-xl">
                                                                            🛣️
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-bold text-text-primary truncate">{c.issueType || 'Road Issue'}</div>
                                                                        <div className="text-xs text-text-secondary line-clamp-2 mt-0.5">{c.description}</div>
                                                                        <div className="text-[10px] text-text-secondary mt-1 font-mono">{c.city}, {c.state}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(c.createdAt)}</td>
                                                            <td className="px-6 py-4">
                                                                <StatusBadge status={c.status} />
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-text-secondary max-w-[160px]">
                                                                {c.remarks ? (
                                                                    <span className="line-clamp-2">{c.remarks}</span>
                                                                ) : (
                                                                    <span className="text-text-secondary/50 italic">No remarks yet</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                                                    <svg className="w-3.5 h-3.5 text-brand-primary" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                                    </svg>
                                                                    {c.upvoteCount}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => setChatComplaintId(c.id)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-light text-xs font-bold text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                    </svg>
                                                                    Chat
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─────────────────────────────────────────────
                                TAB: COMMUNITY FEED
                            ───────────────────────────────────────────── */}
                            {activeTab === 'feed' && (
                                <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
                                    {/* Controls */}
                                    <div className="px-8 py-5 border-b border-border-light flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                        <h2 className="font-heading font-bold text-lg">Community Complaints Feed</h2>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            <div className="flex items-center gap-2 flex-1 sm:flex-none">
                                                <input
                                                    type="text"
                                                    placeholder="Search by ID…"
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    className="w-full sm:w-48 px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-neutral-surface"
                                                />
                                                <button
                                                    onClick={fetchFeed}
                                                    className="px-3 py-2 bg-text-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                            <select
                                                value={sort}
                                                onChange={(e) => setSort(e.target.value)}
                                                className="px-3 py-2 text-sm border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-neutral-surface"
                                            >
                                                <option value="newest">Newest First</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="upvotes">Most Upvotes</option>
                                            </select>
                                        </div>
                                    </div>

                                    {feedLoading ? (
                                        <div className="p-12 text-center text-text-secondary">
                                            <div className="inline-block w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-3" />
                                            <p className="text-sm">Loading feed…</p>
                                        </div>
                                    ) : feed.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="text-5xl mb-4">🔍</div>
                                            <h3 className="font-heading font-bold mb-2">No complaints found</h3>
                                            <p className="text-text-secondary text-sm">Try adjusting your search or sort options.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-[10px] font-mono text-text-secondary uppercase bg-neutral-surface border-b border-border-light">
                                                        <th className="px-6 py-4">ID</th>
                                                        <th className="px-6 py-4">Details</th>
                                                        <th className="px-6 py-4">Coords</th>
                                                        <th className="px-6 py-4">Type</th>
                                                        <th className="px-6 py-4">Date</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4">Votes</th>
                                                        <th className="px-6 py-4">Remarks</th>
                                                        <th className="px-6 py-4">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-light">
                                                    {feed.map((c) => (
                                                        <tr key={c.id} className="hover:bg-neutral-surface/50 transition-colors">
                                                            <td className="px-6 py-4 text-xs font-mono text-text-secondary whitespace-nowrap">
                                                                #{c.id.slice(-8).toUpperCase()}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-start gap-3 max-w-xs">
                                                                    {c.evidenceUrl ? (
                                                                        <img src={c.evidenceUrl} alt="Evidence" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border-light" />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-neutral-surface border border-border-light flex items-center justify-center text-lg">🛣️</div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-bold truncate">{c.submittedBy}</div>
                                                                        <div className="text-xs text-text-secondary line-clamp-1 mt-0.5">{c.description}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-mono text-text-secondary whitespace-nowrap">
                                                                {c.latitude && c.longitude
                                                                    ? `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <TypeBadge type={c.issueType} />
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(c.createdAt)}</td>
                                                            <td className="px-6 py-4">
                                                                <StatusBadge status={c.status} />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <VoteButton
                                                                    complaintId={c.id}
                                                                    initialCount={c.upvoteCount}
                                                                    hasVoted={c.hasVoted ?? false}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 text-xs text-text-secondary max-w-[140px]">
                                                                {c.remarks ? (
                                                                    <span className="line-clamp-2">{c.remarks}</span>
                                                                ) : (
                                                                    <span className="text-text-secondary/50 italic">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => setChatComplaintId(c.id)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-light text-xs font-bold text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all whitespace-nowrap"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                    </svg>
                                                                    Chat
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            <div className="lg:ml-64">
                <AppFooter />
            </div>

            {/* Chat Modal */}
            {chatComplaintId && (
                <ChatModal complaintId={chatComplaintId} onClose={() => setChatComplaintId(null)} />
            )}
        </>
    );
}
