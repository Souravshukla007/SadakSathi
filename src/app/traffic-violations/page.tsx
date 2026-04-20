"use client";

import React, { useState, useEffect, useRef } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import {
  detectTrafficImage,
  detectTrafficVideo,
  saveDetectionResult,
  TrafficAssessmentResponse,
  TrafficVideoAssessmentResponse,
  TrafficDetection,
  UniqueViolation,
} from "@/lib/mlApi";

// Violation type → tab label
const VIOLATION_CLASSES: Record<string, string> = {
  no_helmet:        "No Helmet",
  triple_riding:    "Triple Riding",
  wrong_side_moving:"Wrong Side",
  number_plate:     "Plate Detection",
};

const TABS = ["No Helmet", "Triple Riding", "Wrong Side", "Plate Detection"];

function priorityBadge(priority: string) {
  switch (priority?.toUpperCase()) {
    case "HIGH":   return "bg-red-100 text-red-600";
    case "MEDIUM": return "bg-yellow-100 text-yellow-600";
    default:       return "bg-green-100 text-green-600";
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TrafficViolationsPage() {
  const [activeTab, setActiveTab] = useState("No Helmet");

  // Upload + detection state
  const [file, setFile]               = useState<File | null>(null);
  const [mediaType, setMediaType]     = useState<"image" | "video">("image");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [results, setResults]         = useState<TrafficAssessmentResponse | TrafficVideoAssessmentResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  // ── Derived stats ──
  const imageResult = results as TrafficAssessmentResponse | null;
  const videoResult = results as TrafficVideoAssessmentResponse | null;

  const allDetections: TrafficDetection[] = (imageResult?.detections ?? []) as TrafficDetection[];
  const allViolations: UniqueViolation[]  = (videoResult?.violations  ?? []) as UniqueViolation[];

  const classCounts = imageResult?.class_counts ?? videoResult?.summary?.class_counts ?? {};
  const priorityCounts = imageResult?.priority_counts ?? videoResult?.summary?.priority_counts ?? {};

  const violationsCount = results ? (results.total_detections ?? 0) : 24;   // fallback to placeholder
  const avgConf = allDetections.length > 0
    ? (allDetections.reduce((s, d) => s + d.confidence, 0) / allDetections.length * 100).toFixed(1)
    : results ? "—" : "92.4";
  const vehicleCount = results
    ? ((classCounts["vehicle"] ?? 0) + (classCounts["motorcycle"] ?? 0) + (classCounts["car"] ?? 0) + (classCounts["bike"] ?? 0))
    : 1842;

  // Filter displayed detections by active tab
  const tabClassKey = Object.entries(VIOLATION_CLASSES).find(([, label]) => label === activeTab)?.[0];
  const filteredDetections = tabClassKey
    ? allDetections.filter((d) => d.class_name === tabClassKey)
    : allDetections;

  // ── Handlers ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResults(null);
    setError(null);
    setMediaType(f.type.startsWith("video/") ? "video" : "image");
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setResults(null);
    setError(null);
    setMediaType(f.type.startsWith("video/") ? "video" : "image");
  };

  const runAnalysis = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      let data: TrafficAssessmentResponse | TrafficVideoAssessmentResponse;
      if (mediaType === "image") {
        data = await detectTrafficImage(file);
      } else {
        data = await detectTrafficVideo(file);
      }
      saveDetectionResult(data, "traffic", mediaType, file.name);
      setResults(data);
    } catch (err: any) {
      setError(err.message ?? "Detection failed. Ensure the FastAPI server is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="flex-grow pt-16">
        <section className="py-12 md:py-20 px-6 bg-neutral-surface min-h-screen">
          <div className="max-w-7xl mx-auto">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12" data-animation-on-scroll="">
              <div>
                <div className="inline-block px-3 py-1.5 bg-red-100 rounded text-xs font-bold text-red-600 uppercase tracking-widest mb-4">
                  {results ? "Analysis Complete" : "Live Enforcement"}
                </div>
                <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">AI Traffic Enforcement</h1>
                <p className="text-text-secondary">Detecting safety violations using automated edge-AI vision models.</p>
              </div>
              {results && (
                <button
                  onClick={() => { setFile(null); setResults(null); setError(null); }}
                  className="px-6 py-3 bg-text-primary text-white font-bold rounded-lg shadow-soft flex items-center gap-2 hover:bg-neutral-dark"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4l16 16M4 20L20 4" strokeWidth="2" strokeLinecap="round" /></svg>
                  Clear Results
                </button>
              )}
            </div>

            {/* Violation Type Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-border-light" data-animation-on-scroll="">
              {TABS.map((tab) => {
                const tabKey = Object.entries(VIOLATION_CLASSES).find(([, l]) => l === tab)?.[0];
                const tabCount = tabKey ? (classCounts[tabKey] ?? 0) : 0;
                return (
                  <button
                    key={tab}
                    className={`px-6 py-3 text-sm transition-colors flex items-center gap-2 ${activeTab === tab ? "font-bold border-b-2 border-brand-primary text-brand-primary" : "font-medium text-text-secondary hover:text-text-primary"}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                    {results && tabCount > 0 && (
                      <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{tabCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left — Detection View */}
              <div className="lg:col-span-2 space-y-8" data-animation-on-scroll="">

                {/* Annotated Image / Placeholder */}
                <div className="bg-white rounded-3xl border border-border-light shadow-medium overflow-hidden">
                  <div className="aspect-video relative bg-neutral-dark flex items-center justify-center overflow-hidden">
                    {/* Annotated image (real result) */}
                    {imageResult?.annotated_image_base64 ? (
                      <img
                        src={`data:image/jpeg;base64,${imageResult.annotated_image_base64}`}
                        alt="Traffic AI Result"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <>
                        {/* Placeholder when no result */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="https://images.unsplash.com/photo-1595770367352-038e012e4e4e?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxDQ1RWJTIwZm9vdGFnZSUyMG9mJTIwdHJhZmZpYyUyMGp1bmN0aW9uJTIwd2l0aCUyMG1vdG9yY3ljbGVzfGVufDB8fHx8MTc3MjQ3NDY0OXww&ixlib=rb-4.1.0&w=1200&h=800&fit=crop&fm=jpg&q=80"
                          className="w-full h-full object-cover opacity-40"
                          alt="Traffic intersection"
                          loading="eager"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-white">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="text-sm opacity-60">Upload a traffic image or video to begin analysis</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Processing overlay */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                          <p className="font-bold text-sm">Running AI Analysis...</p>
                        </div>
                      </div>
                    )}

                    {/* Status bar */}
                    {results && (
                      <div className="absolute bottom-6 left-6 right-6 p-4 glass rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <div className="text-xs font-bold uppercase tracking-wider text-white">
                            Analysis Complete — {results.total_detections} Detection{results.total_detections !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="text-xs font-mono text-white/70">
                          {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <p className="font-bold text-red-800 text-sm">Detection Failed</p>
                      <p className="text-sm text-red-700 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Detection Stream Table */}
                <div className="bg-white rounded-2xl border border-border-light shadow-soft overflow-hidden">
                  <div className="p-6 border-b border-border-light">
                    <h3 className="font-heading font-bold">
                      {results ? `Detection Stream — ${filteredDetections.length} result(s) for "${activeTab}"` : "Detection Stream"}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-neutral-surface text-[10px] font-bold uppercase text-text-secondary">
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Violation Type</th>
                          <th className="px-6 py-4">Confidence</th>
                          <th className="px-6 py-4">Priority</th>
                          <th className="px-6 py-4">Plate OCR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {results ? (
                          filteredDetections.length > 0 ? (
                            filteredDetections.map((det, idx) => (
                              <tr key={idx}>
                                <td className="px-6 py-4 text-xs font-mono">#{String(det.id).padStart(3, "0")}</td>
                                <td className="px-6 py-4 text-sm font-bold">{det.display_name}</td>
                                <td className="px-6 py-4 text-sm">{(det.confidence * 100).toFixed(1)}%</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${priorityBadge(det.priority)}`}>{det.priority}</span>
                                </td>
                                <td className="px-6 py-4">
                                  {det.plate_text ? (
                                    <span className="text-xs font-mono bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-300">{det.plate_text}</span>
                                  ) : <span className="text-xs text-text-secondary">—</span>}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-text-secondary text-sm">
                                No {activeTab} violations detected in this media.
                              </td>
                            </tr>
                          )
                        ) : (
                          /* Placeholder rows before first analysis */
                          <>
                            <tr>
                              <td className="px-6 py-4 text-xs font-mono">14:22:10</td>
                              <td className="px-6 py-4 text-sm font-bold">No Helmet</td>
                              <td className="px-6 py-4 text-sm">98.4%</td>
                              <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-600 rounded text-[10px] font-bold uppercase">High</span></td>
                              <td className="px-6 py-4 text-xs text-text-secondary italic">Demo data</td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 text-xs font-mono">14:21:45</td>
                              <td className="px-6 py-4 text-sm font-bold">Wrong Side Driving</td>
                              <td className="px-6 py-4 text-sm">94.1%</td>
                              <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-[10px] font-bold uppercase">Medium</span></td>
                              <td className="px-6 py-4 text-xs text-text-secondary italic">Demo data</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-8" data-animation-on-scroll="">

                {/* Live Stats */}
                <div className="bg-white p-8 rounded-3xl border border-border-light shadow-medium">
                  <h3 className="text-lg font-heading font-bold mb-6">Traffic Analytics</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-secondary font-medium">Violations Detected</span>
                        <span className="text-xl font-bold text-red-500">{violationsCount}</span>
                      </div>
                      <div className="h-2 bg-neutral-surface rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${Math.min((violationsCount / 50) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-secondary font-medium">Avg. Confidence</span>
                        <span className="text-xl font-bold text-brand-primary">{avgConf}%</span>
                      </div>
                      <div className="h-2 bg-neutral-surface rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary transition-all duration-700" style={{ width: `${parseFloat(String(avgConf)) || 0}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary font-medium">Vehicle Count</span>
                      <span className="text-xl font-bold">{vehicleCount.toLocaleString()}</span>
                    </div>
                  </div>

                  {results && (priorityCounts["High"] ?? 0) > 0 && (
                    <div className="mt-8 pt-8 border-t border-border-light">
                      <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                        <p className="text-[10px] font-bold text-red-600 uppercase mb-1">⚠ High Priority Alert</p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          <span className="font-bold text-text-primary">{priorityCounts["High"]}</span> high-priority violation{priorityCounts["High"] !== 1 ? "s" : ""} detected. Recommend immediate enforcement action.
                        </p>
                      </div>
                    </div>
                  )}

                  {!results && (
                    <div className="mt-8 pt-8 border-t border-border-light">
                      <div className="bg-brand-primary/10 p-4 rounded-xl">
                        <p className="text-[10px] font-bold text-brand-primary uppercase mb-1">Infrastructure Alert</p>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Upload traffic footage below to get real-time violation analysis from the AI model.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Panel */}
                <div className="bg-text-primary text-white p-8 rounded-3xl shadow-medium">
                  <h3 className="text-lg font-heading font-bold mb-4">Run Manual Audit</h3>
                  <p className="text-sm opacity-70 mb-6">
                    Upload traffic camera feed or recorded dashcam footage to generate a violation report.
                  </p>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/avi,video/quicktime"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Drop Zone */}
                  <div
                    className="border border-white/20 border-dashed rounded-xl p-6 text-center mb-6 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={triggerFileInput}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div>
                        <svg className="w-6 h-6 mx-auto text-brand-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-xs font-bold text-brand-primary block truncate px-2">{file.name}</span>
                        <span className="text-[10px] opacity-50 mt-1 block">{(file.size / (1024 * 1024)).toFixed(2)} MB · {mediaType.toUpperCase()}</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 mx-auto text-brand-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth="2" /></svg>
                        <span className="text-xs font-bold uppercase tracking-wider">Upload Feed</span>
                        <span className="text-[10px] opacity-50 mt-1 block">JPG · PNG · MP4 · MOV</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={runAnalysis}
                    disabled={!file || isAnalyzing}
                    className={`w-full py-4 font-bold rounded-xl transition-all ${
                      !file || isAnalyzing
                        ? "bg-white/20 text-white/40 cursor-not-allowed"
                        : "bg-brand-primary text-text-primary hover:scale-[1.02]"
                    }`}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analysing...
                      </span>
                    ) : (
                      "Start AI Analysis"
                    )}
                  </button>

                  {file && !isAnalyzing && (
                    <button
                      onClick={() => { setFile(null); setResults(null); setError(null); }}
                      className="w-full mt-3 py-2 text-xs font-semibold text-white/50 hover:text-white/80 transition-colors"
                    >
                      Clear file
                    </button>
                  )}
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
