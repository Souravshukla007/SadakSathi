'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import StaffNav from '@/components/traffic/StaffNav';
import StatStrip from '@/components/traffic/StatStrip';
import Reveal from '@/components/Reveal';
import { BarList, DeskHeader, DonutChart, Panel } from '@/components/traffic/DeskUI';
import { ChartColumn, ChartPie, CircleCheck, ClipboardList, Clock, Layers } from 'lucide-react';

export default function MunicipalInsightsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        pending: 0,
        byType: {} as Record<string, number>,
    });

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Auth check
                const authRes = await fetch('/api/auth/me');
                if (!authRes.ok) { router.push('/auth'); return; }
                
                // The staff list holds every report (the public feed stops at 50); duplicates are counted via their original.
                const feedRes = await fetch('/api/municipal/complaints');
                if (feedRes.ok) {
                    const data = ((await feedRes.json()) as { isDuplicate: boolean; status: string; issueType: string }[]).filter((c) => !c.isDuplicate);
                    
                    let resolved = 0;
                    let pending = 0;
                    const byType: Record<string, number> = {};
                    
                    data.forEach((c: { status: string; issueType: string }) => {
                        if (c.status === 'Completed' || c.status === 'ResolvedReviewed') resolved++;
                        else pending++;
                        
                        byType[c.issueType] = (byType[c.issueType] || 0) + 1;
                    });
                    
                    setStats({
                        total: data.length,
                        resolved,
                        pending,
                        byType
                    });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [router]);

    const byType = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, value]) => ({ label: type || 'Unknown', value }));
    const resolvedPct = Math.round((stats.resolved / Math.max(stats.total, 1)) * 100);

    return (
        <>
            <AppHeader dashboardMode />
            <main id="main-content" className="flex-grow pt-16 min-h-screen bg-neutral-surface lg:pl-64">
                <StaffNav desk="municipal" />
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <DeskHeader icon={ChartColumn} title="Municipal insights" description="What citizens are reporting and how much of it is fixed." />

                        <div className="mb-6">
                            <StatStrip loading={loading} stats={[
                                { label: 'Total complaints', value: stats.total, icon: ClipboardList, tone: 'neutral' },
                                { label: 'Resolved', value: stats.resolved, icon: CircleCheck, tone: 'green', note: `${resolvedPct}% of all complaints` },
                                { label: 'Open or in progress', value: stats.pending, icon: Clock, tone: 'amber' },
                            ]} />
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            <Reveal className="lg:col-span-2">
                                <Panel title="Fixed so far" icon={ChartPie} className="h-full">
                                    {loading ? (
                                        <p className="py-12 text-center text-sm text-text-secondary">Loading insights…</p>
                                    ) : (
                                        <DonutChart
                                            centerValue={`${resolvedPct}%`}
                                            centerLabel="resolved"
                                            segments={[
                                                { label: 'Resolved', value: stats.resolved, tone: 'green' },
                                                { label: 'Open or in progress', value: stats.pending, tone: 'amber' },
                                            ]}
                                        />
                                    )}
                                </Panel>
                            </Reveal>
                            <Reveal delay={70} className="lg:col-span-3">
                                <Panel title="Complaints by type" icon={Layers} tone="red" className="h-full">
                                    {loading ? (
                                        <p className="py-12 text-center text-sm text-text-secondary">Loading insights…</p>
                                    ) : byType.length === 0 ? (
                                        <p className="py-12 text-center text-sm text-text-secondary">No complaints yet. Counts by hazard type appear here once citizens start reporting.</p>
                                    ) : (
                                        <BarList items={byType} tone="red" total={stats.total} />
                                    )}
                                </Panel>
                            </Reveal>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
