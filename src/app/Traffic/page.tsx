'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import TrafficTabs from '@/components/traffic/TrafficTabs';
import TrafficPreview from '@/components/traffic/TrafficPreview';
import TrafficAnalyticsCard from '@/components/traffic/TrafficAnalyticsCard';
import DetectionStreamTable from '@/components/traffic/DetectionStreamTable';
import UploadAuditCard from '@/components/traffic/UploadAuditCard';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';

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
    challan: { status: string; amount: number } | null;
}

function violationLabel(type: string): string {
    const map: Record<string, string> = {
        helmet_violation: 'No Helmet',
        triple_riding:    'Triple Riding',
        wrong_side:       'Wrong Side',
        plate_detection:  'Plate Detected',
    };
    return map[type] ?? type.replace(/_/g, ' ');
}

function challanStyle(status: string) {
    switch (status) {
        case 'Issued':    return 'bg-yellow-100 text-yellow-700';
        case 'Paid':      return 'bg-green-100 text-green-700';
        case 'Disputed':  return 'bg-orange-100 text-orange-700';
        case 'Cancelled': return 'bg-red-100 text-red-700';
        default:          return 'bg-gray-100 text-gray-600';
    }
}

const DEFAULT_ANALYTICS: AnalyticsData = {
    totalViolations: 0,
    avgConfidence: 0,
    vehicleCount: 0,
    totalChallanAmount: 0,
    totalChallansIssued: 0,
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

import { usePathname } from 'next/navigation';

function Sidebar({ onLogout }: { onLogout: () => void }) {
    const pathname = usePathname();
    const navLinks: { href: string; label: string; icon: string; active?: boolean }[] = [
        { href: '/Traffic', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { href: '/upload', label: 'Run Detection', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
        { href: '/results?engine=traffic', label: 'Last Report', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { href: '/Traffic/chat', label: 'Chats', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
        { href: '/Traffic/insights', label: 'Insights', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ];

    return (
        <aside className="w-64 bg-text-primary text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-[60]">
            <div className="p-6 border-b border-white/10">
                <div className="text-xl font-heading font-bold flex items-center gap-2">
                    <span className="text-2xl">🛣️</span> SadakSathi
                </div>
                <div className="mt-2 text-[10px] text-white/50 font-mono uppercase tracking-widest">Traffic Operations</div>
            </div>

            <nav className="flex-grow p-4 space-y-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            pathname === link.href || link.active
                                ? 'bg-brand-primary text-text-primary font-bold'
                                : 'text-white opacity-70 hover:opacity-100 hover:bg-white/5'
                        }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={(link as any).icon} />
                        </svg>
                        {link.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all text-left"
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

// ─── Feature Cards ─────────────────────────────────────────────────────────────

const FEATURES = [
    { icon: '🪖', title: 'No Helmet Detection', desc: 'Identify riders without helmets instantly using high-precision headwear detection models.' },
    { icon: '👨‍👩‍👦', title: 'Triple Riding Detection', desc: 'Detect unsafe multi-passenger riding patterns on two-wheelers automatically.' },
    { icon: '🔄', title: 'Wrong Side Driving', desc: 'Identify vehicles moving against traffic flow to prevent potential collisions in real-time.' },
    { icon: '🔢', title: 'Automatic License Plate Detection', desc: 'Extract license plate details using AI OCR for automated e-challan generation.' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrafficDashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('helmet');
    const [analytics, setAnalytics] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [violations, setViolations] = useState<TrafficViolation[]>([]);
    const [violationsLoading, setViolationsLoading] = useState(true);

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
                if (data.user?.role !== 'traffic' && data.user?.role !== 'user') {
                    router.push('/auth');
                    return;
                }
            } catch (error) {
                router.push('/auth');
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const triggerLogout = () => {
        setShowLogoutConfirm(true);
    };

    // Fetch analytics
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await fetch('/api/traffic/analytics');
                if (res.ok) setAnalytics(await res.json());
            } catch { /* keep defaults */ }

            // Fetch recent traffic violations from DB
            try {
                const res2 = await fetch('/api/traffic/detections');
                if (res2.ok) {
                    const data = await res2.json();
                    setViolations(Array.isArray(data) ? data : []);
                }
            } catch { /* noop */ } finally {
                setViolationsLoading(false);
            }
        };
        fetchAll();
    }, []);

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
                    <Sidebar onLogout={triggerLogout} />

                    <div className="flex-grow lg:ml-64 p-6 lg:p-8">
                        <div className="max-w-7xl mx-auto">

                            {/* ── Page Header ── */}
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-3xl font-heading font-normal tracking-tight">AI Traffic Enforcement</h1>
                                    <p className="text-sm text-text-secondary mt-1">
                                        Detecting safety violations using automated edge-AI vision models.
                                    </p>
                                </div>
                                <button className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-text-primary text-white font-bold text-sm rounded-lg hover:opacity-90 transition-opacity">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Full Report
                                </button>
                            </div>

                            {/* ── Tabs ── */}
                            <div className="mb-8">
                                <TrafficTabs active={activeTab} onChange={setActiveTab} />
                            </div>

                            {/* ── Stat Summary Bar ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Violations Today', value: analytics.totalViolations, color: 'text-red-600' },
                                    { label: 'Avg Confidence', value: `${analytics.avgConfidence}%`, color: 'text-brand-primary' },
                                    { label: 'Vehicles Tracked', value: analytics.vehicleCount.toLocaleString(), color: 'text-text-primary' },
                                    { label: 'Challans Issued', value: analytics.totalChallansIssued, color: 'text-green-600' },
                                ].map((s) => (
                                    <div key={s.label} className="bg-white p-5 rounded-2xl shadow-soft border border-border-light">
                                        <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider mb-2">{s.label}</div>
                                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Main 2-col Grid ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {/* Left: Preview (2/3) */}
                                <div className="lg:col-span-2">
                                    <TrafficPreview />
                                </div>
                                {/* Right: Analytics (1/3) */}
                                <div className="flex flex-col gap-6">
                                    <TrafficAnalyticsCard data={analytics} />
                                    <UploadAuditCard />
                                </div>
                            </div>

                            {/* ── Detection Stream ── */}
                            <div className="mb-8">
                                <DetectionStreamTable />
                            </div>

                            {/* ── Recent Traffic AI Detections Table ── */}
                            <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden mb-8">
                                <div className="px-8 py-6 border-b border-border-light flex justify-between items-center">
                                    <div>
                                        <h3 className="font-heading font-bold">Recent Traffic AI Detections</h3>
                                        <p className="text-xs text-text-secondary mt-0.5">Traffic Violations — detected by AI enforcement engine</p>
                                    </div>
                                    <Link href="/Traffic/insights" className="text-sm font-bold text-brand-primary hover:underline">View Insights →</Link>
                                </div>

                                {violationsLoading ? (
                                    <div className="px-8 py-10 flex justify-center">
                                        <div className="animate-spin w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full" />
                                    </div>
                                ) : violations.length === 0 ? (
                                    <div className="px-8 py-16 text-center text-text-secondary">
                                        <p className="mb-4">No traffic violations detected yet.</p>
                                        <Link href="/upload" className="text-brand-primary font-bold hover:underline">Run Traffic Detection →</Link>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-mono text-text-secondary uppercase bg-neutral-surface border-b border-border-light">
                                                    <th className="px-6 py-4">Violation Type</th>
                                                    <th className="px-6 py-4">Vehicle</th>
                                                    <th className="px-6 py-4">Engine</th>
                                                    <th className="px-6 py-4">Confidence</th>
                                                    <th className="px-6 py-4">Challan</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Detected</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-light">
                                                {violations.slice(0, 10).map((v) => (
                                                    <tr key={v.id} className="hover:bg-neutral-surface transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm font-semibold text-text-primary capitalize">{violationLabel(v.type)}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-text-secondary capitalize">
                                                            {v.vehicle?.vehicleType ?? '—'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                                                                Traffic
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-text-primary">
                                                            {(v.confidence * 100).toFixed(1)}%
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {v.challan ? (
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${challanStyle(v.challan.status)}`}>
                                                                    {v.challan.status} · ₹{v.challan.amount}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-text-secondary">No Challan</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                                v.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                                v.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>{v.status ?? 'detected'}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-text-secondary">
                                                            {new Date(v.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* ── Feature Cards Grid ── */}
                            <div>
                                <h2 className="font-heading font-bold text-lg mb-5">Detection Modules</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {FEATURES.map((f) => (
                                        <div key={f.title} className="bg-white p-6 rounded-2xl shadow-soft border border-border-light hover:-translate-y-1 transition-all group">
                                            <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-primary transition-colors">
                                                <span className="text-2xl">{f.icon}</span>
                                            </div>
                                            <h3 className="font-heading font-bold text-sm mb-2">{f.title}</h3>
                                            <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

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
