"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Award, Crown, FileCheck, Loader2, Medal, Plus, Trophy, Users } from "lucide-react";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/dashboard/PageHero";
import StatTile from "@/components/dashboard/StatTile";
import EmptyState from "@/components/dashboard/EmptyState";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

interface LeaderboardUser {
    id: string;
    fullName: string;
    username: string;
    role: string;
    profileImageUrl: string | null;
    reports: number;
    upvotes: number;
    points: number;
    rank: number;
}

interface Stats {
    totalContributors: number;
    totalReports: number;
}

function getBadge(rank: number) {
    if (rank === 1) return { label: 'Gold badge', cls: 'bg-hazard/15 text-hazard-ink' };
    if (rank <= 3) return { label: 'Silver badge', cls: 'border border-border-dark text-text-primary' };
    if (rank <= 5) return { label: 'Bronze badge', cls: 'bg-neutral-surface text-text-primary' };
    return { label: 'Contributor', cls: 'text-text-secondary' };
}

function getTitle(rank: number) {
    if (rank === 1) return 'Urban legend';
    if (rank === 2) return 'Road sentinel';
    if (rank === 3) return 'Pothole hunter';
    if (rank <= 5) return 'City guardian';
    return 'Contributor';
}

function Avatar({ user, size = 'md' }: { user: LeaderboardUser; size?: 'sm' | 'md' | 'lg' }) {
    const dim = size === 'lg' ? 'w-20 h-20 md:w-28 md:h-28' : size === 'md' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-9 h-9';
    const textSize = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-sm';

    if (user.profileImageUrl) {
        return (
            <div className={`${dim} rounded-full overflow-hidden flex-shrink-0`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className={`${dim} rounded-full bg-neutral-surface border border-border-light flex items-center justify-center flex-shrink-0`} aria-hidden="true">
            <span className={`${textSize} font-bold text-text-primary`}>{user.fullName?.[0]?.toUpperCase() ?? 'U'}</span>
        </div>
    );
}

// Medal per podium place: gold = hazard amber, silver = neutral, bronze = amber tint.
const MEDALS = {
    1: { icon: Crown, chip: 'bg-hazard text-asphalt', label: 'Gold' },
    2: { icon: Medal, chip: 'bg-surface text-text-primary border-2 border-border-dark', label: 'Silver' },
    3: { icon: Award, chip: 'bg-hazard/25 text-hazard-ink border-2 border-hazard', label: 'Bronze' },
} as const;

// Podium place: a card on top of a step. 1st stands tallest on a green road-sign step.
function Podium({ user, place }: { user: LeaderboardUser; place: 1 | 2 | 3 }) {
    const first = place === 1;
    const { icon: MedalIcon, chip, label } = MEDALS[place];
    const order = first ? 'order-1 md:order-2' : place === 2 ? 'order-2 md:order-1' : 'order-3';
    const step = first ? 'md:h-28 road-sign rounded-t-none!' : place === 2 ? 'md:h-20 bg-asphalt text-white' : 'md:h-14 bg-asphalt text-white';
    // 3rd rises first, 1st last, so the winner lands at the end of the sequence.
    const delay = { 1: 300, 2: 150, 3: 0 }[place];
    return (
        <li className={`${order} animate-sign-raise flex flex-col`} style={{ animationDelay: `${delay}ms` }}>
            <div className={`lift elevated relative flex md:flex-col items-center gap-4 md:gap-0 bg-surface rounded-xl md:rounded-b-none p-4 md:p-6 md:text-center border ${first ? 'border-sign-green bg-linear-to-b from-sign-green/8 to-transparent' : 'border-border-light'}`}>
                <div className="relative md:mb-4">
                    <div className={`rounded-full p-1 ${first ? 'bg-sign-green' : place === 2 ? 'bg-border-dark' : 'bg-hazard'}`}>
                        <div className="rounded-full ring-2 ring-surface">
                            <Avatar user={user} size={first ? 'lg' : 'md'} />
                        </div>
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full grid place-items-center elevated ${chip}`}>
                        <MedalIcon className="w-5 h-5" aria-hidden="true" />
                        <span className="sr-only">{label} medal</span>
                    </span>
                </div>
                <div className="min-w-0 flex-1 md:flex-none md:w-full">
                    <p className="text-sm font-semibold text-text-secondary md:hidden">{place === 1 ? '1st' : place === 2 ? '2nd' : '3rd'} place</p>
                    <h3 className={`font-heading font-bold break-words ${first ? 'text-xl md:text-2xl' : 'text-lg'}`}>{user.fullName}</h3>
                    <p className="text-text-secondary text-sm">{getTitle(place)}</p>
                    <p className={`font-heading font-normal tracking-tighter text-sign-green tabular-nums mt-1 md:mt-3 ${first ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'}`}>
                        {user.points.toLocaleString()} pts
                    </p>
                    <p className="text-xs text-text-secondary mt-1 tabular-nums">{user.reports} reports, {user.upvotes} upvotes</p>
                </div>
            </div>
            {/* The podium step itself (desktop) */}
            <div className={`hidden md:flex items-center justify-center rounded-b-xl font-heading text-3xl font-bold ${step}`} aria-hidden="true">
                {place}
            </div>
        </li>
    );
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [stats, setStats] = useState<Stats>({ totalContributors: 0, totalReports: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.leaderboard);
                    setStats(data.stats);
                }
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);
    const topPoints = leaderboard[0]?.points ?? 0;

    return (
        <>
            <AppHeader />
            <main id="main-content" className="flex-grow pt-16 bg-neutral-surface">
                <PageHero
                    maxWidth="max-w-5xl"
                    title="Top contributors"
                    description="Citizens who keep their streets safe. You earn 10 points for each report (duplicates and rejected reports don't count) and 5 for each upvote from someone else."
                />
                <section className="py-8 md:py-12 px-4 sm:px-6 min-h-screen">
                    <div className="max-w-5xl mx-auto">
                        {loading && (
                            <div className="flex flex-col items-center gap-3 py-24 text-text-secondary">
                                <Loader2 className="w-7 h-7 animate-spin text-sign-green" aria-hidden="true" />
                                <p className="text-sm">Loading the leaderboard…</p>
                            </div>
                        )}

                        {!loading && leaderboard.length === 0 && (
                            <div className="bg-surface border border-border-light rounded-xl elevated">
                                <EmptyState
                                    headingLevel={2}
                                    title="No contributors yet"
                                    action={
                                        <Link href="/complaints" className="inline-flex items-center gap-2 min-h-11 px-5 bg-text-primary text-neutral-background font-bold rounded-lg hover:opacity-90 transition-colors">
                                            <Plus className="w-4 h-4" aria-hidden="true" />
                                            Report a hazard
                                        </Link>
                                    }
                                >
                                    Report a hazard to earn points and take the first spot.
                                </EmptyState>
                            </div>
                        )}

                        {!loading && leaderboard.length > 0 && (
                            <>
                                {/* Podium */}
                                <h2 className="sr-only">Top three</h2>
                                <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-10 md:items-end">
                                    {top3[1] && <Podium user={top3[1]} place={2} />}
                                    {top3[0] && <Podium user={top3[0]} place={1} />}
                                    {top3[2] && <Podium user={top3[2]} place={3} />}
                                </ol>

                                {/* Totals */}
                                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
                                    {[
                                        { icon: Users, label: 'Contributors', value: stats.totalContributors.toLocaleString(), tone: 'neutral' as const },
                                        { icon: FileCheck, label: 'Reports filed', value: stats.totalReports.toLocaleString(), tone: 'green' as const },
                                        { icon: Trophy, label: 'Top contributor', value: leaderboard[0]?.fullName ?? '–', tone: 'amber' as const },
                                    ].map(({ icon, label, value, tone }, i) => (
                                        <StatTile key={label} icon={icon} label={label} value={value} tone={tone} delay={450 + i * 70} />
                                    ))}
                                </dl>

                                {/* Full rankings */}
                                {rest.length > 0 && (
                                    <section aria-labelledby="rankings-title">
                                        <div className="flex items-baseline justify-between gap-4 mb-3">
                                            <h2 id="rankings-title" className="text-lg font-heading font-bold">Full rankings</h2>
                                            <span className="hidden sm:block text-sm text-text-secondary">Bar shows points against the leader</span>
                                        </div>
                                        <ol className="space-y-2">
                                            {rest.map((user, i) => {
                                                const badge = getBadge(user.rank);
                                                const share = topPoints > 0 ? Math.max(4, (user.points / topPoints) * 100) : 0;
                                                return (
                                                    <Reveal as="li" key={user.id} delay={Math.min(i, 8) * 60}>
                                                        <div className="lift elevated bg-surface rounded-xl border border-border-light px-3 sm:px-5 py-3 flex items-center gap-3 sm:gap-4">
                                                            <span className="w-10 h-10 rounded-lg bg-neutral-surface border border-border-light grid place-items-center font-heading font-bold text-text-secondary tabular-nums flex-shrink-0">
                                                                <span className="sr-only">Rank </span>{user.rank}
                                                            </span>
                                                            <Avatar user={user} size="sm" />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                                    <span className="font-bold text-text-primary break-words min-w-0">{user.fullName}</span>
                                                                    {badge.label !== 'Contributor' && (
                                                                        <span className={`hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded ${badge.cls}`}>{badge.label}</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-text-secondary tabular-nums">{user.reports} reports, {user.upvotes} upvotes</p>
                                                                <div className="mt-1.5 h-1.5 rounded-full bg-neutral-surface overflow-hidden" aria-hidden="true">
                                                                    <div className="h-full rounded-full bg-sign-green origin-left animate-[bar-fill_800ms_var(--ease-out-sign)_both]" style={{ width: `${share}%` }} />
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <div className="font-heading font-bold text-lg text-sign-green tabular-nums">{user.points.toLocaleString()}</div>
                                                                <div className="text-xs text-text-secondary">points</div>
                                                            </div>
                                                        </div>
                                                    </Reveal>
                                                );
                                            })}
                                        </ol>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>
            <AppFooter />
        </>
    );
}
