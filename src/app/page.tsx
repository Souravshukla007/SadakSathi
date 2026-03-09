"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Upload, Video, Gauge, Server, MapPin } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    setIsLoggedIn(true);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("animate-on-scroll-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.05 }
        );

        document.querySelectorAll("[data-animation-on-scroll]").forEach((el) => {
            el.classList.add("animate-on-scroll-hidden");
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <AppHeader />

            <main className="flex-grow">
                <section className="hero-gradient pt-32 pb-16 px-6 relative overflow-hidden">
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[1220px] h-[543px] blur-gradient rounded-full -rotate-12 z-0"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex justify-center mb-10" data-animation-on-scroll="">
                            <Link href="#" className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-accent/20 rounded-lg text-sm text-text-primary hover:scale-105 transition-transform">
                                <span className="font-medium">🚀 Deploying v2.4 Global Road Model</span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="max-w-4xl mx-auto text-center mb-12" data-animation-on-scroll="">
                            <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-normal tracking-mega-tight leading-none mb-6">
                                AI-Powered Road Intelligence for <span className="italic text-brand-primary">Smart Cities</span>
                            </h1>
                            <p className="text-lg md:text-xl text-text-primary leading-relaxed max-w-2xl mx-auto mb-8">
                                Detect potholes and traffic violations instantly using AI. Real-time monitoring, geo-tagging, automated reports, and smart enforcement tools.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4" data-animation-on-scroll="">
                                <Link
                                    href="/upload"
                                    className="w-full sm:w-auto px-8 py-4 bg-text-primary text-white font-medium text-sm rounded-sm hover:shadow-soft transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <Upload size={20} />
                                    Upload Image
                                </Link>
                                <Link
                                    href="/upload"
                                    className="w-full sm:w-auto px-8 py-4 bg-white text-text-primary font-medium text-sm rounded-sm border border-border-light hover:bg-black/5 transition-all flex items-center justify-center gap-2"
                                >
                                    <Video size={20} />
                                    Upload Video
                                </Link>
                            </div>
                        </div>

                        <div className="max-w-5xl mx-auto" data-animation-on-scroll="">
                            <div className="bg-white/30 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-medium">
                                <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg md:rounded-xl overflow-hidden relative">
                                    <div className="bg-gray-800 px-2 md:px-4 py-2 md:py-3 flex items-center gap-2 md:gap-3 border-b border-gray-700">
                                        <div className="flex gap-1 md:gap-2">
                                            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-red-500"></div>
                                            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <div className="flex-1 bg-gray-700 rounded px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs text-gray-300 font-mono truncate">
                                            potholevision.ai/app/detection
                                        </div>
                                    </div>

                                    <div className="relative w-full h-full overflow-hidden">
                                        <img
                                            src="https://images.unsplash.com/photo-1741996951192-f4762170f3cb?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxIaWdoLWFuZ2xlJTIwc2hvdCUyMG9mJTIwYSUyMGdyYXklMjBhc3BoYWx0JTIwcm9hZCUyMHdpdGglMjB2aXNpYmxlJTIwY3JhY2tzJTIwYW5kJTIwZGVlcCUyMHBvdGhvbGVzfGVufDB8MHx8fDE3NzI0MzIxNTZ8MA&ixlib=rb-4.1.0&w=1200&h=800&fit=crop&fm=jpg&q=80"
                                            alt="Road surface with potholes"
                                            className="w-full h-full object-cover opacity-60"
                                            loading="eager"
                                        />

                                        <div className="absolute inset-0 p-12">
                                            <div className="absolute top-1/4 left-1/4 w-32 h-24 border-2 border-red-500 rounded-sm animate-pulse">
                                                <div className="absolute -top-6 left-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-t-sm whitespace-nowrap">
                                                    Pothole: Severe (94%)
                                                </div>
                                            </div>

                                            <div className="absolute bottom-1/3 right-1/4 w-48 h-32 border-2 border-yellow-400 rounded-sm">
                                                <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-t-sm whitespace-nowrap">
                                                    Pothole: Medium (88%)
                                                </div>
                                            </div>

                                            <div className="absolute top-1/2 right-1/3 w-20 h-20 border-2 border-green-400 rounded-sm">
                                                <div className="absolute -top-6 left-0 bg-green-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-t-sm whitespace-nowrap">
                                                    Cracks: Minor (78%)
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute top-6 right-6 w-48 bg-gray-900/80 backdrop-blur-md rounded-lg p-4 text-white space-y-3 shadow-2xl border border-white/10 hidden sm:block">
                                            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Analysis Status</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <div className="text-xs font-semibold">Active Engine</div>
                                            </div>
                                            <div className="h-px bg-white/10"></div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px]">
                                                    <span>Potholes</span>
                                                    <span className="text-brand-primary">03</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span>Confidence</span>
                                                    <span className="text-brand-primary">91.4%</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span>GPS Lat</span>
                                                    <span className="text-brand-primary">40.7128</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 bg-gray-900/90 px-4 py-2 flex items-center justify-between border-t border-white/10">
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                    <span className="text-[10px] text-gray-400">Recording</span>
                                                </div>
                                                <span className="text-[10px] text-white font-mono">00:12:44</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="px-2 py-1 bg-brand-primary text-gray-900 text-[9px] font-bold rounded cursor-pointer hover:opacity-80 transition-opacity">EXPORT PDF</div>
                                                <div className="px-2 py-1 bg-white/10 text-white text-[9px] font-bold rounded cursor-pointer hover:bg-white/20 transition-opacity">GENERATE JSON</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-secondary to-transparent opacity-10 pointer-events-none"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-16 bg-neutral-background overflow-hidden border-b border-border-light">
                    <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                        <p className="text-sm font-mono text-text-secondary uppercase tracking-widest">Trusted by Municipalities & Infrastructure Leaders</p>
                    </div>
                    <div className="w-full" style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 12.5%, black 87.5%, transparent)", maskImage: "linear-gradient(to right, transparent, black 12.5%, black 87.5%, transparent)" }}>
                        <div className="flex gap-16 items-center animate-marquee whitespace-nowrap" style={{ width: "fit-content" }}>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">TRAFFIC POLICE</div>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">ROAD-TECH GLOBAL</div>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">MUNICIPAL AI</div>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">INFRASTRUCTURE INC</div>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">SAFE-DRIVE ORG</div>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">URBAN VISION</div>

                            {/* Duplicate for loop */}
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">CITY OF AUSTIN</div>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">ROAD-TECH GLOBAL</div>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">MUNICIPAL AI</div>
                            <div className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">INFRASTRUCTURE INC</div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-surface" id="features">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16" data-animation-on-scroll="">
                            <div className="inline-block px-3 py-1.5 bg-brand-accent/20 rounded text-xs font-mono font-medium text-brand-primary uppercase tracking-wide mb-4">
                                Core Capabilities
                            </div>
                            <h2 className="font-heading text-4xl md:text-6xl font-normal tracking-tighter leading-tight max-w-3xl mx-auto">
                                Precision Detection Powered by Specialized Vision Models
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-2xl shadow-soft border border-border-light hover:border-brand-primary transition-colors group" data-animation-on-scroll="">
                                <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors">
                                    <Gauge className="w-6 h-6 text-brand-primary group-hover:text-white" />
                                </div>
                                <h3 className="text-xl font-heading font-semibold mb-3">Real-time Analysis</h3>
                                <p className="text-text-secondary leading-relaxed">Detect hazards as they appear with sub-100ms latency. Optimized for mobile and dashcam streams.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-soft border border-border-light hover:border-brand-primary transition-colors group" data-animation-on-scroll="">
                                <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors">
                                    <Server className="w-6 h-6 text-brand-primary group-hover:text-white" />
                                </div>
                                <h3 className="text-xl font-heading font-semibold mb-3">Severity Mapping</h3>
                                <p className="text-text-secondary leading-relaxed">Automatically classify pothole depth and diameter as High, Medium, or Low for efficient prioritization.</p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-soft border border-border-light hover:border-brand-primary transition-colors group" data-animation-on-scroll="">
                                <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors">
                                    <MapPin className="w-6 h-6 text-brand-primary group-hover:text-white" />
                                </div>
                                <h3 className="text-xl font-heading font-semibold mb-3">GPS Geo-Tagging</h3>
                                <p className="text-text-secondary leading-relaxed">Every detection is pinned to precise coordinates. Integrate directly with city GIS systems.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-surface" id="traffic-detection">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20" data-animation-on-scroll="">
                            <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-6" data-pixel-id="jc9rv" data-pixel-kind="text">AI Traffic Violation Detection</h2>
                            <p className="text-lg text-text-secondary max-w-2xl mx-auto" data-pixel-id="f0qo2" data-pixel-kind="text">Monitor and detect road violations with real-time computer vision tailored for modern urban governance.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {/* Card 1 */}
                            <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-all group" data-animation-on-scroll="">
                                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors" data-pixel-id="kvwoa" data-pixel-kind="text">
                                    <span className="text-2xl">🪖</span>
                                </div>
                                <h3 className="text-2xl font-heading font-bold mb-3" data-pixel-id="8xkj9" data-pixel-kind="text">No Helmet Detection</h3>
                                <p className="text-text-secondary leading-relaxed" data-pixel-id="wfbba" data-pixel-kind="text">Identify riders without helmets instantly using high-precision headwear detection models.</p>
                            </div>
                            {/* Card 2 */}
                            <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-all group" data-animation-on-scroll="">
                                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors" data-pixel-id="6868w" data-pixel-kind="text">
                                    <span className="text-2xl">👨‍👩‍👦</span>
                                </div>
                                <h3 className="text-2xl font-heading font-bold mb-3" data-pixel-id="r1nsq" data-pixel-kind="text">Triple Riding Detection</h3>
                                <p className="text-text-secondary leading-relaxed" data-pixel-id="cx0cn" data-pixel-kind="text">Detect unsafe multi-passenger riding patterns on two-wheelers automatically.</p>
                            </div>
                            {/* Card 3 */}
                            <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-all group" data-animation-on-scroll="">
                                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors" data-pixel-id="gv5ra" data-pixel-kind="text">
                                    <span className="text-2xl">🔄</span>
                                </div>
                                <h3 className="text-2xl font-heading font-bold mb-3" data-pixel-id="prals" data-pixel-kind="text">Wrong Side Driving</h3>
                                <p className="text-text-secondary leading-relaxed" data-pixel-id="h3c7i" data-pixel-kind="text">Identify vehicles moving against traffic flow to prevent potential collisions in real-time.</p>
                            </div>
                            {/* Card 4 */}
                            <div className="bg-white p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-all group" data-animation-on-scroll="">
                                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors" data-pixel-id="e16vc" data-pixel-kind="text">
                                    <span className="text-2xl">🔢</span>
                                </div>
                                <h3 className="text-2xl font-heading font-bold mb-3" data-pixel-id="mn5l2" data-pixel-kind="text">Automatic License Plate Detection</h3>
                                <p className="text-text-secondary leading-relaxed" data-pixel-id="drfis" data-pixel-kind="text">Extract license plate details using powerful AI OCR models for automated e-challan generation.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-surface" id="unified-solutions">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16" data-animation-on-scroll="">
                            <div className="inline-block px-3 py-1.5 bg-brand-accent/20 rounded text-xs font-mono font-medium text-brand-primary uppercase tracking-wide mb-4">
                                Unified Solutions
                            </div>
                            <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter leading-tight max-w-3xl mx-auto">
                                Complete Civic AI Platform
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-8 rounded-xl shadow-soft border border-border-light hover:border-brand-primary/30 hover:shadow-medium transition-all group" data-animation-on-scroll="">
                                <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-brand-primary transition-colors">Pothole Detection</h3>
                                <p className="text-text-secondary text-sm leading-relaxed mb-6">Identify bad patches and road damage instantaneously.</p>
                                <div className="h-0.5 w-12 bg-border-light group-hover:bg-brand-primary group-hover:w-full transition-all duration-500"></div>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-soft border border-border-light hover:border-brand-primary/30 hover:shadow-medium transition-all group" data-animation-on-scroll="">
                                <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-brand-primary transition-colors">Traffic Enforcement</h3>
                                <p className="text-text-secondary text-sm leading-relaxed mb-6">Real-time alerts for helmetless riders and wrong-driving.</p>
                                <div className="h-0.5 w-12 bg-border-light group-hover:bg-brand-primary group-hover:w-full transition-all duration-500"></div>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-soft border border-border-light hover:border-brand-primary/30 hover:shadow-medium transition-all group" data-animation-on-scroll="">
                                <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-brand-primary transition-colors">Complaint Portal</h3>
                                <p className="text-text-secondary text-sm leading-relaxed mb-6">Direct citizen-to-authority ticketing system linking proof.</p>
                                <div className="h-0.5 w-12 bg-border-light group-hover:bg-brand-primary group-hover:w-full transition-all duration-500"></div>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-soft border border-border-light hover:border-brand-primary/30 hover:shadow-medium transition-all group" data-animation-on-scroll="">
                                <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-brand-primary transition-colors">Municipal Dashboard</h3>
                                <p className="text-text-secondary text-sm leading-relaxed mb-6">Live analytics and geographic hot-spot charting for mayors.</p>
                                <div className="h-0.5 w-12 bg-border-light group-hover:bg-brand-primary group-hover:w-full transition-all duration-500"></div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="py-24 bg-neutral-background" id="how-it-works">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div data-animation-on-scroll="">
                                <div className="inline-block px-3 py-1.5 bg-brand-accent/20 rounded text-xs font-mono font-medium text-brand-primary uppercase tracking-wide mb-4">
                                    The Process
                                </div>
                                <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter leading-tight mb-8">
                                    From Rough Roads to Actionable Data in 3 Steps
                                </h2>

                                <div className="space-y-10">
                                    <div className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-text-primary text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
                                        <div>
                                            <h4 className="text-xl font-heading font-semibold mb-2">Upload Media</h4>
                                            <p className="text-text-secondary leading-relaxed">Simply drag and drop images or dashcam video files. Our system supports high-resolution 4K inputs for maximum accuracy.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-text-primary text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
                                        <div>
                                            <h4 className="text-xl font-heading font-semibold mb-2">AI Detection & Analysis</h4>
                                            <p className="text-text-secondary leading-relaxed">Our proprietary neural network scans every frame, identifying potholes and measuring their physical characteristics instantly.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-text-primary text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
                                        <div>
                                            <h4 className="text-xl font-heading font-semibold mb-2">Download Report</h4>
                                            <p className="text-text-secondary leading-relaxed">Receive a structured maintenance report in PDF or JSON format, ready for dispatching repair crews or updating city records.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative" data-animation-on-scroll="">
                                <div className="aspect-square bg-brand-secondary/20 rounded-3xl overflow-hidden shadow-medium flex items-center justify-center p-8">
                                    <div className="w-full h-full bg-white rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-40 bg-gray-100 rounded-xl relative overflow-hidden">
                                                <img src="https://images.pexels.com/photos/11849379/pexels-photo-11849379.jpeg?w=800&fit=crop" alt="Road demo" className="w-full h-full object-cover" loading="lazy" />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-16 border-2 border-red-500 animate-pulse"></div>
                                            </div>
                                            <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                                            <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
                                            <div className="flex gap-2 pt-4">
                                                <div className="h-10 bg-brand-primary rounded-md flex-1"></div>
                                                <div className="h-10 bg-gray-200 rounded-md w-12"></div>
                                            </div>
                                        </div>
                                        <div className="absolute top-10 right-10 bg-white shadow-xl rounded-lg p-3 border border-border-light animate-float hidden sm:block">
                                            <div className="text-[10px] font-mono text-gray-500">SEVERITY</div>
                                            <div className="text-sm font-bold text-red-600 uppercase">HIGH</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-dark text-white overflow-hidden" id="testimonials">
                    <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                        <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter mb-4">What Our Partners Say</h2>
                        <p className="text-text-secondary">Used by 50+ city councils and engineering firms nationwide.</p>
                    </div>
                    <div className="flex gap-6 animate-marquee whitespace-nowrap" style={{ width: "fit-content" }}>
                        <div className="w-96 bg-white/10 backdrop-blur p-8 rounded-2xl whitespace-normal border border-white/10">
                            <p className="text-lg mb-6 leading-relaxed italic">&quot;PotholeVision reduced our survey time by 80%. We can now cover the entire city grid in a single weekend instead of three months.&quot;</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-primary rounded-full"></div>
                                <div>
                                    <div className="font-bold">David Thompson</div>
                                    <div className="text-sm opacity-60">Director of Works, Seattle</div>
                                </div>
                            </div>
                        </div>
                        <div className="w-96 bg-white/10 backdrop-blur p-8 rounded-2xl whitespace-normal border border-white/10">
                            <p className="text-lg mb-6 leading-relaxed italic">&quot;The severity classification is the most useful feature. It helps us justify our maintenance budget with hard, objective data.&quot;</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-secondary rounded-full"></div>
                                <div>
                                    <div className="font-bold">Elena Rodriguez</div>
                                    <div className="text-sm opacity-60">Urban Planner, Chicago</div>
                                </div>
                            </div>
                        </div>
                        <div className="w-96 bg-white/10 backdrop-blur p-8 rounded-2xl whitespace-normal border border-white/10">
                            <p className="text-lg mb-6 leading-relaxed italic">&quot;Integration with our GIS was seamless. The geo-tagged reports mean our crews never waste time searching for a site.&quot;</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-500 rounded-full"></div>
                                <div>
                                    <div className="font-bold">Mark Henderson</div>
                                    <div className="text-sm opacity-60">Operations Manager, RoadTech</div>
                                </div>
                            </div>
                        </div>
                        {/* Duplicates for marquee effect */}
                        <div className="w-96 bg-white/10 backdrop-blur p-8 rounded-2xl whitespace-normal border border-white/10">
                            <p className="text-lg mb-6 leading-relaxed italic">&quot;PotholeVision reduced our survey time by 80%. We can now cover the entire city grid in a single weekend instead of three months.&quot;</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-primary rounded-full"></div>
                                <div>
                                    <div className="font-bold">David Thompson</div>
                                    <div className="text-sm opacity-60">Director of Works, Seattle</div>
                                </div>
                            </div>
                        </div>
                        <div className="w-96 bg-white/10 backdrop-blur p-8 rounded-2xl whitespace-normal border border-white/10">
                            <p className="text-lg mb-6 leading-relaxed italic">&quot;The severity classification is the most useful feature. It helps us justify our maintenance budget with hard, objective data.&quot;</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-secondary rounded-full"></div>
                                <div>
                                    <div className="font-bold">Elena Rodriguez</div>
                                    <div className="text-sm opacity-60">Urban Planner, Chicago</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-surface" id="pricing">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16" data-animation-on-scroll="">
                            <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter mb-4">Enterprise-Grade Pricing</h2>
                            <p className="text-text-secondary">Flexible plans for local councils, state agencies, and private contractors.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl shadow-soft border border-border-light flex flex-col h-full" data-animation-on-scroll="">
                                <div className="mb-8">
                                    <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Individual</h3>
                                    <div className="text-4xl font-bold">$0</div>
                                    <p className="text-sm text-text-light mt-2">Trial detection for small road segments.</p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-sm text-text-secondary">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> 5 Uploads per month
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-text-secondary">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Basic severity classification
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-text-secondary">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> JSON exports
                                    </li>
                                </ul>
                                <Link href="#" className="w-full py-3 bg-neutral-surface text-text-primary text-center font-bold rounded-md hover:bg-gray-100 transition-colors">Start Free</Link>
                            </div>

                            <div className="bg-text-primary text-white p-8 rounded-2xl shadow-medium flex flex-col h-full relative" data-animation-on-scroll="">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-primary text-text-primary text-xs font-bold rounded-full">POPULAR</div>
                                <div className="mb-8">
                                    <h3 className="font-mono text-sm font-bold uppercase tracking-widest opacity-60 mb-2">Council Pro</h3>
                                    <div className="text-4xl font-bold">$499<span className="text-sm font-normal opacity-60">/mo</span></div>
                                    <p className="text-sm opacity-70 mt-2">Full city grid monitoring with history.</p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-sm">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Unlimited Uploads
                                    </li>
                                    <li className="flex items-center gap-3 text-sm">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Video Analysis (up to 4K)
                                    </li>
                                    <li className="flex items-center gap-3 text-sm">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Geo-tagged Map View
                                    </li>
                                    <li className="flex items-center gap-3 text-sm">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> Admin Dashboard
                                    </li>
                                </ul>
                                <Link href="#" className="w-full py-3 bg-brand-primary text-text-primary text-center font-bold rounded-md hover:scale-[1.02] transition-transform">Get Started</Link>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-soft border border-border-light flex flex-col h-full" data-animation-on-scroll="">
                                <div className="mb-8">
                                    <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Enterprise</h3>
                                    <div className="text-4xl font-bold">Custom</div>
                                    <p className="text-sm text-text-light mt-2">State-wide deployment & custom integrations.</p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-sm text-text-secondary">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> White-label Mobile App
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-text-secondary">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> On-premise AI hosting
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-text-secondary">
                                        <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> 24/7 Dedicated Support
                                    </li>
                                </ul>
                                <Link href="#" className="w-full py-3 bg-neutral-surface text-text-primary text-center font-bold rounded-md hover:bg-gray-100 transition-colors">Contact Sales</Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-background" id="faq">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center mb-16" data-animation-on-scroll="">
                            <h2 className="font-heading text-4xl font-normal tracking-tighter">Frequently Asked Questions</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="border border-border-light rounded-xl overflow-hidden active">
                                <button className="w-full p-6 text-left flex justify-between items-center bg-white hover:bg-neutral-surface transition-colors"
                                    onClick={(e) => {
                                        const content = e.currentTarget.nextElementSibling;
                                        if (content) {
                                            content.classList.toggle('hidden');
                                            e.currentTarget.querySelector('svg')?.classList.toggle('rotate-180')
                                        }
                                    }}
                                >
                                    <span className="font-semibold">How accurate is the AI detection?</span>
                                    <svg className="w-5 h-5 text-text-secondary transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                <div className="p-6 bg-white border-t border-border-light text-text-secondary leading-relaxed">
                                    Our v2.4 Global Road Model maintains a 94.2% precision rate across various weather conditions and road surfaces, including asphalt, concrete, and unpaved roads.
                                </div>
                            </div>
                            <div className="border border-border-light rounded-xl overflow-hidden">
                                <button className="w-full p-6 text-left flex justify-between items-center bg-white hover:bg-neutral-surface transition-colors"
                                    onClick={(e) => {
                                        const content = e.currentTarget.nextElementSibling;
                                        if (content) {
                                            content.classList.toggle('hidden');
                                            e.currentTarget.querySelector('svg')?.classList.toggle('rotate-180')
                                        }
                                    }}
                                >
                                    <span className="font-semibold">Can I use dashcam footage?</span>
                                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                <div className="hidden p-6 bg-white border-t border-border-light text-text-secondary leading-relaxed">
                                    Yes, our system is optimized for dashcam video files. We automatically compensate for vehicle motion, vibrations, and varying light conditions to ensure consistent detection.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {!isLoading && !isLoggedIn && (
                    <section className="py-24 hero-gradient relative overflow-hidden">
                        <div className="absolute inset-0 blur-gradient opacity-30"></div>
                        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                            <h2 className="font-heading text-5xl md:text-7xl font-normal tracking-tighter mb-8 leading-none">Ready to start mapping?</h2>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/upload" className="w-full sm:w-auto px-10 py-5 bg-text-primary text-white font-bold rounded-sm shadow-medium hover:-translate-y-1 transition-all">Upload Now</Link>
                                <Link href="/auth" className="w-full sm:w-auto px-10 py-5 bg-white text-text-primary font-bold border border-border-light rounded-sm hover:bg-gray-50 transition-all">Create Account</Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <AppFooter />
        </>
    );
}
