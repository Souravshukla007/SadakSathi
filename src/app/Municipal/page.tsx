"use client";

import React, { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import {
  getDetectionHistory,
  StoredDetection,
  relativeTime,
} from "@/lib/mlApi";

// ── Complaint type from API ────────────────────────────────────────────────────
interface Complaint {
  id: string;
  issueType: string;
  description: string;
  street: string;
  city: string;
  state: string;
  status: string;
  evidenceUrl: string | null;
  createdAt: string;
  upvoteCount: number;
  submittedBy: string;
}

// ── Derived stats from complaints ─────────────────────────────────────────────

interface DashboardStats {
  totalComplaints: number;
  potholeComplaints: number;
  pendingAction: number;
  resolutionRate: string;
  barData: number[]; // last 7 days counts
  pendingPct: number;
  inProgressPct: number;
  resolvedPct: number;
}

const getLast7DaysLabels = () => {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", { weekday: 'short' }).toUpperCase());
  }
  return labels;
};

function computeComplaintStats(complaints: Complaint[]): DashboardStats {
  const totalComplaints = complaints.length;
  let potholeComplaints = 0;
  let pendingAction = 0;
  let inProgress = 0;
  let resolved = 0;

  // For the bar chart: last 7 days counts
  const last7DaysCounts = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const c of complaints) {
    if (c.issueType.toLowerCase().includes("pothole")) {
      potholeComplaints++;
    }

    if (c.status === "Submitted" || c.status === "OnHold") {
      pendingAction++;
    } else if (c.status === "Approved") {
      inProgress++;
    } else if (c.status === "Completed" || c.status === "ResolvedReviewed") {
      resolved++;
    }

    // Bar chart date grouping
    const cDate = new Date(c.createdAt);
    cDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - cDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays < 7) {
      // Index 6 is today, 5 is yesterday, etc.
      last7DaysCounts[6 - diffDays]++;
    }
  }

  const maxBar = Math.max(...last7DaysCounts, 1);
  const barData = last7DaysCounts.map(v => Math.round((v / maxBar) * 100));

  const totalStatus = pendingAction + inProgress + resolved;
  const resolutionRate = totalStatus > 0 ? ((resolved / totalStatus) * 100).toFixed(1) + "%" : "0%";

  return {
    totalComplaints,
    potholeComplaints,
    pendingAction,
    resolutionRate,
    barData,
    pendingPct: totalStatus > 0 ? Math.round((pendingAction / totalStatus) * 100) : 0,
    inProgressPct: totalStatus > 0 ? Math.round((inProgress / totalStatus) * 100) : 0,
    resolvedPct: totalStatus > 0 ? Math.round((resolved / totalStatus) * 100) : 0,
  };
}

function statusStyle(status: string) {
  switch (status) {
    case "Submitted":  return "bg-yellow-100 text-yellow-700";
    case "Approved":   return "bg-blue-100 text-blue-700";
    case "OnHold":     return "bg-orange-100 text-orange-700";
    case "Rejected":   return "bg-red-100 text-red-700";
    case "Completed":
    case "ResolvedReviewed": return "bg-green-100 text-green-700";
    default:           return "bg-gray-100 text-gray-600";
  }
}
function statusLabel(s: string) { return s === "ResolvedReviewed" ? "Resolved" : s; }

