"use client";

import React, { useState, useEffect, useRef } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { Upload, CircleAlert, CircleCheck, Construction, Image as ImageIcon, Loader2, ScanLine, TrafficCone, Video } from "lucide-react";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/dashboard/PageHero";
import EmptyState from "@/components/dashboard/EmptyState";
import DetectionCard from "@/components/dashboard/DetectionCard";
import { PriorityBadge } from "@/components/dashboard/StatusBadge";
import { MlResultView, prefillFromScan, saveDetectionResult, setLastVideoBlobUrl } from "@/lib/mlApi";
import { useRouter } from "next/navigation";

type EngineType = "road" | "traffic";
type MediaType = "IMAGE" | "VIDEO";

export default function UploadPage() {
    // UI State
    const router = useRouter();
    const [engine, setEngine] = useState<EngineType>("road");
    const [activeTab, setActiveTab] = useState<MediaType>("IMAGE");
    
    // File State
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Flag: set to true just before router.push('/results') so the cleanup
    // effect doesn't revoke a blob URL that the results page still needs.
    const navigatingRef = useRef(false);

    // Processing State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Results State
    const [results, setResults] = useState<MlResultView | null>(null);

    // Cleanup object URL on unmount to prevent memory leaks,
    // but only if we are NOT navigating to the results page.
    useEffect(() => {
        return () => {
            if (!navigatingRef.current && previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setResults(null);
            setError(null);

            // Generate short-lived local preview URL
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
            setResults(null);
            setError(null);
            
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(droppedFile));
        }
    };

    const runAnalysis = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);
        setResults(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("conf_threshold", "0.13");

        // Determine media type (image vs video)
        const mediaType = activeTab === "IMAGE" ? "image" : "video";

        // Build proxy endpoint URL
        const endpoint = `/api/ml/detect?engine=${engine}&mediaType=${mediaType}`;

        if (activeTab === "IMAGE") {
            formData.append("include_annotated", "true");
        }
        if (engine === "traffic") {
            formData.append("run_ocr", "true");
        }

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                if (res.status === 503) {
                    throw new Error("The AI detector is offline right now. Try again in a few minutes.");
                }
                const errorData = await res.json().catch(() => null);
                // FastAPI validation errors put a list in `detail`; only show it when it's plain text.
                const detail = typeof errorData?.detail === "string" ? errorData.detail : null;
                throw new Error(detail || errorData?.message || `The scan service returned an error (${res.status}). Try again.`);
            }

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || "This file could not be scanned. Try a different photo or video.");
            }

            // Persist result to sessionStorage for /results page
            saveDetectionResult(data, engine, mediaType, file.name);

            // For video uploads, keep the blob URL alive so /results can play it
            if (mediaType === "video" && previewUrl) {
                setLastVideoBlobUrl(previewUrl);
                navigatingRef.current = true;
            }

            setResults(data);

        } catch (err) {
            console.error("Analysis failed:", err);
            setError((err instanceof Error && err.message) || "Something went wrong while scanning. Try again, or use a different file.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const prettyClass = (name: string) => {
        const s = name.split("_").join(" ");
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const switchTab = (tab: MediaType) => {
        setActiveTab(tab);
        if (file) { setFile(null); setResults(null); setPreviewUrl(null); }
    };

    const engines = [
        { id: "road" as const, icon: Construction, title: "Road hazards", desc: "Potholes, open manholes, garbage and fallen trees." },
        { id: "traffic" as const, icon: TrafficCone, title: "Traffic violations", desc: "Riders without helmets and triple riding. Reads number plates." },
    ];

    const kind = activeTab === "IMAGE" ? "photo" : "video";

    return (
        <>
            <AppHeader />
            <main id="main-content" className="flex-grow pt-16 bg-neutral-surface">
                <PageHero
                    maxWidth="max-w-4xl"
                    title="Scan a photo or video"
                    description="Choose what to look for and upload your media. The AI marks every hazard or violation it finds, and you can turn the result into a report."
                />
                <section className="py-8 md:py-12 px-4 sm:px-6 min-h-screen">
                    <div className="max-w-4xl mx-auto">

                        {/* Engine selector */}
                        <fieldset className="mb-6">
                            <legend className="text-sm font-semibold text-text-primary mb-3">What should the AI look for?</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {engines.map(({ id, icon: Icon, title, desc }, i) => {
                                    const on = engine === id;
                                    return (
                                        <Reveal key={id} delay={i * 70}>
                                            <button
                                                type="button"
                                                onClick={() => { setEngine(id); setResults(null); }}
                                                aria-pressed={on}
                                                className={`lift elevated relative w-full h-full p-4 sm:p-5 rounded-xl border-2 text-left flex items-start gap-4 ${
                                                    on ? "border-sign-green bg-surface bg-linear-to-br from-sign-green/8 to-transparent to-70%" : "border-border-light bg-surface hover:border-border-dark"
                                                }`}
                                            >
                                                <span className={`w-11 h-11 rounded-lg grid place-items-center flex-shrink-0 transition-colors ${on ? "bg-text-primary text-neutral-background" : "bg-neutral-surface text-text-secondary border border-border-light"}`}>
                                                    <Icon className="w-6 h-6" aria-hidden="true" />
                                                </span>
                                                <span className="min-w-0 pr-6">
                                                    <span className="block font-heading text-lg font-bold">{title}</span>
                                                    <span className="block text-sm text-text-secondary mt-0.5">{desc}</span>
                                                </span>
                                                {on && <CircleCheck key={id} className="animate-pop absolute top-4 right-4 w-5 h-5 text-sign-green" aria-hidden="true" />}
                                            </button>
                                        </Reveal>
                                    );
                                })}
                            </div>
                        </fieldset>

                        {/* Upload widget */}
                        <div className="bg-surface rounded-xl border border-border-light elevated overflow-hidden">

                            {/* Media tabs */}
                            <div className="flex border-b border-border-light" role="group" aria-label="Media type">
                                {([["IMAGE", "Photo", ImageIcon], ["VIDEO", "Video", Video]] as const).map(([tab, label, Icon]) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        aria-pressed={activeTab === tab}
                                        onClick={() => switchTab(tab)}
                                        className={`flex-1 min-h-12 text-sm font-bold border-b-2 -mb-px inline-flex items-center justify-center gap-2 transition-colors ${activeTab === tab ? 'border-sign-green text-text-primary bg-sign-green/5' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-neutral-surface'}`}
                                    >
                                        <Icon className="w-4 h-4" aria-hidden="true" />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 sm:p-8">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept={activeTab === "IMAGE" ? "image/jpeg, image/png, image/webp" : "video/mp4, video/avi, video/quicktime"}
                                    className="hidden"
                                    aria-label={activeTab === "IMAGE" ? "Choose a photo" : "Choose a video"}
                                />

                                {!file ? (
                                    <button
                                        type="button"
                                        className={`group w-full border-2 border-dashed rounded-xl *:pointer-events-none px-4 py-10 sm:py-14 text-center transition-[border-color,background-color,transform] duration-200 ${
                                            isDragging ? "border-sign-green bg-sign-green/8 scale-[1.01]" : "border-border-light hover:border-sign-green hover:bg-sign-green/5"
                                        }`}
                                        onClick={triggerFileInput}
                                        onDragOver={handleDragOver}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                    >
                                        <span
                                            key={isDragging ? "drag" : "idle"}
                                            className={`mx-auto mb-4 w-16 h-16 rounded-2xl grid place-items-center transition-colors ${
                                                isDragging ? "animate-pop bg-text-primary text-neutral-background" : "bg-neutral-surface text-text-secondary border border-border-light group-hover:border-sign-green"
                                            }`}
                                        >
                                            <Upload size={28} aria-hidden="true" />
                                        </span>
                                        <span className="block text-lg font-heading font-bold mb-1">
                                            {isDragging ? `Drop to add this ${kind}` : activeTab === "IMAGE" ? "Upload photo" : "Upload video"}
                                        </span>
                                        <span className="block text-sm text-text-secondary mb-5">
                                            Drag a file here or choose one. {activeTab === "IMAGE" ? <>JPG, PNG or WEBP, up to 20&nbsp;MB.</> : <>MP4, AVI or MOV, up to 100&nbsp;MB.</>}
                                        </span>
                                        <span className="inline-flex items-center min-h-11 px-6 bg-asphalt text-white text-sm font-bold rounded-lg">Choose file</span>
                                    </button>
                                ) : (
                                    <div className="animate-pop rounded-xl border border-border-light overflow-hidden bg-neutral-surface">
                                        {/* Preview, with the detector's scan line sweeping it while the request runs */}
                                        <div className="relative bg-asphalt aspect-video flex items-center justify-center overflow-hidden">
                                            {previewUrl && activeTab === "IMAGE" && (
                                                // eslint-disable-next-line @next/next/no-img-element -- dynamic data/API image (local blob: preview)
                                                <img src={previewUrl} alt="Selected photo" className="w-full h-full object-contain" />
                                            )}
                                            {previewUrl && activeTab === "VIDEO" && (
                                                <video src={previewUrl} className="w-full h-full object-contain" muted playsInline />
                                            )}
                                            {isAnalyzing && (
                                                <>
                                                    <span aria-hidden="true" className="absolute inset-0 bg-sign-green/15" />
                                                    {/* Viewfinder corners */}
                                                    <span aria-hidden="true" className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-hazard rounded-tl" />
                                                    <span aria-hidden="true" className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-hazard rounded-tr" />
                                                    <span aria-hidden="true" className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-hazard rounded-bl" />
                                                    <span aria-hidden="true" className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-hazard rounded-br" />
                                                    <span aria-hidden="true" className="animate-scan pointer-events-none absolute inset-x-0 h-0.5 bg-hazard shadow-[0_0_14px_3px_color-mix(in_srgb,var(--color-hazard)_60%,transparent)]" />
                                                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-asphalt/85 text-white text-sm font-semibold">
                                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                        {engine === "road" ? "Looking for hazards…" : "Looking for violations…"}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="w-10 h-10 rounded-lg grid place-items-center flex-shrink-0 bg-surface border border-border-light text-text-secondary">
                                                    {activeTab === "IMAGE" ? <ImageIcon className="w-5 h-5" aria-hidden="true" /> : <Video className="w-5 h-5" aria-hidden="true" />}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate" title={file.name}>{file.name}</p>
                                                    <p className="text-sm text-text-secondary tabular-nums">
                                                        {(file.size / (1024 * 1024)).toFixed(2)}&nbsp;MB
                                                        <span aria-hidden="true" className="mx-2 text-border-dark">|</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setFile(null); setPreviewUrl(null); setResults(null); setError(null); }}
                                                            disabled={isAnalyzing}
                                                            className="font-semibold text-text-secondary hover:text-text-primary underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
                                                        >
                                                            Choose another file
                                                        </button>
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={runAnalysis}
                                                disabled={isAnalyzing}
                                                className="w-full sm:w-auto min-h-12 px-6 font-bold rounded-lg text-neutral-background bg-text-primary hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                                            >
                                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ScanLine className="w-4 h-4" aria-hidden="true" />}
                                                {isAnalyzing ? "Scanning…" : engine === "road" ? "Scan for hazards" : "Scan for violations"}
                                            </button>
                                        </div>
                                        <p className="sr-only" role="status">{isAnalyzing ? `Scanning your ${kind}. This can take a few seconds.` : ""}</p>
                                    </div>
                                )}

                                {error && (
                                    <div role="alert" className="animate-pop mt-6 p-4 bg-signal-red/5 border border-signal-red/40 border-l-4 border-l-signal-red rounded-lg flex gap-3 items-start">
                                        <CircleAlert className="text-signal-red flex-shrink-0 mt-0.5" size={20} aria-hidden="true" />
                                        <div>
                                            <p className="font-bold text-text-primary">Scan failed</p>
                                            <p className="text-sm text-text-secondary mt-0.5">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Results */}
                        {results && (
                            <div className="animate-rise mt-8 bg-surface rounded-xl border border-border-light elevated overflow-hidden" id="results-panel">
                                <div className="px-4 sm:px-6 py-4 border-b border-border-light flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-heading font-bold">Scan result</h2>
                                        <p className="text-sm text-text-secondary">{results.message}</p>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                        <div className="text-sm text-text-secondary flex items-center gap-2">
                                            Overall priority
                                            <span className="animate-pop [animation-delay:250ms]"><PriorityBadge priority={results.road_priority || results.overall_priority} /></span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (activeTab === "VIDEO" && previewUrl) {
                                                    setLastVideoBlobUrl(previewUrl);
                                                    navigatingRef.current = true;
                                                }
                                                router.push("/results");
                                            }}
                                            className="min-h-11 px-4 bg-asphalt text-white text-sm font-bold rounded-lg hover:bg-asphalt/90 transition-colors"
                                        >
                                            See full report
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-6">
                                    {results.annotated_image_base64 && (
                                        <div className="relative mb-6 rounded-lg overflow-hidden bg-asphalt">
                                            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data/API image */}
                                            <img
                                                src={`data:image/jpeg;base64,${results.annotated_image_base64}`}
                                                alt="Uploaded photo with detected issues outlined"
                                                className="w-full h-auto object-contain max-h-[600px]"
                                            />
                                            <span aria-hidden="true" className="animate-scan-once pointer-events-none absolute inset-x-0 h-0.5 bg-hazard shadow-[0_0_14px_3px_color-mix(in_srgb,var(--color-hazard)_60%,transparent)]" />
                                        </div>
                                    )}

                                    {results.detections && results.detections.length > 0 && (
                                        <div>
                                            <h3 className="font-bold mb-3">Found {results.total_detections} issue{results.total_detections !== 1 ? 's' : ''}</h3>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {results.detections.map((det, idx) => (
                                                    <Reveal as="li" key={idx} delay={Math.min(idx, 6) * 70}>
                                                        <DetectionCard
                                                            title={det.display_name || prettyClass(det.class_name)}
                                                            priority={det.priority}
                                                            confidence={det.confidence}
                                                            showPlate={engine === "traffic"}
                                                            plate={det.plate_text}
                                                        />
                                                    </Reveal>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {results.violations && results.violations.length > 0 && (
                                        <div>
                                            <h3 className="font-bold mb-3">{results.unique_tracked_violations} unique violation{results.unique_tracked_violations !== 1 ? 's' : ''} tracked</h3>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {results.violations.map((v, idx) => (
                                                    <Reveal as="li" key={idx} delay={Math.min(idx, 6) * 70}>
                                                        <DetectionCard
                                                            title={v.display_name || prettyClass(v.class_name)}
                                                            priority={v.priority}
                                                            confidence={v.confidence}
                                                            meta={<>Track <span className="font-mono">#{v.track_id}</span>, first seen at {v.first_seen_sec}s</>}
                                                            showPlate={Boolean(v.plate_text)}
                                                            plate={v.plate_text}
                                                        />
                                                    </Reveal>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {results.total_detections === 0 && (
                                        <EmptyState
                                            title="Nothing found"
                                            action={
                                                <button
                                                    type="button"
                                                    onClick={() => { prefillFromScan(results, engine, file?.name ?? "scan"); router.push("/complaints?prefill=1"); }}
                                                    className="inline-flex items-center min-h-11 px-5 border border-border-light rounded-lg text-sm font-bold hover:border-border-dark transition-colors"
                                                >
                                                    Report a hazard
                                                </button>
                                            }
                                        >
                                            The AI did not detect any hazards or violations. If you can see a problem, report it yourself.
                                        </EmptyState>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </section>
            </main>
            <AppFooter />
        </>
    );
}
