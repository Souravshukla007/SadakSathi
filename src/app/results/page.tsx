"use client";

import React, { Suspense, useMemo, useSyncExternalStore } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Film, Fingerprint, Gauge, ImageOff, Loader2, Plus, ScanLine, TriangleAlert } from "lucide-react";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/dashboard/PageHero";
import StatTile from "@/components/dashboard/StatTile";
import EmptyState, { RoadIllustration } from "@/components/dashboard/EmptyState";
import DetectionCard from "@/components/dashboard/DetectionCard";
import { PriorityBadge } from "@/components/dashboard/StatusBadge";
import {
  getLastDetection,
  getDetectionHistory,
  getLastVideoBlobUrl,
  MlResultView,
  relativeTime,
  prefillFromScan,
} from "@/lib/mlApi";

const noopSubscribe = () => () => {};

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

function ResultsPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  // false during prerender/hydration, true on the client: sessionStorage and the blob URL exist only there.
  const loaded = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const engineFilter = searchParams.get("engine");
  const stored = useMemo(() => {
    if (!loaded) return null;
    if (engineFilter) return getDetectionHistory().find(d => d.engine === engineFilter) || null;
    return getLastDetection();
  }, [loaded, engineFilter]);
  const videoBlobUrl = loaded ? getLastVideoBlobUrl() : null;

  // ── Submit Complaint handler ──────────────────────────────────────────────
  const handleSubmitComplaint = () => {
    if (!stored) return;
    prefillFromScan(stored.result as MlResultView, stored.engine, stored.fileName);
    router.push("/complaints?prefill=1");
  };

  // ── Loading ──
  if (!loaded) {
    return (
      <>
        <AppHeader />
        <main id="main-content" className="flex-grow pt-16 min-h-screen bg-neutral-surface flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-sign-green" aria-label="Loading result" />
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
        <main id="main-content" className="flex-grow pt-16 min-h-screen road-glow flex items-center justify-center px-4">
          <div className="text-center max-w-md flex flex-col items-center">
            <RoadIllustration className="w-52 h-auto mb-6" />
            <h1 className="font-heading text-2xl font-normal tracking-tighter mb-2">No scan results yet</h1>
            <p className="text-text-secondary mb-6">Scan a photo or video first. The result appears here, and you can turn it into a report.</p>
            <Link href="/upload" className="inline-flex items-center gap-2 min-h-12 px-6 bg-text-primary text-neutral-background font-bold rounded-lg hover:opacity-90 transition-colors">
              <ScanLine className="w-4 h-4" aria-hidden="true" />
              Scan a photo
            </Link>
          </div>
        </main>
        <AppFooter />
      </>
    );
  }

  // ── Derive result fields ──
  const result = stored.result as MlResultView;
  const isTraffic  = stored.engine === "traffic";
  const isVideo    = stored.mediaType === "video";

  const annotatedB64: string | null = result.annotated_image_base64 ?? null;
  const detections = result.detections ?? [];
  const totalDetections: number = result.total_detections ?? 0;
  const overallPriority: string = result.road_priority ?? result.overall_priority ?? "Low";
  // For video responses, priority_counts is now at top level (same as image)
  const priorityCounts: Record<string, number> = result.priority_counts ?? result.summary?.priority_counts ?? {};
  const classCounts: Record<string, number>    = result.class_counts ?? result.summary?.class_counts ?? {};
  const avgConf = avgConfidence(detections);

  // Video-specific
  const violations = result.violations ?? [];
  const uniqueViolations: number = result.unique_tracked_violations ?? 0;
  const totalFramesAnalyzed: number = result.total_frames_analyzed ?? 0;
  const videoFps: number = result.summary?.fps ?? 0;
  const videoSampleRate: number = result.summary?.sample_rate ?? 5;

  const highCount = priorityCounts["High"] ?? 0;
  const prettyClass = (name: string) => {
    const s = name.split("_").join(" ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const mediumCount = priorityCounts["Medium"] ?? 0;
  const lowCount = priorityCounts["Low"] ?? 0;
  const priorityTotal = highCount + mediumCount + lowCount;
  const priorityRows = [
    { label: "High", color: "bg-signal-red", count: highCount },
    { label: "Medium", color: "bg-hazard", count: mediumCount },
    { label: "Low", color: "bg-text-light", count: lowCount },
  ];
  // Donut segments, in the same order and colours as the legend.
  const cutHigh = priorityTotal ? (highCount / priorityTotal) * 100 : 0;
  const cutMedium = priorityTotal ? ((highCount + mediumCount) / priorityTotal) * 100 : 0;
  const donut = priorityTotal
    ? `conic-gradient(var(--color-signal-red) 0 ${cutHigh}%, var(--color-hazard) ${cutHigh}% ${cutMedium}%, var(--color-text-light) ${cutMedium}% 100%)`
    : "var(--color-neutral-surface)";
  const priorityKey = overallPriority.toLowerCase();
  const priorityTone = priorityKey === "high" ? "red" as const : priorityKey === "medium" ? "amber" as const : "neutral" as const;
  const summary = [
    { label: "Detections", icon: ScanLine, tone: "neutral" as const, value: String(totalDetections) },
    { label: "Average confidence", icon: Gauge, tone: "green" as const, value: `${avgConf}%` },
    { label: "Overall priority", icon: TriangleAlert, tone: priorityTone, value: overallPriority.charAt(0).toUpperCase() + overallPriority.slice(1) },
    ...(isVideo ? [
      { label: "Frames analysed", icon: Film, tone: "neutral" as const, value: String(totalFramesAnalyzed) },
      { label: "Unique violations", icon: Fingerprint, tone: "neutral" as const, value: String(uniqueViolations) },
    ] : []),
  ];
  const classTotal = Object.values(classCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <AppHeader />
      <main id="main-content" className="flex-grow pt-16 bg-neutral-surface">
        <PageHero
          title="Scan result"
          top={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href="/upload" className="text-sign-green hover:underline font-bold inline-flex items-center gap-1 min-h-11">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back to scan
              </Link>
              <span className="text-text-secondary">Result <span className="font-mono" translate="no">#{stored.id}</span></span>
            </div>
          }
          description={<span className="break-words"><span className="font-semibold text-text-primary">{stored.fileName}</span>, scanned {relativeTime(stored.timestamp)} for {isTraffic ? "traffic violations" : "road hazards"}</span>}
          actions={
            <>
              <button
                type="button"
                onClick={handleSubmitComplaint}
                className="justify-center min-h-12 px-5 bg-text-primary text-neutral-background font-bold rounded-lg flex items-center gap-2 hover:opacity-90 transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                {isTraffic ? "Report this violation" : "Report this hazard"}
              </button>
              <button
                type="button"
                onClick={() => downloadJSON(stored.result, `sadaksathi-${stored.id}.json`)}
                className="justify-center min-h-12 px-5 bg-surface border border-border-light text-text-primary font-bold rounded-lg flex items-center gap-2 hover:border-border-dark transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download data (JSON)
              </button>
            </>
          }
        />
        <section className="py-8 md:py-12 px-4 sm:px-6 min-h-screen">
          <div className="max-w-6xl mx-auto">

            {/* Headline figures */}
            <dl className={`grid grid-cols-2 gap-3 sm:gap-4 mb-6 ${isVideo ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
              {summary.map(({ label, icon, tone, value }, i) => (
                <StatTile key={label} icon={icon} label={label} tone={tone} value={value} delay={i * 70}
                  className={i === summary.length - 1 && summary.length % 2 === 1 ? "col-span-2 lg:col-span-1" : ""} />
              ))}
            </dl>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Media + detections */}
              <div className="lg:col-span-2 space-y-6 min-w-0">

                {/* Media panel */}
                <div className="bg-surface rounded-xl border border-border-light elevated overflow-hidden">
                  {isVideo && videoBlobUrl ? (
                    <div className="bg-asphalt">
                      <video
                        src={videoBlobUrl}
                        controls
                        className="w-full max-h-[520px] object-contain"
                        playsInline
                      />
                      {annotatedB64 && (
                        <div className="p-4 border-t border-white/10">
                          <p className="text-sm text-white/75 mb-2">Clearest frame, with detections outlined</p>
                          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data/API image */}
                          <img
                            src={`data:image/jpeg;base64,${annotatedB64}`}
                            alt="Video frame with detected issues outlined"
                            className="w-full max-h-48 object-contain rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative overflow-hidden bg-asphalt aspect-video flex items-center justify-center">
                      {annotatedB64 ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data/API image */}
                          <img
                            src={`data:image/jpeg;base64,${annotatedB64}`}
                            alt="Uploaded photo with detected issues outlined"
                            className="w-full h-full object-contain"
                          />
                          {/* One pass of the detector's scan line when the result first appears. */}
                          <span aria-hidden="true" className="animate-scan-once pointer-events-none absolute inset-x-0 h-0.5 bg-hazard shadow-[0_0_14px_3px_color-mix(in_srgb,var(--color-hazard)_60%,transparent)]" />
                        </>
                      ) : (
                        <div className="text-center text-white/75 p-8">
                          <ImageOff className="w-10 h-10 mx-auto mb-3" aria-hidden="true" />
                          <p className="text-sm">{isVideo ? "Nothing was detected, so there is no frame to show." : "The scan did not return a marked-up image."}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Video stats — road hazard video mode */}
                {isVideo && !isTraffic && (
                  <div className="bg-surface rounded-xl border border-border-light elevated overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-border-light">
                      <h2 className="font-heading font-bold">Video summary</h2>
                    </div>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-light">
                      {[
                        { label: "Frames analysed", value: String(totalFramesAnalyzed) },
                        { label: "Detections", value: String(totalDetections) },
                        { label: "Frames sampled", value: `Every ${videoSampleRate}th` },
                        { label: "Source frame rate", value: videoFps > 0 ? `${videoFps.toFixed(1)} fps` : "–" },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-surface px-4 py-4">
                          <dt className="text-sm text-text-secondary">{label}</dt>
                          <dd className="text-2xl font-bold font-heading tracking-tight tabular-nums mt-1">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Detection cards — image mode */}
                {!isVideo && detections.length > 0 && (
                  <section aria-labelledby="detections-title">
                    <h2 id="detections-title" className="font-heading font-bold text-lg mb-3">Everything detected ({totalDetections})</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {detections.map((det, idx) => (
                        <Reveal as="li" key={idx} delay={Math.min(idx, 6) * 70}>
                          <DetectionCard
                            title={det.display_name ?? prettyClass(det.class_name)}
                            priority={det.priority}
                            confidence={det.confidence}
                            showPlate={isTraffic}
                            plate={det.plate_text}
                            meta={
                              <>
                                <span className="font-mono">#{String(det.id).padStart(3, "0")}</span>
                                <span className="tabular-nums">, at ({det.bbox.x1}, {det.bbox.y1}) to ({det.bbox.x2}, {det.bbox.y2}) px</span>
                              </>
                            }
                          />
                        </Reveal>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Unique violations — video mode */}
                {isVideo && violations.length > 0 && (
                  <section aria-labelledby="violations-title">
                    <h2 id="violations-title" className="font-heading font-bold text-lg mb-3">Unique violations tracked ({uniqueViolations})</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {violations.map((v, idx) => (
                        <Reveal as="li" key={idx} delay={Math.min(idx, 6) * 70}>
                          <DetectionCard
                            title={v.display_name}
                            priority={v.priority}
                            confidence={v.confidence}
                            meta={<>Track <span className="font-mono">#{v.track_id}</span>, first seen at {v.first_seen_sec.toFixed(1)}s</>}
                            showPlate={Boolean(v.plate_text)}
                            plate={v.plate_text}
                          />
                        </Reveal>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Nothing found */}
                {totalDetections === 0 && (
                  <div className="bg-surface rounded-xl border border-border-light elevated">
                    <EmptyState
                      headingLevel={2}
                      title="Nothing found"
                      action={
                        <button type="button" onClick={handleSubmitComplaint} className="inline-flex items-center min-h-11 px-5 border border-border-light rounded-lg text-sm font-bold hover:border-border-dark transition-colors">
                          Report a hazard
                        </button>
                      }
                    >
                      The AI did not detect any hazards or violations. If you can see a problem, report it yourself.
                    </EmptyState>
                  </div>
                )}
              </div>

              {/* Side column */}
              <div className="space-y-6">

                {/* Priority breakdown: donut + legend */}
                <div className="animate-rise [animation-delay:150ms] bg-surface rounded-xl border border-border-light elevated overflow-hidden">
                  {highCount > 0 && <div className="hazard-stripe animate-stripe-slide h-1.5" aria-hidden="true" />}
                  <div className="p-5">
                    <h2 className="font-heading font-bold mb-4">Priority breakdown</h2>
                    <div className="flex items-center gap-5">
                      <div
                        className="animate-pop [animation-delay:300ms] relative w-32 h-32 flex-shrink-0 rounded-full"
                        style={{ background: donut }}
                        role="img"
                        aria-label={`${highCount} high, ${mediumCount} medium and ${lowCount} low priority detections`}
                      >
                        <div className="absolute inset-3.5 rounded-full bg-surface grid place-items-center text-center">
                          <div>
                            <div className="font-heading text-3xl font-normal tracking-tighter tabular-nums leading-none">{priorityTotal}</div>
                            <div className="text-xs text-text-secondary mt-1">detections</div>
                          </div>
                        </div>
                      </div>
                      <ul className="flex-1 min-w-0 space-y-3">
                        {priorityRows.map(({ label, color, count }) => (
                          <li key={label}>
                            <div className="flex items-center justify-between mb-1 text-sm">
                              <span className="flex items-center gap-2 font-medium">
                                <span className={`w-2.5 h-2.5 rounded-full ${color}`} aria-hidden="true" />
                                {label}
                              </span>
                              <span className="font-bold tabular-nums">{count}</span>
                            </div>
                            <div className="h-1.5 bg-neutral-surface rounded-full overflow-hidden" aria-hidden="true">
                              <div
                                className={`h-full rounded-full origin-left animate-[bar-fill_700ms_var(--ease-out-sign)_both] ${color}`}
                                style={{ width: priorityTotal > 0 ? `${(count / priorityTotal) * 100}%` : "0%" }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <dl className="mt-5 pt-4 border-t border-border-light space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-text-secondary">Overall priority</dt>
                        <dd className="animate-pop [animation-delay:250ms]"><PriorityBadge priority={overallPriority} /></dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-text-secondary">Average confidence</dt>
                        <dd className="font-bold tabular-nums">{avgConf}%</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Class counts */}
                {Object.keys(classCounts).length > 0 && (
                  <div className="bg-surface p-5 rounded-xl border border-border-light elevated">
                    <h2 className="font-heading font-bold mb-4">{isVideo ? "Detected types, across all frames" : "Detected types"}</h2>
                    <ul className="space-y-3">
                      {Object.entries(classCounts).map(([cls, count]) => (
                        <li key={cls}>
                          <div className="flex items-center justify-between gap-3 mb-1 text-sm">
                            <span className="min-w-0 break-words">{prettyClass(cls)}</span>
                            <span className="font-bold tabular-nums">{count}</span>
                          </div>
                          <div className="h-1.5 bg-neutral-surface rounded-full overflow-hidden" aria-hidden="true">
                            <div
                              className="h-full rounded-full bg-sign-green origin-left animate-[bar-fill_700ms_var(--ease-out-sign)_both]"
                              style={{ width: classTotal > 0 ? `${(count / classTotal) * 100}%` : "0%" }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What next */}
                <div className="relative overflow-hidden bg-asphalt text-white p-5 pt-6 rounded-xl elevated">
                  <h2 className="font-heading font-bold mb-2">What happens next</h2>
                  <p className="text-sm text-white/80 mb-5 leading-relaxed">
                    {totalDetections === 0
                      ? "Nothing was detected. If you can still see a problem, report it yourself."
                      : highCount > 0
                      ? `${highCount} high-priority issue${highCount !== 1 ? "s" : ""} found. Report it so the ${isTraffic ? "traffic" : "municipal"} department can act quickly.`
                      : `No high-priority issues. Reporting still helps the ${isTraffic ? "traffic" : "municipal"} department plan repairs.`}
                  </p>
                  <Link href="/upload" className="flex items-center justify-center gap-2 w-full min-h-11 border border-white/40 text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-sm">
                    <ScanLine className="w-4 h-4" aria-hidden="true" />
                    Scan another file
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

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsPageInner />
    </Suspense>
  );
}