// ─────────────────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const router = useRouter();
  const [history, setHistory]   = useState<StoredDetection[]>([]);
  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [loaded, setLoaded]     = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);

  useEffect(() => {
    // Auth check
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) { router.push("/auth"); return; }
        const data = await res.json();
        if (data.user?.role !== "municipal" && data.user?.role !== "user") {
          router.push("/auth");
        }
      } catch {
        router.push("/auth");
      }
    };
    checkAuth();

    // Load road-engine detection history from sessionStorage
    const h = getDetectionHistory();
    setHistory(h);

    // Fetch submitted complaints from DB
    const fetchComplaints = async () => {
      try {
        const res = await fetch("/api/complaints/feed?sort=newest");
        if (res.ok) {
          const data = await res.json();
          setComplaints(data);
          setStats(computeComplaintStats(data));
        }
      } catch { /* noop */ } finally {
        setComplaintsLoading(false);
        setLoaded(true);
      }
    };
    fetchComplaints();

    // Scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-on-scroll-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-animation-on-scroll]").forEach((el) => {
      el.classList.add("animate-on-scroll-hidden");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const triggerLogout = () => {
    setShowLogoutConfirm(true);
  };

  const s = stats;

  return (
    <>
      <AppHeader dashboardMode={true} />
      <LogoutConfirmModal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        onConfirm={handleLogout} 
      />
      <main className="flex-grow pt-16">
        <div className="flex min-h-screen bg-neutral-surface">

          {/* Sidebar */}
          <aside className="w-64 bg-text-primary text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-[60]">
            <div className="p-6 border-b border-white/10">
              <div className="text-xl font-heading font-bold flex items-center gap-2">
                <span className="text-2xl">🛣️</span> SadakSathi
              </div>
            </div>
            <nav className="flex-grow p-4 space-y-1">
              <Link href="/Municipal" className="flex items-center gap-3 px-4 py-3 bg-brand-primary text-text-primary font-bold rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Dashboard
              </Link>
              <Link href="/Municipal/complaints" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                Manage Complaints
              </Link>
              <Link href="/upload" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                Run Detection
              </Link>
              <Link href="/results?engine=road" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Last Report
              </Link>

              <Link href="/Municipal/chat" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Chats
              </Link>
              <Link href="/Municipal/insights" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Insights
              </Link>
            </nav>
            <div className="p-4 border-t border-white/10">
              <button 
                onClick={triggerLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-text-primary font-bold">M</div>
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold truncate">Sign Out</div>
                  <div className="text-[10px] opacity-60 truncate">Municipal Desk</div>
                </div>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-grow lg:ml-64 p-8">
            <div className="max-w-7xl mx-auto">

              {/* Top Bar */}
              <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-heading font-normal tracking-tight">Municipal Dashboard</h1>
                <div className="flex items-center gap-4">
                  <Link href="/upload" className="px-4 py-2 bg-brand-primary text-text-primary text-sm font-bold rounded-lg hover:scale-[1.02] transition-transform">
                    + New Analysis
                  </Link>
                  <div className="h-8 w-px bg-gray-200" />
                  <span className="text-sm font-bold text-text-primary">SADAKSATHI.AI</span>
                </div>
              </div>

              {/* Stats Cards */}
              {!loaded ? (
                /* Skeleton */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-soft border border-border-light animate-pulse">
                      <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
                      <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-32 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">Total Complaints</div>
                    <div className="text-3xl font-bold mb-1">{s?.totalComplaints ?? 0}</div>
                    <div className="text-xs text-text-secondary">From all citizens</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">Potholes Reported</div>
                    <div className="text-3xl font-bold mb-1">{s?.potholeComplaints ?? 0}</div>
                    <div className="text-xs text-text-secondary">Major hazard type</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">Pending Action</div>
                    <div className="text-3xl font-bold mb-1 text-red-500">{s?.pendingAction ?? 0}</div>
                    <div className="text-xs text-text-secondary">Requires review/action</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-soft border border-border-light">
                    <div className="text-xs font-mono font-bold text-text-secondary uppercase mb-2">Resolution Rate</div>
                    <div className="text-3xl font-bold mb-1">{s?.resolutionRate ?? "0%"}</div>
                    <div className="text-xs text-brand-primary font-bold">Total resolved</div>
                  </div>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

                {/* Bar Chart — last 7 days */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-soft border border-border-light">
                  <h3 className="font-heading font-bold mb-2">Complaints Over Time — Last 7 Days</h3>
                  {(!s || s.totalComplaints === 0) && (
                    <p className="text-sm text-text-secondary mb-6">No complaints submitted yet. <Link href="/complaints" className="text-brand-primary font-bold hover:underline">View community feed →</Link></p>
                  )}
                  <div className="h-64 flex items-end justify-between gap-2 mt-4">
                    {(s?.barData ?? Array(7).fill(0)).map((pct, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-sm transition-all duration-700"
                          style={{
                            height: `${Math.max(pct, 4)}%`,
                            backgroundColor: pct === 0 ? "#e5e7eb" : `hsl(142, 71%, ${40 + (100 - pct) * 0.2}%)`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[10px] font-mono text-text-secondary">
                    {getLast7DaysLabels().map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                </div>

                {/* Status Ring */}
                <div className="bg-white p-8 rounded-2xl shadow-soft border border-border-light">
                  <h3 className="font-heading font-bold mb-8">Complaint Status</h3>
                  <div className="relative aspect-square flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                      {s && s.pendingPct > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3.5"
                          strokeDasharray={`${s.pendingPct} ${100 - s.pendingPct}`} strokeDashoffset="0" strokeLinecap="round" />
                      )}
                      {s && s.inProgressPct > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#facc15" strokeWidth="3.5"
                          strokeDasharray={`${s.inProgressPct} ${100 - s.inProgressPct}`}
                          strokeDashoffset={`${-(s.pendingPct)}`} strokeLinecap="round" />
                      )}
                      {s && s.resolvedPct > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#4ade80" strokeWidth="3.5"
                          strokeDasharray={`${s.resolvedPct} ${100 - s.resolvedPct}`}
                          strokeDashoffset={`${-(s.pendingPct + s.inProgressPct)}`} strokeLinecap="round" />
                      )}
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-2xl font-bold">{s?.pendingAction ?? 0}</div>
                      <div className="text-[10px] uppercase font-mono text-text-secondary">Pending Action</div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      { label: "Pending",   color: "bg-red-500",    pct: s?.pendingPct   ?? 0 },
                      { label: "In Progress", color: "bg-yellow-400",  pct: s?.inProgressPct ?? 0 },
                      { label: "Resolved",    color: "bg-green-400",   pct: s?.resolvedPct    ?? 0 },
                    ].map(({ label, color, pct }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2"><div className={`w-3 h-3 ${color} rounded-full`} />{label}</div>
                        <span className="font-bold">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Submitted Complaints — Road Hazard */}
              <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
                <div className="px-8 py-6 border-b border-border-light flex justify-between items-center">
                  <div>
                    <h3 className="font-heading font-bold">Recent Submitted Complaints</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Road Hazard Reports — from citizen submissions</p>
                  </div>
                  <Link href="/complaints" className="text-sm font-bold text-brand-primary hover:underline">View All →</Link>
                </div>

                {complaintsLoading ? (
                  <div className="px-8 py-10 flex justify-center">
                    <div className="animate-spin w-6 h-6 border-3 border-brand-primary border-t-transparent rounded-full" />
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="px-8 py-16 text-center text-text-secondary">
                    <p className="mb-4">No complaints submitted yet.</p>
                    <Link href="/complaints" className="text-brand-primary font-bold hover:underline">View Complaints Page →</Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-mono text-text-secondary uppercase bg-neutral-surface border-b border-border-light">
                          <th className="px-6 py-4">Issue Type</th>
                          <th className="px-6 py-4">Location</th>
                          <th className="px-6 py-4">Reported By</th>
                          <th className="px-6 py-4">Engine</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Upvotes</th>
                          <th className="px-6 py-4">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {complaints.slice(0, 10).map((c) => (
                          <tr key={c.id} className="hover:bg-neutral-surface transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-text-primary">{c.issueType}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-secondary max-w-[160px] truncate">
                              {c.street ? `${c.street}, ` : ""}{c.city}, {c.state}
                            </td>
                            <td className="px-6 py-4 text-sm text-text-secondary">{c.submittedBy}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                                Road
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${statusStyle(c.status)}`}>
                                {statusLabel(c.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-text-primary">{c.upvoteCount}</td>
                            <td className="px-6 py-4 text-sm text-text-secondary">
                              {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
