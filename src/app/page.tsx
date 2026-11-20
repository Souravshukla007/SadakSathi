"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Upload, Video, Gauge, Server, MapPin, ChevronDown } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import Reveal from "@/components/Reveal";

// Photos: Unsplash (cracked asphalt) and Pexels (collapsed road), both free to use; served locally.
const CRACKS = { src: "/images/road-cracks-1600.webp", srcSet: "/images/road-cracks-800.webp 800w, /images/road-cracks-1600.webp 1600w" };
const COLLAPSE = { src: "/images/road-collapse-640.webp", srcSet: "/images/road-collapse-640.webp 640w, /images/road-collapse-1200.webp 1200w" };

// What the models actually detect (backend/config.py, backend/ml/traffic.py). Listed twice so the marquee loops.
const DETECTS = ["POTHOLES", "GARBAGE DUMPS", "OVERFLOWING GARBAGE", "OPEN MANHOLES", "FALLEN TREES", "NO HELMET", "TRIPLE RIDING", "NUMBER PLATES"];

const CAPABILITIES = [
    { icon: Gauge, title: "Fast Analysis", body: "Upload a photo or video and see what the AI found in seconds. Lightweight models built to run on an ordinary CPU, even a Raspberry Pi." },
    { icon: Server, title: "Severity Mapping", body: "Each hazard is rated High, Medium, or Low from its size and estimated depth in the photo. An open manhole is always High." },
    { icon: MapPin, title: "GPS Geo-Tagging", body: "Every report is pinned to its location, so crews can find it and people nearby can see and upvote it." },
];

const TRAFFIC = [
    { emoji: "🛵", title: "No Helmet Detection", body: "Identify riders without helmets in photos and video using a dedicated helmet detection model." },
    { emoji: "🚦", title: "Triple Riding Detection", body: "Detect unsafe multi-passenger riding patterns on two-wheelers automatically." },
    { emoji: "⛔", title: "Wrong Side Driving", body: "Identify vehicles moving against the flow of traffic. Needs a model trained for it: the bundled traffic model doesn't detect this yet." },
    { emoji: "📷", title: "Automatic License Plate Detection", body: "Read number plates as text with an AI OCR model, so traffic staff can issue e-challans quickly." },
];

const SOLUTIONS = [
    { title: "Pothole Detection", body: "Identify bad patches and road damage in seconds." },
    { title: "Traffic Enforcement", body: "Flags helmetless riders and triple riding for the traffic desk." },
    { title: "Complaint Portal", body: "Direct citizen-to-authority ticketing system linking proof." },
    { title: "Municipal Dashboard", body: "City staff review reports, update their status and chat with citizens." },
];

const STEPS = [
    { title: "Upload Media", body: "Drag and drop a photo, or a short video from your phone or dashcam." },
    { title: "AI Detection & Analysis", body: "YOLO detection models mark each hazard with a box and a confidence score, rate its priority, and check whether it was already reported nearby." },
    { title: "Submit & Track", body: "File it as a complaint in one tap. City staff update its status, and you can follow it until it's fixed." },
];

// Who uses SadakSathi and for what. Descriptions of real features, not quotes from real people.
const ROLES = [
    { text: "Photograph a pothole or open manhole, file it in one tap, upvote reports near you and climb the leaderboard.", name: "Citizens", role: "Report and track", dot: "bg-brand-primary" },
    { text: "Review incoming complaints, change their status, add remarks and chat with the person who reported.", name: "Municipal staff", role: "Municipal desk", dot: "bg-brand-secondary" },
    { text: "Review violations the AI flagged in photos and video, check the number plate and issue an e-challan.", name: "Traffic police", role: "Traffic desk", dot: "bg-purple-500" },
];

const FAQ = [
    { q: "How accurate is the AI detection?", a: "It depends on the photo: clear daytime shots work best. Every detection shows a confidence score, staff review each complaint before acting on it, and the Model Analytics page lists each model's measured accuracy." },
    { q: "Can I use dashcam footage?", a: "Yes. Upload a video and SadakSathi checks every fifth frame with the same models. Steady daytime footage gives the most reliable results." },
    { q: "Who manages the Municipal Dashboard?", a: "Municipal staff handle road complaints, and traffic police handle violations and challans. Each desk sees only its own work." },
    { q: "Is citizen data kept private?", a: "Public reports show the photo, issue type, description, location and your name. Your email and phone number are never shown publicly. City staff can see who filed a report so they can follow up. Passwords are stored hashed, and the site runs over HTTPS." },
    { q: "Can the AI models detect violations at night?", a: "Detection works best in daylight. At night it is less reliable unless the scene is well lit, so a daytime photo is the safest choice." },
];

