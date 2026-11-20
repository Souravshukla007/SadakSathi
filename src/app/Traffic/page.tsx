'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import TrafficTabs from '@/components/traffic/TrafficTabs';
import TrafficPreview from '@/components/traffic/TrafficPreview';
import TrafficAnalyticsCard from '@/components/traffic/TrafficAnalyticsCard';
import DetectionStreamTable from '@/components/traffic/DetectionStreamTable';
import StaffNav from '@/components/traffic/StaffNav';
import StatStrip from '@/components/traffic/StatStrip';
import { ChallanBadge, ViolationBadge, ViolationTypeBadge, VIOLATION_LABELS_MAP } from '@/components/traffic/ViolationBadge';
import Reveal from '@/components/Reveal';
import { BarList, complaintTone, DeskHeader, DonutChart, IconChip, Panel, RowStripe, type Tone } from '@/components/traffic/DeskUI';
import type { ComplaintStatus } from '@prisma/client';
import { STATUS_LABEL, statusOptions } from '@/lib/complaintStatus';
import { Bike, Car, ChartColumn, ChartPie, Gauge, ListChecks, LoaderCircle, ReceiptText, ScanLine, ShieldAlert, Siren, TriangleAlert, Upload, Users } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
    totalViolations: number;
    avgConfidence: number;
    vehicleCount: number;
    totalChallanAmount: number;
    totalChallansIssued: number;
}

interface TrafficViolation {
    id: string;
    type: string;
    confidence: number;
    status: string;
    timestamp: string;
    location: string | null;
    vehicle: { vehicleType: string } | null;
    plateText: string | null;
    challan: { status: string; amount: number } | null;
}

interface TrafficComplaint {
    id: string;
    issueType: string;
    description: string;
    city: string;
    state: string;
    status: string;
    createdAt: string;
    submittedBy: string;
    evidenceUrl: string | null;
}


// Row edge colour follows the violation status: amber needs review, neutral in hand, green done.
const VIOLATION_TONE: Record<string, Tone> = { detected: 'amber', pending: 'amber', warning: 'amber', cleared: 'green', resolved: 'green' };

const DEFAULT_ANALYTICS: AnalyticsData = {
    totalViolations: 0,
    avgConfidence: 0,
    vehicleCount: 0,
    totalChallanAmount: 0,
    totalChallansIssued: 0,
};

// ─── Detection modules ─────────────────────────────────────────────────────────

