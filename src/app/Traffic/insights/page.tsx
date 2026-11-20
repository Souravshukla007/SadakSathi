'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import StaffNav from '@/components/traffic/StaffNav';
import StatStrip from '@/components/traffic/StatStrip';
import Reveal from '@/components/Reveal';
import { DeskHeader, DonutChart, Panel, TONE, type Tone } from '@/components/traffic/DeskUI';
import { Car, ChartColumn, ChartPie, Filter, Gauge, ReceiptText, ShieldAlert, type LucideIcon } from 'lucide-react';

interface AnalyticsData {
    totalViolations: number;
    avgConfidence: number;
    vehicleCount: number;
    totalChallanAmount: number;
    totalChallansIssued: number;
}

export default function TrafficInsightsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AnalyticsData>({
        totalViolations: 0,
        avgConfidence: 0,
        vehicleCount: 0,
        totalChallanAmount: 0,
        totalChallansIssued: 0,
    });

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                // Auth check
                const authRes = await fetch('/api/auth/me');
                if (!authRes.ok) { router.push('/auth'); return; }
                
                // Fetch traffic analytics
                const res = await fetch('/api/traffic/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [router]);

    const funnelMax = Math.max(stats.vehicleCount, stats.totalViolations, stats.totalChallansIssued, 1);
    const funnel: { label: string; value: number; tone: Tone; icon: LucideIcon }[] = [
        { label: 'Vehicles scanned', value: stats.vehicleCount, tone: 'neutral', icon: Car },
        { label: 'Violations detected', value: stats.totalViolations, tone: 'red', icon: ShieldAlert },
        { label: 'Challans issued', value: stats.totalChallansIssued, tone: 'green', icon: ReceiptText },
    ];
    const pctOf = (part: number, whole: number) => `${(part / Math.max(whole, 1) * 100).toFixed(1)}%`;

    return (
        <>
            <AppHeader dashboardMode />
            <main id="main-content" className="flex-grow pt-16 min-h-screen bg-neutral-surface lg:pl-64">
                <StaffNav desk="traffic" />
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <DeskHeader icon={ChartColumn} title="Traffic insights" description="How many scanned vehicles break a rule, and how many of those get a challan." />

                        <div className="mb-6">
                            <StatStrip loading={loading} stats={[
                                { label: 'Vehicles scanned', value: stats.vehicleCount.toLocaleString(), icon: Car, tone: 'neutral' },
                                { label: 'Violations', value: stats.totalViolations.toLocaleString(), icon: ShieldAlert, tone: 'red' },
                                { label: 'Average AI confidence', value: `${stats.avgConfidence}%`, icon: Gauge, tone: 'neutral' },
                                { label: 'Challans issued', value: stats.totalChallansIssued, icon: ReceiptText, tone: 'green', note: `₹${stats.totalChallanAmount.toLocaleString('en-IN')} in fines` },
                            ]} />
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            <Reveal className="lg:col-span-3">
                                <Panel title="Enforcement funnel" icon={Filter} className="h-full">
                                    {loading ? (
                                        <p className="py-12 text-center text-sm text-text-secondary">Loading insights…</p>
                                    ) : (
                                        <>
                                            <ol className="space-y-4">
                                                {funnel.map((f, i) => (
                                                    <li key={f.label} className="flex items-center gap-3">
                                                        <span className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${TONE[f.tone].chip}`} aria-hidden="true">
                                                            <f.icon className="h-4 w-4" />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                                                                <span className="font-semibold">{f.label}</span>
                                                                <span className="tabular-nums">
                                                                    <span className="font-semibold">{f.value.toLocaleString()}</span>
                                                                    {i > 0 && <span className="ml-1.5 text-text-secondary">{pctOf(f.value, funnel[i - 1].value)} of {funnel[i - 1].label.split(" ")[0].toLowerCase()}</span>}
                                                                </span>
                                                            </div>
                                                            <div className="h-3 overflow-hidden rounded-full bg-neutral-surface" aria-hidden="true">
                                                                <div
                                                                    className={`h-full rounded-full bg-current animate-rise ${TONE[f.tone].mark}`}
                                                                    style={{ width: `${Math.max((f.value / funnelMax) * 100, 1)}%`, animationDelay: `${i * 80}ms` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ol>
                                            <p className="mt-6 rounded-lg bg-neutral-surface px-4 py-3 text-sm text-text-secondary">
                                                Violation rate: <span className="font-semibold text-text-primary tabular-nums">{pctOf(stats.totalViolations, stats.vehicleCount)}</span> of scanned vehicles.
                                            </p>
                                        </>
                                    )}
                                </Panel>
                            </Reveal>
                            <Reveal delay={70} className="lg:col-span-2">
                                <Panel title="Violations with a challan" icon={ChartPie} tone="amber" className="h-full">
                                    {loading ? (
                                        <p className="py-12 text-center text-sm text-text-secondary">Loading insights…</p>
                                    ) : (
                                        <DonutChart
                                            centerValue={pctOf(stats.totalChallansIssued, stats.totalViolations)}
                                            centerLabel="have a challan"
                                            segments={[
                                                { label: 'Challan issued', value: stats.totalChallansIssued, tone: 'green' },
                                                { label: 'No challan yet', value: Math.max(stats.totalViolations - stats.totalChallansIssued, 0), tone: 'amber' },
                                            ]}
                                        />
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
