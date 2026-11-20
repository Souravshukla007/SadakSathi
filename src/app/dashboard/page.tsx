'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { ChartColumn, CircleCheck, ClipboardList, Clock, Construction, Inbox, LayoutDashboard, MapPin, MessageSquare, Plus, Search, ThumbsUp, Trophy, Users } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import StatusBadge, { statusAccent } from '@/components/dashboard/StatusBadge';
import StatTile from '@/components/dashboard/StatTile';
import EmptyState, { RoadIllustration } from '@/components/dashboard/EmptyState';
import Reveal from '@/components/Reveal';
import VoteButton from '@/components/dashboard/VoteButton';
import ChatModal from '@/components/dashboard/ChatModal';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import Sidebar, { type SidebarLink } from '@/components/dashboard/Sidebar';

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

const NAV_LINKS: SidebarLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/complaints', label: 'Report a hazard', icon: Plus },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/dashboard/chat', label: 'Support chat', icon: MessageSquare },
    { href: '/performance', label: 'Model accuracy', icon: ChartColumn },
];

// ─── Shared row pieces ────────────────────────────────────────────────────────

function Thumb({ url, alt }: { url: string | null; alt: string }) {
    return (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 overflow-hidden border border-border-light bg-neutral-surface flex items-center justify-center">
            {url ? (
                // eslint-disable-next-line @next/next/no-img-element -- dynamic data/API image
                <img src={url} alt={alt} width={96} height={96} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
                <RoadIllustration className="w-16 h-auto opacity-80" />
            )}
        </div>
    );
}

function ChatButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-lg border border-border-light text-sm font-bold text-text-secondary hover:border-sign-green hover:text-sign-green transition-colors"
        >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            Chat
        </button>
    );
}

function Remarks({ text }: { text: string | null }) {
    if (!text) return null;
    return (
        <p className="mt-2 text-sm text-text-secondary bg-sign-green/5 border-l-2 border-sign-green rounded-r-md px-3 py-1.5 line-clamp-3">
            <span className="font-semibold text-text-primary">Department remarks: </span>
            {text}
        </p>
    );
}

// Report card: status-coloured stripe on the left edge, photo, details, actions.
function ReportCard({ c, byline, place, date, actions }: {
    c: Complaint; byline?: string; place: React.ReactNode; date: string; actions: React.ReactNode;
}) {
    return (
        <article className="group lift elevated relative overflow-hidden bg-surface rounded-xl border border-border-light pl-5 pr-4 sm:pr-5 py-4 flex gap-3 sm:gap-4">
            <span className={`absolute inset-y-0 left-0 w-1.5 ${statusAccent(c.status)}`} aria-hidden="true" />
            <Thumb url={c.evidenceUrl} alt={`Photo of ${c.issueType || 'road issue'}`} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-heading font-bold text-text-primary">{c.issueType || 'Road issue'}</h3>
                    <StatusBadge status={c.status} />
                </div>
                {byline && <p className="text-xs text-text-secondary mt-0.5">Reported by {byline}</p>}
                <p className="text-sm text-text-secondary line-clamp-2 mt-1">{c.description}</p>
                <Remarks text={c.remarks} />
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary">
                    <span className="font-mono" translate="no">#{c.id.slice(-8).toUpperCase()}</span>
                    {place}
                    <span>{date}</span>
                    <span className="ml-auto flex items-center gap-2">{actions}</span>
                </div>
            </div>
        </article>
    );
}