const FEATURES = [
    { icon: Bike, title: 'No helmet', desc: 'Flags riders and pillions without a helmet.' },
    { icon: Users, title: 'Triple riding', desc: 'Flags two-wheelers carrying three or more people.' },
    { icon: TriangleAlert, title: 'Wrong-side driving', desc: 'Needs a model trained for it. The bundled traffic model does not detect it yet.' },
    { icon: ScanLine, title: 'Number plate reading', desc: 'Reads plates with OCR so a challan can be raised.' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrafficDashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');
    const [analytics, setAnalytics] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
    const [violations, setViolations] = useState<TrafficViolation[]>([]);
    const [violationsLoading, setViolationsLoading] = useState(true);
    const [trafficComplaints, setTrafficComplaints] = useState<TrafficComplaint[]>([]);
    const [loadError, setLoadError] = useState(false);
    const [issuingId, setIssuingId] = useState<string | null>(null);

    const [savingId, setSavingId] = useState<string | null>(null);
    const updateComplaintStatus = async (id: string, status: string) => {
        setSavingId(id);
        try {
            const res = await fetch(`/api/municipal/complaints/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (res.ok) {
                setTrafficComplaints(prev => prev.map(c => c.id === id ? { ...c, status: data.complaint.status } : c));
                toast.success('Status updated.');
            } else {
                toast.error(data.message || "Couldn't update the status. Try again.");
            }
        } catch {
            toast.error("Couldn't reach the server. Check your connection and try again.");
        } finally {
            setSavingId(null);
        }
    };

    const issueChallan = async (violationId: string) => {
        setIssuingId(violationId);
        try {
            const res = await fetch('/api/traffic/challan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ violationId }),
            });
            const data = await res.json();
            if (res.ok || res.status === 409) {
                // 409 means another officer already issued it; show theirs.
                setViolations(prev => prev.map(v => v.id === violationId ? { ...v, status: 'challan_issued', challan: data.challan } : v));
                toast.success(res.ok ? 'Challan issued.' : 'A challan was already issued for this violation.');
            } else {
                toast.error(data.message || "Couldn't issue the challan. Try again.");
            }
        } catch {
            toast.error("Couldn't reach the server. Check your connection and try again.");
        } finally {
            setIssuingId(null);
        }
    };

    // Auth check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    router.push('/auth');
                    return;
                }
                
                const data = await res.json();
                // Check if user has traffic access
                if (data.user?.role !== 'traffic' && data.user?.role !== 'admin') {
                    router.push('/auth');
                    return;
                }
            } catch {
                router.push('/auth');
            }
        };

        checkAuth();
    }, [router]);

    // Fetch analytics + violations + traffic complaints
    useEffect(() => {
        const fetchAll = async () => {
            // Fetch analytics (non-blocking for table)
            try {
                const res = await fetch('/api/traffic/analytics');
                if (res.ok) setAnalytics(await res.json());
                else setLoadError(true);
            } catch { setLoadError(true); }

            // Fetch AI violations + citizen complaints in parallel
            let aiViolations: TrafficViolation[] = [];
            let citizenComplaints: TrafficComplaint[] = [];

            const [violationsRes, complaintsRes] = await Promise.allSettled([
                fetch('/api/traffic/detections'),
                fetch('/api/traffic/complaints'),
            ]);

            if (violationsRes.status === 'fulfilled' && violationsRes.value.ok) {
                const data = await violationsRes.value.json();
                aiViolations = Array.isArray(data) ? data : [];
            }

            if (complaintsRes.status === 'fulfilled' && complaintsRes.value.ok) {
                const data = await complaintsRes.value.json();
                citizenComplaints = Array.isArray(data) ? data : [];
            }

            if (![violationsRes, complaintsRes].every(r => r.status === 'fulfilled' && r.value.ok)) setLoadError(true);

            setViolations(aiViolations);
            setTrafficComplaints(citizenComplaints);
            setViolationsLoading(false);
        };
        fetchAll();
    }, []);

    const shownViolations = activeTab === 'all' ? violations : violations.filter(v => v.type === activeTab);
    const typeCounts: Record<string, number> = { all: violations.length };
    for (const v of violations) typeCounts[v.type] = (typeCounts[v.type] ?? 0) + 1;
    const byType = Object.entries(typeCounts)
        .filter(([type]) => type !== 'all')
        .sort((a, b) => b[1] - a[1])
        .map(([type, value]) => ({ label: VIOLATION_LABELS_MAP[type] ?? type.replace(/_/g, ' '), value }));
    const withChallan = violations.filter(v => v.challan).length;
    const th = 'px-4 py-3 whitespace-nowrap';
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

    return (
        <>
            <Toaster position="top-center" />
            <AppHeader dashboardMode />
            <main id="main-content" className="flex-grow pt-16 bg-neutral-surface lg:pl-64">
                <StaffNav desk="traffic" />
                <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">

                        <DeskHeader
                            icon={Siren}
                            title="Traffic enforcement"
                            description="Review AI-detected violations and the challans raised for them."
                        >
                            <Link href="/Traffic/insights" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-light bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:border-sign-green hover:text-sign-green">
                                <ChartColumn className="h-4 w-4" aria-hidden="true" />
                                Open insights
                            </Link>
                            <Link href="/upload" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-text-primary px-4 text-sm font-bold text-neutral-background shadow-soft transition-colors hover:opacity-90">
                                <Upload className="h-4 w-4" aria-hidden="true" />
                                Run detection
                            </Link>
                        </DeskHeader>

                        {loadError && (
                            <p role="alert" className="mb-6 rounded-lg border border-signal-red/40 bg-signal-red/5 px-4 py-3 text-sm text-signal-red">
                                Couldn&apos;t load some traffic data, so figures and lists may be incomplete. Refresh the page; if it keeps happening, check that the database is running.
                            </p>
                        )}

                        <div className="mb-6">
                            <StatStrip stats={[
                                { label: 'Violations today', value: analytics.totalViolations, icon: ShieldAlert, tone: 'red' },
                                { label: 'Average confidence', value: `${analytics.avgConfidence}%`, icon: Gauge, tone: 'neutral' },
                                { label: 'Vehicles tracked', value: analytics.vehicleCount.toLocaleString(), icon: Car, tone: 'neutral' },
                                { label: 'Challans issued', value: analytics.totalChallansIssued, icon: ReceiptText, tone: 'green', note: `₹${analytics.totalChallanAmount.toLocaleString('en-IN')} in fines` },
                            ]} />
                        </div>

                        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            <Reveal>
                                <Panel title="Violations by type" icon={ChartColumn} tone="red" className="h-full">
                                    {byType.length > 0 ? (
                                        <BarList items={byType} tone="red" />
                                    ) : (
                                        <p className="py-8 text-center text-sm text-text-secondary">{violationsLoading ? 'Loading…' : 'Counts by violation type appear after the first detection run.'}</p>
                                    )}
                                </Panel>
                            </Reveal>
                            <Reveal delay={70}>
                                <Panel title="Challan status" icon={ChartPie} tone="amber" className="h-full">
                                    <DonutChart
                                        centerValue={violations.length - withChallan}
                                        centerLabel="no challan yet"
                                        segments={[
                                            { label: 'No challan yet', value: violations.length - withChallan, tone: 'amber' },
                                            { label: 'Challan issued', value: withChallan, tone: 'green' },
                                        ]}
                                    />
                                </Panel>
                            </Reveal>
                            <Reveal delay={140} className="md:col-span-2 xl:col-span-1">
                                <TrafficAnalyticsCard data={analytics} />
                            </Reveal>
                        </div>

                        <Reveal className="mb-6">
                        <Panel
                            title="Recent violations"
                            icon={ListChecks}
                            bodyClassName=""
                            description={violations.length > 0
                                ? 'Latest 10 detections from the enforcement engine'
                                : 'No AI detections yet'}
                        >
                            {violations.length > 0 && (
                                <div className="border-b border-border-light px-4 py-3 sm:px-6">
                                    <TrafficTabs active={activeTab} onChange={setActiveTab} counts={typeCounts} />
                                </div>
                            )}

                            {violationsLoading ? (
                                <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-text-secondary">
                                    <LoaderCircle className="h-5 w-5 animate-spin text-sign-green" aria-hidden="true" />
                                    Loading violations…
                                </div>
                            ) : violations.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px] text-left">
                                        <thead className="border-b border-border-light bg-neutral-surface">
                                            <tr className="text-sm font-semibold text-text-secondary">
                                                <th scope="col" className={`${th} sm:pl-6`}>Violation</th>
                                                <th scope="col" className={th}>Vehicle</th>
                                                <th scope="col" className={th}>Confidence</th>
                                                <th scope="col" className={th}>Challan</th>
                                                <th scope="col" className={th}>Status</th>
                                                <th scope="col" className={`${th} sm:pr-6`}>Detected</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-light">
                                            {shownViolations.length === 0 && (
                                                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-text-secondary sm:px-6">No violations of this type yet.</td></tr>
                                            )}
                                            {shownViolations.slice(0, 10).map((v) => (
                                                <tr key={v.id} className="text-sm transition-colors hover:bg-sign-green/5">
                                                    <td className="relative px-4 py-2.5 sm:pl-6">
                                                        <RowStripe tone={VIOLATION_TONE[v.status] ?? 'neutral'} />
                                                        <ViolationTypeBadge type={v.type} />
                                                    </td>
                                                    <td className="px-4 py-3 text-text-secondary"><span className="capitalize">{v.vehicle?.vehicleType ?? '—'}</span>{v.plateText && <span className="plate ml-2 text-xs whitespace-nowrap" title="Plate read by OCR. Check it before issuing a challan.">{v.plateText}</span>}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-12 font-semibold tabular-nums">{(v.confidence * 100).toFixed(1)}%</span>
                                                            <span className="h-2 w-16 overflow-hidden rounded-full bg-neutral-surface" aria-hidden="true">
                                                                <span className={`block h-full rounded-full ${v.confidence >= 0.9 ? 'bg-signal-red' : 'bg-hazard'}`} style={{ width: `${v.confidence * 100}%` }} />
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {v.challan ? (
                                                            <ChallanBadge status={v.challan.status} amount={v.challan.amount} />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => issueChallan(v.id)}
                                                                disabled={issuingId === v.id}
                                                                className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-text-primary px-3 text-xs font-bold text-neutral-background shadow-soft transition-colors hover:opacity-90 disabled:opacity-60"
                                                            >
                                                                {issuingId === v.id
                                                                    ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                                                                    : <ReceiptText className="h-4 w-4" aria-hidden="true" />}
                                                                {issuingId === v.id ? 'Issuing…' : 'Issue challan'}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3"><ViolationBadge status={v.status ?? 'detected'} /></td>
                                                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary sm:pr-6">{fmtDate(v.timestamp)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-14 text-center">
                                    <span className="mx-auto mb-3 flex w-fit"><IconChip icon={ScanLine} tone="neutral" /></span>
                                    <p className="font-semibold text-text-primary">No AI-detected violations yet</p>
                                    <p className="mt-1 text-sm text-text-secondary">Run detection on camera footage to start reviewing violations.</p>
                                    <Link href="/upload" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-text-primary px-4 text-sm font-bold text-neutral-background hover:opacity-90">
                                        Run detection
                                    </Link>
                                </div>
                            )}
                        </Panel>
                        </Reveal>

                        {/* Citizen reports of traffic issues: shown always (not only when the AI has found nothing), and the desk sets their status. */}
                        <Reveal className="mb-6">
                        <Panel title="Citizen traffic reports" icon={ListChecks} bodyClassName="" description={`Reports from citizens about traffic issues (${trafficComplaints.length}). Change the status as you act on them.`}>
                            {trafficComplaints.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px] text-left">
                                        <thead className="border-b border-border-light bg-neutral-surface">
                                            <tr className="text-sm font-semibold text-text-secondary">
                                                <th scope="col" className={`${th} sm:pl-6`}>Issue</th>
                                                <th scope="col" className={th}>Location</th>
                                                <th scope="col" className={th}>Reported by</th>
                                                <th scope="col" className={th}>Status</th>
                                                <th scope="col" className={`${th} sm:pr-6`}>Reported</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-light">
                                            {trafficComplaints.slice(0, 10).map((c) => (
                                                <tr key={c.id} className="text-sm transition-colors hover:bg-sign-green/5">
                                                    <td className="relative px-4 py-3 font-semibold text-text-primary sm:pl-6">
                                                        <RowStripe tone={complaintTone(c.status)} />
                                                        {c.issueType}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-secondary">{c.city}{c.state ? `, ${c.state}` : ''}</td>
                                                    <td className="px-4 py-3 text-text-secondary">{c.submittedBy}</td>
                                                    <td className="px-4 py-3">
                                                        <label className="sr-only" htmlFor={`status-${c.id}`}>Status of {c.issueType} report</label>
                                                        <select
                                                            id={`status-${c.id}`}
                                                            value={c.status}
                                                            disabled={savingId === c.id || statusOptions(c.status as ComplaintStatus).length === 1}
                                                            onChange={(e) => updateComplaintStatus(c.id, e.target.value)}
                                                            className="min-h-11 rounded-lg border border-border-light bg-surface px-2 text-sm font-semibold text-text-primary disabled:opacity-60"
                                                        >
                                                            {statusOptions(c.status as ComplaintStatus).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary sm:pr-6">{fmtDate(c.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="px-6 py-10 text-center text-sm text-text-secondary">No citizen traffic reports yet.</p>
                            )}
                        </Panel>
                        </Reveal>

                        <Reveal className="mb-6">
                            <DetectionStreamTable />
                        </Reveal>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            <Reveal className="lg:col-span-3">
                                <TrafficPreview />
                            </Reveal>
                            <Reveal delay={70} className="lg:col-span-2">
                                <Panel title="What the detector checks" icon={ScanLine} className="h-full" bodyClassName="">
                                    <ul className="divide-y divide-border-light">
                                        {FEATURES.map(({ icon, title, desc }) => (
                                            <li key={title} className="flex gap-3 px-4 py-4 transition-colors hover:bg-sign-green/5 sm:px-6">
                                                <IconChip icon={icon} tone="red" size="sm" />
                                                <div>
                                                    <h3 className="text-sm font-bold">{title}</h3>
                                                    <p className="mt-0.5 text-sm text-text-secondary">{desc}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </Panel>
                            </Reveal>
                        </div>

                    </div>
                </div>
            </main>
            <div className="lg:ml-64">
                <AppFooter />
            </div>
        </>
    );
}
