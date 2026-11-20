"use client";

import React, { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StaffNav from "@/components/traffic/StaffNav";
import StatStrip from "@/components/traffic/StatStrip";
import StatusBadge from "@/components/dashboard/StatusBadge";
import Reveal from "@/components/Reveal";
import { BarList, ColumnChart, complaintTone, DeskHeader, DonutChart, Panel, RowStripe } from "@/components/traffic/DeskUI";
import { CalendarDays, ChartPie, CircleCheck, ClipboardList, Clock, ImageOff, Landmark, Layers, LoaderCircle, TrafficCone, Upload } from "lucide-react";

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
  isDuplicate: boolean;
}

// ── Derived stats from complaints ─────────────────────────────────────────────

interface DashboardStats {
  totalComplaints: number;
  potholeComplaints: number;
  pendingAction: number;
  resolutionRate: string;
  barData: number[]; // last 7 days, as % of the busiest day
  barCounts: number[]; // last 7 days, raw counts
  inProgress: number;
  resolved: number;
  byType: { label: string; value: number }[];
  pendingPct: number;
  inProgressPct: number;
  resolvedPct: number;
}

const getLast7DaysLabels = () => {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en-IN", { weekday: 'short' }));
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
  const typeCounts: Record<string, number> = {};

  for (const c of complaints) {
    const type = c.issueType || "Unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;

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
    barCounts: last7DaysCounts,
    inProgress,
    resolved,
    byType: Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value })),
    pendingPct: totalStatus > 0 ? Math.round((pendingAction / totalStatus) * 100) : 0,
    inProgressPct: totalStatus > 0 ? Math.round((inProgress / totalStatus) * 100) : 0,
    resolvedPct: totalStatus > 0 ? Math.round((resolved / totalStatus) * 100) : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const router = useRouter();
  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [loaded, setLoaded]     = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Auth check
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) { router.push("/auth"); return; }
        const data = await res.json();
        if (data.user?.role !== "municipal" && data.user?.role !== "admin") {
          router.push("/auth");
        }
      } catch {
        router.push("/auth");
      }
    };
    checkAuth();

    // Fetch submitted complaints from DB
    const fetchComplaints = async () => {
      try {
        const res = await fetch("/api/municipal/complaints"); // the staff list: every report, not the public feed's first 50
        if (res.ok) {
          const data = await res.json();
          // Duplicates point at an original that is already counted.
          const originals = (data as Complaint[]).filter((c) => !c.isDuplicate);
          setComplaints(originals);
          setStats(computeComplaintStats(originals));
        } else {
          setLoadError(true);
        }
      } catch { setLoadError(true); } finally {
        setComplaintsLoading(false);
        setLoaded(true);
      }
    };
    fetchComplaints();
  }, [router]);

  const s = stats;

  const th = "px-4 py-3 whitespace-nowrap";

  return (
    <>
      <AppHeader dashboardMode={true} />
      <main id="main-content" className="flex-grow pt-16 bg-neutral-surface lg:pl-64">
        <StaffNav desk="municipal" />
        <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">

            <DeskHeader
              icon={Landmark}
              title="Municipal dashboard"
              description={loaded && s ? `${s.pendingAction} of ${s.totalComplaints} road hazard reports are waiting for action.` : "Road hazard reports from citizens, and how far each has got."}
            >
              <Link href="/upload" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-text-primary px-4 text-sm font-bold text-neutral-background shadow-soft transition-colors hover:opacity-90">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Run detection
              </Link>
            </DeskHeader>

            {loadError && (
              <p role="alert" className="mb-6 rounded-lg border border-signal-red/40 bg-signal-red/5 px-4 py-3 text-sm text-signal-red">
                Couldn&apos;t load complaints, so the figures below are not current. Refresh the page; if it keeps happening, check that the database is running.
              </p>
            )}

            <div className="mb-6">
              <StatStrip loading={!loaded} stats={[
                { label: "Total complaints", value: s?.totalComplaints ?? 0, note: "From all citizens", icon: ClipboardList, tone: "neutral" },
                { label: "Potholes reported", value: s?.potholeComplaints ?? 0, note: "Of all complaints", icon: TrafficCone, tone: "red" },
                { label: "Waiting for action", value: s?.pendingAction ?? 0, note: "Submitted or on hold", icon: Clock, tone: "amber" },
                { label: "Resolution rate", value: s?.resolutionRate ?? "0%", note: "Completed or resolved", icon: CircleCheck, tone: "green" },
              ]} />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <Reveal className="md:col-span-2 xl:col-span-1">
                <Panel title="New complaints, last 7 days" icon={CalendarDays} className="h-full">
                  {(!s || s.totalComplaints === 0) && (
                    <p className="mb-3 text-sm text-text-secondary">No complaints yet. <Link href="/complaints" className="font-semibold text-sign-green hover:underline">Open the community feed</Link></p>
                  )}
                  <ColumnChart
                    values={s?.barCounts ?? Array(7).fill(0)}
                    labels={getLast7DaysLabels()}
                    summary={`New complaints per day, last 7 days: ${getLast7DaysLabels().map((d, i) => `${d} ${s?.barCounts[i] ?? 0}`).join(", ")}`}
                  />
                </Panel>
              </Reveal>

              <Reveal delay={70}>
                <Panel title="Complaint status" icon={ChartPie} tone="amber" className="h-full">
                  <DonutChart
                    centerValue={s?.pendingAction ?? 0}
                    centerLabel="waiting"
                    segments={[
                      { label: "Waiting (submitted, on hold)", value: s?.pendingAction ?? 0, tone: "amber" },
                      { label: "Approved, in progress", value: s?.inProgress ?? 0, tone: "neutral" },
                      { label: "Resolved", value: s?.resolved ?? 0, tone: "green" },
                    ]}
                  />
                </Panel>
              </Reveal>

              <Reveal delay={140}>
                <Panel title="Most reported hazards" icon={Layers} tone="red" className="h-full">
                  {s && s.byType.length > 0 ? (
                    <BarList items={s.byType} tone="red" />
                  ) : (
                    <p className="py-8 text-center text-sm text-text-secondary">Counts by hazard type appear once citizens start reporting.</p>
                  )}
                </Panel>
              </Reveal>
            </div>

            {/* Recent complaints */}
            <Reveal>
            <Panel
              title="Recent complaints"
              description="Latest 10 road hazard reports. The edge colour follows the status."
              icon={ClipboardList}
              bodyClassName=""
              action={<Link href="/Municipal/complaints" className="inline-flex min-h-11 items-center text-sm font-semibold text-sign-green hover:underline">Manage complaints</Link>}
            >

              {complaintsLoading ? (
                <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-text-secondary">
                  <LoaderCircle className="h-5 w-5 animate-spin text-sign-green" aria-hidden="true" />
                  Loading complaints…
                </div>
              ) : complaints.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="font-semibold text-text-primary">No complaints yet</p>
                  <p className="mt-1 text-sm text-text-secondary">New citizen reports land here as soon as they are submitted.</p>
                  <Link href="/complaints" className="mt-3 inline-block text-sm font-semibold text-sign-green hover:underline">Open the community feed</Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="border-b border-border-light bg-neutral-surface">
                      <tr className="text-sm font-semibold text-text-secondary">
                        <th scope="col" className={`${th} sm:pl-6`}>Issue</th>
                        <th scope="col" className={th}>Location</th>
                        <th scope="col" className={th}>Reported by</th>
                        <th scope="col" className={th}>Status</th>
                        <th scope="col" className={`${th} text-right`}>Upvotes</th>
                        <th scope="col" className={`${th} sm:pr-6`}>Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {complaints.slice(0, 10).map((c) => (
                        <tr key={c.id} className="text-sm transition-colors hover:bg-sign-green/5">
                          <td className="relative px-4 py-2.5 sm:pl-6">
                            <RowStripe tone={complaintTone(c.status)} />
                            <Link href={`/Municipal/complaints?highlight=${c.id}`} className="flex items-center gap-3 font-semibold text-text-primary hover:text-sign-green">
                              <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-surface">
                                {c.evidenceUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={c.evidenceUrl} alt="" width={40} height={40} loading="lazy" className="h-full w-full object-cover" />
                                ) : (
                                  <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-text-secondary" aria-hidden="true" />
                                )}
                              </span>
                              {c.issueType}
                            </Link>
                          </td>
                          <td className="max-w-[220px] truncate px-4 py-3 text-text-secondary">
                            {c.street ? `${c.street}, ` : ""}{c.city}, {c.state}
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{c.submittedBy}</td>
                          <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">{c.upvoteCount}</td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary sm:pr-6">
                            {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
            </Reveal>

          </div>
        </div>
      </main>
      <div className="lg:ml-64">
        <AppFooter />
      </div>
    </>
  );
}