function SkeletonList({ label }: { label: string }) {
    return (
        <div aria-busy="true">
            <p role="status" className="sr-only">{label}</p>
            <ul className="space-y-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                    <li key={i} className="bg-surface rounded-xl border border-border-light p-4 flex gap-4 animate-pulse">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-neutral-surface flex-shrink-0" />
                        <div className="flex-1 space-y-2.5 py-1">
                            <div className="h-4 w-1/3 rounded bg-neutral-surface" />
                            <div className="h-3 w-full rounded bg-neutral-surface" />
                            <div className="h-3 w-2/3 rounded bg-neutral-surface" />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
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
    // Loading flags start true; later refetches keep the old list visible until new data arrives.
    const fetchMyComplaints = useCallback(async () => {
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

    const stats = [
        { label: 'Reported', icon: ClipboardList, tone: 'neutral' as const, value: myComplaints.length },
        { label: 'Awaiting review', icon: Clock, tone: 'amber' as const, value: myComplaints.filter(c => c.status === 'Submitted').length },
        { label: 'In progress', icon: Construction, tone: 'neutral' as const, value: myComplaints.filter(c => c.status === 'Approved' || c.status === 'OnHold').length },
        { label: 'Resolved', icon: CircleCheck, tone: 'green' as const, value: myComplaints.filter(c => c.status === 'Completed' || c.status === 'ResolvedReviewed').length },
    ];

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
            <main id="main-content" className="flex-grow pt-16">
                <div className="flex min-h-screen bg-neutral-surface">
                    <Sidebar links={NAV_LINKS} activeHref="/dashboard" portalLabel="Citizen portal" user={user} onLogout={triggerLogout} />

                    <div className="flex-grow min-w-0 lg:ml-64 px-4 py-6 sm:p-6 lg:p-8">
                        <div className="max-w-5xl mx-auto">

                            {/* ── Header: glow panel holding the welcome sign and the counts ── */}
                            <header className="road-glow relative overflow-hidden rounded-2xl border border-border-light elevated p-4 sm:p-6 pb-7 sm:pb-8 mb-8">
                                <div className="animate-rise mb-5">
                                    <h1 className="text-3xl font-heading font-normal tracking-tighter">Dashboard</h1>
                                    <p className="text-sm text-text-secondary mt-1">Track your reports and see what others nearby have flagged.</p>
                                </div>

                                <WelcomeBanner
                                    name={user?.fullName ?? 'Citizen'}
                                    complaintCount={myComplaints.length}
                                />

                                <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
                                    {stats.map((stat, i) => (
                                        <StatTile
                                            key={stat.label}
                                            icon={stat.icon}
                                            label={stat.label}
                                            tone={stat.tone}
                                            value={myLoading ? '–' : stat.value}
                                            delay={300 + i * 70}
                                        />
                                    ))}
                                </dl>
                            </header>

                            {/* ── Tabs ── */}
                            <div className="inline-flex max-w-full p-1 gap-1 rounded-xl bg-surface border border-border-light elevated mb-5" role="group" aria-label="Which reports to show">
                                {([
                                    { id: 'my', label: 'My reports', icon: Inbox, count: myLoading ? null : myComplaints.length },
                                    { id: 'feed', label: 'Community feed', icon: Users, count: null },
                                ] as const).map(({ id, label, icon: Icon, count }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setActiveTab(id)}
                                        aria-pressed={activeTab === id}
                                        className={`min-h-11 px-3 sm:px-4 rounded-lg text-sm font-bold inline-flex items-center gap-2 transition-colors ${
                                            activeTab === id
                                                ? 'bg-asphalt text-white'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-neutral-surface'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                                        {label}
                                        {count !== null && (
                                            <span className={`px-1.5 rounded text-xs tabular-nums ${activeTab === id ? 'bg-white/15' : 'bg-neutral-surface'}`}>{count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* ── TAB: my reports ── */}
                            {activeTab === 'my' && (
                                <section aria-labelledby="my-reports-title">
                                    <div className="flex justify-between items-baseline gap-4 mb-3">
                                        <h2 id="my-reports-title" className="font-heading font-bold text-lg">My reports</h2>
                                        {!myLoading && <span className="text-sm text-text-secondary">{myComplaints.length} total</span>}
                                    </div>

                                    {myLoading ? (
                                        <SkeletonList label="Loading your reports…" />
                                    ) : myComplaints.length === 0 ? (
                                        <div className="bg-surface rounded-xl border border-border-light elevated">
                                            <EmptyState
                                                title="You have not reported anything yet"
                                                action={
                                                    <Link href="/complaints" className="inline-flex items-center gap-2 min-h-11 px-5 bg-text-primary text-neutral-background font-bold rounded-lg text-sm hover:opacity-90 transition-colors">
                                                        <Plus className="w-4 h-4" aria-hidden="true" />
                                                        Report a hazard
                                                    </Link>
                                                }
                                            >
                                                Photograph a pothole, open manhole or other hazard and SadakSathi sends it to the right department.
                                            </EmptyState>
                                        </div>
                                    ) : (
                                        <ul className="space-y-3">
                                            {myComplaints.map((c, i) => (
                                                <Reveal as="li" key={c.id} delay={Math.min(i, 6) * 70}>
                                                    <ReportCard
                                                        c={c}
                                                        date={formatDate(c.createdAt)}
                                                        place={<span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{c.city}, {c.state}</span>}
                                                        actions={
                                                            <>
                                                                <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />{c.upvoteCount} upvote{c.upvoteCount !== 1 ? 's' : ''}</span>
                                                                <ChatButton onClick={() => setChatComplaintId(c.id)} />
                                                            </>
                                                        }
                                                    />
                                                </Reveal>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            )}

                            {/* ── TAB: community feed ── */}
                            {activeTab === 'feed' && (
                                <section aria-labelledby="feed-title">
                                    <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-3">
                                        <h2 id="feed-title" className="font-heading font-bold text-lg">Community feed</h2>
                                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                            <div className="flex gap-2 flex-1">
                                                <label htmlFor="feed-search" className="sr-only">Search reports by ID</label>
                                                <div className="relative min-w-0 flex-1">
                                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" aria-hidden="true" />
                                                    <input
                                                        id="feed-search"
                                                        type="search"
                                                        placeholder="Search by report ID…"
                                                        autoComplete="off"
                                                        spellCheck={false}
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        className="w-full sm:w-52 min-h-11 pl-9 pr-3 text-sm border border-border-light rounded-lg focus:outline-none focus:border-sign-green bg-surface"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={fetchFeed}
                                                    className="inline-flex items-center gap-1.5 min-h-11 px-4 bg-asphalt text-white rounded-lg text-sm font-bold hover:bg-asphalt/90 transition-colors"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                            <label htmlFor="feed-sort" className="sr-only">Sort reports</label>
                                            <select
                                                id="feed-sort"
                                                value={sort}
                                                onChange={(e) => setSort(e.target.value)}
                                                className="min-h-11 px-3 text-sm text-text-primary border border-border-light rounded-lg focus:outline-none focus:border-sign-green bg-surface"
                                            >
                                                <option value="newest">Newest first</option>
                                                <option value="oldest">Oldest first</option>
                                                <option value="upvotes">Most upvoted</option>
                                            </select>
                                        </div>
                                    </div>

                                    {feedLoading ? (
                                        <SkeletonList label="Loading community reports…" />
                                    ) : feed.length === 0 ? (
                                        <div className="bg-surface rounded-xl border border-border-light elevated">
                                            <EmptyState
                                                title={search ? 'No reports match that ID' : 'No community reports yet'}
                                                action={search ? (
                                                    <button type="button" onClick={() => setSearch('')} className="inline-flex items-center min-h-11 px-5 border border-border-light rounded-lg text-sm font-bold hover:border-border-dark transition-colors">
                                                        Clear search
                                                    </button>
                                                ) : (
                                                    <Link href="/complaints" className="inline-flex items-center gap-2 min-h-11 px-5 bg-text-primary text-neutral-background font-bold rounded-lg text-sm hover:opacity-90 transition-colors">
                                                        <Plus className="w-4 h-4" aria-hidden="true" />
                                                        Report a hazard
                                                    </Link>
                                                )}
                                            >
                                                {search ? 'Check the ID, or clear the search to see every report.' : 'Reports from people in your city will show up here.'}
                                            </EmptyState>
                                        </div>
                                    ) : (
                                        <ul className="space-y-3">
                                            {feed.map((c, i) => (
                                                <Reveal as="li" key={c.id} delay={Math.min(i, 6) * 70}>
                                                    <ReportCard
                                                        c={c}
                                                        byline={c.submittedBy}
                                                        date={formatDate(c.createdAt)}
                                                        place={c.latitude != null && c.longitude != null && (
                                                            <span className="inline-flex items-center gap-1 tabular-nums"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</span>
                                                        )}
                                                        actions={
                                                            <>
                                                                <VoteButton
                                                                    complaintId={c.id}
                                                                    initialCount={c.upvoteCount}
                                                                    hasVoted={c.hasVoted ?? false}
                                                                />
                                                                <ChatButton onClick={() => setChatComplaintId(c.id)} />
                                                            </>
                                                        }
                                                    />
                                                </Reveal>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            <div className="lg:ml-64">
                <AppFooter />
            </div>

            {chatComplaintId && (
                <ChatModal complaintId={chatComplaintId} onClose={() => setChatComplaintId(null)} />
            )}
        </>
    );
}