// Pill label above section headings. Lavender text uses the deeper action shade so it stays readable.
const PILL = "inline-block px-3 py-1.5 bg-brand-accent/20 rounded text-xs font-mono font-medium text-sign-green uppercase tracking-wide mb-4";
// Near-black button in light mode, near-white in dark mode (both colours flip with the theme).
const PRIMARY_BTN = "bg-text-primary text-neutral-background";

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        fetch("/api/auth/me").then((res) => setIsLoggedIn(res.ok)).catch(() => setIsLoggedIn(false));
    }, []);

    return (
        <>
            <AppHeader />

            <main id="main-content" className="landing flex-grow">
                <section className="hero-gradient pt-32 pb-16 px-6 relative overflow-hidden">
                    <div aria-hidden="true" className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[1220px] h-[543px] blur-gradient rounded-full -rotate-12 z-0"></div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <Reveal className="flex justify-center mb-10">
                            <Link href="#features" className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-accent/20 rounded-lg text-sm text-text-primary hover:scale-105 transition-transform">
                                <span className="font-medium">🚀 Road hazards and traffic violations, one app</span>
                                <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                        </Reveal>

                        <Reveal className="max-w-4xl mx-auto text-center mb-12">
                            <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl font-normal tracking-mega-tight leading-none mb-6">
                                AI-Powered Road Intelligence for <span className="italic text-brand-primary">Smart Cities</span>
                            </h1>
                            <p className="text-lg md:text-xl text-text-primary leading-relaxed max-w-2xl mx-auto mb-8">
                                Detect potholes and traffic violations in seconds using AI. Geo-tagged reports, duplicate checks, complaint tracking, and e-challan tools for city staff.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/upload" className={`w-full sm:w-auto px-8 py-4 ${PRIMARY_BTN} font-medium text-sm rounded-sm hover:shadow-soft transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2`}>
                                    <Upload size={20} aria-hidden="true" />
                                    Upload Image
                                </Link>
                                <Link href="/upload" className="w-full sm:w-auto px-8 py-4 bg-surface text-text-primary font-medium text-sm rounded-sm border border-border-light hover:bg-neutral-surface transition-all flex items-center justify-center gap-2">
                                    <Video size={20} aria-hidden="true" />
                                    Upload Video
                                </Link>
                            </div>
                        </Reveal>

                        <Reveal className="max-w-5xl mx-auto">
                            <div className="bg-white/30 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-medium">
                                <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg md:rounded-xl overflow-hidden relative">
                                    <div className="bg-gray-800 px-2 md:px-4 py-2 md:py-3 flex items-center gap-2 md:gap-3 border-b border-gray-700">
                                        <div className="flex gap-1 md:gap-2" aria-hidden="true">
                                            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-red-500"></div>
                                            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <div className="flex-1 bg-gray-700 rounded px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs text-gray-300 font-mono truncate">
                                            sadaksathi/upload
                                        </div>
                                    </div>

                                    <div className="relative w-full h-full overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP + srcset; no optimizer CPU on the Pi */}
                                        <img
                                            src={CRACKS.src}
                                            srcSet={CRACKS.srcSet}
                                            sizes="(min-width: 1024px) 1024px, 100vw"
                                            alt="Road surface with potholes"
                                            className="w-full h-full object-cover opacity-60"
                                            fetchPriority="high"
                                        />

                                        <div className="absolute inset-0 p-12" aria-hidden="true">
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
                                                <div className="flex justify-between text-[10px]"><span>Potholes</span><span className="text-brand-primary">03</span></div>
                                                <div className="flex justify-between text-[10px]"><span>Confidence</span><span className="text-brand-primary">91.4%</span></div>
                                                <div className="flex justify-between text-[10px]"><span>GPS Lat</span><span className="text-brand-primary">19.0760</span></div>
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
                                                <div className="px-2 py-1 bg-brand-primary text-gray-900 text-[9px] font-bold rounded">FILE COMPLAINT</div>
                                                <div className="px-2 py-1 bg-white/10 text-white text-[9px] font-bold rounded">VIEW DETAILS</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-secondary to-transparent opacity-10 pointer-events-none"></div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <section className="py-16 bg-neutral-background overflow-hidden border-b border-border-light">
                    <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                        <p className="text-sm font-mono text-text-secondary uppercase tracking-widest">What SadakSathi Detects</p>
                    </div>
                    <div className="w-full" style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 12.5%, black 87.5%, transparent)", maskImage: "linear-gradient(to right, transparent, black 12.5%, black 87.5%, transparent)" }}>
                        <div className="flex gap-16 items-center animate-marquee whitespace-nowrap" style={{ width: "fit-content" }}>
                            {[...DETECTS, ...DETECTS].map((p, i) => (
                                <div key={i} aria-hidden={i >= DETECTS.length || undefined} className="flex items-center gap-3 px-8 text-2xl font-bold opacity-40 grayscale">{p}</div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-surface" id="features">
                    <div className="max-w-7xl mx-auto px-6">
                        <Reveal className="text-center mb-16">
                            <div className={PILL}>Core Capabilities</div>
                            <h2 className="font-heading text-4xl md:text-6xl font-normal tracking-tighter leading-tight max-w-3xl mx-auto">
                                Precision Detection Powered by Specialized Vision Models
                            </h2>
                        </Reveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {CAPABILITIES.map(({ icon: Icon, title, body }, i) => (
                                <Reveal key={title} delay={i * 80} className="bg-surface p-8 rounded-2xl shadow-soft border border-border-light hover:border-brand-primary transition-colors group">
                                    <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors">
                                        <Icon className="w-6 h-6 text-sign-green group-hover:text-white" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-heading font-semibold mb-3">{title}</h3>
                                    <p className="text-text-secondary leading-relaxed">{body}</p>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-surface" id="traffic-detection">
                    <div className="max-w-7xl mx-auto px-6">
                        <Reveal className="text-center mb-20">
                            <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-6">AI Traffic Violation Detection</h2>
                            <p className="text-lg text-text-secondary max-w-2xl mx-auto">Detect road violations in photos and video with computer vision built for city traffic desks.</p>
                        </Reveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {TRAFFIC.map(({ emoji, title, body }, i) => (
                                <Reveal key={title} delay={(i % 2) * 80} className="bg-surface p-8 rounded-3xl shadow-soft hover:-translate-y-2 transition-all group">
                                    <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors">
                                        <span className="text-2xl" aria-hidden="true">{emoji}</span>
                                    </div>
                                    <h3 className="text-2xl font-heading font-bold mb-3">{title}</h3>
                                    <p className="text-text-secondary leading-relaxed">{body}</p>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-surface" id="unified-solutions">
                    <div className="max-w-7xl mx-auto px-6">
                        <Reveal className="text-center mb-16">
                            <div className={PILL}>Unified Solutions</div>
                            <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter leading-tight max-w-3xl mx-auto">
                                Complete Civic AI Platform
                            </h2>
                        </Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {SOLUTIONS.map(({ title, body }, i) => (
                                <Reveal key={title} delay={i * 80} className="bg-surface p-8 rounded-xl shadow-soft border border-border-light hover:border-brand-primary/30 hover:shadow-medium transition-all group">
                                    <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-sign-green transition-colors">{title}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed mb-6">{body}</p>
                                    <div className="h-0.5 w-12 bg-border-light group-hover:bg-brand-primary group-hover:w-full transition-all duration-500"></div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-background" id="how-it-works">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <Reveal>
                                <div className={PILL}>The Process</div>
                                <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter leading-tight mb-8">
                                    From Rough Roads to Actionable Data in 3 Steps
                                </h2>

                                <ol className="space-y-10">
                                    {STEPS.map(({ title, body }, i) => (
                                        <li key={title} className="flex gap-6">
                                            <div className={`flex-shrink-0 w-12 h-12 ${PRIMARY_BTN} rounded-full flex items-center justify-center font-bold text-xl`}>{i + 1}</div>
                                            <div>
                                                <h3 className="text-xl font-heading font-semibold mb-2">{title}</h3>
                                                <p className="text-text-secondary leading-relaxed">{body}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </Reveal>

                            <Reveal className="relative">
                                <div className="lg:aspect-square bg-brand-secondary/20 rounded-3xl overflow-hidden shadow-medium flex items-center justify-center p-8">
                                    <div className="w-full h-full bg-surface rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                                        <div className="flex items-center gap-2 mb-4" aria-hidden="true">
                                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-40 bg-neutral-surface rounded-xl relative overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP + srcset; no optimizer CPU on the Pi */}
                                                <img src={COLLAPSE.src} srcSet={COLLAPSE.srcSet} sizes="(min-width: 1024px) 520px, 90vw" alt="Road demo" className="w-full h-full object-cover" loading="lazy" />
                                                <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-16 border-2 border-red-500 animate-pulse"></div>
                                            </div>
                                            <div className="h-4 bg-neutral-surface rounded-full w-3/4"></div>
                                            <div className="h-4 bg-neutral-surface rounded-full w-1/2"></div>
                                            <div className="flex gap-2 pt-4">
                                                <div className="h-10 bg-brand-primary rounded-md flex-1"></div>
                                                <div className="h-10 bg-border-light rounded-md w-12"></div>
                                            </div>
                                        </div>
                                        <div className="absolute top-10 right-10 bg-surface shadow-xl rounded-lg p-3 border border-border-light animate-float hidden sm:block">
                                            <div className="text-[10px] font-mono text-text-secondary">SEVERITY</div>
                                            <div className="text-sm font-bold text-signal-red uppercase">HIGH</div>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-dark text-white overflow-hidden" id="testimonials">
                    <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                        <h2 className="font-heading text-4xl md:text-5xl font-normal tracking-tighter mb-4">Built for Everyone on the Road</h2>
                        <p className="text-white/70">Citizens report, city staff fix, traffic police enforce.</p>
                    </div>
                    {/* Pauses on hover so a card can be read. */}
                    <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap" style={{ width: "fit-content" }}>
                        {[...ROLES, ...ROLES].map((r, i) => (
                            <div key={i} aria-hidden={i >= ROLES.length || undefined} className="w-96 bg-white/10 backdrop-blur p-8 rounded-2xl whitespace-normal border border-white/10">
                                <p className="text-lg mb-6 leading-relaxed">{r.text}</p>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${r.dot} rounded-full`}></div>
                                    <div>
                                        <div className="font-bold">{r.name}</div>
                                        <div className="text-sm text-white/70">{r.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="py-24 bg-neutral-background" id="faq">
                    <div className="max-w-4xl mx-auto px-6">
                        <Reveal className="text-center mb-16">
                            <h2 className="font-heading text-4xl font-normal tracking-tighter">Frequently Asked Questions</h2>
                        </Reveal>

                        <div className="space-y-4">
                            {FAQ.map(({ q, a }, i) => (
                                <details key={q} open={i === 0} className="group border border-border-light rounded-xl overflow-hidden">
                                    <summary className="w-full p-6 text-left flex justify-between items-center bg-surface hover:bg-neutral-surface transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                        <span className="font-semibold">{q}</span>
                                        <ChevronDown className="w-5 h-5 text-text-secondary transition-transform group-open:rotate-180" aria-hidden="true" />
                                    </summary>
                                    <div className="p-6 bg-surface border-t border-border-light text-text-secondary leading-relaxed">{a}</div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {isLoggedIn === false && (
                    <section className="py-24 hero-gradient relative overflow-hidden">
                        <div aria-hidden="true" className="absolute inset-0 blur-gradient opacity-30"></div>
                        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                            <h2 className="font-heading text-5xl md:text-7xl font-normal tracking-tighter mb-8 leading-none">Ready to start mapping?</h2>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/upload" className={`w-full sm:w-auto px-10 py-5 ${PRIMARY_BTN} font-bold rounded-sm shadow-medium hover:-translate-y-1 transition-all`}>Upload Now</Link>
                                <Link href="/auth" className="w-full sm:w-auto px-10 py-5 bg-surface text-text-primary font-bold border border-border-light rounded-sm hover:bg-neutral-surface transition-all">Create Account</Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <AppFooter />
        </>
    );
}
