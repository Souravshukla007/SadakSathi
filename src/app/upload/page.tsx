"use client";

import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Link from "next/link";

export default function UploadPage() {
    const [activeTab, setActiveTab] = useState<"IMAGE UPLOAD" | "VIDEO UPLOAD">("IMAGE UPLOAD");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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

    const handleDropzoneClick = () => {
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5;
            });
        }, 150);
    };

    return (
        <>
            <AppHeader />
            <main className="flex-grow pt-16">
                <section className="pt-32 pb-24 px-6 bg-neutral-surface min-h-screen">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-12" data-animation-on-scroll="">
                            <h1 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter mb-4">Upload Road Media</h1>
                            <p className="text-text-secondary text-lg">Select images or video files for instant AI pothole detection.</p>
                        </div>

                        {/* Upload Tabs */}
                        <div className="bg-white rounded-2xl shadow-medium border border-border-light overflow-hidden" data-animation-on-scroll="">
                            <div className="flex border-b border-border-light">
                                <button
                                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'IMAGE UPLOAD' ? 'border-brand-primary text-brand-primary bg-neutral-surface' : 'border-transparent text-text-secondary hover:bg-neutral-surface'}`}
                                    onClick={() => setActiveTab('IMAGE UPLOAD')}
                                >
                                    IMAGE UPLOAD
                                </button>
                                <button
                                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'VIDEO UPLOAD' ? 'border-brand-primary text-brand-primary bg-neutral-surface' : 'border-transparent text-text-secondary hover:bg-neutral-surface'}`}
                                    onClick={() => setActiveTab('VIDEO UPLOAD')}
                                >
                                    VIDEO UPLOAD
                                </button>
                            </div>

                            <div className="p-12">
                                {/* Dropzone */}
                                <div
                                    id="dropzone"
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer group"
                                    onClick={handleDropzoneClick}
                                >
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                        <svg className="w-10 h-10 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    </div>
                                    <h3 className="text-xl font-heading font-semibold mb-2">Drag and drop files here</h3>
                                    <p className="text-text-secondary mb-8">Support for JPG, PNG, and HEIC up to 20MB.</p>
                                    <button className="px-8 py-3 bg-text-primary text-white font-bold rounded-sm">Browse Files</button>
                                </div>

                                {/* Progress */}
                                {isUploading && (
                                    <div id="progress-section" className="mt-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-mono font-bold text-brand-primary">
                                                {uploadProgress < 100 ? 'UPLOADING...' : 'UPLOAD COMPLETE'}
                                            </span>
                                            <span className="text-sm font-mono text-text-secondary">{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand-primary transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit */}
                                <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs font-mono text-text-secondary">SECURE 256-BIT ENCRYPTION</span>
                                    </div>
                                    <Link href="/results" className="w-full sm:w-auto text-center px-10 py-4 bg-brand-primary text-text-primary font-bold rounded-sm shadow-soft hover:-translate-y-0.5 transition-all">
                                        Run AI Detection
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Guidelines */}
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8" data-animation-on-scroll="">
                            <div className="bg-white p-6 rounded-xl border border-border-light">
                                <h4 className="font-bold mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Best Practices
                                </h4>
                                <ul className="text-sm text-text-secondary space-y-2">
                                    <li>• Ensure good lighting (daylight is best)</li>
                                    <li>• Aim camera at a 45-degree angle</li>
                                    <li>• Clean camera lens before shooting</li>
                                </ul>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-border-light">
                                <h4 className="font-bold mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    Avoid
                                </h4>
                                <ul className="text-sm text-text-secondary space-y-2">
                                    <li>• Blurry or out-of-focus media</li>
                                    <li>• Media shot during heavy rain or snow</li>
                                    <li>• Extremely low-angle shots</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <AppFooter />
        </>
    );
}
