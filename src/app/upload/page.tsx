"use client";

import React, { useState, useEffect, useRef } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { Upload, AlertCircle, FileImage, ShieldAlert, BadgeInfo, Zap } from "lucide-react";

type EngineType = "road" | "traffic";
type MediaType = "IMAGE" | "VIDEO";

export default function UploadPage() {
    // UI State
    const [engine, setEngine] = useState<EngineType>("road");
    const [activeTab, setActiveTab] = useState<MediaType>("IMAGE");
    
    // File State
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Processing State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Results State
    const [results, setResults] = useState<any>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-on-scroll-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('[data-animation-on-scroll]').forEach(el => {
            el.classList.add('animate-on-scroll-hidden');
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // Cleanup object URL on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
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

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
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
        // Default confidence threshold; could be made a UI slider
        formData.append("conf_threshold", "0.25");
        
        // Build Endpoint URL based on state
        let endpoint = "http://127.0.0.1:8000/detect";
        if (engine === "traffic") {
            endpoint += "/traffic";
        }
        if (activeTab === "IMAGE") {
            endpoint += "/image";
            formData.append("include_annotated", "true");
        } else {
            endpoint += "/video";
        }

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                if (res.status === 503) {
                    throw new Error("Model Not Loaded: Please place your .pt model files in the backend directory and restart the FastAPI server.");
                }
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.detail || `API Error: ${res.status}`);
            }

            const data = await res.json();
            
            if (!data.success) {
                throw new Error(data.message || "Failed to analyze media.");
            }

            setResults(data);

        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || "An unexpected error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case "HIGH": return "text-red-500 bg-red-50 border-red-200";
            case "MEDIUM": return "text-yellow-600 bg-yellow-50 border-yellow-200";
            default: return "text-green-600 bg-green-50 border-green-200";
        }
    };

    return (
        <>
            <AppHeader />
            <main className="flex-grow pt-16">
                <section className="pt-24 pb-24 px-6 bg-neutral-surface min-h-screen">
                    <div className="max-w-4xl mx-auto">
                        
                        {/* Header */}
                        <div className="mb-10 text-center" data-animation-on-scroll="">
                            <h1 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter mb-4">Unified AI Detector</h1>
                            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                                Select an AI Engine and upload your media for deep municipal intelligence.
                            </p>
                        </div>

                        {/* Engine Selector */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" data-animation-on-scroll="">
                            <button 
                                onClick={() => { setEngine("road"); setResults(null); }}
                                className={`p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${
                                    engine === "road" 
                                        ? "border-brand-primary bg-white shadow-soft" 
                                        : "border-border-light bg-transparent hover:bg-white hover:shadow-sm"
                                }`}
                            >
                                <div className={`p-3 rounded-lg ${engine === "road" ? "bg-brand-primary/10 text-brand-primary" : "bg-gray-100 text-gray-500"}`}>
                                    <ShieldAlert size={28} />
                                </div>
                                <div>
                                    <h3 className="font-heading text-lg font-bold">Road Hazard Engine</h3>
                                    <p className="text-sm text-text-secondary mt-1">Detects potholes, open manholes, garbage accumulation, and broken infrastructure.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => { setEngine("traffic"); setResults(null); }}
                                className={`p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${
                                    engine === "traffic" 
                                        ? "border-brand-secondary bg-white shadow-soft" 
                                        : "border-border-light bg-transparent hover:bg-white hover:shadow-sm"
                                }`}
                            >
                                <div className={`p-3 rounded-lg ${engine === "traffic" ? "bg-brand-secondary/10 text-brand-secondary" : "bg-gray-100 text-gray-500"}`}>
                                    <Zap size={28} />
                                </div>
                                <div>
                                    <h3 className="font-heading text-lg font-bold">Traffic Violation Engine</h3>
                                    <p className="text-sm text-text-secondary mt-1">Identifies helmetless riders, triple riding, wrong-side driving, and extracts number plates.</p>
                                </div>
                            </button>
                        </div>

                        {/* Upload Widget */}
                        <div className="bg-white rounded-2xl shadow-medium border border-border-light overflow-hidden" data-animation-on-scroll="">
                            
                            {/* Media Tabs */}
                            <div className="flex border-b border-border-light">
                                <button
                                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'IMAGE' ? 'border-brand-primary text-brand-primary bg-neutral-surface' : 'border-transparent text-text-secondary hover:bg-neutral-surface'}`}
                                    onClick={() => { setActiveTab('IMAGE'); if(file) { setFile(null); setResults(null); setPreviewUrl(null); } }}
                                >
                                    IMAGE UPLOAD
                                </button>
                                <button
                                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'VIDEO' ? 'border-brand-primary text-brand-primary bg-neutral-surface' : 'border-transparent text-text-secondary hover:bg-neutral-surface'}`}
                                    onClick={() => { setActiveTab('VIDEO'); if(file) { setFile(null); setResults(null); setPreviewUrl(null); } }}
                                >
                                    VIDEO UPLOAD
                                </button>
                            </div>

                            <div className="p-8 md:p-12">
                                {/* Native Hidden Input */}
                                <input 
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept={activeTab === "IMAGE" ? "image/jpeg, image/png, image/webp" : "video/mp4, video/avi, video/quicktime"}
                                    className="hidden"
                                />

                                {/* Dropzone or Preview */}
                                {!file ? (
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-xl p-12 md:p-16 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer group"
                                        onClick={triggerFileInput}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                    >
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                            <Upload className="text-text-secondary" size={28} />
                                        </div>
                                        <h3 className="text-xl font-heading font-semibold mb-2">Drag and drop file here</h3>
                                        <p className="text-text-secondary mb-8">
                                            {activeTab === "IMAGE" ? "JPG, PNG, WEBP up to 20MB." : "MP4, AVI, MOV up to 100MB."}
                                        </p>
                                        <button className="px-8 py-3 bg-text-primary text-white font-bold rounded-sm hover:-translate-y-0.5 transition-transform">Browse Files</button>
                                    </div>
                                ) : (
                                    <div className="border border-border-light rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 bg-neutral-surface">
                                        <div className="w-32 h-32 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-300">
                                            {previewUrl && activeTab === "IMAGE" && (
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            )}
                                            {previewUrl && activeTab === "VIDEO" && (
                                                <video src={previewUrl} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="font-semibold text-lg max-w-[200px] md:max-w-sm truncate">{file.name}</h3>
                                            <p className="text-sm text-text-secondary mb-4">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            <button 
                                                onClick={() => { setFile(null); setPreviewUrl(null); setResults(null); setError(null); }}
                                                className="text-sm font-semibold text-red-500 hover:text-red-700 underline"
                                            >
                                                Change File
                                            </button>
                                        </div>

                                        {/* Run Button */}
                                        <div className="w-full md:w-auto mt-4 md:mt-0">
                                            <button 
                                                onClick={runAnalysis}
                                                disabled={isAnalyzing}
                                                className={`w-full px-8 py-4 font-bold rounded-sm shadow-soft transition-all text-white ${
                                                    isAnalyzing 
                                                        ? "bg-gray-400 cursor-not-allowed" 
                                                        : (engine === "road" ? "bg-brand-primary hover:-translate-y-0.5" : "bg-brand-secondary hover:-translate-y-0.5")
                                                }`}
                                            >
                                                {isAnalyzing ? (
                                                    <span className="flex items-center gap-2 justify-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Processing Model...
                                                    </span>
                                                ) : (
                                                    "Run AI Detection"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Error State */}
                                {error && (
                                    <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl flex gap-4 items-start animate-fade-in">
                                        <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                                        <div>
                                            <h4 className="font-bold text-red-900 mb-1">Analysis Failed</h4>
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Results Section */}
                        {results && (
                            <div className="mt-12 animate-fade-in" id="results-panel">
                                <div className="bg-white rounded-2xl shadow-medium border border-border-light overflow-hidden">
                                    <div className="px-8 py-6 border-b border-border-light flex justify-between items-center bg-gray-50">
                                        <div>
                                            <h2 className="text-xl font-heading font-bold">Analysis Report</h2>
                                            <p className="text-sm text-text-secondary">{results.message}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs font-mono text-text-secondary uppercase">OVERALL PRIORITY</span>
                                            <span className={`px-3 py-1 mt-1 inline-block rounded-full text-xs font-bold border ${getPriorityColor(results.road_priority || results.overall_priority)}`}>
                                                {(results.road_priority || results.overall_priority || "UNKNOWN").toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        {/* Image Display */}
                                        {results.annotated_image_base64 && (
                                            <div className="mb-8 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-900">
                                                <img 
                                                    src={`data:image/jpeg;base64,${results.annotated_image_base64}`} 
                                                    alt="AI Annotated Result" 
                                                    className="w-full h-auto object-contain max-h-[600px]"
                                                />
                                            </div>
                                        )}

                                        {/* Detection List (Images) */}
                                        {results.detections && results.detections.length > 0 && (
                                            <div>
                                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                                    <BadgeInfo size={18} className="text-brand-primary" />
                                                    Detected Objects ({results.total_detections})
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {results.detections.map((det: any, idx: number) => (
                                                        <div key={idx} className="p-4 rounded-lg bg-neutral-surface border border-border-light flex justify-between items-start">
                                                            <div>
                                                                <span className="font-bold flex items-center gap-2">
                                                                    {det.display_name || det.class_name.split("_").join(" ").toUpperCase()}
                                                                </span>
                                                                <span className="text-xs text-text-secondary">Confidence: {(det.confidence * 100).toFixed(1)}%</span>
                                                                
                                                                {/* Optional text like OCR */}
                                                                {det.plate_text && (
                                                                    <div className="mt-2 text-sm font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block border border-yellow-300">
                                                                        OCR: {det.plate_text}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getPriorityColor(det.priority)}`}>
                                                                {det.priority}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Unique Violations (Video / Traffic) */}
                                        {results.violations && results.violations.length > 0 && (
                                            <div>
                                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                                    <BadgeInfo size={18} className="text-brand-secondary" />
                                                    Unique Tracked Violations ({results.unique_tracked_violations})
                                                </h3>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {results.violations.map((v: any, idx: number) => (
                                                        <div key={idx} className="p-4 rounded-lg bg-neutral-surface border border-border-light flex justify-between items-center">
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-bold text-lg">{v.display_name || v.class_name.split("_").join(" ").toUpperCase()}</span>
                                                                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded font-mono">Track #{v.track_id}</span>
                                                                </div>
                                                                <div className="text-sm text-text-secondary mt-1">
                                                                    First seen at {v.first_seen_sec}s
                                                                </div>
                                                                {v.plate_text && (
                                                                    <div className="mt-2 text-sm font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block border border-yellow-300">
                                                                        OCR: {v.plate_text}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${getPriorityColor(v.priority)}`}>
                                                                {v.priority}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Empty State */}
                                        {results.total_detections === 0 && (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <h3 className="text-lg font-bold">All Clear</h3>
                                                <p className="text-text-secondary">No issues or violations were detected in this media.</p>
                                            </div>
                                        )}
                                    </div>
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
