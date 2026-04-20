"use client";

import React, { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Link from "next/link";
import {
  getLastDetection,
  StoredDetection,
  ImageAssessmentResponse,
  TrafficAssessmentResponse,
  SingleDetection,
  TrafficDetection,
  relativeTime,
} from "@/lib/mlApi";

// ── Helpers ──────────────────────────────────────────────────────────────────

function priorityBadge(priority: string) {
  switch (priority?.toUpperCase()) {
    case "HIGH":   return "bg-red-100 text-red-600";
    case "MEDIUM": return "bg-yellow-100 text-yellow-600";
    default:       return "bg-green-100 text-green-600";
  }
}

function avgConfidence(detections: { confidence: number }[]): string {
  if (!detections || detections.length === 0) return "0.0";
  const avg = detections.reduce((s, d) => s + d.confidence, 0) / detections.length;
  return (avg * 100).toFixed(1);
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [stored, setStored] = useState<StoredDetection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStored(getLastDetection());
    setLoaded(true);

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
  }, []);

  // ── Loading ──
  if (!loaded) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow pt-16 min-h-screen bg-neutral-surface flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
        </main>
        <AppFooter />
      </>
    );
  }

  // ── No data state ──
  if (!stored) {
    return (
      <>
        <AppHeader />
        <main className="flex-grow pt-16 min-h-screen bg-neutral-surface flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-bold mb-3">No Results Yet</h1>
            <p className="text-text-secondary mb-8">Run an AI detection on the upload page first to see your results here.</p>
            <Link href="/upload" className="inline-block px-8 py-3 bg-text-primary text-white font-bold rounded-lg hover:-translate-y-0.5 transition-transform">
              Go to Upload →
            </Link>
          </div>
        </main>
        <AppFooter />
      </>
    );
  }

  // ── Derive result fields ──
  const result = stored.result as any;
  const isTraffic  = stored.engine === "traffic";
  const isVideo    = stored.mediaType === "video";

  const annotatedB64: string | null = result.annotated_image_base64 ?? null;
  const detections: (SingleDetection | TrafficDetection)[] = result.detections ?? [];
  const totalDetections: number = result.total_detections ?? 0;
  const overallPriority: string = result.road_priority ?? result.overall_priority ?? "Low";
  const priorityCounts: Record<string, number> = result.priority_counts ?? {};
  const classCounts: Record<string, number>    = result.class_counts ?? result.summary?.class_counts ?? {};
  const avgConf = avgConfidence(detections);

  // Video-specific
  const violations = result.violations ?? [];
  const uniqueViolations: number = result.unique_tracked_violations ?? 0;

  return (
    <>
      <AppHeader />
      <main className="flex-grow pt-16">
        <section className="pt-32 pb-24 px-6 bg-neutral-surface min-h-screen">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12" data-animation-on-scroll="">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Link href="/upload" className="text-brand-primary hover:underline text-sm font-bold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    BACK TO UPLOAD
                  </Link>
                  <span className="text-gray-300">/</span>
                  <span className="text-sm text-text-secondary font-mono">REPORT #{stored.id}</span>
                </div>
                <h1 className="font-heading text-4xl font-normal tracking-tighter">Detection Results</h1>
                <p className="text-sm text-text-secondary mt-1">
                  {stored.fileName} · {relativeTime(stored.timestamp)} · {isTraffic ? "Traffic" : "Road Hazard"} Engine
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => downloadJSON(stored.result, `sadaksathi-${stored.id}.json`)}
                  className="px-6 py-3 bg-white border border-border-light text-text-primary font-bold rounded-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  DOWNLOAD JSON
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Media + Detection Table */}
              <div className="lg:col-span-2 space-y-8">

                {/* Annotated Image */}
                <div className="bg-white rounded-2xl shadow-medium border border-border-light overflow-hidden" data-animation-on-scroll="">
                  <div className="bg-gray-900 aspect-video relative group overflow-hidden flex items-center justify-center">
                    {annotatedB64 ? (
                      <img
                        src={`data:image/jpeg;base64,${annotatedB64}`}
                        alt="AI Annotated Result"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-white/40 p-8">
                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">{isVideo ? "Annotated frames not available for video mode." : "No annotated image returned."}</p>
                      </div>
                    )}

                    {/* Live Analysis Overlay */}
                    {totalDetections > 0 && (
                      <div className="absolute top-4 right-4 bg-gray-950/80 backdrop-blur p-4 rounded-lg border border-white/10 text-white">
                        <div className="text-[10px] opacity-60 uppercase mb-2">Analysis Summary</div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-8 text-xs"><span>Detections:</span><span className="font-bold text-brand-primary">{String(totalDetections).padStart(2, "0")}</span></div>
                          <div className="flex justify-between gap-8 text-xs"><span>Avg Confidence:</span><span className="font-bold text-brand-primary">{avgConf}%</span></div>
                          {isVideo && <div className="flex justify-between gap-8 text-xs"><span>Unique Violations:</span><span className="font-bold text-red-400">{uniqueViolations}</span></div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detection Table — Image mode */}
                {!isVideo && detections.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-medium border border-border-light overflow-hidden" data-animation-on-scroll="">
                    <div className="px-6 py-4 border-b border-border-light bg-neutral-surface">
                      <h3 className="font-heading font-bold">Detailed Detection List ({totalDetections})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-xs font-mono text-text-secondary uppercase border-b border-border-light">
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Class</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Confidence</th>
                            <th className="px-6 py-4">BBox</th>
                            {isTraffic && <th className="px-6 py-4">Plate OCR</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                          {detections.map((det: any, idx: number) => (
                            <tr key={idx} className="hover:bg-neutral-surface transition-colors">
                              <td className="px-6 py-4 font-mono text-sm">#{String(det.id).padStart(3, "0")}</td>
                              <td className="px-6 py-4 text-sm font-semibold">{det.display_name ?? det.class_name.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${priorityBadge(det.priority)}`}>{det.priority}</span>
                              </td>
                              <td className="px-6 py-4 text-sm">{(det.confidence * 100).toFixed(1)}%</td>
                              <td className="px-6 py-4 text-xs font-mono text-text-secondary">
                                ({det.bbox.x1},{det.bbox.y1}) → ({det.bbox.x2},{det.bbox.y2})
                              </td>
                              {isTraffic && (
                                <td className="px-6 py-4">
                                  {det.plate_text ? (
                                    <span className="text-xs font-mono bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-300">{det.plate_text}</span>
                                  ) : (
                                    <span className="text-xs text-text-secondary">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Unique Violations Table — Video mode */}
                {isVideo && violations.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-medium border border-border-light overflow-hidden" data-animation-on-scroll="">
                    <div className="px-6 py-4 border-b border-border-light bg-neutral-surface">
                      <h3 className="font-heading font-bold">Unique Tracked Violations ({uniqueViolations})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-xs font-mono text-text-secondary uppercase border-b border-border-light">
                            <th className="px-6 py-4">Track ID</th>
                            <th className="px-6 py-4">Violation</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">First Seen</th>
                            <th className="px-6 py-4">Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                          {violations.map((v: any, idx: number) => (
                            <tr key={idx} className="hover:bg-neutral-surface transition-colors">
                              <td className="px-6 py-4 font-mono text-sm">#{v.track_id}</td>
                              <td className="px-6 py-4 text-sm font-semibold">{v.display_name}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${priorityBadge(v.priority)}`}>{v.priority}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-text-secondary">{v.first_seen_sec.toFixed(1)}s</td>
                              <td className="px-6 py-4 text-sm">{(v.confidence * 100).toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* All Clear State */}
                {totalDetections === 0 && (
                  <div className="bg-white rounded-2xl shadow-medium border border-border-light p-12 text-center" data-animation-on-scroll="">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-lg font-bold mb-2">All Clear</h3>
                    <p className="text-text-secondary">No issues or violations were detected in this media.</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">

                {/* Priority Summary */}
                <div className="bg-white p-6 rounded-2xl shadow-medium border border-border-light" data-animation-on-scroll="">
                  <h3 className="font-heading font-bold mb-5">Priority Breakdown</h3>
                  <div className="space-y-4">
                    {[
                      { label: "High", color: "bg-red-500",    count: priorityCounts["High"] ?? 0 },
                      { label: "Medium", color: "bg-yellow-400", count: priorityCounts["Medium"] ?? 0 },
                      { label: "Low", color: "bg-green-400",   count: priorityCounts["Low"] ?? 0 },
                    ].map(({ label, color, count }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <div className={`w-3 h-3 rounded-full ${color}`} />
                            {label}
                          </div>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                        <div className="h-1.5 bg-neutral-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} transition-all duration-700`}
                            style={{ width: totalDetections > 0 ? `${(count / totalDetections) * 100}%` : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-border-light">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-secondary">Overall Priority</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${priorityBadge(overallPriority)}`}>{overallPriority}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Avg Confidence</span>
                      <span className="text-sm font-bold">{avgConf}%</span>
                    </div>
                  </div>
                </div>

                {/* Class Counts */}
                {Object.keys(classCounts).length > 0 && (
                  <div className="bg-white p-6 rounded-2xl shadow-medium border border-border-light" data-animation-on-scroll="">
                    <h3 className="font-heading font-bold mb-5">Detected Classes</h3>
                    <div className="space-y-3">
                      {Object.entries(classCounts).map(([cls, count]) => (
                        <div key={cls} className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary capitalize">{cls.split("_").join(" ")}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Advice */}
                <div className="bg-text-primary text-white p-6 rounded-2xl shadow-medium" data-animation-on-scroll="">
                  <h3 className="font-heading font-bold mb-4">AI Dispatch Advice</h3>
                  <p className="text-sm opacity-70 mb-6 leading-relaxed">
                    {totalDetections === 0
                      ? "No issues detected. No action required at this time."
                      : (priorityCounts["High"] ?? 0) > 0
                      ? `${priorityCounts["High"]} high-priority issue(s) detected. Dispatch a Tier-1 crew immediately. Schedule medium and low priority items for routine maintenance.`
                      : "No high-priority hazards. Schedule detected issues for routine maintenance."}
                  </p>
                  <Link href="/upload" className="block w-full py-3 bg-brand-primary text-text-primary font-bold rounded-md hover:scale-[1.02] transition-transform text-center">
                    Run New Analysis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
